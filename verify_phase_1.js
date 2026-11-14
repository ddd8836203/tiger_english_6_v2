#!/usr/bin/env node
/**
 * Phase 1 Gate Verification:
 * 1) Validates 4 .log files follow AGENTS.md 3-section Progressive Disclosure structure & matching anchors.
 * 2) Validates 107 rotated OD3 photos (od3_p086..od3_p192.jpg) exist and have portrait dimensions (width < height).
 * 3) Validates all Week 12 unit image assets exist on disk with valid sizes.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
let failures = 0;

function fail(msg) {
  console.error('FAIL:', msg);
  failures++;
}

function getJpegDimensions(buf) {
  let offset = 2; // Skip 0xFFD8
  while (offset < buf.length) {
    if (buf[offset] !== 0xff) break;
    const marker = buf[offset + 1];
    if (marker === 0xd8 || marker === 0xd9) {
      offset += 2;
      continue;
    }
    const len = buf.readUInt16BE(offset + 2);
    // SOF0..SOF3, SOF5..SOF7, SOF9..SOF11, SOF13..SOF15
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      return { width, height };
    }
    offset += 2 + len;
  }
  return null;
}

// 1. Validate 4-Log structure
const logChecks = [
  { file: 'goals_and_roadmap.log', prefix: '#GOAL-' },
  { file: 'web_architecture_and_design.log', prefix: '#(ARCH|WHY|SPEC)-' },
  { file: 'source_manifest.log', prefix: '#MAN-' },
  { file: 'memory.log', prefix: '#MEM-' },
];

for (const lc of logChecks) {
  const p = path.join(ROOT, lc.file);
  if (!fs.existsSync(p)) {
    fail(`${lc.file} missing`);
    continue;
  }
  const content = fs.readFileSync(p, 'utf8');
  const lines = content.split(/\r?\n/);
  const top25 = lines.slice(0, 25).join('\n');
  if (!top25.includes('⚡ 0. 當下狀態快照')) {
    fail(`${lc.file} missing "⚡ 0. 當下狀態快照" within top 25 lines`);
  }
  const sec1Idx = content.indexOf('🧭 一、錨點索引大綱');
  const sec2Idx = content.indexOf('📖 二、單一真實來源細節');
  if (sec1Idx === -1 || sec2Idx === -1 || sec2Idx <= sec1Idx) {
    fail(`${lc.file} missing ordered sections 一 / 二`);
    continue;
  }
  const sec1 = content.slice(sec1Idx, sec2Idx);
  const sec2 = content.slice(sec2Idx);
  const anchorRe = new RegExp(`\\[(${lc.prefix}[A-Za-z0-9_-]+)\\]`, 'g');
  const indexAnchors = new Set([...sec1.matchAll(anchorRe)].map((m) => m[1]));
  if (indexAnchors.size === 0) {
    fail(`${lc.file} has 0 index anchors in section 一`);
  }
  for (const a of indexAnchors) {
    if (!sec2.includes(`[${a}]`)) {
      fail(`${lc.file} index anchor [${a}] missing in section 二`);
    }
  }
  console.log(`OK [LOG] ${lc.file}: ${indexAnchors.size} matching anchors`);
}

// 2. Validate 107 OD3 rotated photos
const od3Dir = path.join(ROOT, '六年級上', '課本', '01_Oxford_Discover_3', 'images');
let portraitChecked = 0;
for (let page = 86; page <= 192; page++) {
  const fname = `od3_p${String(page).padStart(3, '0')}.jpg`;
  const fp = path.join(od3Dir, fname);
  if (!fs.existsSync(fp)) {
    fail(`Missing OD3 rotated photo: ${fname}`);
    continue;
  }
  const buf = fs.readFileSync(fp);
  const dims = getJpegDimensions(buf);
  if (!dims || dims.width >= dims.height) {
    fail(`OD3 photo ${fname} not portrait: ${JSON.stringify(dims)}`);
    continue;
  }
  portraitChecked++;
}
console.log(`OK [OD3] ${portraitChecked}/107 rotated photos verified portrait (width < height)`);

// 3. Validate all Week 12 required unit image assets
const requiredAssets = [
  ...Array.from({ length: 4 }, (_, i) => `六年級上/課本/02_Oxford_Discover_Grammar_3/images/odg3_pdf_p0${70 + i}.png`),
  ...Array.from({ length: 8 }, (_, i) => `六年級上/課本/01_Oxford_Discover_3/images/od3_p${156 + i}.jpg`),
  ...Array.from({ length: 6 }, (_, i) => `六年級上/課本/03_Reading_with_Writing_6/images/rww6_u710_pdf_p${15 + i}.png`),
  ...Array.from({ length: 8 }, (_, i) => `六年級上/課本/04_Write_Right_3/images/wr3_u5_pdf_p${String(9 + i).padStart(2, '0')}.png`),
  ...Array.from({ length: 4 }, (_, i) => `六年級上/課本/05_Read_and_Discover_6_Space/images/space_pdf_p${24 + i}.png`),
  '六年級上/課本/05_Read_and_Discover_6_Space/images/space_act_p46.png',
  '六年級上/課本/05_Read_and_Discover_6_Space/images/space_act_p47.png',
];

let assetsOk = 0;
for (const rel of requiredAssets) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full) || fs.statSync(full).size < 10000) {
    fail(`Missing or undersized Week 12 asset: ${rel}`);
  } else {
    assetsOk++;
  }
}
console.log(`OK [WEEK12 ASSETS] ${assetsOk}/${requiredAssets.length} verified`);

if (failures > 0) {
  console.error(`\nPhase 1 verification FAILED with ${failures} error(s).`);
  process.exit(1);
}
console.log('\nPhase 1 verification PASSED (0 failures).');
