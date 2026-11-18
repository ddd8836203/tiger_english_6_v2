#!/usr/bin/env node
/**
 * Phase 5 Verification Gate:
 * Validates Phase 5 Grammar visual blocks + Example TTS, Reading single-sentence click-to-read,
 * Handwrite & paper-first quiz workflow, custom A4 printing, explicit self-grading separation,
 * and unit-tests the extracted helper functions from app.js.
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

// 1. JS syntax check on app.js
try {
  execFileSync(process.execPath, ['--check', path.join(ROOT, 'app.js')], { stdio: 'pipe' });
} catch (err) {
  fail(`node --check app.js failed: ${err.stderr ? err.stderr.toString() : err.message}`);
}

// 2. index.html cache-busters
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
for (const assetName of ['style.css', 'english_data.js', 'midterm_data.js', 'app.js']) {
  const re = new RegExp(`${assetName.replace('.', '\\.')}\\?v=(?:20261114_p5|20261118_p11)`);
  assert(re.test(indexHtml), `index.html missing cache-buster asset for ${assetName}`);
}

// 3. style.css Phase 5 selectors & responsive rules
const styleCss = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
const requiredCssTokens = [
  '.grammar-cards-grid',
  'minmax(460px, 1fr)',
  '@media (max-width: 960px)',
  '.grammar-card-head .b-badge',
  '.grammar-formula-banner',
  '.grammar-formula-title',
  '.grammar-formula-code',
  '.grammar-cat-list',
  '.grammar-cat-row',
  '.grammar-cat-label',
  '.grammar-chips-wrap',
  '.grammar-chip',
  '.grammar-eng-rule',
  '.grammar-pitfalls-box',
  '.grammar-pitfall-row',
  '.gp-wrong',
  '.gp-right',
  '.gp-tip',
  '.grammar-ex-main',
  '.grammar-ex-content',
  '.grammar-ex-hl',
  '.grammar-ex-zh',
  '.btn-ex-speak',
  '.reading-sentence',
  '.speaking-active',
  '.sent-speaker-ico',
  '.tab-pill-btn.handwrite-action-pill',
  '.paper-write-guide-box',
  '.self-check-rubric-box',
  '.self-check-list'
];
for (const tok of requiredCssTokens) {
  assert(styleCss.includes(tok), `style.css missing Phase 5 selector/rule: ${tok}`);
}

// 4. app.js required tokens & explicit self-grading separation
const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
const requiredAppTokens = [
  'extractCleanEnglishForSpeech',
  'splitSentencesFallback',
  'parseGrammarChiExp',
  'formatGrammarExampleHtml',
  'btn-ex-speak',
  'reading-sentence',
  'data-speak-sentence',
  'matchQuizType',
  "filterType === 'handwrite'",
  'handwrite-action-pill',
  'paper-write-guide-box',
  'self-check-rubric-box',
  'self-check-list',
  'unit_custom',
  'speaking-active'
];
for (const tok of requiredAppTokens) {
  assert(appJs.includes(tok), `app.js missing Phase 5 symbol/markup: ${tok}`);
}

// Ensure no stray unescaped template/backslash issue inside getPassagesForUnit
const getPassagesMatch = appJs.match(/function getPassagesForUnit[\s\S]*?\n  \}/);
assert(!!getPassagesMatch && getPassagesMatch[0].includes('sentences: Array.isArray(p.sentences)'), 'getPassagesForUnit must preserve sentences array');

// Explicit self-grading separation check
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

// 5. Functional unit tests on extracted helper functions from app.js
function extractFnBlock(src, signaturePrefix) {
  const start = src.indexOf(signaturePrefix);
  if (start === -1) return null;
  const braceOpen = src.indexOf('{', start);
  let depth = 0;
  for (let i = braceOpen; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}

const fnNames = [
  'function escapeRegex(',
  'function escapeHtml(',
  'function extractCleanEnglishForSpeech(',
  'function splitSentencesFallback(',
  'function splitChipList(',
  'function parseGrammarChiExp(',
  'function matchQuizType('
];
const blocks = [];
for (const sig of fnNames) {
  const blk = extractFnBlock(appJs, sig);
  assert(!!blk, `Could not extract ${sig} from app.js`);
  if (blk) blocks.push(blk);
}

if (blocks.length === fnNames.length) {
  const ctx = {
    state: { errorBook: [] }
  };
  vm.createContext(ctx);
  vm.runInContext(
    blocks.join('\n') +
      '\nthis.__exports = { escapeRegex, escapeHtml, extractCleanEnglishForSpeech, splitSentencesFallback, parseGrammarChiExp, matchQuizType };',
    ctx
  );
  const {
    extractCleanEnglishForSpeech,
    splitSentencesFallback,
    parseGrammarChiExp,
    matchQuizType
  } = ctx.__exports;

  const speech1 = extractCleanEnglishForSpeech('❌ I am worried of tests. ➔ ✅ I am worried about tests. (我擔心考試)');
  assert(speech1 === 'I am worried about tests.', `extractCleanEnglishForSpeech contrast failed: got "${speech1}"`);

  const speech2 = extractCleanEnglishForSpeech({ en: 'It was kind of Grandma to help.', zh: '奶奶人真好' });
  assert(speech2 === 'It was kind of Grandma to help.', `extractCleanEnglishForSpeech object failed: got "${speech2}"`);

  const sents = splitSentencesFallback('Dr. Chen met Mr. Wang at 3 p.m. They talked about space! Did you see?');
  assert(sents.length === 3, `splitSentencesFallback expected 3 sentences, got ${sents.length}`);
  assert(sents[0].en === 'Dr. Chen met Mr. Wang at 3 p.m.', `splitSentencesFallback sentence 0 mismatch: "${sents[0]?.en}"`);

  const parsed = parseGrammarChiExp('搭配介系詞：(1) 表憂喜用 about (happy/excited/worried about)；(2) 表滿意用 with (happy/bored with)。');
  assert(parsed.categories.length === 2, `parseGrammarChiExp expected 2 categories, got ${parsed.categories.length}`);
  assert(parsed.categories[0].items.includes('worried about'), 'parseGrammarChiExp category 0 missing "worried about" chip');

  // Mutual exclusion checks across quiz filter pills
  const qListen = { id: 'q1', type: 'spelling_listen', category_tag: 'listening' };
  const qHand = { id: 'q2', type: 'paper_rewrite', category_tag: 'rewrite' };
  const qGramChoice = { id: 'q3', type: 'choice', category_tag: 'grammar' };
  const qReadChoice = { id: 'q4', type: 'choice', category_tag: 'reading' };

  assert(matchQuizType(qListen, 'vocab') && !matchQuizType(qListen, 'handwrite') && !matchQuizType(qListen, 'grammar') && !matchQuizType(qListen, 'reading'), 'spelling_listen partition failed');
  assert(matchQuizType(qHand, 'handwrite') && !matchQuizType(qHand, 'vocab') && !matchQuizType(qHand, 'grammar') && !matchQuizType(qHand, 'reading'), 'paper_rewrite partition failed');
  assert(matchQuizType(qGramChoice, 'grammar') && !matchQuizType(qGramChoice, 'handwrite') && !matchQuizType(qGramChoice, 'reading'), 'choice(grammar) partition failed');
  assert(matchQuizType(qReadChoice, 'reading') && !matchQuizType(qReadChoice, 'grammar') && !matchQuizType(qReadChoice, 'handwrite'), 'choice(reading) partition failed');
}

if (failures === 0) {
  console.log('Phase 5 verification PASSED (0 failures)');
  process.exit(0);
} else {
  console.error(`Phase 5 verification FAILED (${failures} failures)`);
  process.exit(1);
}
