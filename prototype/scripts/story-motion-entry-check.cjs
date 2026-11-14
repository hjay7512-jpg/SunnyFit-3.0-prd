const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('playwright-core')
const { args, browserPath, root } = require('./story-runtime.cjs')

async function run() {
  const options = args(), base = options.url || 'http://127.0.0.1:3198'
  const out = path.join(root, 'output/story-motion-entry')
  fs.mkdirSync(out, { recursive: true })
  const browser = await chromium.launch({ executablePath: browserPath(options['browser-executable']), headless: true })
  const checks = [], errors = []
  async function visit(page, query = '') {
    await page.goto(base + '/?v=motion-entry#/demo/story-web' + query)
    await page.waitForFunction(() => !!window.__SUNNYFIT_STORY__)
    await page.evaluate(() => window.__SUNNYFIT_STORY__.ready)
  }
  const snapshot = page => page.evaluate(() => ({
    time: window.__SUNNYFIT_STORY__.getState().time,
    playback: window.__SUNNYFIT_STORY__.getPlayback(),
    camera: document.querySelector('.story-pin .story-gym')?.style.transform,
    pinY: document.querySelector('.story-pin')?.getBoundingClientRect().y,
    scrollY
  }))
  async function checkWheel(page, name, width, height) {
    const before = await snapshot(page)
    await page.screenshot({ path: path.join(out, name + '-before.png') })
    await page.mouse.move(width / 2, height / 2)
    await page.mouse.wheel(0, 1400)
    await page.waitForFunction(t => window.__SUNNYFIT_STORY__.getState().time > t + 2, before.time)
    await page.waitForTimeout(300)
    const forward = await snapshot(page)
    assert.notEqual(forward.camera, before.camera, 'Real wheel must change the camera, not only scroll the document')
    assert.ok(Math.abs(forward.pinY) < 1, 'Moving stage stays pinned')
    await page.screenshot({ path: path.join(out, name + '-forward.png') })
    await page.waitForTimeout(500)
    assert.deepEqual(await snapshot(page), forward, 'No automatic playback while scrolling has stopped')
    await page.mouse.wheel(0, -700)
    await page.waitForFunction(t => window.__SUNNYFIT_STORY__.getState().time < t - 1, forward.time)
    await page.waitForTimeout(250)
    const reverse = await snapshot(page)
    assert.notEqual(reverse.camera, forward.camera, 'Reverse wheel must reverse the camera')
    checks.push({ name, before: before.time, forward: forward.time, reverse: reverse.time, systemReduced: forward.playback.systemReduced })
  }
  try {
    for (const [width, height] of [[1440, 900], [390, 844]]) {
      // Reproduce the user's exact branch: system reduced motion on, with no URL override.
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' })
      const page = await context.newPage()
      page.on('pageerror', error => errors.push(error.message))
      await visit(page)
      assert.equal(await page.locator('.story-static > article').count(), 8)
      assert.ok(await page.getByText('You’re viewing the static story.', { exact: true }).isVisible())
      await page.screenshot({ path: path.join(out, width + '-static-notice.png') })
      await page.getByRole('button', { name: 'Enable scroll experience' }).click()
      await page.waitForSelector('.story-pin')
      assert.equal(await page.locator('.story-static').count(), 0)
      assert.ok(page.url().includes('motion=full'))
      await checkWheel(page, width + '-opt-in', width, height)
      await page.reload()
      await page.waitForFunction(() => !!window.__SUNNYFIT_STORY__)
      assert.equal((await snapshot(page)).playback.mode, 'scroll', 'Explicit choice survives reload')
      await page.getByRole('button', { name: 'Motion: on', exact: true }).click()
      await page.waitForSelector('.story-motion-notice')
      assert.equal(await page.locator('.story-static > article').count(), 8)
      assert.ok(page.url().includes('motion=reduce'))

      // Direct review link must show one moving stage even when the OS preference is reduced.
      await visit(page, '?review=opening&motion=full')
      assert.equal((await snapshot(page)).playback.mode, 'scroll')
      await checkWheel(page, width + '-direct-opening', width, height)
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await page.emulateMedia({ reducedMotion: 'reduce' })
      assert.equal((await snapshot(page)).playback.mode, 'scroll', 'Explicit choice wins over preference changes')

      // Default public route still follows accessibility settings when no choice was made.
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      await visit(page)
      await checkWheel(page, width + '-system-motion', width, height)
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.waitForSelector('.story-motion-notice')
      assert.equal((await snapshot(page)).playback.mode, 'static')
      await context.close()
    }
    assert.deepEqual(errors, [])
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ checks, errors }, null, 2))
    console.log(JSON.stringify({ checks, errors }, null, 2))
  } finally { await browser.close() }
}
run().catch(error => { console.error(error); process.exitCode = 1 })
