#!/usr/bin/env node
/**
 * Phase 9 Verification Gate:
 * Validates zero dictation answer leaks across all 18 MIDTERM_DATABASE units & ENGLISH_DATA quizzes,
 * target_chi + masked_example enrichment on spelling_listen items,
 * self-contained passage_excerpt on RWW6_U06/RWW6_U08 line-ref questions,
 * and full book names inside WEEK12_ALL.
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

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsAnswerWord(text, answer) {
  const t = String(text || '');
  const ans = String(answer || '').trim();
  if (!t || !ans) return false;
  // Whole-word case-insensitive match for exact answer
  const re = new RegExp(`\\b${escapeRegExp(ans)}\\b`, 'i');
  return re.test(t);
}

// 1. JS syntax checks
const jsFiles = [
  'data/units/odg3_u16.js',
  'data/units/od3_u16.js',
  'data/units/rww6_u09.js',
  'data/units/space_ch06.js',
  'data/units/wr3_u06.js',
  'build_exam_bank.js',
  'midterm_data.js',
  'english_data.js',
];
for (const file of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', path.join(ROOT, file)], { stdio: 'pipe' });
  } catch (err) {
    fail(`node --check ${file} failed: ${err.stderr ? err.stderr.toString() : err.message}`);
  }
}

// 2. Load compiled databases in VM
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'english_data.js'), 'utf8'), sandbox);
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'midterm_data.js'), 'utf8'), sandbox);

const ed = sandbox.window.ENGLISH_DATA;
const md = sandbox.window.MIDTERM_DATABASE;
assert(ed && Array.isArray(ed.quizzes), 'ENGLISH_DATA missing quizzes');
assert(Array.isArray(md) && md.length === 18, `MIDTERM_DATABASE expected 18 units, got ${md?.length}`);

// 3. Check ALL spelling_listen items across all 18 midterm units
let mdListenCount = 0;
let w12ListenCount = 0;
for (const u of md) {
  for (const q of u.quizzes || []) {
    if (q.type !== 'spelling_listen') continue;
    mdListenCount++;
    assert(!containsAnswerWord(q.question, q.answer),
      `MD ${u.id} ${q.id}: unmasked answer "${q.answer}" leaked in question: "${q.question}"`);
    assert(!containsAnswerWord(q.masked_example, q.answer),
      `MD ${u.id} ${q.id}: unmasked answer "${q.answer}" leaked in masked_example: "${q.masked_example}"`);
    assert(typeof q.target_chi === 'string' && q.target_chi.trim().length > 0,
      `MD ${u.id} ${q.id}: missing non-empty target_chi`);

    if (q.is_week12 || ['ODG3_U16', 'OD3_U16', 'RWW6_U09', 'SPACE_CH06', 'WR3_U06', 'WEEK12_ALL'].includes(u.id)) {
      w12ListenCount++;
      assert(typeof q.masked_example === 'string' && q.masked_example.includes('________'),
        `MD ${u.id} ${q.id}: Week 12 spelling_listen masked_example missing "________" blank (got "${q.masked_example}")`);
    }
  }

  if (u.id === 'RWW6_U06' || u.id === 'RWW6_U08') {
    for (const q of u.quizzes || []) {
      if (/^In line \d+/i.test(q.question || '')) {
        assert(typeof q.passage_excerpt === 'string' && q.passage_excerpt.length >= 15,
          `MD ${u.id} ${q.id}: "In line X" question missing self-contained passage_excerpt`);
      }
    }
  }
}

// 4. Check ALL spelling_listen items in ENGLISH_DATA
let edListenCount = 0;
for (const q of ed.quizzes || []) {
  if (q.type !== 'spelling_listen') continue;
  edListenCount++;
  assert(!containsAnswerWord(q.question, q.answer),
    `ED ${q.unit_id} ${q.id}: unmasked answer "${q.answer}" leaked in question`);
  assert(!containsAnswerWord(q.masked_example, q.answer),
    `ED ${q.unit_id} ${q.id}: unmasked answer "${q.answer}" leaked in masked_example`);
  assert(typeof q.target_chi === 'string' && q.target_chi.trim().length > 0,
    `ED ${q.unit_id} ${q.id}: missing target_chi`);
}

// 5. Check WEEK12_ALL uses full book names (no [ODG3_U16] etc.)
const w12All = md.find((u) => u.id === 'WEEK12_ALL');
assert(!!w12All, 'WEEK12_ALL missing');
if (w12All) {
  for (const p of w12All.passages || []) {
    assert(!/^\[(?:ODG3_U16|OD3_U16|RWW6_U09|SPACE_CH06|WR3_U06)\]/.test(p.section_title || ''),
      `WEEK12_ALL passage still uses raw unit ID tag: "${p.section_title}"`);
  }
  assert(w12All.big_question.includes('Reading with Writing 6') &&
         w12All.big_question.includes('Read and Discover 6: Space') &&
         w12All.big_question.includes('Oxford Discover Grammar 3') &&
         w12All.big_question.includes('Write Right 3') &&
         w12All.big_question.includes('Oxford Discover 3'),
    `WEEK12_ALL big_question missing full book names: "${w12All.big_question}"`);
  assert(w12All.pages.includes('Reading with Writing 6') &&
         w12All.pages.includes('Read and Discover 6: Space') &&
         w12All.pages.includes('Oxford Discover Grammar 3') &&
         w12All.pages.includes('Write Right 3') &&
         w12All.pages.includes('Oxford Discover 3'),
    `WEEK12_ALL pages missing full book names: "${w12All.pages}"`);
}

if (failures === 0) {
  console.log('Phase 9 verification PASSED (0 failures)');
  console.log(`Summary: checked MD spelling_listen=${mdListenCount} (W12=${w12ListenCount}), ED spelling_listen=${edListenCount}, 0 leaks.`);
  process.exit(0);
} else {
  console.error(`Phase 9 verification FAILED (${failures} failures)`);
  process.exit(1);
}
