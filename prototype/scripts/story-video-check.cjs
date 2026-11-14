const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')
const { args, open, seek, root } = require('./story-runtime.cjs')
async function run() {
  const options = args(), ffmpeg = options['ffmpeg-path'] || process.env.STORY_FFMPEG || 'ffmpeg'
  const video = path.resolve(root, options.video || 'output/SunnyFit-3.0-story.mp4')
  const dir = path.join(root, 'output/story-video-qa'); fs.mkdirSync(dir, { recursive: true })
  const invoke = argv => {
    const result = spawnSync(ffmpeg, argv, { encoding: 'utf8', windowsHide: true, maxBuffer: 20 * 1024 * 1024 })
    if (result.error || result.status !== 0) throw Error(result.error || result.stderr)
    return result.stderr
  }
  const decode = invoke(['-i', video, '-map', '0:v:0', '-f', 'null', '-'])
  assert.match(decode, /1920x1080/); assert.match(decode, /30 fps/)
  assert.match(decode, /Duration: 00:01:12\.00/)
  assert.match(decode, /frame=\s*2160/)
  const { browser, page, errors } = await open({ ...options, width: 1920, height: 1080 })
  const comparisons = []
  try {
    for (const frame of [0, 600, 1620, 1920, 2100, 2159]) {
      const web = path.join(dir, `web-${frame}.png`), encoded = path.join(dir, `video-${frame}.png`)
      await seek(page, frame / 30); await page.screenshot({ path: web })
      invoke(['-y', '-i', video, '-vf', `select=eq(n\\,${frame})`, '-frames:v', '1', encoded])
      const result = invoke(['-i', web, '-i', encoded, '-lavfi', 'ssim', '-f', 'null', '-'])
      const ssim = Number(result.match(/All:([\d.]+)/)[1])
      assert.ok(ssim > .97, `Frame ${frame}: SSIM ${ssim}`)
      comparisons.push({ frame, time: frame / 30, ssim })
    }
    assert.deepEqual(errors, [])
    const report = { width: 1920, height: 1080, fps: 30, seconds: 72, frames: 2160, decode: 'passed', comparisons, errors }
    fs.writeFileSync(path.join(dir, 'report.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2))
  } finally { await browser.close() }
}
run().catch(error => { console.error(error); process.exitCode = 1 })
