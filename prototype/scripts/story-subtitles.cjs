const fs = require('node:fs')
const path = require('node:path')
const cues = require('../src/story/narration.cjs')
const { args, root } = require('./story-runtime.cjs')

function timestamp(seconds, separator) {
  const ms = Math.round(seconds * 1000)
  return [Math.floor(ms / 3600000), Math.floor(ms / 60000) % 60, Math.floor(ms / 1000) % 60]
    .map(n => String(n).padStart(2, '0')).join(':') + separator + String(ms % 1000).padStart(3, '0')
}
function writeSubtitles(base) {
  fs.mkdirSync(path.dirname(base), { recursive: true })
  for (const [extension, separator, header] of [['srt', ',', ''], ['vtt', '.', 'WEBVTT\n\n']]) {
    fs.writeFileSync(base + '.' + extension, header + cues.map((cue, i) =>
      `${i + 1}\n${timestamp(cue.start, separator)} --> ${timestamp(cue.end, separator)}\n${cue.text}\n`
    ).join('\n'))
  }
}
if (require.main === module) {
  const base = path.resolve(root, args().out || 'output/SunnyFit-3.0-story')
  writeSubtitles(base)
  console.log('Candidate narration subtitles: ' + base + '.{srt,vtt}; no voice recording supplied.')
}
module.exports = { writeSubtitles }
