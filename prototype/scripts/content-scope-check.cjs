// End-to-end scope edits use disposable local fixtures, never the online admin.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict')
const { spawn } = require('node:child_process'), { randomUUID } = require('node:crypto'), { chromium } = require('playwright-core')
const root = path.resolve(__dirname, '..'), port = 3136, base = `http://127.0.0.1:${port}`
const database = path.join(root, 'runtime', `scope-review-${randomUUID()}.sqlite`)
const evidence = path.join(root, 'runtime/content-scope-validation')
const checks = [], errors = []; let server, browser, page, output = ''
const pass = name => { checks.push(name); console.log('PASS ' + name) }
async function until(work, name) { for (let i = 0; i < 100; i++) { if (await work()) return; await new Promise(resolve => setTimeout(resolve, 100)) } throw Error('Timed out: ' + name) }
async function api(route, body, method = body ? 'POST' : 'GET') { const response = await fetch(base + '/api/commercialization' + route, { method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) }); const result = await response.json(); assert.equal(response.status, 200, result.message); return result.data }
async function run() {
  fs.mkdirSync(evidence, { recursive: true })
  server = spawn(process.execPath, ['server/index.cjs'], { cwd: root, env: { ...process.env, API_PORT: String(port), DEMO_DB_PATH: database }, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
  server.stdout.on('data', data => output += data); server.stderr.on('data', data => output += data)
  await until(async () => { if (server.exitCode !== null) throw Error(output); try { const r = await fetch(base + '/api/health'); return (await r.json()).data.demo.database === database } catch (_) { return false } }, 'isolated server')
  const catalog = await api('/content'), fixtures = []
  for (const type of ['course', 'world_tour', 'training_program']) {
    const source = catalog.find(row => row.published?.contentType === type && row.published.policyVersion === 20261014) || catalog.find(row => row.published?.contentType === type)
    const config = { ...source.published, name: 'ScopeReview ' + type, code: 'scope_review_' + type, tier: 'free', contentScope: 'free_content', status: 'active' }
    const created = await api('/content', config); fixtures.push(await api('/content/' + created.id + '/publish', { revision: created.revision }))
  }
  browser = await chromium.launch({ channel: 'msedge', headless: true }); page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); page.setDefaultTimeout(10000)
  page.on('pageerror', error => errors.push(error.message))
  page.on('response', response => { if (response.url().includes('/api/') && response.status() >= 400) errors.push(response.status() + ' ' + response.url()) })
  await page.goto(base + '/#/commercialization/content'); await page.getByPlaceholder('Course ID / name').fill('ScopeReview')
  const rows = page.locator('.course-management > .el-table > .el-table__body-wrapper tbody tr')
  await until(async () => (await rows.count()) === 3, 'three fixture rows')
  await page.getByTestId('content-type-filter').getByText('Training Program', { exact: true }).click(); assert.equal(await rows.count(), 1); await page.getByTestId('content-type-filter').getByText('ALL', { exact: true }).click()
  assert.equal(await rows.count(), 3); pass('existing-list-pattern-supports-course-world-tour-and-program-filtering')
  await page.getByTestId('edit-scope-' + fixtures[0].id).last().click()
  const dialog = page.locator('.bulk-bar .el-dialog:visible')
  await until(async () => !(await dialog.locator('.el-select input').first().isDisabled()), 'scope options loaded')
  assert.ok(await dialog.getByRole('button', { name: 'Save Draft', exact: true }).isDisabled())
  async function pick(group, name) { await group.locator('.el-select').click(); await page.locator('.el-select-dropdown:visible .el-select-dropdown__item').filter({ hasText: new RegExp('^' + name + '$') }).click(); await until(async () => (await page.locator('.el-select-dropdown:visible').count()) === 0, 'scope dropdown closes') }
  await pick(dialog.locator('.bulk-scope-row'), 'Premium Content'); await dialog.getByRole('button', { name: 'Save Draft', exact: true }).click(); await dialog.waitFor({ state: 'hidden' })
  const course = await api('/content/' + fixtures[0].id)
  assert.equal(course.draft.contentScope, 'premium_content'); assert.equal(course.draft.tier, 'free'); assert.deepEqual(course.published, fixtures[0].published)
  await until(async () => (await rows.filter({ hasText: 'ScopeReview course' }).innerText()).includes('Draft'), 'pending scope visible')
  pass('single-edit-saves-only-scope-as-a-visible-draft-without-changing-label-or-live-access')
  const selectAll = page.locator('.course-management > .el-table > .el-table__fixed .el-table__fixed-header-wrapper .el-checkbox')
  await selectAll.click(); await page.getByTestId('content-bulk-tools').getByRole('button', { name: 'Set Content Scope', exact: true }).click()
  await until(async () => (await dialog.locator('.bulk-scope-row').count()) === 3 && !(await dialog.locator('.el-select input').first().isDisabled()), 'three independent scope groups')
  await pick(dialog.locator('.bulk-scope-row').filter({ hasText: /^World Tour/ }), 'Premium Content')
  await pick(dialog.locator('.bulk-scope-row').filter({ hasText: /^Training Program/ }), 'Premium Content')
  await dialog.getByRole('button', { name: 'Save 2 Drafts', exact: true }).click(); await dialog.waitFor({ state: 'hidden' })
  assert.equal((await api('/content/' + fixtures[0].id)).revision, course.revision)
  for (const fixture of fixtures.slice(1)) { const result = await api('/content/' + fixture.id); assert.equal(result.draft.contentScope, 'premium_content'); assert.equal(result.draft.tier, 'free'); assert.deepEqual(result.published, fixture.published) }
  pass('mixed-type-batch-uses-per-type-scopes-skips-unchanged-records-and-preserves-labels')
  await until(async () => (await page.getByTestId('content-bulk-tools').innerText()).includes('0 selected'), 'selection cleared after save')
  await selectAll.click(); await page.getByTestId('content-bulk-tools').getByRole('button', { name: 'Publish Selected Drafts', exact: true }).click(); await page.locator('.el-message-box:visible').getByRole('button', { name: 'Publish', exact: true }).click()
  await until(async () => (await api('/content/' + fixtures[0].id)).published.contentScope === 'premium_content', 'publication complete')
  for (const fixture of fixtures) { const result = await api('/content/' + fixture.id); assert.equal(result.published.contentScope, 'premium_content'); assert.equal(result.draft, null) }
  pass('explicit-publication-applies-all-reviewed-drafts-and-clears-draft-state')
  await page.getByTestId('content-scope-filter').click(); await page.locator('.el-select-dropdown:visible .el-select-dropdown__item').filter({ hasText: /^Premium Content · World Tour$/ }).click(); assert.equal(await rows.count(), 1); assert.match(await rows.innerText(), /ScopeReview world_tour/)
  pass('scope-filter-disambiguates-identical-scope-codes-across-content-types')
  await page.getByRole('button', { name: 'Reset', exact: true }).click(); await page.screenshot({ path: path.join(evidence, 'course-management.png'), fullPage: true })
  for (const width of [1024, 1440]) { await page.setViewportSize({ width, height: 1000 }); assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); await page.getByTestId('edit-scope-' + fixtures[0].id).last().count().then(async count => { if (!count) await page.getByPlaceholder('Course ID / name').fill('ScopeReview course') }); await page.getByTestId('edit-scope-' + fixtures[0].id).last().click(); const bounds = await dialog.boundingBox(); assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= width); await dialog.getByRole('button', { name: 'Cancel', exact: true }).click() }
  pass('table-scrolls-within-page-and-scope-dialog-fits-desktop-viewports')
  assert.deepEqual(errors, [])
}
run().catch(async error => { errors.push(error.stack); console.error(error); process.exitCode = 1; if (page) await page.screenshot({ path: path.join(evidence, 'failure.png'), fullPage: true }).catch(() => {}) }).finally(async () => { if (browser) await browser.close(); if (server && server.exitCode === null) { const closed = new Promise(resolve => server.once('exit', resolve)); server.kill(); await closed } fs.writeFileSync(path.join(evidence, 'results.json'), JSON.stringify({ status: process.exitCode ? 'failed' : 'passed', checks, errors }, null, 2)); for (const suffix of ['', '-wal', '-shm']) try { fs.unlinkSync(database + suffix) } catch (error) { if (error.code !== 'ENOENT') throw error } })
