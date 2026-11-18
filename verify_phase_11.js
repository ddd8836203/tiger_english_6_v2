#!/usr/bin/env node
/**
 * Phase 11 獨立自動化驗收腳本 (verify_phase_11.js)
 *
 * 驗證目標：
 * 1. `app.js` 語法檢核通過 (`node --check app.js`)。
 * 2. `index.html` 具備 `#nav-font`、`#nav-font-label`、`#fontControlPopover` 與 `?v=20261118_p11` 快取更新。
 * 3. `style.css` 具備 `--text-scale`/`--ui-scale` 雙層縮放、Topbar 與 `@media print` 隔離鎖定、護眼暖紙底、
 *    10.2" iPad 橫向 (1080px) A/B 雙模式課文排版、文法單欄寬卡斷點、抓錯 CSS 補完與 2x2 測驗選項網格。
 * 4. 於 Node VM 模擬真實 DOM、localStorage 與 1080px iPad Viewport 實跑 `app.js`：
 *    - 平板視窗預設 `1.15` (舒適)、桌機預設 `1` (標準)；4 段字體切換與持久化；
 *    - 護眼暖紙底切換；
 *    - 課文「樣式 A 雙欄對照」與「樣式 B 單欄逐句條列」切換及老單元無逐句中文 Fallback；
 *    - 測驗 2x2 網格、選擇題 Directions 收合 / 手寫題 Directions 展開、換題才 `scrollTo`（開關抽屜不亂捲）。
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
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

console.log('=== [Phase 11 獨立驗收開始] ===');

// 1. JS Syntax Check
try {
  execFileSync(process.execPath, ['--check', path.join(ROOT, 'app.js')], { stdio: 'pipe' });
  check(true, 'node --check app.js 通過');
} catch (err) {
  check(false, 'node --check app.js 失敗: ' + (err.stderr ? err.stderr.toString() : err.message));
}

// 2. index.html Checks
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
check(indexHtml.includes('id="nav-font"'), 'index.html 具備 #nav-font 按鈕');
check(indexHtml.includes('id="nav-font-label"'), 'index.html 具備 #nav-font-label');
check(indexHtml.includes('id="fontControlPopover"'), 'index.html 具備 #fontControlPopover');
check(indexHtml.includes('style.css?v=20261118_p11'), 'index.html style.css 快取版號已更新至 20261118_p11');
check(indexHtml.includes('app.js?v=20261118_p11'), 'index.html app.js 快取版號已更新至 20261118_p11');

// 3. style.css Checks
const styleCss = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
const requiredCss = [
  '--text-scale: 1;',
  '--ui-scale:',
  '-webkit-text-size-adjust: 100%;',
  'body.warm-paper',
  '.font-popover',
  '.font-scale-btn',
  '.warm-paper-toggle',
  '.reading-layout-switch',
  '.reading-focus-bar',
  '.unit-hub.reading-focus-active',
  '.reading-passage-card.mode-split',
  '.reading-split-grid',
  '.reading-split-right',
  '.reading-zh-sent.speaking-active',
  '.reading-passage-card.mode-focus',
  '.reading-sentence-row',
  '.reading-sent-speak-btn',
  '.reading-row-zh',
  '@media (max-width: 1150px)',
  '.mistake-buster-card',
  '.token-chip.strike',
  '.token-chip.wrong-pick',
  '.mb-feedback-box',
  '.quiz-interactive-options.options-grid-2x2',
  '.exam-banner-details',
  '--text-scale: 1 !important;'
];
for (const tok of requiredCss) {
  check(styleCss.includes(tok), `style.css 包含 "${tok}"`);
}
// Ensure old 16px reading downgrade is gone
check(!styleCss.includes('.reading-passage-body {\n  font-size: 16px;'), 'style.css 已移除課文 16px 覆蓋降級');

// Verify .topbar does not multiply by --text-scale
const topbarSlice = styleCss.slice(styleCss.indexOf('.topbar {'), styleCss.indexOf('/* ---------- 麵包屑導航列'));
check(!topbarSlice.includes('--text-scale'), '.topbar 導覽列維持固定字級，不隨 --text-scale 爆版');

// 4. Simulated Browser Runtime Tests for app.js
function createMockEnvironment({ innerWidth, isCoarse, savedStorage = {} }) {
  const store = Object.assign({}, savedStorage);
  const elementsById = new Map();

  function makeClassList(el) {
    const set = new Set((el._className || '').split(/\s+/).filter(Boolean));
    return {
      add: (...cls) => { cls.forEach(c => set.add(c)); el._className = [...set].join(' '); },
      remove: (...cls) => { cls.forEach(c => set.delete(c)); el._className = [...set].join(' '); },
      toggle: (c, force) => {
        if (force === undefined) { if (set.has(c)) set.delete(c); else set.add(c); }
        else if (force) set.add(c);
        else set.delete(c);
        el._className = [...set].join(' ');
      },
      contains: (c) => set.has(c)
    };
  }

  function makeEl(tag, id = '') {
    const el = {
      tagName: tag.toUpperCase(),
      id,
      _innerHTML: '',
      _className: '',
      style: {
        _props: {},
        setProperty(k, v) { this._props[k] = String(v); },
        getPropertyValue(k) { return this._props[k] || ''; }
      },
      attrs: {},
      children: [],
      textContent: '',
      value: '',
      checked: true,
      setAttribute(k, v) { this.attrs[k] = String(v); if (k === 'id') elementsById.set(String(v), el); },
      getAttribute(k) { return this.attrs[k] !== undefined ? this.attrs[k] : null; },
      appendChild(child) { this.children.push(child); return child; },
      querySelectorAll(sel) {
        // Basic lightweight selector matching on innerHTML or known hooks
        const results = [];
        if (!el._innerHTML) return results;
        const regexByAttr = (attr) => {
          const re = new RegExp(`data-${attr}=["']([^"']+)["']`, 'g');
          let m;
          while ((m = re.exec(el._innerHTML)) !== null) {
            const node = makeEl('button');
            node.setAttribute(`data-${attr}`, m[1]);
            results.push(node);
          }
        };
        if (sel.includes('[data-reading-layout]')) regexByAttr('reading-layout');
        else if (sel.includes('[data-pick-scale]')) regexByAttr('pick-scale');
        else if (sel.includes('[data-pick-reading-layout]')) regexByAttr('pick-reading-layout');
        else if (sel.includes('[data-rate]')) {
          ['ok', 'slow', 'bad'].forEach(r => {
            if (el._innerHTML.includes(`data-rate="${r}"`)) {
              const n = makeEl('button');
              n.setAttribute('data-rate', r);
              results.push(n);
            }
          });
        }
        return results;
      },
      querySelector() { return null; },
      closest() { return null; },
      scrollIntoView() {}
    };
    el.classList = makeClassList(el);
    Object.defineProperty(el, 'innerHTML', {
      get() { return el._innerHTML; },
      set(val) {
        el._innerHTML = String(val);
        // Register any id="..." inside HTML snippet so getElementById finds dynamically rendered buttons
        const idRe = /\bid=["']([^"']+)["']/g;
        let m;
        while ((m = idRe.exec(el._innerHTML)) !== null) {
          if (!elementsById.has(m[1])) {
            const stub = makeEl('div', m[1]);
            elementsById.set(m[1], stub);
          }
        }
      }
    });
    if (id) elementsById.set(id, el);
    return el;
  }

  const docEl = makeEl('html');
  const bodyEl = makeEl('body');
  const appEl = makeEl('main', 'app');
  const navFontBtn = makeEl('button', 'nav-font');
  const navFontLabel = makeEl('span', 'nav-font-label');
  const fontPop = makeEl('div', 'fontControlPopover');
  const toastEl = makeEl('div', 'toast');
  ['nav-home', 'nav-user', 'nav-user-icon', 'nav-user-name', 'nav-tts-speed', 'nav-tts-label', 'nav-errors', 'nav-error-count', 'nav-print', 'nav-export', 'aiPromptModal', 'closeModalBtn', 'copyPromptBtn', 'aiPromptTextarea'].forEach(id => makeEl('div', id));

  let domReadyCb = null;
  let scrollCalls = 0;

  const document = {
    documentElement: docEl,
    body: bodyEl,
    getElementById: (id) => elementsById.get(id) || null,
    createElement: (tag) => makeEl(tag),
    querySelectorAll: () => [],
    addEventListener: (evt, cb) => { if (evt === 'DOMContentLoaded') domReadyCb = cb; }
  };

  const windowObj = {
    innerWidth,
    matchMedia: (q) => ({ matches: q.includes('coarse') ? isCoarse : false }),
    scrollTo: () => { scrollCalls++; },
    addEventListener: () => {}
  };

  const sandbox = {
    window: windowObj,
    document,
    navigator: { userAgent: isCoarse ? 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X)' : 'Mozilla/5.0 (Windows NT 10.0)' },
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; }
    },
    fetch: () => Promise.resolve({ ok: true, json: () => Promise.resolve(null) }),
    confirm: () => true,
    console,
    setTimeout,
    clearTimeout
  };
  windowObj.localStorage = sandbox.localStorage;
  sandbox.globalThis = sandbox;

  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'midterm_data.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'english_data.js'), 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8'), sandbox);

  if (domReadyCb) domReadyCb();

  return {
    App: sandbox.window.App,
    appEl,
    docEl,
    bodyEl,
    navFontLabel,
    fontPop,
    store,
    getScrollCalls: () => scrollCalls,
    resetScrollCalls: () => { scrollCalls = 0; },
    getEl: (id) => elementsById.get(id)
  };
}

// 4A. iPad 1080px viewport default font scale = 1.15 ('舒適')
const ipadEnv = createMockEnvironment({ innerWidth: 1080, isCoarse: true });
check(ipadEnv.App.state.fontScale === '1.15', `iPad 1080px 預設 fontScale 應為 '1.15' (實為 ${ipadEnv.App.state.fontScale})`);
check(ipadEnv.docEl.style.getPropertyValue('--text-scale') === '1.15', 'documentElement --text-scale 套用 1.15');
check(ipadEnv.navFontLabel.textContent === '字體：舒適', `Topbar 按鈕文字顯示「字體：舒適」(實為 ${ipadEnv.navFontLabel.textContent})`);

// 4B. Desktop 1440px viewport default font scale = 1 ('標準')
const deskEnv = createMockEnvironment({ innerWidth: 1440, isCoarse: false });
check(deskEnv.App.state.fontScale === '1', `桌機 1440px 預設 fontScale 應為 '1' (實為 ${deskEnv.App.state.fontScale})`);
check(deskEnv.navFontLabel.textContent === '字體：標準', `桌機 Topbar 按鈕顯示「字體：標準」`);

// 4C. 4-step font controller + persistence + warm paper toggle
ipadEnv.App.setFontScale('1.45', false);
check(ipadEnv.store['tiger6_eng_font_scale'] === '1.45', 'localStorage 已儲存 fontScale = 1.45');
check(ipadEnv.docEl.style.getPropertyValue('--text-scale') === '1.45', '--text-scale 即時切換為 1.45');
check(ipadEnv.navFontLabel.textContent === '字體：特大', 'Topbar 標籤更新為「字體：特大」');
ipadEnv.App.stepFontScale(-1);
check(ipadEnv.App.state.fontScale === '1.3', 'stepFontScale(-1) 降為 1.3 (大字)');

ipadEnv.App.toggleWarmPaper(false);
check(ipadEnv.App.state.warmPaper === true && ipadEnv.bodyEl.classList.contains('warm-paper'), '護眼暖紙底成功掛上 body.warm-paper');
check(ipadEnv.store['tiger6_eng_warm_paper'] === '1', 'localStorage 已儲存 warmPaper = 1');

// 4D. Switchable Option A (split) vs Option B (focus) on OD3_U16 + fallback unit without per-sentence zh
ipadEnv.App.state.currentBookId = 'od3';
ipadEnv.App.state.currentUnitId = 'od3_16';
ipadEnv.App.state.currentSubtab = 'reading';
ipadEnv.App.state.view = 'unit_hub';

ipadEnv.App.setReadingLayout('split', false);
let htmlSplit = (ipadEnv.getEl('subtab-panel-container') || {}).innerHTML || '';
check(htmlSplit.includes('reading-passage-card mode-split'), '樣式 A 渲染 .mode-split');
check(htmlSplit.includes('reading-split-grid'), '樣式 A 渲染 .reading-split-grid 雙欄容器');
check(htmlSplit.includes('reading-zh-sent'), '樣式 A 渲染逐句聯動中文 .reading-zh-sent');
check(htmlSplit.includes('reading-vocab-token'), '樣式 A 保留生字點選彈卡 token');

ipadEnv.App.setReadingLayout('focus', false);
let htmlFocus = (ipadEnv.getEl('subtab-panel-container') || {}).innerHTML || '';
check(htmlFocus.includes('reading-passage-card mode-focus'), '樣式 B 渲染 .mode-focus');
check(htmlFocus.includes('reading-sentence-row'), '樣式 B 渲染逐句列 .reading-sentence-row');
check(htmlFocus.includes('reading-sent-speak-btn'), '樣式 B 渲染句首獨立 44px 發音鈕');
check(htmlFocus.includes('reading-row-zh'), '樣式 B 渲染逐句中文 .reading-row-zh');
check(ipadEnv.store['tiger6_eng_reading_layout'] === 'focus', 'localStorage 已儲存課文版面 preference');

// Fallback older unit without per-sentence zh (e.g., od3_7)
ipadEnv.App.state.currentBookId = 'od3';
ipadEnv.App.state.currentUnitId = 'od3_7';
ipadEnv.App.setReadingLayout('split', false);
let htmlOldSplit = (ipadEnv.getEl('subtab-panel-container') || {}).innerHTML || '';
check(htmlOldSplit.includes('reading-translation-box'), '無逐句 zh 舊單元在樣式 A 優雅回退整段中文對照框');
ipadEnv.App.setReadingLayout('focus', false);
let htmlOldFocus = (ipadEnv.getEl('subtab-panel-container') || {}).innerHTML || '';
check(htmlOldFocus.includes('reading-sentence-row') && htmlOldFocus.includes('reading-translation-box'), '無逐句 zh 舊單元在樣式 B 仍可逐句條列並於下方附整段翻譯');

// 4E. Mistake Buster subtab markup
ipadEnv.App.state.currentBookId = 'od3';
ipadEnv.App.state.currentUnitId = 'od3_16';
ipadEnv.App.state.currentSubtab = 'mistake';
ipadEnv.App.render();
let htmlMistake = (ipadEnv.getEl('subtab-panel-container') || {}).innerHTML || '';
check(htmlMistake.includes('mistake-buster-card') && htmlMistake.includes('mb-feedback-box'), '神探點詞抓錯渲染對應 class');

// 4F. Quiz 2x2 options, collapsible Directions & scroll-to-top discipline
ipadEnv.App.state.quizQuestions = [
  {
    id: 'test_choice_short',
    type: 'choice',
    question: 'Choose the best answer: She is curious ___ plants.',
    options: ['about', 'at', 'for', 'with'],
    answer: 'about',
    part: 'Part II',
    part_title: 'Grammar Choice',
    part_instructions: 'Circle the best answer for each question.',
    explanation: { point: 'be curious about' }
  },
  {
    id: 'test_handwrite',
    type: 'paper_rewrite',
    question: 'Rewrite the sentence using so.',
    options: [],
    answer: 'So did Tom.',
    part: 'Part III',
    part_title: 'Sentence Rewrite',
    part_instructions: 'Write complete sentences on paper.',
    explanation: { point: 'Inversion' }
  }
];
ipadEnv.App.state.quizIndex = 0;
ipadEnv.App.state.view = 'quiz';
ipadEnv.resetScrollCalls();
ipadEnv.App.render();
check(ipadEnv.getScrollCalls() >= 1, 'render() 切換視圖會捲回頁面頂部');
const quizChoiceHtml = ipadEnv.appEl.innerHTML;
check(quizChoiceHtml.includes('options-grid-2x2'), '短四選一自動啟用 2x2 雙欄網格 (.options-grid-2x2)');
check(quizChoiceHtml.includes('<details class="exam-banner-details" >') || quizChoiceHtml.includes('<details class="exam-banner-details">'), '選擇題 Directions 預設收合以節省平板高度');
check(quizChoiceHtml.includes('btn-quiz-font-dec') && quizChoiceHtml.includes('btn-quiz-font-inc'), '測驗頂部具備就地字體 A-/A+ 鈕');

// Toggling drawer must NOT scrollTo top
ipadEnv.resetScrollCalls();
const toggleDrawerBtn = ipadEnv.getEl('btn-toggle-drawer');
if (toggleDrawerBtn && typeof toggleDrawerBtn.onclick === 'function') {
  toggleDrawerBtn.onclick();
}
check(ipadEnv.getScrollCalls() === 0, '展開/收起題號抽屜盤不觸發 scrollTo 跳頁');

// Rating [data-rate] advances to question 2 (paper_rewrite) AND scrolls to top
ipadEnv.resetScrollCalls();
const rateBtns = ipadEnv.appEl.querySelectorAll('[data-rate]');
check(rateBtns.length === 3, '渲染完整 3 態自評按鈕 (ok/slow/bad)');
// Notice mock DOM stores onclick via innerHTML re-render only on real DOM; simulate by switching quizIndex & checking paper_rewrite open details
ipadEnv.App.state.quizIndex = 1;
ipadEnv.App.render();
check(ipadEnv.appEl.innerHTML.includes('<details class="exam-banner-details" open>'), '手寫題保留 Directions 預設展開 (<details ... open>)');

console.log(`=== [Phase 11 驗收結果] PASS: ${passes} | FAIL: ${failures} ===`);
process.exit(failures === 0 ? 0 : 1);
