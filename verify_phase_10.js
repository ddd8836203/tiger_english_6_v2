/**
 * Phase 10 獨立自動化驗收腳本 (verify_phase_10.js)
 *
 * 驗證目標：
 * 1. `app.js` 語法檢核通過 (`node --check app.js`)。
 * 2. `BOOK_META` (`gra3`, `wr3`, `rw6`, `rd6`, `od3`)、`tea_midterm` 說明與 `.banner-week12` 全數使用完整課本名稱，無縮寫殘留。
 * 3. `renderActiveQuizView` 具備中文題型徽章 (`getQuizTypeBadgeLabel`)、去重 `partBannerText`、`[data-speak-stem]` 綁定。
 * 4. `style.css` 具備三層題幹卡片與 `.w12-grid` RWD 樣式。
 * 5. 於 Node VM 實跑 `renderStructuredStemHtml(q)` 與 `getQuizTypeBadgeLabel(q)` 覆蓋 `midterm_data.js` 全部 18 單元與 `english_data.js` 全庫題目：
 *    - 0 例外；0 `[Tiger 3C` / `[3C Handwritten` 內部標籤外露；
 *    - 全部 `spelling_listen` 渲染為 `.stem-listen-card` 且去標籤純文字不洩漏 `q.answer`；
 *    - 全部 `paper_rewrite` 渲染為結構化手寫卡片；
 *    - 含 `___` 之 `choice` / `fill` 題渲染 `<span class="stem-blank-slot">`。
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

let passes = 0;
let failures = 0;

function check(cond, msg) {
  if (cond) {
    passes++;
  } else {
    failures++;
    console.error('FAIL:', msg);
  }
}

console.log('=== [Phase 10 獨立驗收開始] ===');

const rootDir = __dirname;
const appPath = path.join(rootDir, 'app.js');
const cssPath = path.join(rootDir, 'style.css');
const mdPath = path.join(rootDir, 'midterm_data.js');
const edPath = path.join(rootDir, 'english_data.js');

// 1. node --check app.js
try {
  execFileSync('node', ['--check', appPath], { stdio: 'pipe' });
  check(true, 'node --check app.js 語法通過');
} catch (err) {
  check(false, 'node --check app.js 語法失敗: ' + (err.stderr ? err.stderr.toString() : err.message));
}

const appSrc = fs.readFileSync(appPath, 'utf8');
const cssSrc = fs.readFileSync(cssPath, 'utf8');

// 2. Extract BOOK_META via VM and verify full book names
const bmStart = appSrc.indexOf('const BOOK_META = {');
const bmEnd = appSrc.indexOf('  function getUnitsForBook(', bmStart);
check(bmStart !== -1 && bmEnd !== -1, '在 app.js 中定位 BOOK_META 定義區塊');

const metaCtx = {};
vm.createContext(metaCtx);
vm.runInContext(appSrc.slice(bmStart, bmEnd) + '\nthis.__BOOK_META = BOOK_META;', metaCtx);
const BOOK_META = metaCtx.__BOOK_META;

const expectedBooks = {
  gra3: 'Oxford Discover Grammar 3',
  wr3: 'Write Right 3',
  rw6: 'Reading with Writing 6',
  rd6: 'Read and Discover 6: Space',
  od3: 'Oxford Discover 3'
};

for (const [bid, fullName] of Object.entries(expectedBooks)) {
  const m = BOOK_META[bid];
  check(Boolean(m), `BOOK_META['${bid}'] 存在`);
  if (m) {
    check(m.shortName === fullName, `BOOK_META['${bid}'].shortName 為完整書名 "${fullName}" (實為 "${m.shortName}")`);
    check(m.name.includes(fullName), `BOOK_META['${bid}'].name 包含完整書名 "${fullName}" (實為 "${m.name}")`);
    check(m.isMidterm === true, `BOOK_META['${bid}'].isMidterm === true`);
  }
}

// Verify forbidden abbreviated book labels are absent in BOOK_META / tea_midterm / .banner-week12
const bannerStart = appSrc.indexOf('<aside class="banner-week12">');
const bannerEnd = appSrc.indexOf('</aside>', bannerStart);
check(bannerStart !== -1 && bannerEnd !== -1, '在 app.js 中定位 .banner-week12 區塊');
const bannerHtml = bannerStart !== -1 && bannerEnd !== -1 ? appSrc.slice(bannerStart, bannerEnd) : '';

for (const fullName of Object.values(expectedBooks)) {
  check(bannerHtml.includes(fullName), `.banner-week12 包含完整書名 "${fullName}"`);
}

const forbiddenAbbrs = ['RWW 6', 'OD3 課本', 'OD3 主課本', 'Space 科普', "'Grammar 3'", '📘 Grammar 3', 'OD3 Unit 16'];
const uiMetaAndBannerSlice = appSrc.slice(bmStart, appSrc.indexOf('function isWeek12Unit(', bmStart)) + '\n' + bannerHtml;
for (const abbr of forbiddenAbbrs) {
  check(!uiMetaAndBannerSlice.includes(abbr), `BOOK_META / tea_midterm / .banner-week12 不含縮寫 "${abbr}"`);
}

// 3. Check renderActiveQuizView upgrades
check(appSrc.includes('${getQuizTypeBadgeLabel(q)}'), 'renderActiveQuizView 使用 getQuizTypeBadgeLabel(q)');
check(appSrc.includes('const partBannerText = !rawPart'), 'renderActiveQuizView 具備 partBannerText 去重邏輯');
check(appSrc.includes('${escapeHtml(partBannerText)}'), 'renderActiveQuizView 渲染去重後 partBannerText');
check(appSrc.includes("container.querySelectorAll('[data-speak-stem]').forEach"), 'renderActiveQuizView 綁定 [data-speak-stem] 朗讀按鈕');

// 4. Check style.css required Phase 10 classes & responsive .w12-grid
const requiredCssTokens = [
  'minmax(215px, 1fr)',
  '.stem-listen-card',
  '.stem-listen-meaning-box',
  '.stem-listen-label',
  '.stem-listen-chi',
  '.stem-listen-pos',
  '.stem-listen-example-box',
  '.stem-ex-label',
  '.stem-ex-sent',
  '.stem-ex-zh',
  '.stem-rewrite-card',
  '.stem-task-header',
  '.stem-notes-box',
  '.stem-box-label',
  '.stem-notes-chips-row',
  '.stem-note-chip',
  '.stem-quote-box',
  '.stem-quote-box.is-proofread',
  '.stem-quote-top',
  '.stem-quote-text',
  '.stem-cue-pill',
  '.stem-cue-pill.subtle-note',
  '.cue-tag',
  '.cue-code',
  '.cue-text',
  '.stem-choice-card',
  '.stem-choice-lead',
  '.stem-choice-sentence',
  '.stem-blank-slot',
  '.stem-word-hint'
];
for (const tok of requiredCssTokens) {
  check(cssSrc.includes(tok), `style.css 包含樣式 "${tok}"`);
}

// 5. Extract stem rendering functions from app.js into VM
const fnStart = appSrc.indexOf('  function escapeHtml(str)');
const fnEnd = appSrc.indexOf('  function getCurrentUserObj()');
check(fnStart !== -1 && fnEnd !== -1, '在 app.js 定位題幹渲染函式群區塊');

const stemCtx = {};
vm.createContext(stemCtx);
vm.runInContext(appSrc.slice(fnStart, fnEnd), stemCtx);

check(typeof stemCtx.getQuizTypeBadgeLabel === 'function', 'VM 成功載入 getQuizTypeBadgeLabel');
check(typeof stemCtx.renderStructuredStemHtml === 'function', 'VM 成功載入 renderStructuredStemHtml');
check(typeof stemCtx.highlightBlanksAndWordHints === 'function', 'VM 成功載入 highlightBlanksAndWordHints');

// Load MIDTERM_DATABASE & ENGLISH_DATA
const dataCtx = { window: {} };
vm.createContext(dataCtx);
vm.runInContext(fs.readFileSync(mdPath, 'utf8'), dataCtx);
vm.runInContext(fs.readFileSync(edPath, 'utf8'), dataCtx);

const MIDTERM_DATABASE = dataCtx.window.MIDTERM_DATABASE;
const ENGLISH_DATA = dataCtx.window.ENGLISH_DATA;
check(Boolean(MIDTERM_DATABASE) && typeof MIDTERM_DATABASE === 'object', '成功載入 MIDTERM_DATABASE');
check(Boolean(ENGLISH_DATA) && Array.isArray(ENGLISH_DATA.quizzes), '成功載入 ENGLISH_DATA.quizzes');

// Helper: strip tags & decode basic HTML entities for visible-text leak checking
function stripTags(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegExpLocal(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(s) {
  return String(s || '').replace(/\u2019/g, "'").replace(/\s+/g, ' ').trim();
}

// Collect every question across MIDTERM_DATABASE (18 units) and ENGLISH_DATA.quizzes
const allTargets = [];
const mdUnits = Object.keys(MIDTERM_DATABASE);
check(mdUnits.length === 18, `MIDTERM_DATABASE 應有 18 個單元（實為 ${mdUnits.length}）`);
for (const uk of mdUnits) {
  const qs = (MIDTERM_DATABASE[uk] && MIDTERM_DATABASE[uk].quizzes) || [];
  qs.forEach((q, idx) => allTargets.push({ source: `MD.${uk}[${idx}]`, q }));
}
ENGLISH_DATA.quizzes.forEach((q, idx) => allTargets.push({ source: `ED[${idx}]`, q }));

let renderErrors = 0;
let internalTagLeaks = 0;
let listenTotal = 0;
let listenCardFailures = 0;
let listenAnswerLeaks = 0;
let rewriteTotal = 0;
let rewriteStructuredFailures = 0;
let cuePillExpected = 0;
let cuePillFailures = 0;
let blankChoiceTotal = 0;
let blankSlotFailures = 0;
let badgeEmptyFailures = 0;

for (const { source, q } of allTargets) {
  let html = '';
  let badge = '';
  try {
    html = stemCtx.renderStructuredStemHtml(q);
    badge = stemCtx.getQuizTypeBadgeLabel(q);
  } catch (err) {
    renderErrors++;
    if (renderErrors <= 5) console.error('Render threw at', source, q && q.id, err);
    continue;
  }

  if (!badge || !badge.trim()) {
    badgeEmptyFailures++;
  }

  // Check zero internal tag leaks
  if (/\[(?:Tiger\s+3C|3C\s+Handwritten)/i.test(html)) {
    internalTagLeaks++;
    if (internalTagLeaks <= 5) console.error('Internal bracket tag leaked:', source, q && q.id, html.slice(0, 180));
  }

  // spelling_listen checks
  if (q && q.type === 'spelling_listen') {
    listenTotal++;
    if (!html.includes('stem-listen-card')) {
      listenCardFailures++;
      if (listenCardFailures <= 5) console.error('Missing .stem-listen-card:', source, q.id);
    }
    const ans = normalizeText(q.answer);
    if (ans && ans.length >= 2 && /[a-zA-Z]/.test(ans)) {
      const visible = normalizeText(stripTags(html));
      const rx = new RegExp(`(?<![a-zA-Z])${escapeRegExpLocal(ans)}(?![a-zA-Z])`, 'i');
      if (rx.test(visible)) {
        listenAnswerLeaks++;
        if (listenAnswerLeaks <= 5) {
          console.error('Dictation leak after render:', source, q.id, 'answer=', ans, 'visible=', visible.slice(0, 160));
        }
      }
    }
  }

  // paper_rewrite checks
  if (q && q.type === 'paper_rewrite') {
    rewriteTotal++;
    const hasStructuredBlock =
      html.includes('stem-rewrite-card') ||
      html.includes('stem-inversion') ||
      html.includes('stem-adverbs') ||
      html.includes('stem-measure') ||
      html.includes('stem-proofread');
    if (!hasStructuredBlock) {
      rewriteStructuredFailures++;
      if (rewriteStructuredFailures <= 5) console.error('Unstructured paper_rewrite:', source, q.id);
    }

    // Check cue pill when question has trailing (Use: / Include: / Begin with: ...)
    const rawQ = String(q.question || '');
    if (/\(\s*(?:Use|Include|Begin with)\s*[：:]/i.test(rawQ) && !rawQ.includes('[Part')) {
      cuePillExpected++;
      if (!html.includes('stem-cue-pill')) {
        cuePillFailures++;
        if (cuePillFailures <= 5) console.error('Missing .stem-cue-pill:', source, q.id, rawQ);
      }
    }
  }

  // choice / fill blank slot check
  if (q && (q.type === 'choice' || q.type === 'fill') && /_{2,}/.test(String(q.question || ''))) {
    blankChoiceTotal++;
    if (!html.includes('<span class="stem-blank-slot">')) {
      blankSlotFailures++;
      if (blankSlotFailures <= 5) console.error('Missing .stem-blank-slot:', source, q.id);
    }
  }
}

check(renderErrors === 0, `全庫 ${allTargets.length} 題渲染零例外 (錯誤: ${renderErrors})`);
check(badgeEmptyFailures === 0, `全庫題型中文徽章非空 (空白: ${badgeEmptyFailures})`);
check(internalTagLeaks === 0, `渲染後題幹零殘留 [Tiger 3C / [3C Handwritten 標籤 (殘留: ${internalTagLeaks})`);
check(listenTotal >= 360, `聽寫題總檢驗數 >= 360 (實測 ${listenTotal} 題)`);
check(listenCardFailures === 0, `全部 ${listenTotal} 題 spelling_listen 皆渲染 .stem-listen-card (失敗: ${listenCardFailures})`);
check(listenAnswerLeaks === 0, `全部 ${listenTotal} 題 spelling_listen 渲染純文字零洩漏正解 (洩漏: ${listenAnswerLeaks})`);
check(rewriteTotal >= 140, `手寫題 paper_rewrite 檢驗數 >= 140 (實測 ${rewriteTotal} 題)`);
check(rewriteStructuredFailures === 0, `全部 ${rewriteTotal} 題 paper_rewrite 皆具結構化題幹區塊 (失敗: ${rewriteStructuredFailures})`);
check(cuePillExpected > 0 && cuePillFailures === 0, `含 (Use/Include/Begin with) 之手寫題 (${cuePillExpected} 題) 皆渲染 .stem-cue-pill (失敗: ${cuePillFailures})`);
check(blankChoiceTotal > 0 && blankSlotFailures === 0, `含底線挖空之選擇/填空題 (${blankChoiceTotal} 題) 皆渲染 .stem-blank-slot (失敗: ${blankSlotFailures})`);

console.log(
  `[統計] 檢查總題數=${allTargets.length}, spelling_listen=${listenTotal}, paper_rewrite=${rewriteTotal}, cue_pill=${cuePillExpected}, blank_choice=${blankChoiceTotal}`
);
console.log(`=== [Phase 10 驗收結果] PASS: ${passes} | FAIL: ${failures} ===`);
process.exit(failures === 0 ? 0 : 1);
