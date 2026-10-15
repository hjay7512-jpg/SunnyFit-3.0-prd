// Exercises the built prototype in a separate database; review data stays intact.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { randomUUID } = require('node:crypto')
const { spawn } = require('node:child_process')
const { chromium } = require('playwright-core')
const root = path.resolve(__dirname, '..')
const database = path.join(root, 'runtime', `browser-check-${randomUUID()}.sqlite`)
const screenshots = path.join(root, 'docs', 'prototype-previews')
const port = 3099
const base = `http://127.0.0.1:${port}`
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
let server, browser, page, output = ''
const errors = []
const checks = []
const check = label => { checks.push(label); console.log(`OK ${label}`) }
async function api(route) {
  const response = await fetch(`${base}/api/commercialization${route}`)
  assert.equal(response.status, 200)
  return (await response.json()).data
}
async function until(predicate, label) {
  for (let attempt = 0; attempt < 50; attempt++) {
    if (await predicate()) return
    await pause(100)
  }
  throw new Error(`Timed out: ${label}`)
}
async function dismissDialog() {
  await page.locator('.el-dialog:visible .el-dialog__footer').getByRole('button', { name: 'Close', exact: true }).click()
  await until(async () => !(await page.locator('.el-dialog:visible').count()), 'dialog closes')
}
async function confirm(label) {
  await page.locator('.el-message-box:visible').getByRole('button', { name: label, exact: true }).click()
  await until(async () => !(await page.locator('.el-message-box:visible').count()), 'confirmation closes')
}
async function showSuits() {
  await page.locator('.sidebar-container').getByRole('menuitem', { name: /Entitlement Suits$/ }).click()
  await page.getByTestId('suits-page').waitFor()
  await until(async () => (await page.locator('[data-testid="suits-table"] .el-table__body-wrapper tbody tr').count()) >= 3, 'suits loaded')
}
async function openSuit(name) {
  const row = page.locator('[data-testid="suits-table"] .el-table__fixed-right .el-table__row').filter({ hasText: name })
  await row.getByRole('button', { name: 'Configure', exact: true }).click()
  await page.getByTestId('suit-detail-page').waitFor()
  await until(async () => await page.getByTestId('suit-name').inputValue() === name, 'suit loaded')
}
async function run() {
  assert.ok(fs.existsSync(path.join(root, 'dist', 'index.html')), 'Run npm run build first.')
  fs.mkdirSync(screenshots, { recursive: true })
  server = spawn(process.execPath, ['server/index.cjs'], { cwd: root, env: { ...process.env, API_PORT: String(port), DEMO_DB_PATH: database }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
  server.stdout.on('data', value => { output += value })
  server.stderr.on('data', value => { output += value })
  await until(async () => {
    if (server.exitCode !== null) throw new Error(output)
    try { return (await fetch(`${base}/api/health`)).ok } catch (_) { return false }
  }, 'API starts')
  browser = await chromium.launch({ channel: 'msedge', headless: true })
  page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 })
  page.setDefaultTimeout(10000)
  page.on('pageerror', error => errors.push(error.message))
  page.on('response', response => { if (response.url().includes('/api/') && response.status() >= 400) errors.push(`API ${response.status()} ${response.url()}`) })

  await page.goto(`${base}/#/commercialization/catalog`)
  await until(async () => (await page.locator('[data-testid="catalog-table"] .el-table__body-wrapper tbody tr').count()) === 10, 'typed catalog loaded')
  assert.equal(await page.locator('.sidebar-container').evaluate(el => Math.round(el.getBoundingClientRect().width)), 210)
  await page.screenshot({ path: path.join(screenshots, '01-entitlement-catalog.png'), fullPage: true, animations: 'disabled' })
  await page.getByTestId('catalog-search').fill('ai_coach_chat')
  await page.getByRole('button', { name: /Search$/ }).click()
  assert.equal(await page.locator('[data-testid="catalog-table"] .el-table__body-wrapper tbody tr').count(), 1)
  await page.locator('[data-testid="catalog-table"] .el-table__fixed-right').getByRole('button', { name: 'View', exact: true }).click()
  await page.locator('.el-dialog:visible .read-detail').waitFor()
  assert.match(await page.locator('.el-dialog:visible').innerText(), /Credits/)
  assert.equal(await page.locator('.el-dialog:visible input').count(), 0)
  await dismissDialog()
  await page.getByRole('button', { name: /Reset$/ }).click()
  await page.getByTestId('interaction-notes').click()
  await page.locator('.el-drawer:visible .note-block').first().waitFor()
  assert.match(await page.locator('.el-drawer:visible').innerText(), /目录只读/)
  await page.screenshot({ path: path.join(screenshots, '02-interaction-notes.png'), animations: 'disabled' })
  await page.keyboard.press('Escape')
  await until(async () => !(await page.locator('.el-drawer:visible').count()), 'notes close')
  check('Catalog API, search, read-only details, 210px shell and Chinese interaction notes')

  await showSuits()
  await showSuits() // Clicking the active menu must not raise NavigationDuplicated.
  await page.screenshot({ path: path.join(screenshots, '03-entitlement-suits.png'), fullPage: true, animations: 'disabled' })
  await openSuit('Free Account')
  assert.ok(await page.getByTestId('suit-code').isDisabled())
  assert.ok(await page.getByTestId('suit-type').locator('input').isDisabled())
  assert.ok(await page.getByTestId('suit-status').locator('input').isDisabled())
  await showSuits()
  await openSuit('Premium Membership')
  await page.screenshot({ path: path.join(screenshots, '04-suit-configuration.png'), fullPage: true, animations: 'disabled' })
  assert.equal(await page.getByTestId('feature-ai_coach_chat').locator('input').count(),0)
  const contentScope = page.getByTestId('scope-course_access')
  await contentScope.click()
  assert.equal(await page.locator('.el-select-dropdown:visible .el-select-dropdown__item').filter({hasText:/^ALL$/}).count(),0)
  await page.locator('.el-select-dropdown:visible .el-select-dropdown__item').filter({hasText:/^YouTube$/}).click()
  await page.keyboard.press('Escape')
  await until(async()=>!(await contentScope.innerText()).includes('YouTube'),'scope selection renders')
  assert.doesNotMatch(await contentScope.innerText(),/YouTube/)
  await page.getByTestId('item-course_access').getByRole('button',{name:'Select all scopes',exact:true}).click()
  assert.match(await contentScope.innerText(),/YouTube/)
  await page.getByTestId('credits-amount').locator('input').fill('240')
  await page.getByTestId('credits-amount').locator('input').press('Tab')
  assert.ok(await page.getByTestId('publish-suit').isDisabled())
  await page.getByRole('button', { name: /Back$/ }).click()
  await confirm('Stay')
  assert.ok(await page.getByTestId('suit-detail-page').isVisible())
  const tagCount = await page.locator('.tags-view-item').count()
  await page.locator('.tags-view-item.active .tag-close').click()
  await confirm('Stay')
  assert.equal(await page.locator('.tags-view-item').count(), tagCount)
  assert.ok(await page.locator('.tags-view-item.active').count())
  await page.getByTestId('save-draft').click()
  await until(async () => (await api('/suits/premium')).draft?.creditGrants[0].amount === 240, 'typed draft saved')
  assert.equal((await api('/suits/premium')).published.creditBenefit.amount, 150)
  await page.getByTestId('preview-changes').click()
  await page.locator('.el-dialog:visible .change-block').first().waitFor()
  assert.match(await page.locator('.el-dialog:visible').innerText(), /150 Legacy Credits/)
  assert.match(await page.locator('.el-dialog:visible').innerText(), /240 Legacy Credits/)
  await page.screenshot({ path: path.join(screenshots, '05-publication-preview.png'), animations: 'disabled' })
  await dismissDialog()
  await until(async () => !(await page.getByTestId('publish-suit').isDisabled()), 'publish enabled')
  await page.getByTestId('publish-suit').click()
  await confirm('Publish')
  await until(async () => (await api('/suits/premium')).publishedVersion === 2, 'published v2')
  const versions = await api('/suits/premium/history')
  assert.equal(versions.length, 2)
  assert.equal(versions.find(entry => entry.version === 1).config.creditBenefit.amount, 150)
  assert.ok((await api('/suits/premium/impact')).existingGrants.every(grant => grant.version === 1))
  await page.getByRole('button', { name: /Versions$/ }).click()
  await page.locator('.el-dialog:visible .el-table__row').filter({ hasText: 'v1' }).getByRole('button', { name: 'View', exact: true }).click()
  assert.match(await page.getByTestId('version-snapshot').innerText(), /150 Legacy Credits/)
  await dismissDialog()
  check('Typed content scopes without ALL, feature access without controls, unsaved guard, saved draft, diff preview and immutable legacy grants')

  await showSuits()
  await page.getByTestId('new-suit').click()
  await page.getByTestId('suit-name').fill('Browser Review Suit')
  await page.getByTestId('suit-code').fill('browser_review_suit')
  await page.getByTestId('add-item-select').click()
  await page.locator('.el-select-dropdown:visible .el-select-dropdown__item').filter({ hasText: /^AI Coach Chat$/ }).click()
  await page.getByTestId('add-item').click()
  await page.getByTestId('save-draft').click()
  await page.waitForURL(/suits\/[0-9a-f-]+$/)
  const created = (await api('/suits')).find(suit => suit.code === 'browser_review_suit')
  assert.ok(created && created.hasDraft && !created.publishedVersion)
  await page.reload()
  await until(async () => await page.getByTestId('suit-name').inputValue() === 'Browser Review Suit', 'saved draft persists after reload')
  // A feature-only suit can later acquire a separate typed credit grant.
  await page.getByTestId('add-item-select').click()
  await page.locator('.el-select-dropdown:visible .el-select-dropdown__item').filter({hasText:/^AI Coach Credits$/}).click()
  await page.getByTestId('add-item').click()
  await page.getByTestId('credits-amount').locator('input').fill('10')
  await page.getByTestId('credits-amount').locator('input').press('Tab')
  await page.getByTestId('save-draft').click()
  await until(async () => (await api(`/suits/${created.id}`)).draft?.creditGrants[0].amount===10, 'typed credit grant saved')
  assert.equal((await api(`/suits/${created.id}`)).draft.creditGrants[0].creditType,'AI_COACH_CREDIT')
  assert.equal((await api(`/suits/${created.id}`)).draft.creditGrants[0].expiration,'membership_cycle')
  await page.getByTestId('publish-suit').click()
  await confirm('Publish')
  await until(async () => (await api(`/suits/${created.id}`)).publishedVersion === 1, 'new suit published')
  await page.setViewportSize({ width: 760, height: 1000 })
  await page.getByTestId('interaction-notes').click()
  assert.ok((await page.locator('.el-drawer:visible').boundingBox()).width <= 760)
  await page.keyboard.press('Escape')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await showSuits()
  await page.locator('[data-testid="suits-table"] .el-table__fixed-right .el-table__row').filter({ hasText: 'Browser Review Suit' }).getByRole('button', { name: 'Delete', exact: true }).click()
  await confirm('Delete')
  await until(async () => !(await api('/suits')).some(suit => suit.id === created.id), 'unused suit deleted')
  check('New draft, reload persistence, first publication, narrow-screen notes and confirmed deletion of an unused suit')
  assert.deepEqual(errors, [], 'No unhandled page errors or failed API responses')
  fs.writeFileSync(path.join(screenshots, 'browser-check.json'), JSON.stringify({ checkedAt: new Date().toISOString(), browser: 'Microsoft Edge (headless, isolated session)', viewport: '1440 × 1000; notes also checked at 760px', checks, errors }, null, 2))
  console.log('Browser review complete; screenshots: docs/prototype-previews')
}
run().catch(async error => {
  console.error(error)
  if (page) await page.screenshot({ path: path.join(root, 'runtime', 'browser-check-failure.png'), fullPage: true }).catch(() => {})
  process.exitCode = 1
}).finally(async () => {
  if (browser) await browser.close()
  if (server && server.exitCode === null) {
    const closed = new Promise(resolve => server.once('exit', resolve))
    server.kill()
    await closed
  }
  // Remove only the three exact filenames created for this isolated review.
  for (const suffix of ['', '-wal', '-shm']) {
    try { fs.unlinkSync(database + suffix) } catch (error) { if (error.code !== 'ENOENT') console.error(error.message) }
  }
})
