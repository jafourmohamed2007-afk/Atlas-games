#!/usr/bin/env node
/* Runs tests/arrow-meta.js against the 3D edition (games/arrow-rampart-3d.html, saves ar3:*, its own feathers). */
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const src = path.join(__dirname, 'arrow-meta.js'), tmp = path.join(__dirname, '.tmp-arrow-3d.js');
fs.writeFileSync(tmp, fs.readFileSync(src, 'utf8').replace(/arrow-rampart\.html/g, 'arrow-rampart-3d.html').replace(/bubzi:ar:/g, 'bubzi:ar3:').replace(/bubzi:cur:arrow-rampart/g, 'bubzi:cur:arrow-rampart-3d'));
let code = 0; try { execFileSync(process.execPath, [tmp], { stdio: 'inherit' }); } catch (e) { code = 1; } finally { fs.unlinkSync(tmp); }
process.exit(code);
