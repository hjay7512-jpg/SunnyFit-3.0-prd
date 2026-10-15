// Task review of the current consumer demo. Uses a separate database and keeps evidence.
// Observed design gaps are recorded separately from execution errors; this is not a user study.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID, createHash } = require('node:crypto')
const { spawn } = require('node:child_process')
const { chromium } = require('playwright-core')

const root = path.resolve(__dirname, '..')
const runId = new Date().toISOString().replace(/[:.]/g, '-') + '-' + randomUUID().slice(0, 8)
const evidenceDir = path.join(root, 'docs', 'validation-round-3', runId)
const database = path.join(root, 'runtime', 'consumer-review-' + runId + '.sqlite')
const port = Number(process.env.CONSUMER_REVIEW_PORT || 3107)
const base = `http://127.0.0.1:${port}`
const report = { runId, startedAt: new Date().toISOString(), kind: 'Automated task walkthrough, not target-user research', database: path.relative(root, database), browser: 'Microsoft Edge headless', viewport: { width: 1440, height: 1200 }, checks: [], observations: [], consoleErrors: [], failedResponses: [] }
let server, browser, page, serverOutput = ''
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
function record(id, status, summary, details = {}) { report.checks.push({ id, status, summary, ...details }); console.log(`${status.toUpperCase()} ${id}: ${summary}`) }
function observe(id, summary, details = {}) { report.observations.push({ id, summary, ...details }) }
async function api(route, data) {
  const response = await fetch(base + '/api/commercialization' + route, data ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) } : undefined)
  const body = await response.json()
  assert.equal(response.status, 200, `${route}: ${JSON.stringify(body)}`)
  return body.data
}
async function until(predicate, label) {
  for (let i = 0; i < 80; i++) { if (await predicate()) return; await sleep(100) }
  throw new Error('Timed out: ' + label)
}
async function open(screen, user = 'DEMO-1003', extra = {}) {
  const query = new URLSearchParams({ user, ...extra })
  await page.goto(`${base}/#/app/${screen}?${query}`)
  await page.locator('.phone-frame .source-visual,.phone-frame .mobile-scroll,.phone-frame .history-screen').first().waitFor()
  await until(async () => !await page.locator('.mobile-loading').count(), 'mobile data ready')
}
async function capture(name) {
  await page.evaluate(async () => { if (document.fonts) await document.fonts.ready })
  await page.locator('.phone-frame').screenshot({ path: path.join(evidenceDir, name + '.png'), animations: 'disabled' })
  return name + '.png'
}
const sheet = () => page.locator('.mobile-sheet')
async function dismiss() { await page.locator('.sheet-close').click(); await sheet().waitFor({ state: 'hidden' }) }

