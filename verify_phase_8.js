#!/usr/bin/env node
/**
 * Phase 8 Verification Gate:
 * Validates compiled midterm_data.js + english_data.js (156 Week 12 quizzes = 65 listen + 41 handwrite + 50 choice),
 * zero-empty-pill partitioning via extracted app.js matchQuizType,
 * BOOK_META & banner-week12 UI count sync in app.js, and JS syntax across all runtime/unit modules.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

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
const jsFiles = [
  'app.js',
  'midterm_data.js',
  'english_data.js',
  'build_exam_bank.js',
  'data/units/odg3_u16.js',
  'data/units/od3_u16.js',
  'data/units/rww6_u09.js',
  'data/units/space_ch06.js',
  'data/units/wr3_u06.js'
];
for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', path.join(ROOT, file)], { stdio: 'pipe' });
  } catch (err) {
    fail(`node --check ${file} failed: ${err.stderr ? err.stderr.toString() : err.message}`);
  }
}

// 2. Load compiled databases in sandbox
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'english_data.js'), 'utf8'), sandbox);
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'midterm_data.js'), 'utf8'), sandbox);

const ed = sandbox.window.ENGLISH_DATA;
const md = sandbox.window.MIDTERM_DATABASE;
assert(ed && Array.isArray(ed.books), 'ENGLISH_DATA missing');
assert(Array.isArray(md), 'MIDTERM_DATABASE missing');

const expectedUnits = {
  ODG3_U16: 28,
  OD3_U16: 32,
  RWW6_U09: 32,
  SPACE_CH06: 32,
  WR3_U06: 32
};

// Extract matchQuizType from app.js to test live pill partitioning
const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
function extractFnBlock(src, signaturePrefix) {
  const start = src.indexOf(signaturePrefix);
  if (start === -1) return null;
  const braceOpen = src.indexOf('{', start);
  let depth = 0;
  for (let i = braceOpen; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}
const matchFnBlk = extractFnBlock(appJs, 'function matchQuizType(');
assert(!!matchFnBlk, 'Could not extract matchQuizType from app.js');
const matchCtx = { state: { errorBook: [] } };
vm.createContext(matchCtx);
vm.runInContext(`${matchFnBlk}\nthis.matchQuizType = matchQuizType;`, matchCtx);
const matchQuizType = matchCtx.matchQuizType;

let totalListen = 0;
let totalHandwrite = 0;
let totalChoice = 0;
let totalGramChoice = 0;
let totalReadChoice = 0;

for (const [midId, expCount] of Object.entries(expectedUnits)) {
  const u = md.find(item => item && item.id === midId);
  assert(!!u, `MIDTERM_DATABASE missing ${midId}`);
  if (!u) continue;
  const qs = u.quizzes || [];
  assert(qs.length === expCount, `${midId} expected ${expCount} quizzes, got ${qs.length}`);

  const listen = qs.filter(q => q.type === 'spelling_listen');
  const hand = qs.filter(q => q.type === 'paper_rewrite');
  const choice = qs.filter(q => q.type === 'choice');
  totalListen += listen.length;
  totalHandwrite += hand.length;
  totalChoice += choice.length;
  totalGramChoice += choice.filter(q => q.category_tag === 'grammar').length;
  totalReadChoice += choice.filter(q => q.category_tag === 'reading').length;

  listen.forEach(q => {
    assert(q.vocab_card && q.vocab_card.word && q.vocab_card.word.toLowerCase() === String(q.answer || '').toLowerCase(),
      `${midId} ${q.id} compiled spelling_listen missing vocab_card`);
  });
  hand.forEach(q => {
    assert(q.part_instructions && q.sentence_form && Array.isArray(q.self_check) && q.self_check.length >= 2,
      `${midId} ${q.id} compiled paper_rewrite missing guide/rubric fields`);
  });

  // Zero-empty-pill + mutual exclusivity + exhaustive coverage assertions
  const vocabQ = qs.filter(q => matchQuizType(q, 'vocab'));
  const handwriteQ = qs.filter(q => matchQuizType(q, 'handwrite'));
  const grammarQ = qs.filter(q => matchQuizType(q, 'grammar'));
  const readingQ = qs.filter(q => matchQuizType(q, 'reading'));

  assert(vocabQ.length >= 6, `${midId}: vocabQ pill too small (${vocabQ.length})`);
  assert(handwriteQ.length >= 5, `${midId}: handwriteQ pill too small (${handwriteQ.length})`);
  assert(grammarQ.length >= 4, `${midId}: grammarQ pill too small (${grammarQ.length})`);
  assert(readingQ.length >= 4, `${midId}: readingQ pill too small (${readingQ.length})`);
  assert(
    vocabQ.length + handwriteQ.length + grammarQ.length + readingQ.length === qs.length,
    `${midId}: pill partition sum (${vocabQ.length}+${handwriteQ.length}+${grammarQ.length}+${readingQ.length}) !== total (${qs.length})`
  );
}

assert(totalListen === 65, `Week 12 total spelling_listen expected 65, got ${totalListen}`);
assert(totalHandwrite === 41, `Week 12 total paper_rewrite expected 41, got ${totalHandwrite}`);
assert(totalChoice === 50, `Week 12 total choice expected 50, got ${totalChoice}`);
assert(totalGramChoice === 25 && totalReadChoice === 25,
  `Week 12 choice split expected 25 grammar / 25 reading, got ${totalGramChoice} / ${totalReadChoice}`);

const w12All = md.find(u => u && u.id === 'WEEK12_ALL');
assert(!!w12All && Array.isArray(w12All.quizzes) && w12All.quizzes.length === 156,
  `WEEK12_ALL quizzes expected 156, got ${w12All?.quizzes?.length}`);

const edW12Quizzes = (ed.quizzes || []).filter(q => q.is_week12 === true);
assert(edW12Quizzes.length === 156, `ENGLISH_DATA Week 12 quizzes expected 156, got ${edW12Quizzes.length}`);

// Ensure sentences & grammar categories/pitfalls survive into ENGLISH_DATA
const edW12Gram = (ed.grammar || []).filter(g => g.is_week12 === true);
assert(edW12Gram.length >= 14 && edW12Gram.every(g => typeof g.formula === 'string' && g.formula.length >= 6),
  'ENGLISH_DATA Week 12 grammar entries missing formula field');

// 3. Validate app.js Week 12 UI counts
assert(appJs.includes('156 道 KET-4D 全真複習題庫'), 'app.js banner-week12 missing 156 total heading');
assert(appJs.includes('65 聽寫 + 41 手寫實戰 + 50 選擇'), 'app.js banner-week12 missing 65/41/50 breakdown');
assert(appJs.includes('五合一 156 題大模考'), 'app.js banner-week12 missing 156 mock button text');

for (const chipLabel of [
  '14 聽寫 + 8 手寫 + 10 選擇 (32 題)',
  '6 聽寫 + 10 手寫 + 12 選擇 (28 題)',
  '14 聽寫 + 10 手寫 + 8 選擇 (32 題)',
  '17 聽寫 + 5 手寫 + 10 選擇 (32 題)'
]) {
  assert(appJs.includes(chipLabel), `app.js .w12-chip missing label: ${chipLabel}`);
}

// 4. Verify BOOK_META desc counts match actual compiled totals per book
for (const bid of ['gra3', 'wr3', 'rw6', 'rd6', 'od3']) {
  const edCount = (ed.quizzes || []).filter(q => q.book_id === bid).length;
  const metaMatch = appJs.match(new RegExp(`'${bid}'\\s*:\\s*\\{[\\s\\S]*?desc:\\s*'([^']+)'`));
  assert(!!metaMatch, `BOOK_META.${bid} desc missing in app.js`);
  if (metaMatch) {
    assert(metaMatch[1].includes(`(${edCount} 題)`),
      `BOOK_META.${bid}.desc "${metaMatch[1]}" expected to contain "(${edCount} 題)"`);
  }
}

if (failures === 0) {
  console.log('Phase 8 verification PASSED (0 failures)');
  console.log(`Summary: WEEK12_ALL=${w12All.quizzes.length} Qs (${totalListen} listen / ${totalHandwrite} handwrite / ${totalChoice} choice)`);
  process.exit(0);
} else {
  console.error(`Phase 8 verification FAILED (${failures} failures)`);
  process.exit(1);
}
