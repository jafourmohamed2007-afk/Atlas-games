#!/usr/bin/env node
/* Runs every Ink Heroes test against the Remastered build (games/ink-heroes-remastered.html):
   each tests/ink-*.js is copied with the page name and save keys swapped ("ink:" → "inkr:"), then run.
   Usage: node tests/ink-remastered.js [story features dash grab train] */
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const names = process.argv.slice(2).length ? process.argv.slice(2) : ['story', 'features', 'dash', 'grab', 'train'];
let bad = 0;
for (const n of names) {
  const src = path.join(__dirname, 'ink-' + n + '.js'), tmp = path.join(__dirname, '.tmp-inkr-' + n + '.js');
  const code = fs.readFileSync(src, 'utf8').replace(/ink-heroes\.html/g, 'ink-heroes-remastered.html')
    .replace(/bubzi:ink:/g, 'bubzi:inkr:').replace(/bubzi:cur:ink-heroes/g, 'bubzi:cur:ink-heroes-remastered');
  fs.writeFileSync(tmp, code);
  try { execFileSync(process.execPath, [tmp], { stdio: 'inherit' }); } catch (e) { bad++; console.log('ink-' + n + ' (remastered): FAILED'); }
  finally { fs.unlinkSync(tmp); }
}
console.log(bad ? bad + ' remastered ink suite(s) failed' : 'ALL REMASTERED INK SUITES PASSED');
process.exit(bad ? 1 : 0);
