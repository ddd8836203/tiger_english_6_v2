#!/usr/bin/env node
/**
 * Phase 4 Verification Gate:
 * Validates compiled data (midterm_data.js + english_data.js), Week 12 4D quality,
 * cache-busters in index.html, Week 12 & 4D CSS classes in style.css,
 * and Week 12 Sprint Hub / 4D answer drawer / self-grading preservation in app.js.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');
const { validateUnit } = require('./verify_phase_2.js');

const ROOT = __dirname;
let failures = 0;

function fail(msg) {
  console.error('FAIL:', msg);
  failures++;
}

function assert(cond, msg) {
  if (!cond) fail(msg);
}

// 1. JS syntax checks
const jsFiles = ['app.js', 'midterm_data.js', 'english_data.js', 'build_exam_bank.js'];
for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', path.join(ROOT, file)], { stdio: 'pipe' });
  } catch (err) {
    fail(`node --check ${file} failed: ${err.stderr ? err.stderr.toString() : err.message}`);
  }
}

// 2. Unit-level 4D + MD validation across all 5 Week 12 modules
const unitSpecs = [
  {
    mdRel: '六年級上/課本/02_Oxford_Discover_Grammar_3/Unit_16_Food_Facts.md',
    jsRel: 'data/units/odg3_u16.js',
    expected: { id: 'ODG3_U16', unit_id: 'gra3_16', book_id: 'gra3' }
  },
  {
    mdRel: '六年級上/課本/01_Oxford_Discover_3/Unit_16_The_Garden_of_Happiness.md',
    jsRel: 'data/units/od3_u16.js',
    expected: { id: 'OD3_U16', unit_id: 'od3_16', book_id: 'od3' }
  },
  {
    mdRel: '六年級上/課本/03_Reading_with_Writing_6/Unit_09_Getting_to_Know_You.md',
    jsRel: 'data/units/rww6_u09.js',
    expected: { id: 'RWW6_U09', unit_id: 'rw6_9', book_id: 'rw6' }
  },
  {
    mdRel: '六年級上/課本/05_Read_and_Discover_6_Space/Chapter_06_Life_on_Other_Planets.md',
    jsRel: 'data/units/space_ch06.js',
    expected: { id: 'SPACE_CH06', unit_id: 'rd6_6', book_id: 'rd6' }
  },
  {
    mdRel: '六年級上/課本/04_Write_Right_3/Unit_06_A_Great_Person_in_History.md',
    jsRel: 'data/units/wr3_u06.js',
    expected: { id: 'WR3_U06', unit_id: 'wr3_6', book_id: 'wr3' }
  }
];

for (const spec of unitSpecs) {
  failures += validateUnit(spec);
}

// 3. Load compiled window.ENGLISH_DATA & window.MIDTERM_DATABASE in sandbox
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'english_data.js'), 'utf8'), sandbox);
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'midterm_data.js'), 'utf8'), sandbox);

const ed = sandbox.window.ENGLISH_DATA;
const md = sandbox.window.MIDTERM_DATABASE;

assert(ed && Array.isArray(ed.books), 'ENGLISH_DATA.books missing or not array');
assert(Array.isArray(md), 'MIDTERM_DATABASE missing or not array');

const w12MidIds = ['ODG3_U16', 'OD3_U16', 'RWW6_U09', 'SPACE_CH06', 'WR3_U06'];
for (const midId of w12MidIds) {
  const entry = md.find(u => u && u.id === midId);
  assert(!!entry, `MIDTERM_DATABASE missing ${midId}`);
  if (entry) {
    assert(Array.isArray(entry.quizzes) && entry.quizzes.length >= 20, `${midId} quizzes.length expected >= 20, got ${entry.quizzes?.length}`);
    for (const q of entry.quizzes || []) {
      const exp = q.explanation || {};
      const has4D = !!(exp.examPurpose && exp.correctReason && (exp.distractorAnalysis || (Array.isArray(exp.commonTraps) && exp.commonTraps.length > 0)));
      assert(has4D && q.extensionStudy, `${midId} quiz ${q.id} missing 4D explanation or extensionStudy`);
    }
    for (const m of entry.mistake_buster || []) {
      assert(m.error_token_index !== undefined && m.wrong_index !== undefined, `${midId} mistake_buster ${m.id} missing dual index keys`);
      assert((m.correct_text || m.fixed_sentence) && (m.explanation || m.reason), `${midId} mistake_buster ${m.id} missing fix/explanation keys`);
    }
  }
}

const w12All = md.find(u => u && u.id === 'WEEK12_ALL');
assert(!!w12All, 'MIDTERM_DATABASE missing WEEK12_ALL');
if (w12All) {
  assert(Array.isArray(w12All.quizzes) && w12All.quizzes.length >= 100, `WEEK12_ALL quizzes.length expected >= 100, got ${w12All.quizzes?.length}`);
  assert(Array.isArray(w12All.passages) && w12All.passages.length >= 16, `WEEK12_ALL passages.length expected >= 16, got ${w12All.passages?.length}`);
  assert(Array.isArray(w12All.mistake_buster) && w12All.mistake_buster.length >= 37, `WEEK12_ALL mistake_buster.length expected >= 37, got ${w12All.mistake_buster?.length}`);
}

const od3Book = (ed.books || []).find(b => b.book_id === 'od3');
assert(od3Book && od3Book.is_midterm === true, 'ENGLISH_DATA.books.od3 must have is_midterm === true');

const w12UnitIds = ['gra3_16', 'od3_16', 'rw6_9', 'rd6_6', 'wr3_6'];
for (const uid of w12UnitIds) {
  const unitMeta = (ed.units || []).find(u => u.unit_id === uid);
  assert(!!unitMeta, `ENGLISH_DATA.units missing ${uid}`);
  const unitQ = (ed.quizzes || []).filter(q => q.unit_id === uid);
  assert(unitQ.length >= 20, `ENGLISH_DATA.quizzes for ${uid} expected >= 20, got ${unitQ.length}`);
}

const w12Vocab = (ed.vocabulary || []).filter(v => v.is_week12 === true);
const w12Grammar = (ed.grammar || []).filter(g => g.is_week12 === true);
const w12Reading = (ed.reading_content || []).filter(r => r.is_week12 === true);
const w12Quizzes = (ed.quizzes || []).filter(q => q.is_week12 === true);

assert(w12Vocab.length === 71, `ENGLISH_DATA Week 12 vocabulary expected 71, got ${w12Vocab.length}`);
assert(w12Grammar.length >= 14, `ENGLISH_DATA Week 12 grammar expected >= 14, got ${w12Grammar.length}`);
assert(w12Reading.length >= 16, `ENGLISH_DATA Week 12 reading_content expected >= 16, got ${w12Reading.length}`);
assert(w12Quizzes.length >= 100, `ENGLISH_DATA Week 12 quizzes expected >= 100, got ${w12Quizzes.length}`);

// 4. Validate index.html cache-busters
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const assetName of ['style.css', 'english_data.js', 'midterm_data.js', 'app.js']) {
  const re = new RegExp(`${assetName.replace('.', '\\.')}\\?v=(?:20261114_(?:w12|p5|p8)|20261118_p11)`);
  assert(re.test(indexHtml), `index.html missing cache-buster asset for ${assetName}`);
}

// 5. Validate style.css Week 12 & 4D styles
const styleCss = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
for (const cls of ['.banner-week12', '.w12-grid', '.w12-chip', '.u-no.week12-badge', '.exp-4d-grid', '.exp-row.exp-purpose', '.exp-row.exp-correct', '.exp-row.exp-distractors', '.ext-study-details', '.ext-syn-chip']) {
  assert(styleCss.includes(cls), `style.css missing class selector: ${cls}`);
}

// 6. Validate app.js Week 12 integration, 4D drawer, fallbacks & explicit self-grading closure
const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const requiredAppTokens = [
  'banner-week12',
  'btn-launch-w12-mock',
  'data-open-w12-unit',
  'week12_all',
  'week12-badge',
  'exp-4d-grid',
  'examPurpose',
  'correctReason',
  'distractorAnalysis',
  'commonTraps',
  'ext-study-details',
  'grammarCompare',
  'examVariations',
  'ks.note || ks.point',
  'm.wrong_index',
  'm.fixed_sentence'
];
for (const tok of requiredAppTokens) {
  assert(appJs.includes(tok), `app.js missing required Week 12 / 4D integration token: ${tok}`);
}

// Verify explicit self-grading closure: revealBtn.onclick must NOT invoke recordAnswerResult; only [data-rate] invokes it
const revealBlockMatch = appJs.match(/if \(revealBtn && ansDrawer\) \{([\s\S]*?)\r?\n\s*\}/);
assert(!!revealBlockMatch, 'app.js missing revealBtn && ansDrawer handler block');
if (revealBlockMatch) {
  assert(!revealBlockMatch[1].includes('recordAnswerResult'), 'revealBtn.onclick must NOT auto-call recordAnswerResult');
}
const optClickMatch = appJs.match(/container\.querySelectorAll\('\[data-opt-idx\]'\)\.forEach\(([\s\S]*?)\r?\n\s*\}\);/);
assert(!!optClickMatch, 'app.js missing [data-opt-idx] click handler block');
if (optClickMatch) {
  assert(!optClickMatch[1].includes('recordAnswerResult'), '[data-opt-idx] click handler must NOT auto-call recordAnswerResult');
}
const rateMatch = appJs.match(/container\.querySelectorAll\('\[data-rate\]'\)\.forEach\(([\s\S]*?)\r?\n\s*\}\);/);
assert(!!rateMatch && rateMatch[1].includes('recordAnswerResult(q, rate)'), '[data-rate] handler must explicitly call recordAnswerResult(q, rate)');

// Verify BOOK_META.od3.isMidterm === true
const od3MetaMatch = appJs.match(/'od3'\s*:\s*\{([\s\S]*?)\}/);
assert(!!od3MetaMatch && /isMidterm:\s*true/.test(od3MetaMatch[1]), 'BOOK_META.od3 in app.js must have isMidterm: true');

if (failures === 0) {
  console.log('Phase 4 verification PASSED (0 failures)');
  console.log(`Summary: MD units=${md.length}, WEEK12_ALL quizzes=${w12All.quizzes.length}, W12 vocab=${w12Vocab.length}, W12 grammar=${w12Grammar.length}, W12 reading=${w12Reading.length}`);
  process.exit(0);
} else {
  console.error(`Phase 4 verification FAILED (${failures} failures)`);
  process.exit(1);
}
