#!/usr/bin/env node
/* Builds games/ashen-vigil.html: ONE self-contained, 100%-canvas HTML file.
   Source modules live in src/ashen-vigil/ (01-core ... 05-ui). The ElevenLabs narrator clips in
   src/ashen-vigil/voices/*.mp3 are embedded as base64 data URIs, so the game makes no runtime API calls. */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SRC = path.join(ROOT, 'src/ashen-vigil');
function build() {
  const voices = {};
  for (const f of fs.readdirSync(path.join(SRC, 'voices')).filter((n) => n.endsWith('.mp3')).sort())
    voices[f.replace(/\.mp3$/, '')] = 'data:audio/mpeg;base64,' + fs.readFileSync(path.join(SRC, 'voices', f)).toString('base64');
  const code = fs.readdirSync(SRC).filter((n) => /^\d\d-.*\.js$/.test(n)).sort()
    .map((n) => fs.readFileSync(path.join(SRC, n), 'utf8')).join('\n').replace('__VOICE_JSON__', () => JSON.stringify(voices)).replace(/<\/script/gi, '<\\/script');
  const html = fs.readFileSync(path.join(SRC, 'template.html'), 'utf8').replace('__CODE__', () => code);
  fs.mkdirSync(path.join(ROOT, 'games'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'games/ashen-vigil.html'), html);
  console.log('built games/ashen-vigil.html', (html.length / 1024).toFixed(0) + ' KB,', Object.keys(voices).length, 'voice clips');
  return html;
}
if (require.main === module) build();
module.exports = build;