async function run() {
  assert.ok(fs.existsSync(path.join(root, 'dist', 'index.html')), 'Run npm run build first.')
  fs.mkdirSync(evidenceDir, { recursive: true })
  report.sourceHashes = Object.fromEntries(['src/views/app/index.vue', 'src/views/app/controller.js', 'src/views/app/commerceMixin.js', 'src/views/app/SourceCanvas.vue', 'server/commerce.cjs', 'config/demo-policy.cjs'].map(file => [file, createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex')]))
  server = spawn(process.execPath, ['server/index.cjs'], { cwd: root, env: { ...process.env, API_PORT: String(port), DEMO_DB_PATH: database }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  server.stdout.on('data', chunk => { serverOutput += chunk })
  server.stderr.on('data', chunk => { serverOutput += chunk })
  await until(async () => {
    if (server.exitCode !== null) throw new Error(serverOutput)
    // Do not accept a health response from another process already using this port.
    if (!serverOutput.includes('SunnyFit prototype API: ' + base)) return false
    try { return (await fetch(base + '/api/health')).ok } catch (_) { return false }
  }, 'isolated API startup')
  browser = await chromium.launch({ channel: 'msedge', headless: true })
  page = await browser.newPage({ viewport: report.viewport, deviceScaleFactor: 1 })
  page.setDefaultTimeout(12000)
  page.on('pageerror', error => report.consoleErrors.push(error.message))
  page.on('response', response => { if (response.url().includes('/api/') && response.status() >= 400) report.failedResponses.push({ status: response.status(), url: response.url() }) })
  const initial = await api('/storefront/DEMO-1003')
  fs.writeFileSync(path.join(evidenceDir, 'initial-member.json'), JSON.stringify(initial, null, 2))

  // Task 1: Identify included access. Scenario selection supplies fixtures, not customer navigation.
  await open('home')
  const profileLink = page.locator('[data-action="profile"]').first()
  if (await profileLink.count()) {
    const before = page.url()
    await profileLink.click()
    await until(async () => !!await page.locator('.review-gap').innerText(), 'profile gap feedback')
    observe('navigation-profile', 'Profile does not navigate to account or membership; it reports a missing source design.', { urlUnchanged: page.url() === before, feedback: await page.locator('.review-gap').innerText(), screenshot: await capture('01-home-profile') })
  }
  await open('course', 'DEMO-1001', { content: 'course_free' })
  assert.match(await page.locator('.commerce-content-label').innerText(), /Free/)
  await page.locator('[data-action="start-course"]').click()
  await until(async () => !!await page.locator('.review-feedback').count(), 'free start access result')
  assert.equal(await sheet().count(), 0)
  record('free-start', 'pass', 'Free content passes the Start access check without a purchase.', { scope: 'Entry authorization only; the demo does not implement playback', screenshot: await capture('02-free-course') })
  await open('course', 'DEMO-1001', { content: 'course_premium' })
  await page.locator('[data-action="start-course"]').click()
  await sheet().waitFor()
  assert.match(await sheet().innerText(), /eligible membership/)
  record('premium-gate', 'pass', 'Free account is directed to membership for subscription content.', { sheet: await sheet().innerText(), screenshot: await capture('03-premium-gate') })
  await open('course', 'DEMO-1003', { content: 'course_featured' })
  await page.locator('[data-action="start-course"]').click()
  await sheet().waitFor()
  const redeemCopy = await sheet().innerText()
  await sheet().getByRole('button', { name: /^Unlock ·/ }).click()
  await sheet().getByRole('heading', { name: 'Content unlocked', exact: true }).waitFor()
  await dismiss()
  const redeemed = await api('/storefront/DEMO-1003')
  assert.equal(redeemed.contents.find(c => c.id === 'course_featured').access.reason, 'REDEEMED')
  await page.reload()
  await page.locator('.commerce-content-label').waitFor()
  const label = await page.locator('.commerce-content-label').innerText()
  observe('redeemed-label', 'Redeemed content still displays the Featured price badge; access state is not reflected in the badge.', { label, redemptionConfirmation: redeemCopy, screenshot: await capture('04-unlocked-still-priced') })
  const balanceBeforeReplay = (await api('/storefront/DEMO-1003')).wallet.available
  await page.locator('[data-action="start-course"]').click()
  await until(async () => !!await page.locator('.review-feedback').count(), 'redeemed replay entry')
  assert.equal((await api('/storefront/DEMO-1003')).wallet.available, balanceBeforeReplay)
  record('redeemed-replay', 'pass', 'An already unlocked course can pass Start again without spending more Credits.')

  // Task 2: Buy enough balance, return to the original analysis, then explicitly generate.
  await open('result', 'DEMO-1004')
  const low = await api('/storefront/DEMO-1004')
  const analysisCost = low.services.find(s => s.id === 'deep_analysis').credits
  assert.ok(low.wallet.available < analysisCost, 'Seed persona must be short on analysis balance.')
  await page.getByRole('button', { name: /Generate new insight/ }).click()
  await sheet().waitFor()
  assert.match(await sheet().innerText(), /Add Credits/)
  record('analysis-insufficient', 'pass', 'A member with insufficient balance sees a Credits gate, not a membership gate.', { screenshot: await capture('05-analysis-balance-gate') })
  await sheet().getByRole('button', { name: 'Add Credits', exact: true }).click()
  await page.locator('.consumer-credits-offer').first().waitFor()
  await page.locator('.consumer-credits-offer').first().getByRole('button').click()
  await sheet().getByRole('button', { name: 'Confirm Purchase', exact: true }).waitFor()
  const purchaseCopy = await sheet().innerText()
  await sheet().getByRole('button', { name: 'Confirm Purchase', exact: true }).click()
  await sheet().getByRole('heading', { name: 'You’re all set', exact: true }).waitFor()
  await sheet().getByRole('button', { name: 'Return to Workout Data', exact: true }).click()
  await page.getByRole('button', { name: /Generate new insight/ }).waitFor()
  const topped = await api('/storefront/DEMO-1004')
  assert.ok(topped.wallet.available > low.wallet.available)
  assert.equal(topped.assets.length, low.assets.length, 'Buying balance must not automatically execute analysis.')
  record('topup-return', 'pass', 'Top-up returns to Workout Data without automatically generating or charging for an analysis.', { confirmation: purchaseCopy, screenshot: await capture('06-return-to-analysis') })
  await page.getByRole('button', { name: /Generate new insight/ }).click()
  await sheet().getByRole('button', { name: /^Continue ·/ }).waitFor()
  await sheet().getByRole('button', { name: /^Continue ·/ }).click()
  await sheet().getByRole('heading', { name: 'Insight saved', exact: true }).waitFor()
  const analyzed = await api('/storefront/DEMO-1004')
  assert.equal(analyzed.wallet.available, topped.wallet.available - analysisCost)
  assert.equal(analyzed.assets.length, topped.assets.length + 1)
  record('analysis-complete', 'pass', 'Explicit analysis confirmation creates one saved result and spends the quoted amount once.', { credits: analysisCost, screenshot: await capture('07-analysis-saved') })
  await dismiss()
  await page.reload()
  await page.locator('.saved-insight-body').waitFor()
  assert.equal((await api('/storefront/DEMO-1004')).wallet.available, analyzed.wallet.available)
  record('analysis-read', 'pass', 'Reading the generated insight after reload does not spend Credits.')

  // Context persistence and failure recovery on the same real UI path.
  await open('coach', 'DEMO-1001')
  await page.getByLabel('Message AI', { exact: true }).fill('Can I train today after yesterday’s ride?')
  await page.locator('[data-action="send"]').click()
  await sheet().getByRole('button', { name: 'Add Credits', exact: true }).waitFor()
  await sheet().getByRole('button', { name: 'Add Credits', exact: true }).click()
  await page.getByRole('button', { name: 'Return to AI Coach', exact: true }).click()
  await page.getByLabel('Message AI', { exact: true }).waitFor()
  assert.equal(await page.getByLabel('Message AI', { exact: true }).inputValue(), 'Can I train today after yesterday’s ride?')
  record('chat-draft-return', 'pass', 'A chat draft survives visiting and leaving the top-up page without a purchase.')
  await open('result', 'DEMO-1004')
  await page.locator('.review-checkbox').filter({ hasText: '模拟 LLM 失败' }).locator('input').check()
  const beforeFailed = await api('/storefront/DEMO-1004')
  await page.getByRole('button', { name: /Generate new insight/ }).click()
  await sheet().getByRole('button', { name: /^Continue ·/ }).click()
  await sheet().getByRole('heading', { name: 'Let’s try again', exact: true }).waitFor()
  const afterFailed = await api('/storefront/DEMO-1004')
  assert.equal(afterFailed.wallet.available, beforeFailed.wallet.available)
  assert.equal(afterFailed.wallet.reserved, 0)
  assert.equal(afterFailed.assets.length, beforeFailed.assets.length)
  record('analysis-failure', 'pass', 'Failed generation releases its hold and does not create a new result.', { screenshot: await capture('08-analysis-failed') })

  // Task 3: Cancel renewal; then separately simulate period end. Cancellation is not expiry.
  await open('membership', 'DEMO-1003')
  const beforeCancel = await api('/storefront/DEMO-1003')
  const active = beforeCancel.subscriptions.find(s => s.status !== 'expired' && s.autoRenew)
  assert.ok(active, 'Seed member needs an active renewal.')
  await page.locator('.row-group .mobile-row').filter({ hasText: active.productName }).first().click()
  await page.locator('.el-message-box:visible').getByRole('button', { name: 'Confirm', exact: true }).click()
  await until(async () => (await api('/storefront/DEMO-1003')).subscriptions.find(s => s.id === active.id).autoRenew === false, 'renewal cancellation')
  const canceled = await api('/storefront/DEMO-1003')
  assert.equal(canceled.effective.membershipActive, true)
  assert.equal(canceled.effective.base.expiresAt, beforeCancel.effective.base.expiresAt)
  record('cancel-retains-period', 'pass', 'Turning off renewal retains membership until the original paid expiry.', { screenshot: await capture('09-renewal-off') })
  await api('/demo-expire', { userId: 'DEMO-1003' })
  const expired = await api('/storefront/DEMO-1003')
  assert.equal(expired.effective.membershipActive, false)
  assert.equal(expired.contents.find(c => c.id === 'course_featured').access.reason, 'REDEEMED')
  assert.equal(expired.wallet.available, canceled.wallet.available)
  assert.equal(expired.assets.length, canceled.assets.length)
  record('expiry-retains-assets', 'pass', 'Separate simulated period end retains saved assets, independent redemption and still-valid balance.')
  await open('course', 'DEMO-1003', { content: 'course_featured' })
  await page.locator('[data-action="start-course"]').click()
  await until(async () => !!await page.locator('.review-feedback').count(), 'expired member unlocked start')
  assert.equal(await sheet().count(), 0)
  record('expiry-unlocked-access', 'pass', 'After expiry the independently unlocked content still passes Start.', { screenshot: await capture('10-expired-unlocked-course') })
  await open('coach', 'DEMO-1003')
  await page.locator('[data-action="history"]').click()
  await page.locator('.history-list button').first().waitFor()
  await page.locator('.history-list button').first().click()
  await page.locator('.assistant-bubble').waitFor()
  assert.equal((await api('/storefront/DEMO-1003')).wallet.available, expired.wallet.available)
  record('expiry-history-read', 'pass', 'Saved conversation remains reachable through AI history after expiry, without spending.', { screenshot: await capture('11-expired-history') })
  observe('unlocked-discovery', 'Content retention works when a known course is opened; a customer-facing unlocked-content discovery path is not completed by this walkthrough.', { limitation: 'Scenario IDs and direct routes supply fixtures. No claim of unassisted customer task completion.' })

  // Published display versus purchased period: make the mismatch visible using admin API only.
  const suit = await api('/suits/premium')
  const config = JSON.parse(JSON.stringify(suit.published))
  config.items = config.items.filter(item => item.code !== 'weekly_report_ai_insight')
  config.creditBenefit.amount += 90
  const savedResponse = await fetch(base + '/api/commercialization/suits/premium', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ config, revision: suit.revision }) })
  assert.equal(savedResponse.status, 200)
  const savedSuit = (await savedResponse.json()).data
  await api('/suits/premium/publish', { revision: savedSuit.revision })
  await open('membership', 'DEMO-1004')
  const oldMember = await api('/storefront/DEMO-1004')
  assert.ok(oldMember.effective.items.some(item => item.code === 'weekly_report_ai_insight'))
  const displayedBenefits = await page.locator('.benefit-list').innerText()
  observe('benefits-snapshot', 'An existing v1 member retains weekly insight rights, but the Included with Premium list reads newly published sale benefits.', { currentVersion: oldMember.effective.base.version, publishedVersion: 2, includesWeeklyInActualRights: true, includesWeeklyInDisplayedList: displayedBenefits.includes('Weekly AI Insights'), displayedBenefits, screenshot: await capture('12-purchased-vs-sale-benefits') })
  await page.setViewportSize({ width: 390, height: 844 })
  await capture('13-membership-390px')
  const layout = await page.evaluate(() => ({ viewport: innerWidth, documentWidth: document.documentElement.scrollWidth, phoneWidth: document.querySelector('.phone-frame').getBoundingClientRect().width }))
  observe('mobile-layout', '390px viewport geometry recorded; fixed source frames do not establish large-text or screen-reader usability.', { layout })
  assert.deepEqual(report.consoleErrors, [], 'Unhandled browser errors')
  assert.deepEqual(report.failedResponses, [], 'Unexpected failed API calls')
  fs.writeFileSync(path.join(evidenceDir, 'final-member.json'), JSON.stringify(oldMember, null, 2))
  report.completedAt = new Date().toISOString()
  report.execution = 'completed'
}
run().catch(async error => {
  report.execution = 'failed'
  report.error = error.stack || error.message
  console.error(report.error)
  if (page) await capture('execution-failure').catch(() => {})
  process.exitCode = 1
}).finally(async () => {
  if (browser) await browser.close()
  if (server && server.exitCode === null) { const closed = new Promise(resolve => server.once('exit', resolve)); server.kill(); await closed }
  fs.mkdirSync(evidenceDir, { recursive: true })
  report.serverOutput = serverOutput
  fs.writeFileSync(path.join(evidenceDir, 'results.json'), JSON.stringify(report, null, 2))
  console.log('Evidence: ' + path.relative(root, evidenceDir))
})
