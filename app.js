/**
 * 六年級英語特訓 — 應用程式核心 (app.js v3.0 現代卡片狀態機架構)
 * 架構規範：
 *   Level 1: 首頁課本與考券地圖 (Books & Exam Papers)
 *   Level 2: 課本單元清單 (Units Grid，含考券 W2/W4/W5/W6/W7 與綜合)
 *   Level 3: 單元學習工作台 (Unit Workspace: 課文閱聽 / 點詞抓錯 / 雙軌測驗 / 晨間體操)
 *   全域支援：4人帳號切換 (Rex + Test 1~3)、抽屜盤熱力圖、A4 出卷、終身錯題本、AI 匯出
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. 多人學習帳號設定 (Rex 正式學員 + Test 1~3 測試帳號)
  // ==========================================================================
  const USERS = [
    { id: 'rex',   name: 'Rex',    icon: '🦖', role: '正式學員', color: '#5b4bdb', bg: '#ede9fe', isTest: false },
    { id: 'test1', name: 'Test 1', icon: '🧪', role: '測試帳號 1', color: '#059669', bg: '#d1fae5', isTest: true },
    { id: 'test2', name: 'Test 2', icon: '🔬', role: '測試帳號 2', color: '#d97706', bg: '#fef3c7', isTest: true },
    { id: 'test3', name: 'Test 3', icon: '🛠️', role: '測試帳號 3', color: '#0284c7', bg: '#e0f2fe', isTest: true },
  ];

  // ==========================================================================
  // 2. 全域狀態機 (State Machine)
  // ==========================================================================
  const DEFAULT_CLOUD_DB_URL = 'https://math-review-6-default-rtdb.asia-southeast1.firebasedatabase.app';

  const state = {
    currentUser: 'rex',
    view: 'dashboard',             // 'dashboard' | 'book' | 'unit_hub' | 'quiz' | 'error_book' | 'print'
    currentBookId: null,
    currentUnitId: null,
    cloudDbUrl: localStorage.getItem('tiger6_eng_cloud_db_url') || DEFAULT_CLOUD_DB_URL,
    cloudSyncStatus: 'idle',       // 'idle' | 'syncing' | 'synced' | 'offline'
    fullHistory: [],
    currentSubtab: 'reading',      // 'reading' | 'mistake' | 'quiz' | 'braingym'
    ttsSpeed: 1.0,                 // 1.0 | 0.8
    selectedBatches: ['期中考核心', '文法專修', '寫作專攻', '讀寫進階', '太空科普', '岱崙週考'],

    // 測驗執行期狀態
    quizMode: 'unit',              // 'unit' | 'exam_week' | 'braingym' | 'error_book' | 'mixed'
    quizQuestions: [],
    quizIndex: 0,
    quizDualMode: 'paper',         // 'paper' | 'interactive' | 'voice'
    sessionAnswers: [],            // { qId, result: 'ok'|'slow'|'bad', time }
    drawerOpen: false,

    // 神探點詞抓錯執行期狀態
    mistakeIndex: 0,
    selectedTokenIdx: null,
    mistakeChecked: false,

    // 晨間體操狀態
    bgTier: 'all',                 // 'all' | '1-3' | '4-7' | '8-10'
    bgCombo: 0,

    // 各使用者獨立持久化資料
    errorBook: [],                 // [ qId, ... ]
    errorCounts: {},               // { [qId]: count }
    successCounts: {},             // { [qId]: count }
    slowCounts: {},                // { [qId]: count }
    unitProgress: {},              // { [unitId]: lastIndex }
    fullHistory: [],
    updatedAt: 0,

    // A4 出卷設定
    printConfig: {
      printType: 'quiz_original',  // 'quiz_original' | 'quiz_variant' | 'spelling' | 'grammar' | 'errorbook'
      bookId: 'tea_midterm',
      unitId: 'tea_all',
      count: 20,
      answerMode: 'student'        // 'student' | 'teacher' | 'contrast'
    }
  };

  const STORAGE_KEYS = {
    errorBook: 'tiger6_eng_error_book',
    errorCounts: 'tiger6_eng_error_counts',
    successCounts: 'tiger6_eng_success_counts',
    slowCounts: 'tiger6_eng_slow_counts',
    history: 'tiger6_eng_history',
    unitProgress: 'tiger6_eng_unit_progress',
    updatedAt: 'tiger6_eng_updated_at'
  };

  const GLOBAL_KEYS = {
    currentUser: 'tiger6_eng_current_user',
    ttsSpeed: 'tiger6_eng_tts_speed',
    cloudDbUrl: 'tiger6_eng_cloud_db_url'
  };


  // ==========================================================================
  // HTML Escaping & Syntax Block Helpers (防標籤吞食與結構化題幹)
  // ==========================================================================
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeRegex(s) {
    return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Extract pure correct English text from bilingual or error-vs-correct examples
  function extractCleanEnglishForSpeech(rawEx) {
    if (!rawEx) return '';
    let s = (typeof rawEx === 'object') ? (rawEx.en || rawEx.sentence || '') : String(rawEx);
    const arrowMatch = s.match(/(?:✅|➔|→)\s*([^\n]+)/);
    if (arrowMatch) {
      s = arrowMatch[1];
    } else if (s.includes('❌')) {
      s = s.split('❌')[0];
    }
    s = s
      .replace(/[🔴🟢✅❌⭐💡📐✍️🔊]/g, ' ')
      .replace(/（[^）]*）/g, ' ')
      .replace(/\([^)]*[\u4e00-\u9fff][^)]*\)/g, ' ')
      .replace(/[\u4e00-\u9fff、，。！？：「」『』]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return s;
  }

  function splitSentencesFallback(engText) {
    if (!engText) return [];
    const text = String(engText).replace(/\n+/g, ' ').trim();
    if (!text) return [];
    const safeAbbr = text
      .replace(/\b(Mr|Mrs|Ms|Dr|Prof|St|vs)\./g, '$1__DOT__');
    const parts = safeAbbr.split(/(?<=[.!?])\s+(?=[A-Z"'“‘])/);
    return parts
      .map(p => ({ en: p.replace(/__DOT__/g, '.').trim(), zh: '' }))
      .filter(item => item.en.length > 0);
  }

  function splitChipList(rawListText) {
    return String(rawListText || '')
      .split(/[\/,，、]+/)
      .map(t => t.trim())
      .filter(Boolean);
  }

  function parseGrammarChiExp(chiExp) {
    const raw = String(chiExp || '').trim();
    if (!raw) return { intro: '', categories: [] };
    const numberedRe = /\((\d+)\)\s*([\s\S]*?)(?=\(\d+\)|$)/g;
    const matches = [...raw.matchAll(numberedRe)];
    if (matches.length === 0) {
      const parenChips = [];
      const cleaned = raw.replace(/\(([^()]{4,})\)/g, (full, inner) => {
        if (/[A-Za-z]/.test(inner) && (inner.includes('/') || inner.includes(','))) {
          parenChips.push(...splitChipList(inner));
          return '';
        }
        return full;
      }).replace(/\s{2,}/g, ' ').trim();
      return {
        intro: cleaned,
        categories: parenChips.length > 0 ? [{ label: '常見搭配詞清單', items: parenChips }] : []
      };
    }

    const firstIdx = raw.search(/\(\d+\)/);
    const intro = firstIdx > 0 ? raw.slice(0, firstIdx).replace(/[：:]\s*$/, '').trim() : '';
    const categories = matches.map(m => {
      const idxLabel = m[1];
      let body = (m[2] || '').replace(/[;；。]+\s*$/, '').trim();
      const chips = [];
      body = body.replace(/\(([^()]+)\)/g, (full, inner) => {
        if (/[A-Za-z]/.test(inner) && (inner.includes('/') || inner.includes(','))) {
          chips.push(...splitChipList(inner));
          return '';
        }
        return full;
      }).replace(/\s{2,}/g, ' ').trim();
      return {
        label: `${idxLabel}. ${body}`,
        items: chips
      };
    });
    return { intro, categories };
  }

  function formatGrammarExampleHtml(rawEx) {
    if (rawEx && typeof rawEx === 'object') {
      let enHtml = escapeHtml(rawEx.en || '');
      if (rawEx.highlight) {
        const hlRe = new RegExp('(' + escapeRegex(rawEx.highlight) + ')', 'gi');
        enHtml = enHtml.replace(hlRe, '<span class="grammar-ex-hl">$1</span>');
      }
      const zhHtml = rawEx.zh ? `<span class="grammar-ex-zh">${escapeHtml(rawEx.zh)}</span>` : '';
      return `<div class="grammar-ex-content"><span>${enHtml}</span>${zhHtml}</div>`;
    }
    const rawStr = String(rawEx || '');
    let enPart = rawStr;
    let zhPart = '';
    const zhTail = rawStr.match(/^(.*?)[（(]([\s\S]*[\u4e00-\u9fff][\s\S]*)[）)]\s*$/);
    if (zhTail) {
      enPart = zhTail[1].trim();
      zhPart = zhTail[2].trim();
    }
    let enHtml = escapeHtml(enPart);
    // Highlight common target patterns like preposition collocations or It is/was ... of
    enHtml = enHtml.replace(
      /\b(worried about|excited about|happy about|curious about|happy with|bored with|disappointed with|surprised by|amazed by|confused by|good at|bad at|excellent at|interested in|famous for|world-famous for|full of|allergic to|afraid of|thanks to|prefer\s+[a-z]+(?:ing)?\s+to)\b/gi,
      '<span class="grammar-ex-hl">$1</span>'
    );
    return `<div class="grammar-ex-content"><span>${enHtml}</span>${zhPart ? `<span class="grammar-ex-zh">${escapeHtml(zhPart)}</span>` : ''}</div>`;
  }

  function formatFormulaBlocks(formStr) {
    if (!formStr) return '';
    let s = escapeHtml(formStr);

    // 三階段副詞三級積木
    s = s.replace(/&lt;adverb clause&gt;/gi, '<span class="f-block f-blue"><i class="f-idx">1</i> 原級子句 &lt;adverb clause&gt;</span>');
    s = s.replace(/&lt;comparative clause&gt;/gi, '<span class="f-block f-purple"><i class="f-idx">2</i> 比較級子句 &lt;comparative clause&gt;</span>');
    s = s.replace(/&lt;superlative clause&gt;/gi, '<span class="f-block f-amber"><i class="f-idx">3</i> 最高級子句 &lt;superlative clause&gt;</span>');

    // 量詞句型積木
    s = s.replace(/\[數字英文\]/g, '<span class="f-block f-teal">數字 (英文寫出)</span>');
    s = s.replace(/\[量詞 containers\]/g, '<span class="f-block f-indigo">容器量詞 (box, slice...)</span>');
    s = s.replace(/\[名詞\]/g, '<span class="f-block f-rose">名詞</span>');

    // 運算符號與連接詞
    s = s.replace(/\s*\+\s*/g, ' <span class="f-symbol">+</span> ');
    s = s.replace(/\bbut\b/g, '<span class="f-conj">but</span>');
    s = s.replace(/,/g, '<span class="f-punct">,</span>');

    return '<div class="formula-blocks-container">' + s + '</div>';
  }

  function getQuizTypeBadgeLabel(q) {
    if (!q) return '🎯 綜合實戰';
    const t = String(q.type || '').toLowerCase();
    const cat = String(q.category_tag || '').toLowerCase();
    if (t === 'paper_rewrite' || t === 'rewrite') return '✍️ 考卷手寫實戰';
    if (t === 'spelling_listen' || t === 'spelling') return '🎧 考卷單字聽寫';
    if (t === 'fill' || t === 'cloze') return '✏️ 克漏字填空';
    if (q.is_count_noncount) return '🍎 可數與不可數判斷';
    if (t === 'reading' || cat === 'reading') return '📖 閱讀理解四選一';
    if (t === 'grammar' || cat === 'grammar') return '📐 文法觀念四選一';
    if (t === 'vocab') return '🔤 核心單字測驗';
    return '🎯 觀念四選一';
  }

  function highlightBlanksAndWordHints(rawText) {
    let html = escapeHtml(String(rawText || ''));
    // 將括號內底線 ( ______ ) 與獨立底線 ______ 轉為視覺化藍色填空槽
    html = html.replace(/\(\s*_{2,}\s*\)/g, '<span class="stem-blank-slot">_______</span>');
    html = html.replace(/_{2,}/g, '<span class="stem-blank-slot">_______</span>');
    // 將題幹中的提示原形動詞如 (nervous), (slow), (Read), (help), (burn) 轉為綠色膠囊提示
    html = html.replace(/\(([a-zA-Z]{2,20})\)/g, '<span class="stem-word-hint">($1)</span>');
    return html;
  }

  function maskAnswerFallback(text, answer) {
    const t = String(text || '');
    const ans = String(answer || '').trim();
    if (!t || !ans) return t;
    const esc = escapeRegex(ans);
    return t.replace(new RegExp(`\\b${esc}(?:es|s|ed|d|ing)?\\b`, 'gi'), '________');
  }

  function mapRewriteTaskTitle(prefixText, rawRest) {
    const combined = `${prefixText || ''} ${rawRest || ''}`.toLowerCase();
    if (/proofread|grammatical error|find the .*error/.test(combined)) {
      return '⚠️ 挑錯改寫：請找出下方句子中的 1 處文法錯誤，並在紙上寫出正確的完整句子';
    }
    if (/biography sentence|factual notes|biographical facts|prompt cues|age and year|biography impact|honoring/.test(combined)) {
      return '🧩 傳記造句：請將下方的語塊積木連成文法正確的完整英文句子';
    }
    if (/answer the question|short answer|reading comprehension|character analysis/.test(combined)) {
      return '❓ 考卷簡答：請根據課文內容，用完整英文句子回答下方問題';
    }
    if (/fill in the missing word|story cloze/.test(combined)) {
      return '✏️ 考卷填空：請依句子語境，在紙上寫出空格處應填入的單字';
    }
    if (/gerund|parentheses/.test(combined)) {
      return '🔧 動名詞造句：請將括號內的提示動詞轉為正確的動名詞或單數動詞形式';
    }
    if (/preposition(?:s)? from the box/.test(combined)) {
      return '📌 介系詞填空：請參考提示單字庫，在紙上寫出正確的介系詞';
    }
    if (/combine|rewrite|transform|guided writing|pattern/.test(combined)) {
      return '✍️ 句型改寫：請依下方的必用句型提示改寫原句';
    }
    const cleanChi = String(prefixText || '').replace(/[：:]\s*$/, '').trim();
    if (/[\u4e00-\u9fff]/.test(cleanChi)) {
      return `✍️ ${cleanChi}：`;
    }
    return '✍️ 紙筆手寫任務：請先在紙上完成完整作答，再點下方對答案';
  }

  function mapChoiceLeadTitle(prefixText) {
    const low = String(prefixText || '').toLowerCase();
    if (low.includes('preposition')) return '📌 請選出正確的「介系詞」完成下方句子：';
    if (low.includes('verb')) return '📌 請選出正確的「動詞型態」完成下方句子：';
    if (low.includes('noun')) return '📌 請選出正確的「名詞型態」完成下方句子：';
    if (low.includes('transition') || low.includes('consequence')) return '📌 請選出最適合的「轉折連接詞」完成下方句子：';
    if (low.includes('pair')) return '📌 請選出同時符合平行對等結構的一組動詞：';
    if (low.includes('apology')) return '📌 請選出最符合禮貌道歉語境的單字：';
    return '📌 請閱讀句子並選出最恰當的答案：';
  }

  function renderStructuredStemHtml(q) {
    const rawQ = (q && q.question) ? q.question.trim() : '';
    if (!rawQ) return '';

    let badge = '';
    let rest = rawQ;
    const bm = rest.match(/^【(.*?)】\s*/);
    if (bm) {
      badge = bm[1];
      rest = rest.substring(bm[0].length).trim();
    }

    const badgeHtml = badge ? `
      <div class="q-stem-topbar">
        <span class="q-source-badge">
          <span class="b-icon">🏷️</span> ${escapeHtml(badge)}
        </span>
      </div>
    ` : '';

    // 短文克漏字情境參照框 或 單句課文參照框
    let passageHtml = '';
    if (q.passage_context) {
      let pc = escapeHtml(q.passage_context);
      if (q.cloze_index) {
        const targetTag = `【${q.cloze_index}】`;
        pc = pc.replace(new RegExp(targetTag, 'g'), `<mark class="cloze-active-blank">【${q.cloze_index} ? 】</mark>`);
      }
      pc = pc.replace(/【(\d+)】/g, '<span class="cloze-other-blank">【$1】</span>');
      passageHtml = `
        <div class="cloze-passage-card">
          <div class="cpc-header">
            <span class="cpc-icon">📖</span>
            <span class="cpc-title">篇章情境閱讀參照（請對照當前空格序號）：</span>
          </div>
          <div class="cpc-body">${pc}</div>
        </div>
      `;
    } else if (q.passage_excerpt) {
      passageHtml = `
        <div class="cloze-passage-card">
          <div class="cpc-header">
            <span class="cpc-icon">📖</span>
            <span class="cpc-title">課文原句情境參照：</span>
          </div>
          <div class="cpc-body">${highlightBlanksAndWordHints(q.passage_excerpt)}</div>
        </div>
      `;
    }

    // 1. 倒裝附和句：例如 "1. [Roger, Sean – see new Iron Man movie tomorrow / so]"
    const invM = rest.match(/^(\d+\.?)\s*\[(.*?)\]\s*(.*)$/);
    if (invM) {
      const num = invM[1];
      const bracketContent = invM[2];
      const parts = bracketContent.split(/\s*[\/–—-]\s*/);
      const actor = parts[0] || '';
      const action = parts[1] || '';
      const target = parts[2] || '';

      return `
        ${passageHtml}
        <div class="q-stem-card stem-inversion">
          ${badgeHtml}
          <div class="q-stem-title-row">
            <span class="q-num-pill">${escapeHtml(num)}</span>
            <span class="q-stem-title-text">請依給定線索改寫為倒裝附和句（注意時態與助動詞）：</span>
          </div>
          <div class="q-clue-grid">
            <div class="clue-card clue-actor">
              <div class="clue-label">👥 登場人物</div>
              <div class="clue-val">${escapeHtml(actor)}</div>
            </div>
            <div class="clue-card clue-action">
              <div class="clue-label">⚡ 動作事件（留意時態）</div>
              <div class="clue-val">${escapeHtml(action)}</div>
            </div>
            <div class="clue-card clue-target">
              <div class="clue-label">🎯 指定附和詞</div>
              <div class="clue-val">${escapeHtml(target)}</div>
            </div>
          </div>
        </div>
      `;
    }

    // 2. 副詞三級多參數比較：例如 "2. How did they do in their quiz? Jerome: 65%, Ivan: 55% & Nate: 45%"
    const advM = rest.match(/^(\d+\.?\s*[^?:]+[?:])\s*(.*)$/);
    if (advM && advM[2] && (advM[2].includes('&') || advM[2].includes('%') || advM[2].includes('km') || advM[2].includes(':') || advM[2].includes(','))) {
      const mainTitle = advM[1].trim();
      const paramStr = advM[2].trim();
      const tokens = paramStr.replace(/\s*&\s*/g, ', ').split(',').map(s => s.trim()).filter(Boolean);

      return `
        ${passageHtml}
        <div class="q-stem-card stem-adverbs">
          ${badgeHtml}
          <div class="q-stem-title-row">
            <span class="q-stem-title-text">${escapeHtml(mainTitle)}</span>
          </div>
          <div class="q-params-row">
            ${tokens.map(tk => {
              const p = tk.split(':');
              if (p.length === 2) {
                return `
                  <div class="q-param-pill has-val">
                    <span class="p-name">👤 ${escapeHtml(p[0].trim())}</span>
                    <span class="p-score">${escapeHtml(p[1].trim())}</span>
                  </div>
                `;
              } else {
                return `
                  <div class="q-param-pill pure-item">
                    <span class="p-name">✨ ${escapeHtml(tk)}</span>
                  </div>
                `;
              }
            }).join('')}
          </div>
        </div>
      `;
    }

    // 3. 量詞容器提示：例如 "1. pizza (1 片披薩)"
    const measM = rest.match(/^(\d+\.?)\s*([a-zA-Z\s]+)\s*\((.*?)\)/);
    if (measM) {
      const num = measM[1];
      const en = measM[2].trim();
      const zh = measM[3].trim();
      return `
        ${passageHtml}
        <div class="q-stem-card stem-measure">
          ${badgeHtml}
          <div class="q-stem-title-row">
            <span class="q-num-pill">${escapeHtml(num)}</span>
            <span class="q-stem-title-text">請看提示物品，以完整句子回答數量（包含 There is/are 與容器量詞）：</span>
          </div>
          <div class="measure-item-hero">
            <div class="mi-en">${escapeHtml(en)}</div>
            <div class="mi-zh">中文提示：${escapeHtml(zh)}</div>
          </div>
        </div>
      `;
    }

    // 4. 抓錯 Proofreading：例如 "請修正待改錯短文中的錯誤片段：If I would have"
    if (rest.includes('請修正待改錯短文中的錯誤片段：')) {
      const pParts = rest.split('請修正待改錯短文中的錯誤片段：');
      const numOrPref = pParts[0].trim();
      const errTarget = pParts[1].trim();
      return `
        ${passageHtml}
        <div class="q-stem-card stem-proofread">
          ${badgeHtml}
          <div class="q-stem-title-row">
            <span class="q-stem-title-text">${escapeHtml(numOrPref || '請修正短文中的文法或拼寫錯誤：')}</span>
          </div>
          <div class="proofread-target-box">
            <span class="pt-label">⚠️ 待修正片段：</span>
            <span class="pt-text">${escapeHtml(errTarget)}</span>
          </div>
        </div>
      `;
    }

    // 5. 聽音拼寫題 (Spelling Listen — 防洩題結構化聽寫卡)
    if (q.type === 'spelling_listen') {
      const vc = q.vocab_card || null;
      let targetChi = q.target_chi || (vc && (vc.chi || vc.meaning)) || '';
      if (!targetChi) {
        const mFor = rest.match(/Spell the target [^"]*?"([^"]+)"/);
        const mBr = rest.match(/表示「([^」]+)」/);
        targetChi = (mFor && mFor[1]) || (mBr && mBr[1]) || '';
      }
      const targetPos = q.target_pos || (vc && vc.pos) || '';
      let maskedEx = q.masked_example || '';
      if (!maskedEx) {
        const qM = rest.match(/sentence:\s*"([^"]+)"/i);
        const rawEx = (qM && qM[1]) || (vc && (vc.context_eng || vc.example)) || '';
        maskedEx = maskAnswerFallback(rawEx, q.answer);
      } else {
        maskedEx = maskAnswerFallback(maskedEx, q.answer);
      }
      const hintMatch = rest.match(/（\s*提示[：:]\s*([^）]+)\s*）/) || rest.match(/\(\s*Hint[：:]\s*([^)]+)\s*\)/i);
      const hintText = hintMatch ? maskAnswerFallback(hintMatch[1].trim(), q.answer) : '';

      return `
        ${passageHtml}
        <div class="q-stem-card stem-listen-card">
          ${badgeHtml}
          <div class="stem-task-header">🎧 請仔細聆聽上方發音，在紙上拼寫出對應的英文單字：</div>
          <div class="stem-listen-meaning-box">
            <span class="stem-listen-label">🎯 目標字義</span>
            <span class="stem-listen-chi">${escapeHtml(maskAnswerFallback(targetChi || rest, q.answer))}</span>
            ${targetPos ? `<span class="stem-listen-pos">${escapeHtml(maskAnswerFallback(targetPos, q.answer))}</span>` : ''}
          </div>
          ${maskedEx ? `
            <div class="stem-listen-example-box">
              <div class="stem-ex-label">📖 語境例句（空格處即為本題單字）</div>
              <div class="stem-ex-sent">${highlightBlanksAndWordHints(maskedEx)}</div>
              ${q.masked_example_chi ? `<div class="stem-ex-zh">${escapeHtml(maskAnswerFallback(q.masked_example_chi, q.answer))}</div>` : ''}
            </div>
          ` : ''}
          ${hintText ? `
            <div class="stem-cue-pill">
              <span class="cue-tag">💡 拼寫小提示</span>
              <span class="cue-text">${escapeHtml(hintText)}</span>
            </div>
          ` : ''}
        </div>
      `;
    }

    // 6. 考卷手寫實戰 / 改寫 / 造句 / 簡答 (三層視覺積木卡)
    if (q.type === 'paper_rewrite' || q.type === 'rewrite') {
      let work = rest.replace(/^\[(?:Tiger\s+3C|3C)[^\]]*\]\s*/i, '').trim();
      let cueLabel = '';
      let cueContent = '';
      const cueM = work.match(/\(\s*(Use|Include|Begin with|Hint|提示)\s*[：:]\s*([^)]+)\)\s*\.?\s*$/i);
      if (cueM) {
        cueLabel = cueM[1].trim();
        cueContent = cueM[2].trim();
        work = work.slice(0, cueM.index).trim();
      }

      let leadRaw = '';
      let coreRaw = work;
      let tailRaw = '';
      const quotedM = work.match(/^([^:]+?):\s*"([^"]+)"(.*)$/);
      if (quotedM) {
        leadRaw = quotedM[1].trim();
        coreRaw = quotedM[2].trim();
        tailRaw = quotedM[3].replace(/^\.\s*/, '').trim();
      } else {
        const colonM = work.match(/^([^:：]+)[：:]\s*([\s\S]+)$/);
        if (colonM) {
          leadRaw = colonM[1].trim();
          coreRaw = colonM[2].trim();
        }
      }

      // 去除外層反引號，並抽取中文化括號作答提示
      coreRaw = coreRaw.replace(/^`([\s\S]+)`$/, '$1').trim();
      if (!cueContent) {
        const zhCueM = coreRaw.match(/^(.*?)\s*\((用[^)]+)\)\s*$/);
        if (zhCueM) {
          coreRaw = zhCueM[1].trim();
          cueLabel = '作答提示';
          cueContent = zhCueM[2].trim();
        }
      }

      const taskHeader = mapRewriteTaskTitle(leadRaw, rest);
      const isProofreadTask = /⚠️\s*挑錯改寫|改錯重寫/.test(taskHeader) || /改錯/.test(leadRaw);

      // 判斷核心內容是否為「斜線分隔的關鍵字筆記積木」(例如 "(Thomas Edison / born on ... / in Ohio)")
      const innerNotes = coreRaw.replace(/^\(([\s\S]+)\)$/, '$1').trim();
      const isSlashNotes = innerNotes.includes(' / ') && !/[?!]/.test(innerNotes);

      let coreHtml = '';
      if (isSlashNotes) {
        const chips = innerNotes.split(/\s*\/\s*/).map(s => s.trim()).filter(Boolean);
        coreHtml = `
          <div class="stem-notes-box">
            <div class="stem-box-label">🧩 造句關鍵字積木</div>
            <div class="stem-notes-chips-row">
              ${chips.map(ch => `<span class="stem-note-chip">${escapeHtml(ch)}</span>`).join('')}
            </div>
          </div>
        `;
      } else {
        const hasBlanks = /_{2,}/.test(coreRaw);
        const canSpeakCore = !hasBlanks && !isProofreadTask && /[a-zA-Z]{3,}/.test(coreRaw) && !/^[\u4e00-\u9fff]/.test(coreRaw);
        const boxLabel = isProofreadTask ? '⚠️ 待改錯原句（找出 1 處錯誤並重寫整句）' : (hasBlanks ? '✏️ 待完成句子' : '📄 題目原句 / 問題');
        coreHtml = `
          <div class="stem-quote-box ${isProofreadTask ? 'is-proofread' : ''}">
            <div class="stem-quote-top">
              <span class="stem-box-label">${boxLabel}</span>
              ${canSpeakCore ? `<button type="button" class="btn-ex-speak" data-speak-stem="${escapeHtml(coreRaw)}">🔊 朗讀題目</button>` : ''}
            </div>
            <div class="stem-quote-text">${highlightBlanksAndWordHints(coreRaw)}</div>
          </div>
        `;
      }

      return `
        ${passageHtml}
        <div class="q-stem-card stem-rewrite-card">
          ${badgeHtml}
          <div class="stem-task-header">${escapeHtml(taskHeader)}</div>
          ${coreHtml}
          ${cueContent ? `
            <div class="stem-cue-pill">
              <span class="cue-tag">💡 必用句型 / 提示${cueLabel ? ` (${escapeHtml(cueLabel)})` : ''}</span>
              <code class="cue-code">${escapeHtml(cueContent)}</code>
            </div>
          ` : ''}
          ${tailRaw ? `
            <div class="stem-cue-pill subtle-note">
              <span class="cue-tag">📝 寫作檢核</span>
              <span class="cue-text">${escapeHtml(tailRaw)}</span>
            </div>
          ` : ''}
        </div>
      `;
    }

    // 7. 觀念選擇與克漏字填空題 (Choice / Fill — 視覺挖空槽與簡潔前導)
    let choiceLead = '';
    let choiceCore = rest.replace(/^\[(?:Tiger\s+3C|3C)[^\]]*\]\s*/i, '').trim();
    let choiceSubCue = '';

    const chQuoteM = choiceCore.match(/^((?:Choose|Read|Complete)\s+[^:]+):\s*"([^"]+)"\s*$/i);
    if (chQuoteM) {
      choiceLead = mapChoiceLeadTitle(chQuoteM[1]);
      choiceCore = chQuoteM[2].trim();
    } else if (/^判斷名詞類別：\s*【\s*(.*?)\s*】\s*$/.test(choiceCore)) {
      const ncM = choiceCore.match(/^判斷名詞類別：\s*【\s*(.*?)\s*】\s*$/);
      choiceLead = '🍎 請判斷下方名詞為「可數 (Count)」或「不可數 (Noncount)」：';
      choiceCore = ncM[1].trim();
    } else if (choiceCore.includes('➔')) {
      const arrowParts = choiceCore.split('➔');
      choiceCore = arrowParts[0].trim();
      choiceSubCue = arrowParts.slice(1).join(' ➔ ').trim();
    } else if (choiceCore.startsWith('判斷下列特徵屬於哪一場歷史隕石事件：')) {
      choiceLead = '☄️ 判斷下列特徵屬於哪一場歷史隕石事件：';
      choiceCore = choiceCore.replace('判斷下列特徵屬於哪一場歷史隕石事件：', '').trim();
    } else if (choiceCore.startsWith('根據英文定義拼寫出核心字彙：')) {
      choiceLead = '📘 請根據以下英文定義，寫出對應的核心字彙：';
      choiceCore = choiceCore.replace('根據英文定義拼寫出核心字彙：', '').trim();
    }

    return `
      ${passageHtml}
      <div class="q-stem-card stem-choice-card">
        ${badgeHtml}
        ${choiceLead ? `<div class="stem-choice-lead">${escapeHtml(choiceLead)}</div>` : ''}
        <div class="stem-choice-sentence">${highlightBlanksAndWordHints(choiceCore)}</div>
        ${choiceSubCue ? `
          <div class="stem-cue-pill">
            <span class="cue-tag">🎯 作答要求</span>
            <span class="cue-text">${escapeHtml(choiceSubCue)}</span>
          </div>
        ` : ''}
        ${q.definition_clue ? `
          <div class="stem-cue-pill">
            <span class="cue-tag">💡 課文字義線索</span>
            <span class="cue-text">${escapeHtml(q.definition_clue)}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  function getCurrentUserObj() {
    return USERS.find(u => u.id === state.currentUser) || USERS[0];
  }

  function getUserKey(baseKey, userId = state.currentUser) {
    return `${baseKey}__${userId}`;
  }

  // 載入指定使用者的統計摘要 (含錯題數)
  function loadUserStatsSummary(userId) {
    try {
      const ebRaw = localStorage.getItem(getUserKey(STORAGE_KEYS.errorBook, userId));
      const eb = ebRaw ? JSON.parse(ebRaw) : [];
      return {
        errCount: Array.isArray(eb) ? eb.length : 0
      };
    } catch (e) {
      return { errCount: 0 };
    }
  }

  function loadState(userId) {
    try {
      if (userId && USERS.some(u => u.id === userId)) {
        state.currentUser = userId;
      } else {
        const savedUser = localStorage.getItem(GLOBAL_KEYS.currentUser);
        if (savedUser && USERS.some(u => u.id === savedUser)) {
          state.currentUser = savedUser;
        }
      }
      const savedTts = localStorage.getItem(GLOBAL_KEYS.ttsSpeed);
      if (savedTts) {
        state.ttsSpeed = parseFloat(savedTts) || 1.0;
      }

      const uid = state.currentUser;
      const eb = localStorage.getItem(getUserKey(STORAGE_KEYS.errorBook, uid));
      state.errorBook = eb ? JSON.parse(eb) : [];
      const ec = localStorage.getItem(getUserKey(STORAGE_KEYS.errorCounts, uid));
      state.errorCounts = ec ? JSON.parse(ec) : {};
      const sc = localStorage.getItem(getUserKey(STORAGE_KEYS.successCounts, uid));
      state.successCounts = sc ? JSON.parse(sc) : {};
      const sl = localStorage.getItem(getUserKey(STORAGE_KEYS.slowCounts, uid));
      state.slowCounts = sl ? JSON.parse(sl) : {};
      const up = localStorage.getItem(getUserKey(STORAGE_KEYS.unitProgress, uid));
      state.unitProgress = up ? JSON.parse(up) : {};
      const fh = localStorage.getItem(getUserKey(STORAGE_KEYS.history, uid));
      state.fullHistory = fh ? JSON.parse(fh) : [];
      const ua = localStorage.getItem(getUserKey(STORAGE_KEYS.updatedAt, uid));
      state.updatedAt = ua ? parseInt(ua, 10) || 0 : 0;
    } catch (e) {
      console.warn('載入狀態失敗:', e);
    }
  }

  function saveState(autoPushCloud = true) {
    try {
      const uid = state.currentUser;
      const nowTs = Date.now();
      state.updatedAt = nowTs;
      localStorage.setItem(GLOBAL_KEYS.currentUser, state.currentUser);
      localStorage.setItem(GLOBAL_KEYS.ttsSpeed, String(state.ttsSpeed));
      if (state.cloudDbUrl) {
        localStorage.setItem(GLOBAL_KEYS.cloudDbUrl, state.cloudDbUrl);
      }
      localStorage.setItem(getUserKey(STORAGE_KEYS.errorBook, uid), JSON.stringify(state.errorBook));
      localStorage.setItem(getUserKey(STORAGE_KEYS.errorCounts, uid), JSON.stringify(state.errorCounts));
      localStorage.setItem(getUserKey(STORAGE_KEYS.successCounts, uid), JSON.stringify(state.successCounts));
      localStorage.setItem(getUserKey(STORAGE_KEYS.slowCounts, uid), JSON.stringify(state.slowCounts));
      localStorage.setItem(getUserKey(STORAGE_KEYS.unitProgress, uid), JSON.stringify(state.unitProgress));
      localStorage.setItem(getUserKey(STORAGE_KEYS.history, uid), JSON.stringify(state.fullHistory || []));
      localStorage.setItem(getUserKey(STORAGE_KEYS.updatedAt, uid), String(nowTs));
      updateNavBadges();

      if (autoPushCloud) {
        pushToCloud(uid).catch(() => {});
      }
    } catch (e) {
      console.warn('儲存狀態失敗:', e);
    }
  }

  // ==========================================================================
  // 跨裝置雲端同步引擎 (Firebase Realtime DB REST API)
  // ==========================================================================
  function normalizeCloudUrl(url) {
    if (!url) return '';
    return url.trim().replace(/\/+$/, '').replace(/\.json$/i, '');
  }

  async function pushToCloud(userId = state.currentUser) {
    const base = normalizeCloudUrl(state.cloudDbUrl);
    if (!base) return false;
    state.cloudSyncStatus = 'syncing';
    const payload = {
      userId,
      updatedAt: state.updatedAt || Date.now(),
      errorBook: state.errorBook,
      errorCounts: state.errorCounts,
      successCounts: state.successCounts,
      slowCounts: state.slowCounts,
      fullHistory: state.fullHistory || [],
      unitProgress: state.unitProgress || {}
    };
    try {
      const res = await fetch(`${base}/g6_english_users/${userId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        state.cloudSyncStatus = 'synced';
        return true;
      }
    } catch (e) {
      state.cloudSyncStatus = 'offline';
    }
    return false;
  }

  async function syncFromCloud(userId = state.currentUser, showFeedback = false) {
    const base = normalizeCloudUrl(state.cloudDbUrl);
    if (!base) return false;
    state.cloudSyncStatus = 'syncing';
    try {
      const res = await fetch(`${base}/g6_english_users.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const allCloudUsers = (await res.json()) || {};

      // 同步其他 3 位非當前人員快取至本地 LocalStorage，保持切換膠囊數字即時最新
      USERS.forEach(u => {
        if (u.id === userId) return;
        const cData = allCloudUsers[u.id];
        if (!cData || typeof cData !== 'object') return;
        const lUp = parseInt(localStorage.getItem(getUserKey(STORAGE_KEYS.updatedAt, u.id)) || '0', 10) || 0;
        const cUp = cData.updatedAt || 0;
        if (cUp > lUp) {
          localStorage.setItem(getUserKey(STORAGE_KEYS.errorBook, u.id), JSON.stringify(cData.errorBook || []));
          localStorage.setItem(getUserKey(STORAGE_KEYS.errorCounts, u.id), JSON.stringify(cData.errorCounts || {}));
          localStorage.setItem(getUserKey(STORAGE_KEYS.successCounts, u.id), JSON.stringify(cData.successCounts || {}));
          localStorage.setItem(getUserKey(STORAGE_KEYS.slowCounts, u.id), JSON.stringify(cData.slowCounts || {}));
          localStorage.setItem(getUserKey(STORAGE_KEYS.history, u.id), JSON.stringify(cData.fullHistory || []));
          localStorage.setItem(getUserKey(STORAGE_KEYS.unitProgress, u.id), JSON.stringify(cData.unitProgress || {}));
          localStorage.setItem(getUserKey(STORAGE_KEYS.updatedAt, u.id), String(cUp));
        }
      });

      const cloudData = allCloudUsers[userId];
      const localUpdated = state.updatedAt || 0;
      const localActivityCount = (state.fullHistory?.length || 0) + Object.keys(state.successCounts || {}).length + (state.errorBook?.length || 0);

      if (cloudData && typeof cloudData === 'object') {
        const cloudUpdated = cloudData.updatedAt || 0;
        const cloudActivityCount = (cloudData.fullHistory?.length || 0) + Object.keys(cloudData.successCounts || {}).length + (cloudData.errorBook?.length || 0);

        // 雲端較新，或本地無紀錄但雲端有紀錄時
        if (cloudUpdated > localUpdated || (localUpdated === 0 && cloudActivityCount > 0)) {
          state.errorBook = Array.isArray(cloudData.errorBook) ? cloudData.errorBook : [];
          state.errorCounts = cloudData.errorCounts || {};
          state.successCounts = cloudData.successCounts || {};
          state.slowCounts = cloudData.slowCounts || {};
          state.fullHistory = Array.isArray(cloudData.fullHistory) ? cloudData.fullHistory : [];
          state.unitProgress = cloudData.unitProgress || {};
          state.updatedAt = cloudUpdated;
          saveState(false);
          render();
          const uObj = USERS.find(u => u.id === userId) || { name: userId };
          showToast(`☁️ 已同步【${uObj.name}】的最新雲端進度！`);
        } else if (localUpdated > cloudUpdated && localActivityCount > 0) {
          await pushToCloud(userId);
          if (showFeedback) showToast('☁️ 本機進度較新，已推送同步至雲端！');
        } else {
          if (showFeedback) showToast('☁️ 目前已是最新雲端同步狀態！');
        }
      } else if (localActivityCount > 0) {
        await pushToCloud(userId);
        if (showFeedback) showToast('☁️ 已將本機紀錄首次備份至雲端！');
      }
      state.cloudSyncStatus = 'synced';
      return true;
    } catch (e) {
      state.cloudSyncStatus = 'offline';
      if (showFeedback) showToast('⚠️ 雲端連線失敗，請檢查網路狀態');
      return false;
    }
  }

  // 每一題答題日誌非同步寫入 (/g6_english_logs/${userId}/${logKey}.json)
  async function pushAnswerLog(logData) {
    const base = normalizeCloudUrl(state.cloudDbUrl);
    if (!base) return;
    try {
      const logKey = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      await fetch(`${base}/g6_english_logs/${state.currentUser}/${logKey}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
    } catch (e) {
      // 容錯靜默
    }
  }

  function switchUser(newUserId) {
    if (!USERS.some(u => u.id === newUserId)) return;
    saveState(true);
    state.currentUser = newUserId;
    localStorage.setItem(GLOBAL_KEYS.currentUser, newUserId);
    loadState(newUserId);
    updateNavBadges();
    showToast(`已切換學習人員為【${getCurrentUserObj().name}】`);
    render();
    syncFromCloud(newUserId, false).catch(() => {});
  }

  function resetTestUser(userId) {
    const target = USERS.find(u => u.id === userId);
    if (!target || !target.isTest) {
      showToast('🔒 Rex 為正式學員帳號，受系統保護不可清空！');
      return;
    }
    Object.values(STORAGE_KEYS).forEach(k => {
      localStorage.removeItem(getUserKey(k, userId));
    });
    if (state.currentUser === userId) {
      state.errorBook = [];
      state.errorCounts = {};
      state.successCounts = {};
      state.slowCounts = {};
      state.unitProgress = {};
      state.sessionAnswers = [];
      state.fullHistory = [];
      saveState(false);
      render();
    }
    // 雲端同步刪除
    const base = normalizeCloudUrl(state.cloudDbUrl);
    if (base) {
      fetch(`${base}/g6_english_users/${userId}.json`, { method: 'DELETE' }).catch(() => {});
      fetch(`${base}/g6_english_logs/${userId}.json`, { method: 'DELETE' }).catch(() => {});
    }
    showToast(`🧹 已將測試帳號【${target.name}】的紀錄歸零重置！`);
  }

  // ==========================================================================
  // 3. Web Speech API 語音合成引擎 (支援 1.0x / 0.8x 雙速)
  // ==========================================================================
  let activeSpeech = null;

  function speakText(text, rate = state.ttsSpeed, onEndCallback = null) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/\[.*?\]/g, '').replace(/[\(\)（）_]/g, ' ').trim();
      if (!clean) return;

      const utt = new SpeechSynthesisUtterance(clean);
      utt.lang = 'en-US';
      utt.rate = rate || 1.0;
      utt.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const engVoice = voices.find(v => (v.lang === 'en-US' || v.lang === 'en_US') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Jenny') || v.name.includes('David')));
      if (engVoice) utt.voice = engVoice;

      utt.onend = () => {
        activeSpeech = null;
        document.querySelectorAll('.reading-sentence.speaking-active').forEach(el => el.classList.remove('speaking-active'));
        if (typeof onEndCallback === 'function') onEndCallback();
      };
      utt.onerror = () => {
        activeSpeech = null;
        document.querySelectorAll('.reading-sentence.speaking-active').forEach(el => el.classList.remove('speaking-active'));
        if (typeof onEndCallback === 'function') onEndCallback();
      };

      activeSpeech = utt;
      window.speechSynthesis.speak(utt);
    } catch (e) {
      console.warn('TTS 發音失敗:', e);
    }
  }

  function stopAllSpeech() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      activeSpeech = null;
    }
    document.querySelectorAll('.reading-sentence.speaking-active').forEach(el => el.classList.remove('speaking-active'));
  }

  // ==========================================================================
  // 4. 資料模型與輔助查詢
  // ==========================================================================
  // 5 本期中考核心書系中繼資料
  const BOOK_META = {
    'tea_midterm': {
      id: 'tea_midterm',
      name: '🏆 岱崙美語 3C Quiz 歷史考券',
      shortName: '岱崙歷史考券',
      desc: 'Week 2~7 實戰小考 1:1 復原重測、紅黑對照與全週次大模考 (55 題)',
      hue: 45,
      isMidterm: true,
      category: '岱崙週考'
    },
    'gra3': {
      id: 'gra3',
      name: '📘 Oxford Discover Grammar 3',
      shortName: 'Oxford Discover Grammar 3',
      desc: '全冊 12 單元：時態變化、倒裝附和句、副詞三級比較、名詞計量、動名詞與飲食事實 (635 題)',
      hue: 245,
      isMidterm: true,
      category: '文法專修'
    },
    'wr3': {
      id: 'wr3',
      name: '📝 Write Right 3',
      shortName: 'Write Right 3',
      desc: '全冊 6 單元：出國旅遊、最愛課堂、朋友爭執、社區空間、假設語氣與歷史偉人 (343 題)',
      hue: 285,
      isMidterm: true,
      category: '寫作專攻'
    },
    'rw6': {
      id: 'rw6',
      name: '📖 Reading with Writing 6',
      shortName: 'Reading with Writing 6',
      desc: '全冊 9 單元：水中世界、鯊魚攝影師、時空背景分析、定向越野、多國語言與認識地球 (304 題)',
      hue: 165,
      isMidterm: true,
      category: '讀寫進階'
    },
    'rd6': {
      id: 'rd6',
      name: '🚀 Read and Discover 6: Space',
      shortName: 'Read and Discover 6: Space',
      desc: '全冊 5 章節：宇宙起源、地球與月球、岩石與冰、外星生命探索與天文學史 (259 題)',
      hue: 345,
      isMidterm: true,
      category: '太空科普'
    },
    'od3': {
      id: 'od3',
      name: '📚 Oxford Discover 3',
      shortName: 'Oxford Discover 3',
      desc: '核心課本：時間與地球 (Unit 7)、茉莉醫生 (Unit 8)、快樂花園 (Unit 16) 深度閱讀與字彙 (152 題)',
      hue: 200,
      isMidterm: true,
      category: '課本閱讀'
    },
    'tiger_5b': {
      id: 'tiger_5b',
      name: '📚 Tiger 五下歷史單字庫',
      shortName: '五下歷史庫',
      desc: '五下單字回溯鞏固：D3 U10~12、RW5 U11、RW6 U1~4 核心字彙專題測驗 (92 題)',
      hue: 120,
      isMidterm: false,
      category: '單字專題'
    }
  };

  // 取得課本清單
  function getBooksList() {
    return Object.values(BOOK_META);
  }

  // 取得某課本下的單元列表 (Units List，涵蓋全書所有單元)
  function getUnitsForBook(bookId) {
    if (bookId === 'tea_midterm') {
      return [
        {
          id: 'week12_all',
          bookId: 'tea_midterm',
          title: '🚨 Week 12 (11/18 三) 小考五合一總複習模擬考',
          desc: 'Oxford Discover Grammar 3 (U16) + Oxford Discover 3 (U16) + Reading with Writing 6 (U9) + Read and Discover 6: Space (Ch6) + Write Right 3 (U6)（共 156 題 KET-4D 新題）',
          week: 'W12',
          badge: '🚨 Week 12 必考',
          is_midterm: true,
          is_week12: true
        },
        {
          id: 'tea_all',
          bookId: 'tea_midterm',
          title: '🎲 Week 2~7 全週次綜合全真大模考',
          desc: '收錄全部 164 道考券真題、58 道改錯題與 3 篇實體真卷精讀',
          week: 'ALL',
          badge: '全真模考',
          is_midterm: true
        },
        {
          id: 'tea_w2',
          bookId: 'tea_midterm',
          title: '📄 Week 2 真卷：簡單機械單字 + 倒裝附和 + 社區作文',
          desc: 'Oxford Discover 3 (U13) 單字 (20) + Oxford Discover Grammar 3 (U13) 倒裝 (4) + Michelle\'s Neighborhood 作文 (9)（共 33 題真題）',
          week: 'W2',
          badge: 'Week 2',
          is_midterm: true
        },
        {
          id: 'tea_w4',
          bookId: 'tea_midterm',
          title: '📄 Week 4 真卷：吹玻璃單字 + 方位介系詞 + 三級副詞長句',
          desc: 'Oxford Discover 3 (U14) 單字 (20) + Reading with Writing 6 方位 (16) + Oxford Discover Grammar 3 (U14) 副詞三合一長句 (5)（共 41 題真題）',
          week: 'W4',
          badge: 'Week 4',
          is_midterm: true
        },
        {
          id: 'tea_w5',
          bookId: 'tea_midterm',
          title: '📄 Week 5 真卷：定向越野長篇聽寫 + 三級副詞 + 6000美元作文',
          desc: 'Reading with Writing 6 (U6) 課文長篇聽寫 (9) + Oxford Discover Grammar 3 (U14) 副詞比較 (3) + 6000美元作文 (7)（共 19 題真題）',
          week: 'W5',
          badge: 'Week 5',
          is_midterm: true
        },
        {
          id: 'tea_w6',
          bookId: 'tea_midterm',
          title: '📄 Week 6 真卷：植物與語言單字 + 14處抓錯題 + 數量詞',
          desc: 'Oxford Discover 3 (U15) 植物 (20) + Reading with Writing 6 語言 (15) + 3000美元 14 處抓錯 (14) + 數量詞 (3)（共 52 題真題）',
          week: 'W6',
          badge: 'Week 6',
          is_midterm: true
        },
        {
          id: 'tea_w7',
          bookId: 'tea_midterm',
          title: '📄 Week 7 真卷：容器量詞造句 + 倒裝時態 + 三級副詞長句',
          desc: 'Oxford Discover Grammar 3 (U15) 容器量詞看圖造句 (10) + Oxford Discover Grammar 3 (U13) 倒裝 (4) + Oxford Discover Grammar 3 (U14) 副詞問答 (5)（共 19 題真題）',
          week: 'W7',
          badge: 'Week 7',
          is_midterm: true
        }
      ];
    }

    if (!window.ENGLISH_DATA || !window.ENGLISH_DATA.units) return [];
    
    // 取得該課本底下的全部單元 (不限定期中考，全面開放)
    const list = window.ENGLISH_DATA.units.filter(u => u.book_id === bookId);
    
    const WEEK12_UNIT_IDS = ['gra3_16', 'od3_16', 'rw6_9', 'rd6_6', 'wr3_6'];
    return list.map(u => {
      const isWeek12 = !!(u.is_week12 || WEEK12_UNIT_IDS.includes(u.unit_id));
      let badge = isWeek12 ? '🚨 Week 12 必考' : (u.is_midterm ? '🔥 期中核心' : '📚 實力精熟');
      const uNumMatch = u.unit_id.match(/_(\d+)$/);
      if (isWeek12) {
        badge = '🚨 Week 12 必考';
      } else if (uNumMatch) {
        badge = (u.is_midterm ? '🔥 ' : '') + `Unit ${uNumMatch[1]}`;
      } else if (u.unit_id.includes('tiger_5b')) {
        badge = '複習 ' + u.unit_id.replace('tiger_5b_', '').toUpperCase();
      }
      return {
        id: u.unit_id,
        bookId: u.book_id,
        title: u.unit_title,
        desc: u.big_question || `${u.unit_title} 核心文法與實戰題庫`,
        midtermId: u.midterm_unit_id,
        badge: badge,
        is_midterm: !!u.is_midterm,
        is_week12: isWeek12
      };
    });
  }

  // 取得某單元之 MIDTERM_DATABASE 資料
  function getMidtermDataUnit(midtermIdOrUnitId) {
    if (!window.MIDTERM_DATABASE) return null;
    let target = window.MIDTERM_DATABASE.find(u => u.id === midtermIdOrUnitId);
    if (!target && window.ENGLISH_DATA && window.ENGLISH_DATA.units) {
      const u = window.ENGLISH_DATA.units.find(x => x.unit_id === midtermIdOrUnitId);
      if (u && u.midterm_unit_id) {
        target = window.MIDTERM_DATABASE.find(x => x.id === u.midterm_unit_id);
      }
    }
    return target;
  }

  // 題目類型相容比對器 (跨 MIDTERM_DATABASE 與 ENGLISH_DATA，區分手寫實戰 vs 觀念選擇)
  function matchQuizType(q, filterType) {
    if (!q || filterType === 'all') return true;
    const t = (q.type || '').toLowerCase();
    const cat = (q.category_tag || '').toLowerCase();
    const isErr = (qid) => state.errorBook.some(e => (typeof e === 'string' ? e : e.id) === qid);

    const isVocab = t === 'vocab' || t === 'spelling_listen' || t === 'spelling' || cat === 'listening';
    const isHandwrite = !isVocab && (
      t === 'paper_rewrite' || t === 'rewrite' || t === 'cloze' || t === 'fill' ||
      cat === 'rewrite' || cat === 'fill' ||
      ((t === 'grammar' || t === 'reading') && (!Array.isArray(q.options) || q.options.length === 0))
    );

    if (filterType === 'vocab') return isVocab;
    if (filterType === 'handwrite') return isHandwrite;
    if (filterType === 'grammar') return !isVocab && !isHandwrite && (t === 'grammar' || cat === 'grammar');
    if (filterType === 'reading') return !isVocab && !isHandwrite && (t === 'reading' || (t === 'choice' && cat !== 'grammar'));
    if (filterType === 'braingym') return t === 'brain_gym';
    if (filterType === 'error') return isErr(q.id);
    return true;
  }

  // 取得某單元之單字庫清單 (7 大錨點單字卡)
  function getVocabsForUnit(bookId, unitId) {
    if (!window.ENGLISH_DATA || !window.ENGLISH_DATA.vocabulary) return [];
    if (unitId === 'week12_all') {
      return window.ENGLISH_DATA.vocabulary.filter(v => v.is_week12);
    }
    if (bookId === 'tea_midterm' || unitId.startsWith('tea_')) {
      if (unitId === 'tea_w2') return window.ENGLISH_DATA.vocabulary.filter(v => v.unit_id === 'tea_midterm_1' || v.unit_id === 'gra3_13');
      if (unitId === 'tea_w4') return window.ENGLISH_DATA.vocabulary.filter(v => v.unit_id === 'rw6_5' || v.unit_id === 'gra3_14');
      if (unitId === 'tea_w5') return window.ENGLISH_DATA.vocabulary.filter(v => v.unit_id === 'rw6_6');
      if (unitId === 'tea_w6') return window.ENGLISH_DATA.vocabulary.filter(v => v.unit_id === 'rw6_7' || v.unit_id === 'rw6_8');
      if (unitId === 'tea_w7') return window.ENGLISH_DATA.vocabulary.filter(v => v.unit_id === 'gra3_15');
      return window.ENGLISH_DATA.vocabulary.filter(v => v.is_midterm || v.unit_id.startsWith('gra3_1') || v.unit_id.startsWith('rw6_'));
    }
    return window.ENGLISH_DATA.vocabulary.filter(v => v.unit_id === unitId || (bookId && v.book_id === bookId && v.unit_id === unitId));
  }

  // 取得某單元之文法焦點清單
  function getGrammarForUnit(bookId, unitId) {
    if (!window.ENGLISH_DATA || !window.ENGLISH_DATA.grammar) return [];
    if (unitId === 'week12_all') {
      return window.ENGLISH_DATA.grammar.filter(g => g.is_week12);
    }
    if (bookId === 'tea_midterm' || unitId.startsWith('tea_')) {
      if (unitId === 'tea_w2') return window.ENGLISH_DATA.grammar.filter(g => g.unit_id === 'gra3_13');
      if (unitId === 'tea_w4') return window.ENGLISH_DATA.grammar.filter(g => g.unit_id === 'gra3_14');
      if (unitId === 'tea_w5') return window.ENGLISH_DATA.grammar.filter(g => g.unit_id === 'gra3_14');
      if (unitId === 'tea_w6') return window.ENGLISH_DATA.grammar.filter(g => g.unit_id === 'gra3_15');
      if (unitId === 'tea_w7') return window.ENGLISH_DATA.grammar.filter(g => g.unit_id === 'gra3_13' || g.unit_id === 'gra3_14' || g.unit_id === 'gra3_15');
      return window.ENGLISH_DATA.grammar.filter(g => g.unit_id.startsWith('gra3_1'));
    }
    return window.ENGLISH_DATA.grammar.filter(g => g.unit_id === unitId || (bookId && g.book_id === bookId && g.unit_id === unitId));
  }

  // 取得某單元之課文清單 (優先取完整課文，若來自 MIDTERM_DATABASE 則自動組合句子)
  function getPassagesForUnit(bookId, unitId) {
    if (unitId === 'week12_all') {
      const w12 = getMidtermDataUnit('WEEK12_ALL');
      if (!w12 || !w12.passages) return [];
      return w12.passages.map((p, idx) => ({
        sequence: p.sequence || (idx + 1),
        section_title: p.section_title || p.title || `Week 12 課文精讀 #${idx + 1}`,
        eng: p.eng || (Array.isArray(p.sentences) ? p.sentences.map(s => s.en).join(' ') : (Array.isArray(p.paragraphs) ? p.paragraphs.join('\n\n') : (p.text || ''))),
        chi: p.chi || (Array.isArray(p.sentences) ? p.sentences.map(s => s.zh).join(' ') : (p.chinese || p.translation || '')),
        sentences: Array.isArray(p.sentences) ? p.sentences : [],
        key_sentences: p.key_sentences || []
      }));
    }
    if (bookId === 'tea_midterm' || unitId.startsWith('tea_')) {
      const tea = getMidtermDataUnit('TEA_QUIZ_REVIEW');
      if (!tea || !tea.passages) return [];
      let rawList = [];
      if (unitId === 'tea_w2') rawList = []; // Week 2 has no reading comprehension passage
      else if (unitId === 'tea_w4') rawList = []; // Week 4 has no reading comprehension passage
      else if (unitId === 'tea_w5') rawList = tea.passages.filter((_, idx) => idx === 0 || idx === 2); // W5 Orienteering Dictation & $6000 Essay
      else if (unitId === 'tea_w6') rawList = tea.passages.filter((_, idx) => idx === 3); // W6 3000 Dollars Proofreading
      else if (unitId === 'tea_w7') rawList = []; // Week 7 has no reading comprehension passage
      else rawList = tea.passages.filter((_, idx) => idx === 0 || idx === 2 || idx === 3);

      return rawList.map((p, idx) => ({
        sequence: p.sequence || (idx + 1),
        section_title: p.section_title || p.title || `範文精讀 #${idx + 1}`,
        eng: p.eng || (Array.isArray(p.sentences) ? p.sentences.map(s => s.en).join(' ') : (Array.isArray(p.paragraphs) ? p.paragraphs.join('\n\n') : (p.text || ''))),
        chi: p.chi || (Array.isArray(p.sentences) ? p.sentences.map(s => s.zh).join(' ') : (p.chinese || p.translation || '')),
        sentences: Array.isArray(p.sentences) ? p.sentences : [],
        key_sentences: p.key_sentences || []
      }));
    }

    // 優先從 ENGLISH_DATA.reading_content 取得 100% 完整課文全文 (含 Topic Intro、Part 1、Part 2、副篇)
    if (window.ENGLISH_DATA && window.ENGLISH_DATA.reading_content) {
      const fullList = window.ENGLISH_DATA.reading_content.filter(r => r.unit_id === unitId || (bookId && r.book_id === bookId && r.unit_id === unitId));
      if (fullList.length > 0) {
        return fullList.map((r, idx) => ({
          sequence: r.sequence || (idx + 1),
          section_title: r.section_title || r.title || `課文段落 #${idx + 1}`,
          eng: r.eng || (Array.isArray(r.sentences) ? r.sentences.map(s => s.en).join(' ') : (r.text || '')),
          chi: r.chi || (Array.isArray(r.sentences) ? r.sentences.map(s => s.zh).join(' ') : (r.chinese || '')),
          sentences: Array.isArray(r.sentences) ? r.sentences : [],
          key_sentences: r.key_sentences || []
        }));
      }
    }

    // 次之從 MIDTERM_DATABASE 取得
    const mid = getMidtermDataUnit(unitId);
    if (mid && mid.passages && mid.passages.length > 0) {
      return mid.passages.map((p, idx) => ({
        sequence: p.sequence || (idx + 1),
        section_title: p.section_title || p.title || `課文段落 #${idx + 1}`,
        eng: p.eng || (Array.isArray(p.sentences) ? p.sentences.map(s => s.en).join(' ') : (Array.isArray(p.paragraphs) ? p.paragraphs.join('\n\n') : (p.text || ''))),
        chi: p.chi || (Array.isArray(p.sentences) ? p.sentences.map(s => s.zh).join(' ') : (p.chinese || p.translation || '')),
        sentences: Array.isArray(p.sentences) ? p.sentences : [],
        key_sentences: p.key_sentences || []
      }));
    }

    return [];
  }

  function getMistakesForUnit(bookId, unitId) {
    if (unitId === 'week12_all') {
      const w12 = getMidtermDataUnit('WEEK12_ALL');
      return (w12 && w12.mistake_buster) ? w12.mistake_buster : [];
    }
    if (bookId === 'tea_midterm' || unitId.startsWith('tea_')) {
      const tea = getMidtermDataUnit('TEA_QUIZ_REVIEW');
      if (!tea || !tea.mistake_buster) return [];
      if (unitId === 'tea_all') return tea.mistake_buster;
      const wMap = { tea_w2: 'W2', tea_w4: 'W4', tea_w5: 'W5', tea_w6: 'W6', tea_w7: 'W7' };
      const targetWeek = wMap[unitId];
      if (targetWeek) {
        const targetW0 = 'W0' + targetWeek.slice(1);
        return tea.mistake_buster.filter(m => {
          if (m.week === targetWeek || m.week === targetW0) return true;
          if (m.id && (m.id.toUpperCase().includes('_' + targetWeek + '_') || m.id.toUpperCase().includes('_' + targetW0 + '_'))) return true;
          if (m.trap_id && (m.trap_id.toUpperCase().includes(targetWeek) || m.trap_id.toUpperCase().includes(targetW0))) return true;
          if (m.point && (m.point.includes(targetWeek) || m.point.includes(targetW0))) return true;
          if (m.reason && (m.reason.includes(targetWeek) || m.reason.includes(targetW0))) return true;
          return false;
        });
      }
      return tea.mistake_buster;
    }
    const mid = getMidtermDataUnit(unitId);
    return (mid && mid.mistake_buster) ? mid.mistake_buster : [];
  }

  // 取得某單元之測驗題庫清單 (支援 1,711 道全題庫 + 考券真題)
  function getQuizzesForUnit(bookId, unitId) {
    if (unitId === 'week12_all') {
      const w12 = getMidtermDataUnit('WEEK12_ALL');
      if (w12 && w12.quizzes && w12.quizzes.length > 0) return w12.quizzes;
      if (window.ENGLISH_DATA && window.ENGLISH_DATA.quizzes) {
        return window.ENGLISH_DATA.quizzes.filter(q => q.is_week12);
      }
      return [];
    }
    if (bookId === 'tea_midterm' || unitId.startsWith('tea_')) {
      const tea = getMidtermDataUnit('TEA_QUIZ_REVIEW');
      if (!tea || !tea.quizzes) return [];
      if (unitId === 'tea_all') return tea.quizzes;
      const wMap = { tea_w2: 'W2', tea_w4: 'W4', tea_w5: 'W5', tea_w6: 'W6', tea_w7: 'W7' };
      const targetWeek = wMap[unitId];
      if (targetWeek) {
        return tea.quizzes.filter(q => {
          if (q.week === targetWeek) return true;
          if (q.id && (q.id.toUpperCase().includes(`_${targetWeek}_`) || q.id.toLowerCase().startsWith(`q_tea_${targetWeek.toLowerCase()}`))) return true;
          if (q.question && q.question.toUpperCase().includes(targetWeek)) return true;
          return false;
        });
      }
      return tea.quizzes;
    }

    const mid = getMidtermDataUnit(unitId);
    if (mid && mid.quizzes && mid.quizzes.length > 0) return mid.quizzes;

    if (window.ENGLISH_DATA && window.ENGLISH_DATA.quizzes) {
      return window.ENGLISH_DATA.quizzes.filter(q => (q.unit_id === unitId || (bookId && q.book_id === bookId && q.unit_id === unitId)) && q.type !== 'brain_gym');
    }
    return [];
  }

  // 取得晨間題目
  function getBrainGymQuestions(tier = 'all') {
    if (!window.ENGLISH_DATA) return [];
    let list = window.ENGLISH_DATA.quizzes.filter(q => q.type === 'brain_gym' || q.is_midterm === true);
    if (tier === '1-3') list = list.filter(q => (q.star || 1) <= 3);
    else if (tier === '4-7') list = list.filter(q => (q.star || 1) >= 4 && (q.star || 1) <= 7);
    else if (tier === '8-10') list = list.filter(q => (q.star || 1) >= 8);
    return list;
  }

  // 統計計算 (修復 bookId 傳入與錯題物件相容性)
  function getUnitMasteryStats(unitId, bookId = state.currentBookId) {
    const list = getQuizzesForUnit(bookId, unitId);
    if (!list || list.length === 0) return { total: 0, errCount: 0, mastered: 0, pct: 0 };
    const isErr = (qid) => state.errorBook.some(e => (typeof e === 'string' ? e : e.id) === qid);
    const errCount = list.filter(q => isErr(q.id)).length;
    const mastered = list.filter(q => (state.successCounts[q.id] || 0) >= 1 && !isErr(q.id)).length;
    const pct = list.length > 0 ? Math.round((mastered / list.length) * 100) : 0;
    return { total: list.length, errCount, mastered, pct };
  }

  function getBookStats(bookId) {
    const units = getUnitsForBook(bookId);
    let totalQ = 0;
    let totalErr = 0;
    let totalMastered = 0;

    units.forEach(u => {
      const st = getUnitMasteryStats(u.id, bookId);
      totalQ += st.total;
      totalErr += st.errCount;
      totalMastered += st.mastered;
    });

    const pct = totalQ > 0 ? Math.round((totalMastered / totalQ) * 100) : 0;
    return { unitsCount: units.length, totalQ, totalErr, totalMastered, pct };
  }

  function getGlobalStats() {
    let totalQ = 0;
    let mastered = 0;
    const isErr = (qid) => state.errorBook.some(e => (typeof e === 'string' ? e : e.id) === qid);
    if (window.ENGLISH_DATA && window.ENGLISH_DATA.quizzes) {
      totalQ = window.ENGLISH_DATA.quizzes.length;
      mastered = window.ENGLISH_DATA.quizzes.filter(q => (state.successCounts[q.id] || 0) >= 1 && !isErr(q.id)).length;
    }
    const pct = totalQ > 0 ? Math.round((mastered / totalQ) * 100) : 0;
    return {
      total: totalQ || 1711,
      mastered,
      pct,
      errors: state.errorBook.length
    };
  }

  // ==========================================================================
  // 5. 頂部列與導覽更新
  // ==========================================================================
  function updateNavBadges() {
    const badge = document.getElementById('nav-error-count');
    if (badge) {
      const cnt = state.errorBook.length;
      badge.textContent = cnt;
      if (cnt === 0) badge.classList.add('zero');
      else badge.classList.remove('zero');
    }

    const curUser = getCurrentUserObj();
    const iconEl = document.getElementById('nav-user-icon');
    const nameEl = document.getElementById('nav-user-name');
    const userBtn = document.getElementById('nav-user');
    if (iconEl) iconEl.textContent = curUser.icon;
    if (nameEl) nameEl.textContent = curUser.name;
    if (userBtn) {
      userBtn.style.borderColor = curUser.color;
      userBtn.style.color = curUser.color;
    }

    const ttsLabel = document.getElementById('nav-tts-label');
    if (ttsLabel) {
      ttsLabel.textContent = `${state.ttsSpeed.toFixed(1)}x`;
    }
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2400);
  }

  // ==========================================================================
  // 6. 視圖主調度器 (View Router)
  // ==========================================================================
  function render() {
    const app = document.getElementById('app');
    if (!app) return;
    updateNavBadges();
    stopAllSpeech();

    if (state.view === 'dashboard') {
      renderDashboardView(app);
    } else if (state.view === 'book') {
      renderBookView(app, state.currentBookId);
    } else if (state.view === 'unit_hub') {
      renderUnitHubView(app, state.currentBookId, state.currentUnitId, state.currentSubtab);
    } else if (state.view === 'quiz') {
      renderActiveQuizView(app);
    } else if (state.view === 'error_book') {
      renderErrorBookView(app);
    } else if (state.view === 'print') {
      renderPrintView(app);
    } else {
      state.view = 'dashboard';
      renderDashboardView(app);
    }
  }

  // ==========================================================================
  // 7. Level 1: 首頁「課本與考券總覽」 (Dashboard View)
  // ==========================================================================
  function renderDashboardView(container) {
    const g = getGlobalStats();
    const curUser = getCurrentUserObj();
    const books = getBooksList();

    const bookCardsHtml = books.map(b => {
      const st = getBookStats(b.id);
      return `
        <article class="book-card" style="--hue: ${b.hue}">
          <div class="book-card-head">
            <span class="b-badge">${b.category}</span>
            <span class="tag ${st.pct === 100 ? 'ok' : ''}">掌握 ${st.pct}%</span>
          </div>
          <h3>${b.name}</h3>
          <p>${b.desc}</p>
          <div class="progress" title="全書掌握度 ${st.pct}%"><i style="width: ${st.pct}%"></i></div>
          <div class="book-card-meta">
            <span class="tag pri">${st.unitsCount} 個單元</span>
            <span class="tag">${st.totalQ} 道題庫</span>
            ${st.totalErr > 0 ? `<span class="tag bad">🔥 ${st.totalErr} 題待消滅</span>` : ''}
          </div>
          <div class="u-actions" style="margin-top: 14px;">
            <button class="btn btn-primary btn-block" data-open-book="${b.id}">
              進入課本學習 ➔
            </button>
          </div>
        </article>
      `;
    }).join('');

    const userSwitcherHtml = `
      <section class="user-switcher-bar glass" style="--active-user-color: ${curUser.color}; --active-user-bg: ${curUser.bg};">
        <div class="user-bar-left">
          <span class="user-bar-label">👤 目前使用人員：</span>
          <div class="user-pills-row">
            ${USERS.map(u => {
              const active = u.id === state.currentUser;
              const st = loadUserStatsSummary(u.id);
              return `
                <button type="button" class="user-pill-btn ${active ? 'active' : ''}" data-pick-user="${u.id}" style="--u-color: ${u.color}; --u-bg: ${u.bg};">
                  <span>${u.icon} ${u.name}</span>
                  ${st.errCount > 0 ? `<b class="u-err-dot" title="${st.errCount} 題待消滅">${st.errCount}</b>` : ''}
                </button>
              `;
            }).join('')}
          </div>
        </div>
        <div class="user-bar-right">
          ${curUser.isTest ? `
            <span class="test-mode-tag">🧪 測試隔離模式（不影響 Rex 紀錄）</span>
            <button type="button" class="btn btn-sm btn-ghost btn-clear-cur-test" id="btn-dash-reset-test">🧹 清空 ${curUser.name} 紀錄</button>
          ` : `
            <span class="rex-mode-tag">🦖 Rex 正式學習模式（進度保護中）</span>
          `}
          <button type="button" class="btn btn-sm btn-ghost" id="btn-open-user-modal">⚙️ 帳號與雲端</button>
        </div>
      </section>
    `;

    container.innerHTML = `
      <div class="view dashboard">
        ${userSwitcherHtml}

        <!-- 首頁 Hero -->
        <section class="glass hero">
          <div>
            <h2>${curUser.icon} ${curUser.name} 的英語特訓 <span class="grad">核心素養精熟特訓</span></h2>
            <p>5 大書系完整課文・7 大記憶錨點・神探點詞抓錯・雙軌紙筆測驗・岱崙小考歷史真題全收錄。</p>
            <div class="filters">
              <span class="label">教材範圍：</span>
              <span class="chip on"><span class="dot"></span>📘 文法專修</span>
              <span class="chip on"><span class="dot"></span>📝 寫作專攻</span>
              <span class="chip on"><span class="dot"></span>📖 讀寫進階</span>
              <span class="chip on"><span class="dot"></span>🚀 太空科普</span>
              <span class="chip on"><span class="dot"></span>🏆 岱崙週考真卷</span>
            </div>
          </div>
          <div class="stats">
            <div class="stat pri"><b>${g.pct}%</b><span>全冊掌握度</span></div>
            <div class="stat bad"><b>${g.errors}</b><span>待消滅錯題</span></div>
            <div class="stat ok"><b>${g.total}</b><span>精選題庫數</span></div>
          </div>
        </section>

        <!-- 🚨 Week 12 (11/18 三) 小考五合一衝刺專區 -->
        <aside class="banner-week12">
          <div class="w12-header">
            <div>
              <span class="w12-badge-pill">🚨 下週三 11/18 (W12) *EL-3C 小考總衝刺</span>
              <h3>Week 12 必考五大範圍 &times; 156 道 KET-4D 全真複習題庫（65 聽寫 + 41 手寫實戰 + 50 選擇）</h3>
              <p>含四書範圍 + Oxford Discover 3 (Unit 16) 主課本單字，逐題附命題核心目標、正解推導與錯選項排除分析。</p>
            </div>
            <button class="btn btn-primary" id="btn-launch-w12-mock">🚀 五合一 156 題大模考</button>
          </div>
          <div class="w12-grid">
            <button type="button" class="w12-chip" data-open-w12-book="rw6" data-open-w12-unit="rw6_9">
              <span class="w12-chip-top">📖 Reading with Writing 6</span>
              <strong>Unit 9：認識地球與人際</strong>
              <small>14 聽寫 + 8 手寫 + 10 選擇 (32 題)</small>
            </button>
            <button type="button" class="w12-chip" data-open-w12-book="rd6" data-open-w12-unit="rd6_6">
              <span class="w12-chip-top">🚀 Read and Discover 6: Space</span>
              <strong>Ch 6：外星生命探索</strong>
              <small>14 聽寫 + 8 手寫 + 10 選擇 (32 題)</small>
            </button>
            <button type="button" class="w12-chip" data-open-w12-book="gra3" data-open-w12-unit="gra3_16">
              <span class="w12-chip-top">📘 Oxford Discover Grammar 3</span>
              <strong>Unit 16：飲食事實 Facts</strong>
              <small>6 聽寫 + 10 手寫 + 12 選擇 (28 題)</small>
            </button>
            <button type="button" class="w12-chip" data-open-w12-book="wr3" data-open-w12-unit="wr3_6">
              <span class="w12-chip-top">📝 Write Right 3</span>
              <strong>Unit 6：歷史偉人傳記</strong>
              <small>14 聽寫 + 10 手寫 + 8 選擇 (32 題)</small>
            </button>
            <button type="button" class="w12-chip" data-open-w12-book="od3" data-open-w12-unit="od3_16">
              <span class="w12-chip-top">📚 Oxford Discover 3</span>
              <strong>Unit 16：快樂花園</strong>
              <small>17 聽寫 + 5 手寫 + 10 選擇 (32 題)</small>
            </button>
          </div>
        </aside>

        <!-- 早餐純腦力體操 Banner -->
        <aside class="glass banner-mental">
          <div style="display: flex; gap: 14px; align-items: center;">
            <span style="font-size: 36px;">☕</span>
            <div>
              <h3>早餐 iPad 專屬：晨間純腦力英語體操 (1★~10★ 語感天梯)</h3>
              <p>早餐 5~10 分鐘免動筆！單手點擊秒殺，培養倒裝附和、三級副詞、量詞搭配與科普直覺。（共 56 題秒殺題）</p>
            </div>
          </div>
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <select id="select-braingym-tier" style="padding: 10px 14px; border-radius: 10px; border: 1.5px solid #fcd34d; background: #fff; font-weight: 700; color: #854d0e; cursor: pointer;">
              <option value="all">🔥 全部星級挑戰 (56 題)</option>
              <option value="1-3">⭐ Lv.1~3 基礎暖身 (15 題)</option>
              <option value="4-7">⭐⭐ Lv.4~7 段考主力 (25 題)</option>
              <option value="8-10">⭐⭐⭐ Lv.8~10 滿分魔王 (16 題)</option>
            </select>
            <button class="btn btn-primary" id="btn-launch-braingym">⚡ 啟動晨間體操</button>
          </div>
        </aside>

        <!-- 錯題消滅 Banner (若有錯題) -->
        ${state.errorBook.length > 0 ? `
          <aside class="banner-error">
            <div>
              <h3>🔥 跨課本錯題消滅戰</h3>
              <p>目前累積 ${state.errorBook.length} 個真實錯題與盲點，答對即徹底移出錯題本！</p>
            </div>
            <button class="btn btn-lg" id="btn-launch-errors">立即消滅錯題 ➔</button>
          </aside>
        ` : ''}

        <!-- 課本大卡片網格 -->
        <div class="section-title">
          <h2>📚 全教材書系與小考考券總覽</h2>
          <span class="muted">點選任一書系或考券進入單元清單</span>
        </div>
        <section class="book-grid">
          ${bookCardsHtml}
        </section>
      </div>
    `;

    // 綁定 Level 1 事件
    container.querySelectorAll('[data-open-book]').forEach(btn => {
      btn.onclick = () => {
        const bId = btn.getAttribute('data-open-book');
        state.currentBookId = bId;
        state.view = 'book';
        render();
      };
    });

    container.querySelectorAll('[data-pick-user]').forEach(btn => {
      btn.onclick = () => switchUser(btn.getAttribute('data-pick-user'));
    });

    const dashResetBtn = document.getElementById('btn-dash-reset-test');
    if (dashResetBtn) {
      dashResetBtn.onclick = () => {
        if (confirm(`確定要清空【${curUser.name}】的紀錄嗎？`)) resetTestUser(curUser.id);
      };
    }

    const modalBtn = document.getElementById('btn-open-user-modal');
    if (modalBtn) modalBtn.onclick = openUserModal;

    const w12MockBtn = document.getElementById('btn-launch-w12-mock');
    if (w12MockBtn) {
      w12MockBtn.onclick = () => {
        state.currentBookId = 'tea_midterm';
        state.currentUnitId = 'week12_all';
        startQuizSession('unit', 'tea_midterm', 'week12_all', 'all', 'all');
      };
    }

    container.querySelectorAll('[data-open-w12-unit]').forEach(btn => {
      btn.onclick = () => {
        const bId = btn.getAttribute('data-open-w12-book');
        const uId = btn.getAttribute('data-open-w12-unit');
        state.currentBookId = bId;
        state.currentUnitId = uId;
        state.currentSubtab = 'reading';
        state.view = 'unit_hub';
        render();
      };
    });

    const bgBtn = document.getElementById('btn-launch-braingym');
    if (bgBtn) {
      bgBtn.onclick = () => {
        const sel = document.getElementById('select-braingym-tier');
        startQuizSession('braingym', null, null, sel ? sel.value : 'all');
      };
    }

    const errBtn = document.getElementById('btn-launch-errors');
    if (errBtn) {
      errBtn.onclick = () => {
        state.view = 'error_book';
        render();
      };
    }
  }

  // ==========================================================================
  // 8. Level 2: 課本單元清單 (Book View)
  // ==========================================================================
  function renderBookView(container, bookId) {
    const book = BOOK_META[bookId] || BOOK_META['tea_midterm'];
    state.currentBookId = book.id || bookId;
    const units = getUnitsForBook(book.id || bookId);

    const unitCardsHtml = units.map(u => {
      const st = getUnitMasteryStats(u.id, book.id || bookId);
      const isExam = (bookId === 'tea_midterm' || book.id === 'tea_midterm');
      return `
        <article class="unit-card ${isExam ? 'exam-card' : ''}" style="--hue: ${book.hue}">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="u-no ${u.is_week12 ? 'week12-badge' : ''}">${u.badge}</span>
            <span class="tag ${st.pct === 100 ? 'ok' : ''}">掌握 ${st.pct}%</span>
          </div>
          <h3>${u.title}</h3>
          <div class="progress"><i style="width: ${st.pct}%"></i></div>
          <div class="u-meta">
            <span class="tag pri">${st.total} 題練習</span>
            ${st.errCount > 0 ? `<span class="tag bad">🔥 ${st.errCount} 題待消滅</span>` : ''}
          </div>
          <div class="u-actions ${st.errCount > 0 ? 'has-errors' : ''}">
            <div class="u-actions-top-row">
              <button class="btn btn-primary" data-open-unit="${u.id}">進入單元 ➔</button>
              <button class="btn btn-ghost" data-print-unit="${u.id}">🖨️ 印卷</button>
            </div>
            ${st.errCount > 0 ? `
              <button class="btn btn-kill-err" data-kill-unit-err="${u.id}">🔥 立即消滅此單元錯題</button>
            ` : ''}
          </div>
        </article>
      `;
    }).join('');

    container.innerHTML = `
      <div class="view book-view">
        <!-- 麵包屑導航 -->
        <nav class="breadcrumb-bar">
          <button class="crumb-link" id="btn-crumb-home">🏠 首頁課本總覽</button>
          <span class="crumb-sep">›</span>
          <span class="crumb-curr">${book.name}</span>
        </nav>

        <section class="glass hero" style="grid-template-columns: 1fr; margin-bottom: 22px; padding: 22px 28px;">
          <div>
            <h2>${book.name}</h2>
            <p>${book.desc}</p>
          </div>
        </section>

        <div class="section-title">
          <h2>📑 單元與試卷進度地圖</h2>
          <span class="muted">共收錄 ${units.length} 個單元模組</span>
        </div>
        <section class="unit-grid">
          ${unitCardsHtml}
        </section>
      </div>
    `;

    const crumbHome = document.getElementById('btn-crumb-home');
    if (crumbHome) {
      crumbHome.onclick = () => {
        state.view = 'dashboard';
        render();
      };
    }

    container.querySelectorAll('[data-open-unit]').forEach(btn => {
      btn.onclick = () => {
        const uId = btn.getAttribute('data-open-unit');
        state.currentBookId = book.id || bookId;
        state.currentUnitId = uId;
        state.currentSubtab = 'reading';
        state.view = 'unit_hub';
        render();
      };
    });

    container.querySelectorAll('[data-kill-unit-err]').forEach(btn => {
      btn.onclick = () => {
        const uId = btn.getAttribute('data-kill-unit-err');
        state.currentBookId = book.id || bookId;
        state.currentUnitId = uId;
        startQuizSession('unit_error', book.id || bookId, uId);
      };
    });

    container.querySelectorAll('[data-print-unit]').forEach(btn => {
      btn.onclick = () => {
        const uId = btn.getAttribute('data-print-unit');
        const bId = book.id || bookId;
        state.currentBookId = bId;
        state.printConfig.bookId = bId;
        state.printConfig.unitId = uId;
        state.printConfig.printType = (bId === 'tea_midterm' && uId.startsWith('tea_')) ? 'quiz_original' : 'unit_custom';
        state.view = 'print';
        render();
      };
    });
  }

  // ==========================================================================
  
  // 9. Level 3: 單元工作台 (Unit Workspace: 4 Subtabs)
  // ==========================================================================
  function renderUnitHubView(container, bookId, unitId, activeSubtab = 'reading') {
    const book = BOOK_META[bookId] || BOOK_META['tea_midterm'];
    const units = getUnitsForBook(bookId);
    const unit = units.find(u => u.id === unitId) || units[0];
    state.currentSubtab = activeSubtab;

    // 取得各項資料
    const passages = getPassagesForUnit(bookId, unitId);
    const vocabs = getVocabsForUnit(bookId, unitId);
    const grammars = getGrammarForUnit(bookId, unitId);
    const mistakes = getMistakesForUnit(bookId, unitId);
    const allQuizzes = getQuizzesForUnit(bookId, unitId);

    const vocabQ = allQuizzes.filter(q => matchQuizType(q, 'vocab'));
    const handwriteQ = allQuizzes.filter(q => matchQuizType(q, 'handwrite'));
    const grammarQ = allQuizzes.filter(q => matchQuizType(q, 'grammar'));
    const readingQ = allQuizzes.filter(q => matchQuizType(q, 'reading'));
    const brainGymQ = allQuizzes.filter(q => matchQuizType(q, 'braingym'));
    const unitErrQ = allQuizzes.filter(q => matchQuizType(q, 'error'));

    // 如果該課無課文且切換在閱讀，智能選取第一個有資料的學習分頁
    if (activeSubtab === 'reading' && passages.length === 0) {
      if (vocabs.length > 0) activeSubtab = 'vocab';
      else if (grammars.length > 0) activeSubtab = 'grammar';
      else if (mistakes.length > 0) activeSubtab = 'mistake';
      state.currentSubtab = activeSubtab;
    }

    container.innerHTML = `
      <div class="view unit-hub">
        <!-- 麵包屑導航 -->
        <nav class="breadcrumb-bar">
          <button class="crumb-link" id="btn-crumb-home">🏠 首頁</button>
          <span class="crumb-sep">›</span>
          <button class="crumb-link" id="btn-crumb-book">${book.shortName}</button>
          <span class="crumb-sep">›</span>
          <span class="crumb-curr">${unit.badge || unit.title}</span>
        </nav>

        <!-- 單元 Hero 橫幅 -->
        <section class="unit-hub-hero">
          <div class="unit-hub-title-row">
            <div>
              <span class="b-badge" style="background:#ede9fe; color:#5b4bdb; font-weight:800; font-size:12px; padding:2px 8px; border-radius:999px;">${book.category}</span>
              <h2 style="margin-top:6px;">${unit.title}</h2>
              <p class="unit-hub-bq">${unit.desc}</p>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-primary" id="btn-quick-quiz-launch">🎯 啟動全單元綜合測驗 (${allQuizzes.length} 題)</button>
              <button class="btn btn-ghost" id="btn-quick-print-launch">🖨️ A4 出卷</button>
            </div>
          </div>

          <!-- 子頁籤與題型快捷按鈕列 (平鋪同一層) -->
          <div class="tab-pills-bar">
            <!-- 學習與精讀專題 -->
            ${passages.length > 0 ? `
              <button class="tab-pill-btn ${activeSubtab === 'reading' ? 'active' : ''}" data-subtab="reading">
                <span>📖 課文閱聽與對照</span>
                <span class="tab-pill-badge">${passages.length} 段</span>
              </button>
            ` : ''}
            <button class="tab-pill-btn ${activeSubtab === 'vocab' ? 'active' : ''}" data-subtab="vocab">
              <span>📇 7 大錨點單字庫</span>
              <span class="tab-pill-badge">${vocabs.length} 字</span>
            </button>
            <button class="tab-pill-btn ${activeSubtab === 'grammar' ? 'active' : ''}" data-subtab="grammar">
              <span>🔍 文法焦點與例句</span>
              <span class="tab-pill-badge">${grammars.length} 條</span>
            </button>
            ${mistakes.length > 0 ? `
              <button class="tab-pill-btn ${activeSubtab === 'mistake' ? 'active' : ''}" data-subtab="mistake">
                <span>🕵️ 神探點詞抓錯</span>
                <span class="tab-pill-badge">${mistakes.length} 關</span>
              </button>
            ` : ''}

            <!-- 視覺分隔線 -->
            <span class="tab-pills-divider" aria-hidden="true"></span>

            <!-- 雙軌題庫分類按鈕 (對齊歷史考卷手寫實戰 + 觀念選擇熱身) -->
            ${vocabQ.length > 0 ? `
              <button class="tab-pill-btn quiz-action-pill" data-launch-quiz-type="vocab" title="仿真考卷 Part A：聽音在紙上手寫拼出單字">
                <span>🔊 考卷單字聽寫</span>
                <span class="tab-pill-badge" style="background:#e0f2fe; color:#0369a1;">${vocabQ.length} 題</span>
              </button>
            ` : ''}
            ${handwriteQ.length > 0 ? `
              <button class="tab-pill-btn quiz-action-pill handwrite-action-pill" data-launch-quiz-type="handwrite" title="仿真考卷 Part B/C：紙筆手寫造句、合併、挑錯與課文聽寫">
                <span>✍️ 考卷手寫實戰</span>
                <span class="tab-pill-badge" style="background:#fde68a; color:#92400e;">${handwriteQ.length} 題</span>
              </button>
            ` : ''}
            ${grammarQ.length > 0 ? `
              <button class="tab-pill-btn quiz-action-pill" data-launch-quiz-type="grammar" title="觀念四選一熱身：文法避坑與搭配辨析">
                <span>📐 文法觀念選擇</span>
                <span class="tab-pill-badge" style="background:#ede9fe; color:#5b21b6;">${grammarQ.length} 題</span>
              </button>
            ` : ''}
            ${readingQ.length > 0 ? `
              <button class="tab-pill-btn quiz-action-pill" data-launch-quiz-type="reading" title="專題測驗：篇章閱讀、科普事實與細節推論">
                <span>📖 閱讀理解訓練</span>
                <span class="tab-pill-badge" style="background:#d1fae5; color:#065f46;">${readingQ.length} 題</span>
              </button>
            ` : ''}
            ${brainGymQ.length > 0 ? `
              <button class="tab-pill-btn quiz-action-pill" data-launch-quiz-type="braingym" title="專題測驗：早餐純腦力語感秒殺">
                <span>⚡ 晨間語感秒殺</span>
                <span class="tab-pill-badge" style="background:#fef3c7; color:#92400e;">${brainGymQ.length} 題</span>
              </button>
            ` : ''}
            ${unitErrQ.length > 0 ? `
              <button class="tab-pill-btn quiz-action-pill error-action-pill" data-launch-quiz-type="error" title="專題測驗：僅測驗本單元待消滅錯題">
                <span>🔥 待消滅錯題</span>
                <span class="tab-pill-badge" style="background:#ffe4e6; color:#be123c; font-weight:800;">${unitErrQ.length} 題</span>
              </button>
            ` : ''}
          </div>
        </section>

        <!-- 子面板容器 -->
        <div id="subtab-panel-container">
          <!-- 動態渲染各學習子面板 -->
        </div>
      </div>
    `;

    // 麵包屑導航與捷徑
    document.getElementById('btn-crumb-home').onclick = () => {
      state.view = 'dashboard';
      render();
    };
    document.getElementById('btn-crumb-book').onclick = () => {
      state.view = 'book';
      render();
    };
    document.getElementById('btn-quick-quiz-launch').onclick = () => {
      startQuizSession('unit', bookId, unitId, 'all', 'all');
    };
    document.getElementById('btn-quick-print-launch').onclick = () => {
      state.printConfig.bookId = bookId;
      state.printConfig.unitId = unitId;
      state.printConfig.printType = (bookId === 'tea_midterm' && unitId.startsWith('tea_')) ? 'quiz_original' : 'unit_custom';
      state.view = 'print';
      render();
    };

    // 學習專區次分頁切換
    container.querySelectorAll('[data-subtab]').forEach(btn => {
      btn.onclick = () => {
        const tab = btn.getAttribute('data-subtab');
        renderUnitHubView(container, bookId, unitId, tab);
      };
    });

    // 雙軌題庫分類按鈕直達開測
    container.querySelectorAll('[data-launch-quiz-type]').forEach(btn => {
      btn.onclick = () => {
        const qType = btn.getAttribute('data-launch-quiz-type');
        startQuizSession('unit_filtered', bookId, unitId, 'all', qType);
      };
    });

    // 渲染當前學習子分頁
    const subContainer = document.getElementById('subtab-panel-container');
    if (activeSubtab === 'reading') {
      renderReadingSubpanel(subContainer, bookId, unitId, passages, vocabs);
    } else if (activeSubtab === 'vocab') {
      renderVocabSubpanel(subContainer, bookId, unitId, vocabs);
    } else if (activeSubtab === 'grammar') {
      renderGrammarSubpanel(subContainer, bookId, unitId, grammars);
    } else if (activeSubtab === 'mistake') {
      renderMistakeSubpanel(subContainer, mistakes);
    }
  }

  // --------------------------------------------------------------------------
  // 子面板 1: 課文閱聽與 7 大記憶錨點彈卡 (完整課文 + 中英對照 + 段考解析)
  // --------------------------------------------------------------------------
  function renderReadingSubpanel(container, bookId, unitId, passages, vocabs) {
    if (!passages || passages.length === 0) {
      container.innerHTML = '<div class="glass" style="padding:40px; text-align:center; font-size:15px; color:var(--ink-2);">本單元目前以專題字彙與文法測驗為主，無獨立長篇課文段落。</div>';
      return;
    }

    const vocabMap = new Map();
    (vocabs || []).forEach(v => {
      if (v.word) vocabMap.set(v.word.toLowerCase().trim(), v);
    });

    const vocabHighlightEntries = [];
    vocabMap.forEach((vObj, wordKey) => {
      if (wordKey.length >= 3 && !['and','the','for','with','this','that','from','they','them','have','were','will'].includes(wordKey)) {
        vocabHighlightEntries.push({
          word: vObj.word,
          reg: new RegExp(`\\b(${escapeRegex(wordKey)}(?:s|es|ed|d|ing|er|est|ies)?)\\b`, 'gi')
        });
      }
    });

    function decorateSentenceTokens(sentenceStr) {
      let out = escapeHtml(sentenceStr);
      vocabHighlightEntries.forEach(entry => {
        out = out.replace(entry.reg, (match) => `<span class="reading-vocab-token" data-word="${escapeHtml(entry.word)}">${match}</span>`);
      });
      return out;
    }

    // 建立段落清單 (保留整段朗讀 + 新增點擊任一句子單獨朗讀與高亮跟讀)
    const passagesHtml = passages.map((p, idx) => {
      const engText = p.eng || '';
      const chiText = p.chi || '';
      const title = p.section_title || `Paragraph ${idx + 1}`;
      const keySentences = p.key_sentences || [];
      const sentenceObjs = (Array.isArray(p.sentences) && p.sentences.length > 0)
        ? p.sentences.filter(s => s && s.en && String(s.en).trim())
        : splitSentencesFallback(engText);

      const sentencesHtml = sentenceObjs.length > 0
        ? sentenceObjs.map((sObj, sIdx) => {
            const cleanSent = String(sObj.en || '').trim();
            return `<span class="reading-sentence" data-speak-sentence="1" data-sent-en="${escapeHtml(cleanSent)}" data-p-idx="${idx}" data-s-idx="${sIdx}" title="點擊單獨朗讀此句"><i class="sent-speaker-ico" aria-hidden="true">🔊</i>${decorateSentenceTokens(cleanSent)}</span> `;
          }).join('')
        : decorateSentenceTokens(engText).replace(/\n\n/g, '<br><br>');

      return `
        <article class="reading-passage-card">
          <div class="reading-passage-head">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span class="reading-seq">Paragraph ${p.sequence || (idx + 1)}</span>
              <h4 style="margin:0; font-size:15.5px;">${title}</h4>
            </div>
            <button class="btn btn-sm btn-ghost" data-speak-passage="${idx}" title="朗讀此段落">🔊 朗讀此段</button>
          </div>
          <div class="reading-passage-body">
            ${sentencesHtml}
          </div>
          ${chiText ? `
            <div class="reading-translation-box">
              <strong style="color:var(--primary);">🌐 中文對照翻譯：</strong><br>
              <span>${chiText.replace(/\n/g, '<br>')}</span>
            </div>
          ` : ''}
          ${keySentences.length > 0 ? `
            <div class="reading-key-notes-box">
              ${keySentences.map(ks => `
                <div class="reading-key-note-item">
                  <span class="note-tag">🎯 段考考點解析</span>
                  <strong style="color:#1e293b;">${ks.sentence || ''}</strong>
                  ${(ks.note || ks.point) ? `<div style="color:#78350f; font-size:13px; margin-top:2px;">💡 解析：${ks.note || ks.point}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </article>
      `;
    }).join('');

    container.innerHTML = `
      <div class="reading-toolbar glass">
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" id="btn-play-all-passages">🔊 連續朗讀全篇</button>
          <button class="btn btn-ghost btn-sm" id="btn-stop-tts">⏹️ 停止朗讀</button>
          <label class="toolbar-checkbox-label">
            <input type="checkbox" id="chk-toggle-chi" checked>
            <span>顯示中文對照翻譯</span>
          </label>
          <label class="toolbar-checkbox-label">
            <input type="checkbox" id="chk-toggle-notes" checked>
            <span>標註段考考點解析</span>
          </label>
        </div>
        <span class="muted" style="font-size:13px;">💡 提示：點擊<strong>任一句子 (🔊)</strong> 可單句朗讀跟讀；點擊<strong>藍色高亮生字</strong>可發音並彈出「7 大錨點單字卡」！</span>
      </div>
      <div class="reading-passages-list">
        ${passagesHtml}
      </div>
    `;

    // 朗讀與開關事件
    const chiBoxes = container.querySelectorAll('.reading-translation-box');
    const chkChi = document.getElementById('chk-toggle-chi');
    if (chkChi) {
      chkChi.onchange = () => {
        chiBoxes.forEach(box => { box.style.display = chkChi.checked ? 'block' : 'none'; });
      };
    }

    const noteBoxes = container.querySelectorAll('.reading-key-notes-box');
    const chkNotes = document.getElementById('chk-toggle-notes');
    if (chkNotes) {
      chkNotes.onchange = () => {
        noteBoxes.forEach(box => { box.style.display = chkNotes.checked ? 'block' : 'none'; });
      };
    }

    container.querySelectorAll('.reading-sentence').forEach(sentEl => {
      sentEl.onclick = () => {
        const sentEn = sentEl.getAttribute('data-sent-en');
        if (!sentEn) return;
        document.querySelectorAll('.reading-sentence.speaking-active').forEach(el => el.classList.remove('speaking-active'));
        sentEl.classList.add('speaking-active');
        speakText(sentEn, state.ttsSpeed, () => {
          sentEl.classList.remove('speaking-active');
        });
      };
    });

    container.querySelectorAll('[data-speak-passage]').forEach(btn => {
      btn.onclick = () => {
        const pIdx = parseInt(btn.getAttribute('data-speak-passage'), 10);
        if (passages[pIdx] && passages[pIdx].eng) {
          speakText(passages[pIdx].eng);
        }
      };
    });

    const playAllBtn = document.getElementById('btn-play-all-passages');
    if (playAllBtn) {
      playAllBtn.onclick = () => {
        const fullEng = passages.map(p => p.eng).filter(Boolean).join('. ');
        speakText(fullEng);
      };
    }

    const stopBtn = document.getElementById('btn-stop-tts');
    if (stopBtn) {
      stopBtn.onclick = stopAllSpeech;
    }

    // 點擊生字彈出 Tiger 7 大錨點單字卡
    container.querySelectorAll('.reading-vocab-token').forEach(tok => {
      tok.onclick = (e) => {
        e.stopPropagation();
        const wordStr = tok.getAttribute('data-word');
        const v = vocabMap.get((wordStr || tok.textContent).toLowerCase().trim()) || {
          word: tok.textContent,
          chi: '課文核心重點詞彙'
        };
        speakText(v.word);
        openVocabModal(v);
      };
    });
  }

  // --------------------------------------------------------------------------
  // 子面板 2: 7 大錨點單字庫 (Tiger 7 大錨點卡片清單)
  // --------------------------------------------------------------------------
  function renderVocabSubpanel(container, bookId, unitId, vocabs) {
    if (!vocabs || vocabs.length === 0) {
      container.innerHTML = '<div class="glass" style="padding:40px; text-align:center; font-size:15px; color:var(--ink-2);">本單元無獨立單字列表，請參閱課文閱聽或直接進行雙軌測驗。</div>';
      return;
    }

    const vocabCardsHtml = vocabs.map(v => `
      <article class="vocab-anchor-card glass">
        <div class="vocab-card-head">
          <div style="display:flex; align-items:baseline; gap:8px; flex-wrap:wrap;">
            <span class="vocab-card-word">${v.word}</span>
            ${v.pos ? `<span class="vocab-card-pos">${v.pos}</span>` : ''}
          </div>
          <button class="btn btn-sm btn-ghost btn-pronounce-word" data-word="${v.word}">🔊 發音</button>
        </div>
        <div class="vocab-card-chi">${v.chi || ''}</div>
        
        <div class="vocab-card-body">
          ${v.breakdown ? `
            <div class="vocab-detail-row">
              <span class="v-tag">🧩 拆解記憶</span>
              <span>${v.breakdown}</span>
            </div>
          ` : ''}
          ${v.trick ? `
            <div class="vocab-detail-row">
              <span class="v-tag" style="background:#fef3c7; color:#92400e;">💡 諧音/要訣</span>
              <span>${v.trick}</span>
            </div>
          ` : ''}
          ${v.context_eng ? `
            <div class="vocab-detail-row">
              <span class="v-tag" style="background:#ede9fe; color:#5b21b6;">📝 課文例句</span>
              <div>
                <strong>${v.context_eng}</strong>
                ${v.context_chi ? `<div style="color:var(--ink-3); font-size:12.5px; margin-top:2px;">${v.context_chi}</div>` : ''}
              </div>
            </div>
          ` : ''}
          ${v.compare ? `
            <div class="vocab-detail-row">
              <span class="v-tag" style="background:#ffe4e6; color:#be123c;">⚠️ 易混陷阱</span>
              <span>${v.compare}</span>
            </div>
          ` : ''}
        </div>
      </article>
    `).join('');

    container.innerHTML = `
      <div class="section-title" style="margin-bottom:14px;">
        <h3>📇 本單元 7 大記憶錨點核心字彙 (${vocabs.length} 個單字)</h3>
        <span class="muted">含發音拆解、口訣聯想、課文情境例句與考點陷阱</span>
      </div>
      <div class="vocab-cards-grid">
        ${vocabCardsHtml}
      </div>
    `;

    container.querySelectorAll('.btn-pronounce-word').forEach(btn => {
      btn.onclick = () => {
        const w = btn.getAttribute('data-word');
        if (w) speakText(w);
      };
    });
  }

  // --------------------------------------------------------------------------
  // 子面板 3: 文法焦點與例句 (文法規則、公式拆解與雙色對比例句)
  // --------------------------------------------------------------------------
  function renderGrammarSubpanel(container, bookId, unitId, grammars) {
    if (!grammars || grammars.length === 0) {
      container.innerHTML = '<div class="glass" style="padding:40px; text-align:center; font-size:15px; color:var(--ink-2);">本單元未配置文法避坑卡，請參閱課文或進行實戰題庫測驗。</div>';
      return;
    }

    const grammarCardsHtml = grammars.map(g => {
      const title = g.rule_title || g.title || '文法重點歸納';
      const engExp = g.eng_exp || '';
      const chiExp = g.chi_exp || '';
      const examples = g.examples || [];
      const formulaStr = g.formula || '';
      const parsed = (Array.isArray(g.categories) && g.categories.length > 0)
        ? { intro: g.intro || '', categories: g.categories }
        : parseGrammarChiExp(chiExp);
      const pitfalls = Array.isArray(g.pitfalls) ? g.pitfalls : [];

      return `
        <article class="grammar-focus-card glass">
          <div class="grammar-card-head">
            <span class="b-badge" style="background:#ede9fe; color:#5b21b6; font-size:12px;">文法專修</span>
            <h4>${escapeHtml(title)}</h4>
          </div>

          ${formulaStr ? `
            <div class="grammar-formula-banner">
              <div class="grammar-formula-title">📐 必背句型公式積木：</div>
              <div class="grammar-formula-code">${escapeHtml(formulaStr)}</div>
            </div>
          ` : ''}

          ${(parsed.categories.length > 0 || chiExp) ? `
            <div class="grammar-exp-box">
              <strong style="color:var(--ink-1); font-size:14px;">💡 核心觀念分段解析：</strong>
              ${parsed.categories.length > 0 ? `
                ${parsed.intro ? `<p style="margin:6px 0 4px; line-height:1.6; color:var(--ink-2); font-size:14px;">${escapeHtml(parsed.intro)}</p>` : ''}
                <div class="grammar-cat-list">
                  ${parsed.categories.map(cat => `
                    <div class="grammar-cat-row">
                      <div class="grammar-cat-label">${escapeHtml(cat.label || '')}</div>
                      ${(Array.isArray(cat.items) && cat.items.length > 0) ? `
                        <div class="grammar-chips-wrap">
                          ${cat.items.map(chip => `<span class="grammar-chip">${escapeHtml(chip)}</span>`).join('')}
                        </div>
                      ` : ''}
                      ${cat.note ? `<div style="font-size:12.5px; color:#64748b; margin-top:4px;">${escapeHtml(cat.note)}</div>` : ''}
                    </div>
                  `).join('')}
                </div>
              ` : `
                <p style="margin:6px 0 0; line-height:1.7; color:var(--ink-2); font-size:14.5px;">${escapeHtml(chiExp)}</p>
              `}
            </div>
          ` : ''}

          ${pitfalls.length > 0 ? `
            <div class="grammar-pitfalls-box">
              <h5>⚡ 考場避坑對比 (錯 vs 正)：</h5>
              ${pitfalls.map(pf => `
                <div class="grammar-pitfall-row">
                  <span class="gp-wrong">❌ ${escapeHtml(pf.wrong || '')}</span>
                  <span class="gp-right">✅ ${escapeHtml(pf.right || '')}</span>
                  ${pf.tip ? `<span class="gp-tip">💡 ${escapeHtml(pf.tip)}</span>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${engExp ? `
            <div class="grammar-eng-rule">
              <strong>📖 課本英文規則：</strong> ${escapeHtml(engExp)}
            </div>
          ` : ''}

          ${examples.length > 0 ? `
            <div class="grammar-examples-box" style="margin-top:14px;">
              <strong style="color:var(--primary); font-size:13.5px;">🌟 經典正反範例與例句 (點擊 🔊 聆聽標準發音)：</strong>
              <div class="grammar-examples-list" style="margin-top:8px; display:grid; gap:8px;">
                ${examples.map(ex => {
                  const rawStr = typeof ex === 'object' ? (ex.en || '') : String(ex || '');
                  const isMistake = rawStr.includes('❌') && !rawStr.includes('✅') && !rawStr.includes('➔');
                  const cleanSpeech = extractCleanEnglishForSpeech(ex);
                  return `
                    <div class="grammar-ex-item ${isMistake ? 'bad' : 'ok'}">
                      <div class="grammar-ex-main">
                        <span style="flex-shrink:0;">${isMistake ? '🔴' : '🟢'}</span>
                        ${formatGrammarExampleHtml(ex)}
                      </div>
                      ${cleanSpeech ? `
                        <button type="button" class="btn-ex-speak" data-speak-ex="${escapeHtml(cleanSpeech)}" title="朗讀正確英文例句">🔊 朗讀</button>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}
        </article>
      `;
    }).join('');

    container.innerHTML = `
      <div class="section-title" style="margin-bottom:14px;">
        <h3>🔍 本單元文法核心焦點與避坑指南 (${grammars.length} 條規則)</h3>
        <span class="muted">句型公式積木 + 搭配膠囊 + 正反對比 + 例句即時點讀</span>
      </div>
      <div class="grammar-cards-grid">
        ${grammarCardsHtml}
      </div>
    `;

    container.querySelectorAll('.btn-ex-speak').forEach(btn => {
      btn.onclick = () => {
        const text = btn.getAttribute('data-speak-ex');
        if (text) speakText(text, state.ttsSpeed);
      };
    });
  }

  // --------------------------------------------------------------------------
  // 子面板 4: 神探點詞抓錯
  // --------------------------------------------------------------------------
  function renderMistakeSubpanel(container, mistakes) {
    if (!mistakes || mistakes.length === 0) {
      container.innerHTML = '<div class="glass" style="padding:40px; text-align:center; font-size:15px; color:var(--ink-2);">本單元未配置改錯題目，請進行雙軌題庫測驗。</div>';
      return;
    }

    const itemsHtml = mistakes.map((m, idx) => {
      const sentence = m.sentence || '';
      const tokens = sentence.split(/\s+/);
      const targetTokenIdx = m.error_token_index !== undefined ? m.error_token_index : (m.wrong_index !== undefined ? m.wrong_index : -1);

      return `
        <article class="mistake-buster-card glass" id="mb-card-${idx}">
          <div class="mb-head">
            <span class="tag bad">第 ${idx + 1} 關</span>
            <span class="mb-point">考點：<strong>${m.point || '文法偵錯'}</strong></span>
          </div>
          <p class="mb-instruction">🕵️ 點擊句子中<strong>錯誤的單詞</strong>，神探出擊除錯！</p>
          <div class="sentence-tokens-box" data-mb-idx="${idx}">
            ${tokens.map((tok, tIdx) => `
              <button type="button" class="token-chip" data-token-idx="${tIdx}">
                ${tok}
              </button>
            `).join('')}
          </div>
          <div class="mb-feedback-box" id="mb-feed-${idx}" style="display:none;">
            <div class="mb-correct-line">
              <span class="badge-ok">✓ 修正形式：</span>
              <strong style="color:var(--ok); font-size:16px;">${m.correct_text || m.fixed_sentence || m.correction || m.correct_word || ''}</strong>
            </div>
            <p class="mb-exp-text">💡 <strong>神探解析：</strong>${m.explanation || m.reason || ''}</p>
          </div>
        </article>
      `;
    }).join('');

    container.innerHTML = `
      <div class="section-title" style="margin-bottom:14px;">
        <h3>🔍 神探點詞抓錯：點擊即劃線訂正 (${mistakes.length} 道挑戰)</h3>
        <span class="muted">訓練對倒裝、主述一致、副詞字尾與量詞搭配的靈敏直覺</span>
      </div>
      <div class="mistake-busters-list">
        ${itemsHtml}
      </div>
    `;

    // 綁定抓錯互動
    container.querySelectorAll('.sentence-tokens-box').forEach(box => {
      const mbIdx = parseInt(box.getAttribute('data-mb-idx'), 10);
      const m = mistakes[mbIdx];
      const targetIdx = m.error_token_index !== undefined ? m.error_token_index : (m.wrong_index !== undefined ? m.wrong_index : 0);
      const feedBox = document.getElementById(`mb-feed-${mbIdx}`);

      box.querySelectorAll('.token-chip').forEach(btn => {
        btn.onclick = () => {
          const clickedIdx = parseInt(btn.getAttribute('data-token-idx'), 10);
          if (clickedIdx === targetIdx) {
            btn.classList.add('strike');
            if (feedBox) feedBox.style.display = 'block';
            showToast('🎯 抓到錯誤！神探出擊成功！');
          } else {
            btn.classList.add('wrong-pick');
            setTimeout(() => btn.classList.remove('wrong-pick'), 800);
            showToast('這個單字是正確的，再仔細找找看！');
          }
        };
      });
    });
  }

  // ==========================================================================
  // 10. 雙軌測驗核心引擎 (Dual Quiz Engine - 支援題型過濾)
  // ==========================================================================
  function startQuizSession(mode, bookId = null, unitId = null, tier = 'all', filterType = 'all') {
    state.quizMode = mode;
    state.quizIndex = 0;
    state.sessionAnswers = [];
    state.drawerOpen = false;
    state.currentQuizFilter = filterType;

    const isErr = (qid) => state.errorBook.some(e => (typeof e === 'string' ? e : e.id) === qid);

    if (mode === 'braingym') {
      state.quizQuestions = getBrainGymQuestions(tier);
    } else if (mode === 'unit_error') {
      const qList = getQuizzesForUnit(bookId, unitId);
      state.quizQuestions = qList.filter(q => isErr(q.id));
    } else if (mode === 'error_book') {
      const allQ = (window.ENGLISH_DATA && window.ENGLISH_DATA.quizzes) ? window.ENGLISH_DATA.quizzes : [];
      state.quizQuestions = allQ.filter(q => isErr(q.id));
    } else {
      let qList = getQuizzesForUnit(bookId, unitId);
      if (filterType && filterType !== 'all') {
        qList = qList.filter(q => matchQuizType(q, filterType));
      }
      state.quizQuestions = qList;
    }

    if (state.quizQuestions.length === 0) {
      showToast('目前此題型無題目可練習！');
      return;
    }

    state.view = 'quiz';
    render();
  }
  function renderActiveQuizView(container) {
    const q = state.quizQuestions[state.quizIndex];
    if (!q) {
      renderQuizSummaryView(container);
      return;
    }

    const curOk = state.successCounts[q.id] || 0;
    const curBad = state.errorCounts[q.id] || 0;
    const isError = state.errorBook.some(e => (typeof e === 'string' ? e : e.id) === q.id);

    // 抽屜盤按鈕矩陣
    const drawerGridHtml = state.quizQuestions.map((item, idx) => {
      const ok = state.successCounts[item.id] || 0;
      const bad = state.errorCounts[item.id] || 0;
      const net = bad - ok;
      let heatClass = '';
      if (net >= 3) heatClass = 'heat-bad-heavy';
      else if (net >= 2) heatClass = 'heat-bad-mid';
      else if (net >= 1) heatClass = 'heat-bad-light';
      else if (net === 0 && (bad > 0 || ok > 0)) heatClass = 'heat-tie';
      else if (net <= -2) heatClass = 'heat-ok-heavy';
      else if (net <= -1) heatClass = 'heat-ok-light';

      const isCur = idx === state.quizIndex;
      return `
        <button type="button" class="drawer-q-btn ${heatClass} ${isCur ? 'current' : ''}" data-jump-idx="${idx}">
          ${ok > 0 ? `<span class="q-badge-ok">${ok}</span>` : ''}
          ${bad > 0 ? `<span class="q-badge-bad">${bad}</span>` : ''}
          <span class="q-num-center">${idx + 1}</span>
        </button>
      `;
    }).join('');

    const isListenMode = (q.type === 'spelling_listen');
    const isRewrite = (q.type === 'rewrite' || q.type === 'paper_rewrite');
    const options = q.options || [];

    // 解析詳解與錨點單字卡 (支援舊版 3 色詳解與 KET-4D 四維詳解 + extensionStudy)
    const expObj = typeof q.explanation === 'object' && q.explanation !== null ? q.explanation : { point: q.explanation || '文法規則與語境考核' };
    const expPoint = expObj.point || '文法規則與語境考核';
    const expTrap = expObj.trap || '';
    const expNote = expObj.note || '';
    const expPurpose = expObj.examPurpose || '';
    const expCorrectReason = expObj.correctReason || '';
    const expDistractors = expObj.distractorAnalysis || null;
    const expCommonTraps = Array.isArray(expObj.commonTraps)
      ? expObj.commonTraps
      : (typeof expObj.commonTraps === 'string' && expObj.commonTraps ? [expObj.commonTraps] : []);
    const has4DExp = !!(expPurpose || expCorrectReason || expDistractors || expCommonTraps.length > 0);
    const extObj = (q.extensionStudy && typeof q.extensionStudy === 'object') ? q.extensionStudy : null;

    let vocabCard = q.vocab_card;
    if (!vocabCard && isListenMode && window.ENGLISH_DATA && window.ENGLISH_DATA.vocabulary) {
      const found = window.ENGLISH_DATA.vocabulary.find(v => v.word && v.word.toLowerCase() === (q.answer || '').toLowerCase().trim());
      if (found) vocabCard = found;
    }

    const ipaStr = q.ipa || (vocabCard ? vocabCard.ipa : '') || '';

    let expDetailHtml = '';
    if (has4DExp) {
      let distractorItemsHtml = '';
      if (expDistractors && typeof expDistractors === 'object' && !Array.isArray(expDistractors)) {
        distractorItemsHtml += Object.entries(expDistractors).map(([optKey, reason]) => `
          <div class="distractor-item">
            <span class="distractor-key">${escapeHtml(optKey)}</span>
            <span>${escapeHtml(reason)}</span>
          </div>
        `).join('');
      } else if (Array.isArray(expDistractors)) {
        distractorItemsHtml += expDistractors.map((item, dIdx) => `
          <div class="distractor-item">
            <span class="distractor-key">干擾項 ${dIdx + 1}</span>
            <span>${escapeHtml(typeof item === 'string' ? item : JSON.stringify(item))}</span>
          </div>
        `).join('');
      } else if (typeof expDistractors === 'string' && expDistractors) {
        distractorItemsHtml += `<div class="distractor-item"><span>${escapeHtml(expDistractors)}</span></div>`;
      }
      if (expCommonTraps.length > 0) {
        distractorItemsHtml += expCommonTraps.map((trapText, tIdx) => `
          <div class="distractor-item">
            <span class="distractor-key">陷阱 ${tIdx + 1}</span>
            <span>${escapeHtml(trapText)}</span>
          </div>
        `).join('');
      }

      expDetailHtml = `
        <div class="exp-4d-grid">
          <div class="exp-row exp-purpose">
            <div>
              <strong>🎯 命題核心目標：</strong><span>${escapeHtml(expPurpose || expPoint)}</span>
              ${(expPurpose && expPoint && expPoint !== expPurpose) ? `<div class="exp-pill-sub">📌 核心考點：${escapeHtml(expPoint)}</div>` : ''}
            </div>
          </div>
          ${(expCorrectReason || expNote) ? `
            <div class="exp-row exp-correct">
              <div>
                <strong>✅ 正解邏輯推導：</strong><span>${escapeHtml(expCorrectReason || expNote)}</span>
                ${(expCorrectReason && expNote) ? `<div class="exp-pill-sub">💡 考點公式：${escapeHtml(expNote)}</div>` : ''}
              </div>
            </div>
          ` : ''}
          ${(distractorItemsHtml || expTrap) ? `
            <div class="exp-row exp-distractors">
              <div style="width:100%;">
                <strong>🕵️ 逐項迷思排除與避坑指南：</strong>
                ${expTrap ? `<div class="exp-pill-sub">⚠️ 考場陷阱：${escapeHtml(expTrap)}</div>` : ''}
                ${distractorItemsHtml ? `<div class="distractor-list">${distractorItemsHtml}</div>` : ''}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    } else if (!vocabCard) {
      expDetailHtml = `
        <!-- 文法三色結構化詳解 -->
        <div class="structured-exp-box">
          <div class="exp-row exp-concept">
            <strong>🎯 核心考點：</strong><span>${expPoint}</span>
          </div>
          ${expTrap ? `
            <div class="exp-row exp-trap">
              <strong>⚠️ 考場避坑（Rex 當年失分點）：</strong><span>${expTrap}</span>
            </div>
          ` : ''}
          ${expNote ? `
            <div class="exp-row exp-note">
              <strong>💡 官方解題公式：</strong><span>${expNote}</span>
            </div>
          ` : ''}
        </div>
      `;
    }

    let extStudyHtml = '';
    if (extObj && (extObj.synonyms || extObj.grammarCompare || extObj.examVariations)) {
      const synList = Array.isArray(extObj.synonyms)
        ? extObj.synonyms
        : (typeof extObj.synonyms === 'string' && extObj.synonyms.trim() ? [extObj.synonyms.trim()] : []);
      const varList = Array.isArray(extObj.examVariations)
        ? extObj.examVariations
        : (typeof extObj.examVariations === 'string' && extObj.examVariations.trim() ? [extObj.examVariations.trim()] : []);
      extStudyHtml = `
        <details class="ext-study-details">
          <summary>📚 點此展開 KET 延伸學習：同義替換 / 易混對比 / 考題變形 ▼</summary>
          <div class="ext-study-body">
            ${synList.length > 0 ? `
              <div class="ext-syn-row">
                <strong>🔄 同義替換：</strong>
                ${synList.map(s => `<span class="ext-syn-chip">${escapeHtml(s)}</span>`).join('')}
              </div>
            ` : ''}
            ${extObj.grammarCompare ? `
              <div><strong>⚖️ 易混文法對比：</strong><span>${escapeHtml(extObj.grammarCompare)}</span></div>
            ` : ''}
            ${varList.length > 0 ? `
              <div><strong>🧩 考題變形預測：</strong><span>${varList.map(v => escapeHtml(v)).join(' ｜ ')}</span></div>
            ` : ''}
          </div>
        </details>
      `;
    }

    const rawPart = (q.part || '').trim();
    const rawPartTitle = (q.part_title || '大題說明').trim();
    const partBannerText = !rawPart
      ? rawPartTitle
      : (rawPartTitle.toLowerCase().startsWith(rawPart.toLowerCase()) || /^part\s+[ivx0-9]/i.test(rawPartTitle))
        ? rawPartTitle
        : `${rawPart}：${rawPartTitle}`;

    container.innerHTML = `
      <div class="view active-quiz-view">
        <!-- 頂部題號列與抽屜開關 -->
        <div class="quiz-topbar">
          <button class="btn btn-ghost btn-sm" id="btn-exit-quiz">⬅️ 結束並返回</button>
          <button type="button" class="count-badge-btn" id="btn-toggle-drawer">
            第 ${state.quizIndex + 1} / ${state.quizQuestions.length} 題 ${state.drawerOpen ? '▲ 收起抽屜盤' : '▼ 快速跳題抽屜盤'}
          </button>
          <span class="tag ${isError ? 'bad' : 'ok'}">${isError ? '🔥 曾有錯題紀錄' : '✨ 熟練良好'}</span>
        </div>

        <!-- 題號抽屜盤 (展開時呈現) -->
        ${state.drawerOpen ? `
          <div class="quiz-grid-drawer">
            <div class="grid-drawer-head">
              <div class="drawer-legend-bar">
                <span>圖例：</span>
                <span class="leg-item"><i class="leg-dot ok"></i> 左上綠字(答對次數)</span>
                <span class="leg-item"><i class="leg-dot bad"></i> 右上紅字(答錯次數)</span>
                <span class="leg-item"><i class="leg-dot red-shade"></i> 底色越紅代表錯越多</span>
              </div>
              <button class="btn-close-drawer" id="btn-close-drawer">✕</button>
            </div>
            <div class="drawer-q-grid">
              ${drawerGridHtml}
            </div>
          </div>
        ` : ''}

        <!-- 題目卡片 -->
        <div class="quiz-card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <span class="tag pri">${getQuizTypeBadgeLabel(q)}</span>
            <span style="font-size:13px; color:var(--ink-3);">難度：${q.difficulty || '★★★☆☆'}</span>
          </div>

                    <!-- 岱崙實體真卷大題指南橫幅 -->
          ${(q.part_instructions || q.sentence_form || q.word_bank) ? `
            <div class="exam-section-banner">
              <div class="es-badge">📄 ${escapeHtml(partBannerText)}</div>
              ${q.part_instructions ? `
                <blockquote class="es-instructions">
                  <strong>Directions:</strong> ${escapeHtml(q.part_instructions)}
                  ${q.tense_hint ? `<div class="es-tense-warning">⚠️ ${escapeHtml(q.tense_hint)}</div>` : ''}
                </blockquote>
              ` : ''}
              ${q.word_bank ? `
                <div class="es-row">
                  <span class="es-tag">📌 提示單字庫：</span>
                  <code>${escapeHtml(q.word_bank)}</code>
                </div>
              ` : ''}
              ${q.sentence_form ? `
                <div class="es-row es-formula-box">
                  <span class="es-tag">📐 官方句型公式：</span>
                  ${formatFormulaBlocks(q.sentence_form)}
                </div>
              ` : ''}
            </div>
          ` : ''}

          <!-- 單字盲聽播放器 (若為盲聽題) -->
          ${isListenMode ? `
            <div class="spelling-listen-player">
              <div style="display:flex; gap:10px;">
                <button class="btn-listen-audio" id="btn-play-word">🔊 朗讀單字 (1.0x)</button>
                <button class="btn-listen-slow" id="btn-play-word-slow">🐢 慢速精聽 (0.8x)</button>
              </div>
              <div style="font-size:14.5px; color:#475569; margin-top:4px;">
                音標：<code>${escapeHtml(ipaStr) || '請聽音拼寫'}</code> ｜ 請在紙上寫出單字拼寫再對答案！
              </div>
            </div>
          ` : ''}

          <!-- 題幹 (結構化排版) -->
          <div class="q-stem-container">
            ${renderStructuredStemHtml(q)}
          </div>

          <!-- iPad 互動選項 (四選一 或 可數/不可數二選一) -->
          ${options.length > 0 ? `
            ${q.is_count_noncount ? `
              <div class="count-noncount-grid" id="quiz-options-group">
                ${options.map((opt, oi) => {
                  const isCount = opt.includes('Count') && !opt.includes('Noncount');
                  return `
                    <button type="button" class="interactive-opt-btn ${isCount ? 'btn-count-card' : 'btn-noncount-card'}" data-opt-idx="${oi}">
                      <span class="cn-icon">${isCount ? '🍎' : '💧'}</span>
                      <span>${opt}</span>
                      <span class="cn-sub">${isCount ? '（可個別數出個數）' : '（液體/粉末/塊狀不可數）'}</span>
                    </button>
                  `;
                }).join('')}
              </div>
            ` : `
              <div class="quiz-interactive-options" id="quiz-options-group">
                ${options.map((opt, oi) => `
                  <button class="interactive-opt-btn" data-opt-idx="${oi}">
                    (${String.fromCharCode(65 + oi)}) ${opt}
                  </button>
                `).join('')}
              </div>
            `}
          ` : ''}

          <!-- 紙筆手寫作答提示框 (當無互動選項時呈現) -->
          ${options.length === 0 ? `
            <div class="paper-write-guide-box">
              ${isListenMode
                ? '✍️ 【紙筆聽寫訓練】請準備紙筆，點擊上方播放鍵，在紙上拼寫完整單字（留意靜音字母、雙母音與單複數），寫完後再點擊「看詳解與對答案」！'
                : '✍️ 【仿真考卷手寫實戰】請先在紙上完整寫出你的英文句子或答案（檢查動詞時態、介系詞、冠詞與句尾標點），寫完後再按下方「看詳解與對答案」！'}
            </div>
          ` : ''}

          <!-- 紙筆翻牌核對正解按鈕 -->
          <div style="margin:16px 0 20px;">
            <button class="btn btn-primary btn-block btn-lg" id="btn-reveal-answer">
              👁️ 看詳解與對答案
            </button>
          </div>

          <!-- 詳解抽屜 (翻牌後展開) -->
          <div id="quiz-answer-drawer" style="display:none; animation:rise .25s ease;">
            <div style="padding:16px 20px; border-radius:14px; background:#ecfdf5; border:1.5px solid #a7f3d0; margin-bottom:14px;">
              <span style="font-size:13px; font-weight:800; color:#047857;">🎯 標準正解：</span>
              <div style="font-size:22px; font-weight:900; color:#065f46; margin-top:2px;">
                ${q.answer || ''}
                <button class="btn btn-sm btn-ghost" id="btn-speak-ans" style="margin-left:8px;">🔊 聽發音</button>
              </div>
            </div>

            <!-- 單字 7 大錨點深度記憶卡 (若有單字卡) -->
            ${vocabCard ? `
              <div class="vocab-answer-anchor-card">
                <div class="va-header">
                  <div class="va-word-row">
                    <span class="va-word">${vocabCard.word}</span>
                    ${vocabCard.ipa ? `<span class="va-ipa">${vocabCard.ipa}</span>` : ''}
                    ${vocabCard.pos ? `<span class="va-pos">${vocabCard.pos}</span>` : ''}
                  </div>
                  <div class="va-chi">${vocabCard.chi || ''}</div>
                </div>
                <div class="va-anchors-grid">
                  ${vocabCard.breakdown ? `
                    <div class="va-row">
                      <span class="va-badge">🧩 字根拆解</span>
                      <span class="va-text">${vocabCard.breakdown}</span>
                    </div>
                  ` : ''}
                  ${vocabCard.trick ? `
                    <div class="va-row">
                      <span class="va-badge" style="background:#fef3c7; color:#92400e;">💡 記憶要訣</span>
                      <span class="va-text">${vocabCard.trick}</span>
                    </div>
                  ` : ''}
                  ${vocabCard.collocation ? `
                    <div class="va-row">
                      <span class="va-badge" style="background:#ede9fe; color:#5b21b6;">🔗 搭配用語</span>
                      <span class="va-text"><code>${vocabCard.collocation}</code></span>
                    </div>
                  ` : ''}
                  ${vocabCard.context_eng ? `
                    <div class="va-row">
                      <span class="va-badge" style="background:#d1fae5; color:#065f46;">📖 實用例句</span>
                      <span class="va-text">${vocabCard.context_eng}${vocabCard.context_chi ? `<br><small class="muted">${vocabCard.context_chi}</small>` : ''}</span>
                    </div>
                  ` : ''}
                  ${(expTrap || vocabCard.compare) ? `
                    <div class="va-row">
                      <span class="va-badge" style="background:#ffe4e6; color:#be123c;">⚠️ 避坑提醒</span>
                      <span class="va-text">${expTrap || vocabCard.compare}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : ''}
            ${expDetailHtml}
            ${extStudyHtml}

            ${options.length === 0 ? `
              <div class="self-check-rubric-box">
                <strong>✅ 紙筆批改自檢清單（確認以下幾點再打分）：</strong>
                <ul class="self-check-list">
                  ${(Array.isArray(q.self_check) && q.self_check.length > 0
                    ? q.self_check
                    : (isListenMode
                      ? ['核對每一個母音與雙子音順序是否完全一致', '確認字首是否誤寫大寫，或漏掉靜音字母 e / 複數 -s']
                      : ['檢查動詞時態是否與題目問句一致（現在式 / 過去式 / 助動詞）', '檢查介系詞搭配與動名詞 (V-ing) 字尾變化', '檢查句首大寫、冠詞 (a/an/the) 與句尾標點符號'])
                  ).map(chk => `<li>${escapeHtml(chk)}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <!-- 三態打分按鈕 (👍 / ⏳ / ❌) -->
            <div style="margin-top:20px; text-align:center;">
              <p style="font-weight:800; color:var(--ink-2); margin-bottom:10px;">核對你在紙上的作答結果：</p>
              <div class="fb-row">
                <button class="fb ok" data-rate="ok">
                  <span class="emo">👍</span>
                  <span>我算對了</span>
                  <small>熟練掌握</small>
                </button>
                <button class="fb slow" data-rate="slow">
                  <span class="emo">⏳</span>
                  <span>想很久</span>
                  <small>猶豫未熟</small>
                </button>
                <button class="fb bad" data-rate="bad">
                  <span class="emo">❌</span>
                  <span>算錯了</span>
                  <small>記入錯題本</small>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // 抽屜盤展開與收起
    const drawerBtn = document.getElementById('btn-toggle-drawer');
    if (drawerBtn) {
      drawerBtn.onclick = () => {
        state.drawerOpen = !state.drawerOpen;
        renderActiveQuizView(container);
      };
    }
    const closeDrawerBtn = document.getElementById('btn-close-drawer');
    if (closeDrawerBtn) {
      closeDrawerBtn.onclick = () => {
        state.drawerOpen = false;
        renderActiveQuizView(container);
      };
    }

    container.querySelectorAll('[data-jump-idx]').forEach(btn => {
      btn.onclick = () => {
        state.quizIndex = parseInt(btn.getAttribute('data-jump-idx'), 10);
        state.drawerOpen = false;
        renderActiveQuizView(container);
      };
    });

    // 盲聽題自動報題
    if (isListenMode && q.answer) {
      speakText(q.answer, state.ttsSpeed);
      const btnPlayWord = document.getElementById('btn-play-word');
      if (btnPlayWord) btnPlayWord.onclick = () => speakText(q.answer, 1.0);
      const btnPlaySlow = document.getElementById('btn-play-word-slow');
      if (btnPlaySlow) btnPlaySlow.onclick = () => speakText(q.answer, 0.8);
    }

    // 翻牌對答案
    const revealBtn = document.getElementById('btn-reveal-answer');
    const ansDrawer = document.getElementById('quiz-answer-drawer');
    if (revealBtn && ansDrawer) {
      revealBtn.onclick = () => {
        ansDrawer.style.display = 'block';
        revealBtn.style.display = 'none';
      };
    }

    const speakAnsBtn = document.getElementById('btn-speak-ans');
    if (speakAnsBtn) {
      speakAnsBtn.onclick = () => speakText(q.answer);
    }

    container.querySelectorAll('[data-speak-stem]').forEach(btn => {
      btn.onclick = () => {
        const txt = btn.getAttribute('data-speak-stem');
        if (txt) speakText(txt, state.ttsSpeed);
      };
    });

    // 互動點選選項
    container.querySelectorAll('[data-opt-idx]').forEach(btn => {
      btn.onclick = () => {
        if (ansDrawer) ansDrawer.style.display = 'block';
        if (revealBtn) revealBtn.style.display = 'none';
        const oi = parseInt(btn.getAttribute('data-opt-idx'), 10);
        const optText = options[oi];
        const isRight = (optText === q.answer || optText.startsWith(q.answer));
        if (isRight) {
          btn.classList.add('correct');
        } else {
          btn.classList.add('wrong');
        }
      };
    });

    // 三態回饋自評 (👍 / ⏳ / ❌)
    container.querySelectorAll('[data-rate]').forEach(btn => {
      btn.onclick = () => {
        const rate = btn.getAttribute('data-rate');
        recordAnswerResult(q, rate);
        state.quizIndex++;
        renderActiveQuizView(container);
      };
    });

    const exitBtn = document.getElementById('btn-exit-quiz');
    if (exitBtn) {
      exitBtn.onclick = () => {
        if (confirm('確定要結束本次測驗練習嗎？')) {
          state.view = state.currentUnitId ? 'unit_hub' : 'dashboard';
          render();
        }
      };
    }
  }

  function recordAnswerResult(question, rate, userPick = null) {
    const qId = question.id;
    const isOk = rate === 'ok';
    const isErrObj = (e) => (typeof e === 'string' ? e === qId : e.id === qId);

    if (rate === 'ok') {
      state.successCounts[qId] = (state.successCounts[qId] || 0) + 1;
      state.errorBook = state.errorBook.filter(e => !isErrObj(e));
    } else if (rate === 'slow') {
      state.slowCounts[qId] = (state.slowCounts[qId] || 0) + 1;
      if (!state.errorBook.some(isErrObj)) {
        state.errorBook.push({ id: qId, question: question.question, rate, timestamp: Date.now() });
      }
    } else {
      state.errorCounts[qId] = (state.errorCounts[qId] || 0) + 1;
      if (!state.errorBook.some(isErrObj)) {
        state.errorBook.push({ id: qId, question: question.question, rate, timestamp: Date.now() });
      }
    }
    saveState(true);

    // 非同步記錄詳細作答日誌 Log 至雲端
    pushAnswerLog({
      qid: qId,
      bookId: state.currentBookId,
      unitId: state.currentUnitId,
      type: question.type || 'unknown',
      rate,
      isCorrect: isOk,
      userPick,
      timestamp: Date.now()
    }).catch(() => {});
  }

  function renderQuizSummaryView(container) {
    container.innerHTML = `
      <div class="view result glass" style="padding:48px 32px; text-align:center;">
        <span style="font-size:64px;">🏆</span>
        <h2 style="font-size:28px; font-weight:900; margin:12px 0;">恭喜完成本輪特訓！</h2>
        <p class="muted" style="font-size:16px;">所有答題紀錄已自動更新至學習進度與專屬錯題本。</p>
        <div style="display:flex; justify-content:center; gap:12px; margin-top:24px;">
          <button class="btn btn-primary" id="btn-summary-done">返回單元主頁</button>
          <button class="btn btn-ghost" id="btn-summary-home">回首頁總覽</button>
        </div>
      </div>
    `;
    document.getElementById('btn-summary-done').onclick = () => {
      state.view = state.currentUnitId ? 'unit_hub' : 'dashboard';
      render();
    };
    document.getElementById('btn-summary-home').onclick = () => {
      state.view = 'dashboard';
      render();
    };
  }

  // ==========================================================================
  // 11. 錯題本視圖 (Error Book View)
  // ==========================================================================
  function renderErrorBookView(container) {
    const allQ = (window.ENGLISH_DATA && window.ENGLISH_DATA.quizzes) ? window.ENGLISH_DATA.quizzes : [];
    const qMap = new Map();
    allQ.forEach(q => qMap.set(q.id, q));

    const errList = state.errorBook.map(id => qMap.get(id) || { id, question: `錯題代碼：${id}`, answer: '請參考詳解' });

    container.innerHTML = `
      <div class="view error-book-view">
        <nav class="breadcrumb-bar">
          <button class="crumb-link" id="btn-crumb-home">🏠 首頁課本總覽</button>
          <span class="crumb-sep">›</span>
          <span class="crumb-curr">🔥 終身錯題本與弱點消滅</span>
        </nav>

        <section class="glass hero" style="grid-template-columns:1fr; margin-bottom:20px; padding:22px 28px;">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px;">
            <div>
              <h2>📕 終身錯題本 (共 ${errList.length} 題弱點待消滅)</h2>
              <p>自動歸檔練習時標註 ❌ 答錯 與 ⏳ 想很久的題目，答對即可徹底消滅！</p>
            </div>
            <div style="display:flex; gap:8px;">
              <button class="btn btn-primary" id="btn-kill-all-errors" ${errList.length === 0 ? 'disabled' : ''}>⚡ 啟動錯題消滅戰</button>
              <button class="btn btn-ghost" id="btn-preload-tea-errors">🔥 匯入岱崙 W2~W7 真實錯題</button>
              <button class="btn btn-ghost" id="btn-print-error-book">🖨️ 印出專屬 A4 錯題卷</button>
            </div>
          </div>
        </section>

        <div class="err-list">
          ${errList.length === 0 ? `
            <div class="empty glass">
              <span class="emo">🎉</span>
              <h3>太棒了！目前沒有任何待消滅錯題！</h3>
            </div>
          ` : errList.map((q, idx) => `
            <div class="err-item">
              <div>
                <div class="q-mini">${idx + 1}. ${q.question || ''}</div>
                <div class="meta">
                  <span class="tag bad">正解：${q.answer || ''}</span>
                  <span class="tag pri">錯次：${state.errorCounts[q.id] || 1} 次</span>
                </div>
              </div>
              <div>
                <button class="btn-remove-err" data-del-err="${q.id}">✅ 克服</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('btn-crumb-home').onclick = () => {
      state.view = 'dashboard';
      render();
    };

    container.querySelectorAll('[data-del-err]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-del-err');
        state.errorBook = state.errorBook.filter(x => x !== id);
        saveState();
        renderErrorBookView(container);
      };
    });

    document.getElementById('btn-kill-all-errors').onclick = () => {
      startQuizSession('error_book');
    };

    document.getElementById('btn-preload-tea-errors').onclick = () => {
      let added = 0;
      if (window.ENGLISH_DATA) {
        const teaQ = window.ENGLISH_DATA.quizzes.filter(q => q.book_id === 'tea_midterm');
        teaQ.forEach(q => {
          if (!state.errorBook.includes(q.id)) {
            state.errorBook.push(q.id);
            state.errorCounts[q.id] = 1;
            added++;
          }
        });
      }
      saveState();
      showToast(`已成功匯入 ${added} 道岱崙小考真實失分題！`);
      renderErrorBookView(container);
    };

    document.getElementById('btn-print-error-book').onclick = () => {
      state.printConfig.printType = 'errorbook';
      state.view = 'print';
      render();
    };
  }

  // ==========================================================================
  // 12. A4 出卷中心 (Print Center View)
  // ==========================================================================
  function renderPrintView(container) {
    const curUser = getCurrentUserObj();

    container.innerHTML = `
      <div class="view print-view">
        <nav class="breadcrumb-bar no-print">
          <button class="crumb-link" id="btn-crumb-home">🏠 首頁課本總覽</button>
          <span class="crumb-sep">›</span>
          <span class="crumb-curr">🖨️ A4 實體考卷即時排版與出卷</span>
        </nav>

        <div class="print-setup">
          <!-- 出卷設定側欄 -->
          <div class="setup-panel no-print">
            <h3>出卷設定</h3>
            <div class="field">
              <label>考卷類型：</label>
              <select id="select-print-type" class="custom-select" style="width:100%; padding:9px; border-radius:10px; border:1.5px solid var(--line); font-weight:700;">
                <option value="unit_custom" ${state.printConfig.printType === 'unit_custom' ? 'selected' : ''}>📑 本單元專屬考卷 (聽寫 + 手寫實戰 + 選擇)</option>
                <option value="quiz_original" ${state.printConfig.printType === 'quiz_original' ? 'selected' : ''}>📄 岱崙美語歷史考券 1:1 復原重測卷 (Week 2~7)</option>
                <option value="contrast" ${state.printConfig.printType === 'contrast' ? 'selected' : ''}>📝 考券紅黑批改對照卷 (學生原答 + 老師批改)</option>
                <option value="quiz_variant" ${state.printConfig.printType === 'quiz_variant' ? 'selected' : ''}>🎲 AI 變式狙擊模擬卷 (相同考點動態抽換)</option>
                <option value="spelling" ${state.printConfig.printType === 'spelling' ? 'selected' : ''}>🔤 Spelling Bee 單字聽寫專用卷</option>
                <option value="errorbook" ${state.printConfig.printType === 'errorbook' ? 'selected' : ''}>📕 個人專屬弱點錯題消滅卷</option>
              </select>
            </div>

            <div class="field">
              <label>出卷題數：</label>
              <select id="select-print-count" class="custom-select" style="width:100%; padding:9px; border-radius:10px; border:1.5px solid var(--line); font-weight:700;">
                <option value="15">15 題 (精簡卷)</option>
                <option value="20" selected>20 題 (標準段考卷)</option>
                <option value="30">30 題 (全真總模考)</option>
              </select>
            </div>

            <div class="field">
              <label>解答標記：</label>
              <select id="select-print-mode" class="custom-select" style="width:100%; padding:9px; border-radius:10px; border:1.5px solid var(--line); font-weight:700;">
                <option value="student" selected>學生作答卷 (留白寫答案)</option>
                <option value="teacher">教師/家長解答卷 (標註紅字正解)</option>
              </select>
            </div>

            <div style="display:grid; gap:10px; margin-top:20px;">
              <button class="btn btn-primary" id="btn-trigger-print">🖨️ 立即列印 A4 考卷</button>
              <button class="btn btn-ghost" id="btn-re-render-preview">🔄 重新排版預覽</button>
            </div>
          </div>

          <!-- 考卷預覽畫布 -->
          <div class="preview-wrap">
            <div id="print-sheet-paper" class="paper a4-exam-sheet">
              <!-- 動態渲染 A4 紙張內容 -->
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-crumb-home').onclick = () => {
      state.view = 'dashboard';
      render();
    };

    const paperEl = document.getElementById('print-sheet-paper');
    renderA4PaperContent(paperEl);

    document.getElementById('btn-re-render-preview').onclick = () => {
      state.printConfig.printType = document.getElementById('select-print-type').value;
      state.printConfig.count = parseInt(document.getElementById('select-print-count').value, 10);
      state.printConfig.answerMode = document.getElementById('select-print-mode').value;
      renderA4PaperContent(paperEl);
    };

    document.getElementById('btn-trigger-print').onclick = () => {
      window.print();
    };
  }

  function renderA4PaperContent(sheetEl) {
    if (!sheetEl) return;
    const type = state.printConfig.printType;
    const isTeacher = (state.printConfig.answerMode === 'teacher');
    const isContrast = (type === 'contrast');
    const curUser = getCurrentUserObj();
    const today = new Date().toLocaleDateString('zh-TW');

    let qrSvg = '';
    try {
      if (typeof qrcode !== 'undefined') {
        const qr = qrcode(0, 'M');
        qr.addData(window.location.href);
        qr.make();
        qrSvg = qr.createSvgTag({ scalable: true });
      }
    } catch (e) {}

    if (type === 'unit_custom') {
      const bMeta = BOOK_META[state.printConfig.bookId] || BOOK_META['tea_midterm'];
      const uList = getUnitsForBook(bMeta.id);
      const uMeta = uList.find(u => u.id === state.printConfig.unitId) || uList[0];
      const uQuizzes = uMeta ? getQuizzesForUnit(bMeta.id, uMeta.id) : [];
      const uVocabs = uMeta ? getVocabsForUnit(bMeta.id, uMeta.id) : [];
      const pListen = uQuizzes.filter(q => matchQuizType(q, 'vocab'));
      const pHand = uQuizzes.filter(q => matchQuizType(q, 'handwrite'));
      const pChoice = uQuizzes.filter(q => !matchQuizType(q, 'vocab') && !matchQuizType(q, 'handwrite'));
      const dictItems = pListen.length > 0
        ? pListen.map(q => ({ zh: (q.vocab_card && q.vocab_card.chi) || q.question, ans: q.answer }))
        : uVocabs.map(v => ({ zh: v.chi || v.meaning || '', ans: v.word }));

      sheetEl.innerHTML = `
        <div class="paper-head">
          <div>
            <h2>${escapeHtml(bMeta.shortName)} — ${escapeHtml(uMeta ? uMeta.title : '單元實戰卷')}</h2>
            <div class="sub">命題日期：${today} ${isTeacher ? '【教師解答版】' : '【學生紙筆作答版】'} ｜ 仿 3C 實戰手寫架構</div>
            <div class="paper-fields">
              <span>班級：____________</span>
              <span>學員姓名：<b>${escapeHtml(curUser.name)}</b></span>
              <span>得分：______ / 100</span>
            </div>
          </div>
          <div class="paper-qr">
            ${qrSvg}
            <div>掃碼對答案</div>
          </div>
        </div>

        ${dictItems.length > 0 ? `
          <div style="font-weight:900; margin:6mm 0 3mm; border-bottom:1.5px solid #000; padding-bottom:1mm;">
            Part I. Listen and Write 單字聽寫 (${dictItems.length} 題)
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:3mm 10mm;">
            ${dictItems.slice(0, 20).map((item, i) => `
              <div style="font-size:11.5pt; padding:2mm 0; border-bottom:1px dotted #ccc;">
                ${i + 1}. ${escapeHtml(item.zh)}：${isTeacher ? `<strong style="color:#dc2626;">${escapeHtml(item.ans)}</strong>` : '__________________'}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${pHand.length > 0 ? `
          <div style="font-weight:900; margin:7mm 0 3mm; border-bottom:1.5px solid #000; padding-bottom:1mm;">
            Part II. Grammar & Writing 手寫造句與改寫實戰 (${pHand.length} 題)
          </div>
          <div>
            ${pHand.slice(0, 12).map((q, i) => `
              <div class="pq" style="margin-bottom:4mm;">
                ${q.sentence_form ? `<div style="font-size:10pt; color:#475569; margin-bottom:1mm;">Formula: <code>${escapeHtml(q.sentence_form)}</code></div>` : ''}
                <div><strong>${i + 1}.</strong> ${escapeHtml(q.question)}</div>
                ${isTeacher
                  ? `<div style="color:#dc2626; font-weight:bold; margin-top:1.5mm;">正解：${escapeHtml(q.answer)}</div>`
                  : `<div style="height:22px; border-bottom:1px solid #333; margin-top:3mm;"></div>`}
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${pChoice.length > 0 ? `
          <div style="font-weight:900; margin:7mm 0 3mm; border-bottom:1.5px solid #000; padding-bottom:1mm;">
            Part III. Reading & Grammar Usage 觀念選擇 (${pChoice.length} 題)
          </div>
          <div>
            ${pChoice.slice(0, 12).map((q, i) => `
              <div class="pq" style="margin-bottom:3mm;">
                <div>( &nbsp;&nbsp; ) <strong>${i + 1}.</strong> ${escapeHtml(q.question)}</div>
                ${Array.isArray(q.options) && q.options.length > 0 ? `
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:1mm 6mm; margin-top:1mm; font-size:10.5pt;">
                    ${q.options.map((o, oi) => `<span>(${String.fromCharCode(65 + oi)}) ${escapeHtml(o)}</span>`).join('')}
                  </div>
                ` : ''}
                ${isTeacher ? `<div style="color:#dc2626; font-weight:bold; font-size:10.5pt;">正解：${escapeHtml(q.answer)}</div>` : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}
      `;
      return;
    }

    // A4 考券標頭
    let title = '國小六年級 岱崙美語 3C Quiz 歷史真題 1:1 復原評量卷 (Week 2~7)';
    if (type === 'quiz_variant') title = '國小六年級英語 ｜ AI 變式狙擊模擬卷 (相同文法全新情境)';
    else if (type === 'spelling') title = '國小六年級英語 ｜ Spelling Bee 單字聽寫專用試卷';
    else if (type === 'errorbook') title = `國小六年級英語 ｜ 【${curUser.name}】個人專屬弱點錯題消滅卷`;

    sheetEl.innerHTML = `
      <div class="paper-head">
        <div>
          <h2>${title}</h2>
          <div class="sub">命題範圍：六上期中考全真題庫 ｜ 命題日期：${today} ${isTeacher ? '【教師解答版】' : ''}</div>
          <div class="paper-fields">
            <span>學校/班級：____________</span>
            <span>學員姓名：<b>${curUser.name}</b></span>
            <span>座號：______</span>
            <span>得分：______ / 100</span>
          </div>
        </div>
        <div class="paper-qr">
          ${qrSvg}
          <div>掃碼對答案</div>
        </div>
      </div>

      <!-- Part I: 單字聽寫 -->
      <div style="font-weight:900; margin:8mm 0 3mm; border-bottom:1.5px solid #000; padding-bottom:1mm;">
        Part I. Spelling 核心單字聽寫 (共 20 分)
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:3mm 10mm;">
        ${[
          { zh: '楔子 (三角木) [W2]', ans: 'wedge' },
          { zh: '小刀 [W2]', ans: 'knife' },
          { zh: '山脈 [W2]', ans: 'mountain' },
          { zh: '輪椅 [W2]', ans: 'wheelchair' },
          { zh: '熔爐 [W4]', ans: 'furnace' },
          { zh: '眼鏡鏡框 [W4]', ans: 'frames' },
          { zh: '花蜜 [W6]', ans: 'nectar' },
          { zh: '花瓣 [W6]', ans: 'petals' },
          { zh: '官方的 [W6]', ans: 'official' },
          { zh: '政府 [W6]', ans: 'government' }
        ].map((item, i) => `
          <div style="font-size:12pt; padding:2mm 0; border-bottom:1px dotted #ccc;">
            ${i + 1}. ${item.zh}：${isTeacher || isContrast ? `<strong style="color:#dc2626;">${item.ans}</strong>` : '____________________'}
          </div>
        `).join('')}
      </div>

      <!-- Part II: 倒裝附和句 -->
      <div style="font-weight:900; margin:8mm 0 3mm; border-bottom:1.5px solid #000; padding-bottom:1mm;">
        Part II. Grammar 3 (U13) 倒裝附和句長句改寫 (共 24 分)
      </div>
      <div>
        ${[
          { q: '[W2] Ryan, Michael - 95% on quiz / too', a: 'Ryan got 95% on his quiz, and Michael did, too.' },
          { q: '[W2] Olivia, Penny - 100% on quiz / so', a: 'Olivia got 100% on her quiz, and so did Penny.' },
          { q: '[W7] Roger, Sean – see new Iron Man movie tomorrow / so', a: 'Roger will see the new Iron Man movie tomorrow, and so will Sean.' },
          { q: '[W7] penguins, ostriches – can\'t fly / neither', a: 'Penguins can\'t fly, and neither can ostriches.' }
        ].map((item, i) => `
          <div class="pq">
            <div><strong>${i + 1}.</strong> Prompt: <strong>[${item.q}]</strong></div>
            ${isTeacher || isContrast ? `
              <div style="color:#dc2626; font-weight:bold; margin-top:2mm;">正解：${item.a}</div>
            ` : `
              <div style="height:24px; border-bottom:1px solid #333; margin-top:4mm;"></div>
            `}
          </div>
        `).join('')}
      </div>

      <!-- Part III: 三級副詞長句合成 -->
      <div style="font-weight:900; margin:8mm 0 3mm; border-bottom:1.5px solid #000; padding-bottom:1mm;">
        Part III. Grammar 3 (U14) 副詞三級比較長句合成 (共 36 分)
      </div>
      <div>
        ${[
          { q: '[W4] How fast do they run? (person, dog & lion)', a: 'A person runs fast, a dog runs faster than a person, but a lion runs the fastest.' },
          { q: '[W5] How far can they jump? (frog, rabbit & kangaroo)', a: 'A frog can jump far, a rabbit can jump farther than a frog, but a kangaroo can jump the farthest.' },
          { q: '[W7] How well did they do their homework? (Hana, Ingrid & Jeremy)', a: 'Hana did her homework well, Ingrid did her homework better than Hana, but Jeremy did his homework the best.' },
          { q: '[W7] How beautifully do they sing? (Beth, Vicky & Anne)', a: 'Beth sings beautifully, Vicky sings more beautifully than Beth, but Anne sings the most beautifully.' }
        ].map((item, i) => `
          <div class="pq">
            <div><strong>${i + 1}.</strong> Prompt: <strong>[${item.q}]</strong></div>
            ${isTeacher || isContrast ? `
              <div style="color:#dc2626; font-weight:bold; margin-top:2mm;">正解：${item.a}</div>
            ` : `
              <div style="height:24px; border-bottom:1px solid #333; margin-top:4mm;"></div>
            `}
          </div>
        `).join('')}
      </div>

      <!-- Part IV: 14處抓錯題 -->
      <div style="font-weight:900; margin:8mm 0 3mm; border-bottom:1.5px solid #000; padding-bottom:1mm;">
        Part IV. Week 6《If I Had 3000 Dollars》挑錯與改寫 (共 20 分)
      </div>
      <div style="font-size:12pt; line-height:1.75; padding:3mm 0;">
        ${isTeacher || isContrast ? `
          If I <strong style="color:#dc2626;">had</strong> 3000 dollars, I would do three things. First, I love sports, so I would go <strong style="color:#dc2626;">to</strong> a baseball game <strong style="color:#dc2626;">with</strong> my sister. Next, I would <strong style="color:#dc2626;">buy</strong> a new bike <strong style="color:#dc2626;">for</strong> my brother. His bike is very old, and he <strong style="color:#dc2626;">needs</strong> a new <strong style="color:#dc2626;">one</strong>. Finally, I would spend some money <strong style="color:#dc2626;">on</strong> myself. I would buy a new computer, a watch, and some video games. Those things would <strong style="color:#dc2626;">cost</strong> me about 1500 dollars. With <strong style="color:#dc2626;">the</strong> rest of the money, I would put it in the bank. Wouldn't it <strong style="color:#dc2626;">be</strong> great to have 3000 dollars?
        ` : `
          請在下列短文中圈出 14 個錯誤並於上方訂正：<br>
          If I <u>have</u> 3000 dollars, I would do three things. First, I love sports, so I would <u>go a baseball game</u> <u>to</u> my sister. Next, I would <u>bought</u> a new bike <u>to</u> my brother. His bike is very old, and he <u>need</u> a new <u>it</u>. Finally, I would spend some money <u>in</u> myself. I would <u>by</u> a new computer, a watch, and some video <u>game</u>. Those things would <u>spend</u> me about 1500 dollars. <u>With rest</u> of the money, I would put you in the bank. Wouldn't <u>it great</u> to have 3000 dollars?
        `}
      </div>
    `;
  }

  // ==========================================================================
  // 13. 彈窗模組：Tiger 7 大錨點單字卡、人員管理、AI Prompt
  // ==========================================================================
  function openVocabModal(v) {
    const modal = document.getElementById('vocabPopoverModal');
    const content = document.getElementById('vocabPopoverContent');
    if (!modal || !content) return;

    content.innerHTML = `
      <div class="popover-header">
        <div>
          <span class="popover-word-title">${v.word}</span>
          <span class="popover-ipa-badge">${v.pos || ''}</span>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-sm btn-primary" id="btn-modal-tts">🔊 聽發音</button>
          <button class="btn-close-drawer" id="btn-close-vocab-modal">✕</button>
        </div>
      </div>
      <div class="popover-grid">
        <div class="popover-row">
          <span class="anchor-badge">🏷️ 中文釋義</span>
          <span class="anchor-val"><strong>${v.chi}</strong></span>
        </div>
        ${v.breakdown ? `
          <div class="popover-row">
            <span class="anchor-badge">🧩 字根拆解</span>
            <span class="anchor-val">${v.breakdown}</span>
          </div>
        ` : ''}
        ${v.trick ? `
          <div class="popover-row">
            <span class="anchor-badge">💡 記憶口訣</span>
            <span class="anchor-val">${v.trick}</span>
          </div>
        ` : ''}
        ${v.scene ? `
          <div class="popover-row">
            <span class="anchor-badge">🎬 情境畫面</span>
            <span class="anchor-val">${v.scene}</span>
          </div>
        ` : ''}
        ${v.collocation ? `
          <div class="popover-row">
            <span class="anchor-badge">🔗 搭配用語</span>
            <span class="anchor-val"><code>${v.collocation}</code></span>
          </div>
        ` : ''}
        ${v.context_eng ? `
          <div class="popover-row">
            <span class="anchor-badge">📖 實用例句</span>
            <span class="anchor-val">${v.context_eng}<br><span class="muted">${v.context_chi || ''}</span></span>
          </div>
        ` : ''}
      </div>
    `;

    document.getElementById('btn-modal-tts').onclick = () => speakText(v.word);
    document.getElementById('btn-close-vocab-modal').onclick = () => {
      modal.style.display = 'none';
    };
    modal.onclick = (e) => {
      if (e.target === modal) modal.style.display = 'none';
    };
    modal.style.display = 'flex';
  }

  function openUserModal() {
    let modal = document.getElementById('user-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'user-modal';
      modal.className = 'user-modal-backdrop';
      document.body.appendChild(modal);
    }

    const renderModalContent = () => {
      const userCardsHtml = USERS.map(u => {
        const isCurrent = u.id === state.currentUser;
        const st = loadUserStatsSummary(u.id);
        return `
          <div class="user-profile-card ${isCurrent ? 'active' : ''}" style="--u-color: ${u.color}; --u-bg: ${u.bg};">
            <div class="u-card-left" data-pick-user="${u.id}" style="cursor:pointer;">
              <span class="u-avatar">${u.icon}</span>
              <div class="u-info">
                <div class="u-name-row">
                  <b>${u.name}</b>
                  <span class="u-role-tag" style="background:${u.bg}; color:${u.color}; font-weight:800; font-size:12px; padding:2px 7px; border-radius:999px;">${u.role}</span>
                  ${isCurrent ? `<span class="u-cur-badge" style="color:var(--ok); font-weight:800; font-size:12px;">✔ 使用中</span>` : ''}
                </div>
                <div class="u-stats-row" style="font-size:13px; color:var(--ink-2); margin-top:3px;">
                  <span class="${st.errCount > 0 ? 'bad-txt' : ''}">待消滅錯題 <b>${st.errCount}</b></span>
                </div>
              </div>
            </div>
            <div class="u-card-actions">
              ${!isCurrent ? `
                <button type="button" class="btn btn-sm btn-primary" data-pick-user="${u.id}">切換</button>
              ` : ''}
              ${u.isTest ? `
                <button type="button" class="btn btn-sm btn-ghost btn-clear-cur-test" data-reset-user="${u.id}" title="將此測試帳號的錯題與進度歸零">
                  🧹 清空
                </button>
              ` : `
                <span style="font-size:12.5px; font-weight:800; color:#059669; padding:4px 8px; border-radius:999px; background:#d1fae5;" title="正式學員資料受保護，防止誤刪">🔒 保護中</span>
              `}
            </div>
          </div>
        `;
      }).join('');

      modal.innerHTML = `
        <div class="user-modal-panel glass" role="dialog" aria-label="切換學習帳號與雲端設定">
          <div class="user-modal-head">
            <div>
              <h3>👥 切換使用人員（錯題本與進度獨立隔離）</h3>
              <p class="muted" style="font-size: 13px; margin: 4px 0 0;">點擊人員即可切換，測試帳號可一鍵清空重置，絕不影響 Rex 的紀錄。</p>
            </div>
            <button type="button" class="btn-close-drawer" id="user-modal-close">✕</button>
          </div>

          <div class="user-cards-list">
            ${userCardsHtml}
          </div>

          <div class="cloud-sync-box glass" style="margin-top:16px; padding:16px; border-radius:14px; border:1.5px solid var(--line); background:#fafafa;">
            <div class="cloud-sync-head" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <span style="font-weight:800; font-size:14px; color:var(--ink-1);">☁️ 跨裝置雲端同步（Firebase Realtime DB）</span>
              <span class="cloud-badge" style="font-size:12px; font-weight:800; padding:2px 8px; border-radius:999px; ${state.cloudDbUrl ? 'background:#d1fae5; color:#065f46;' : 'background:#f1f5f9; color:#64748b;'}">
                ${state.cloudDbUrl ? '🟢 已掛載 /g6_english_users' : '⚪ 本機離線模式'}
              </span>
            </div>
            <div class="cloud-input-row" style="display:flex; gap:8px;">
              <input type="url" id="input-cloud-url" style="flex:1; padding:8px 12px; border-radius:8px; border:1.5px solid var(--line); font-size:13px;" placeholder="https://你的專案.firebasedatabase.app" value="${state.cloudDbUrl || ''}">
              <button type="button" class="btn btn-primary btn-sm" id="btn-save-cloud">儲存並同步</button>
            </div>
            <p class="muted" style="font-size:12px; margin:8px 0 0; line-height:1.5;">
              與數學、國語網頁共用同一組 Firebase，英語進度將獨立儲存於 <code>/g6_english_users</code> 與 <code>/g6_english_logs</code>。
            </p>
          </div>
        </div>
      `;

      modal.style.display = 'flex';

      document.getElementById('user-modal-close').onclick = () => {
        modal.style.display = 'none';
      };
      modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
      };

      modal.querySelectorAll('[data-pick-user]').forEach(btn => {
        btn.onclick = () => {
          const uId = btn.getAttribute('data-pick-user');
          if (uId && uId !== state.currentUser) {
            switchUser(uId);
            modal.style.display = 'none';
          }
        };
      });

      modal.querySelectorAll('[data-reset-user]').forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const uId = btn.getAttribute('data-reset-user');
          const target = USERS.find(u => u.id === uId);
          if (confirm(`確定要清空測試帳號【${target.name}】的所有錯題與答題紀錄嗎？此操作將同步清除雲端紀錄。`)) {
            resetTestUser(uId);
            renderModalContent();
          }
        };
      });

      const btnSaveCloud = document.getElementById('btn-save-cloud');
      if (btnSaveCloud) {
        btnSaveCloud.onclick = async () => {
          const inp = document.getElementById('input-cloud-url');
          state.cloudDbUrl = normalizeCloudUrl(inp.value);
          localStorage.setItem(GLOBAL_KEYS.cloudDbUrl, state.cloudDbUrl);
          btnSaveCloud.disabled = true;
          btnSaveCloud.textContent = '同步中…';
          await syncFromCloud(state.currentUser, true);
          btnSaveCloud.disabled = false;
          btnSaveCloud.textContent = '儲存並同步';
          renderModalContent();
        };
      }
    };

    renderModalContent();
  }

  function initAiPromptModal() {
    const modal = document.getElementById('aiPromptModal');
    const openBtn = document.getElementById('nav-export');
    const closeBtn = document.getElementById('closeModalBtn');
    const copyBtn = document.getElementById('copyPromptBtn');
    const textarea = document.getElementById('aiPromptTextarea');

    if (openBtn) {
      openBtn.onclick = () => {
        const curUser = getCurrentUserObj();
        const errCount = state.errorBook.length;
        const promptText = `你是一位頂尖的國小英語教研出題專家。
以下是國小六年級學生【${curUser.name}】在準備六上英語期中考時的弱點診斷：
- 當前待消滅錯題數：${errCount} 題
- 考核核心教材：Oxford Discover Grammar 3 (U13~15)、Write Right 3 (U4~5)、Reading with Writing 6 (U5~8)、Read and Discover 6 Space (Ch4~5) 與岱崙美語 3C Quiz 歷史真卷 (Week 2~7)。
- 重大失分語法考點：
  1. Grammar 3 U13 倒裝附和句 (so did / neither did / tomorrow 漏 will / doesn't 混用 do)
  2. Grammar 3 U14 副詞三級比較長句合成 (well->better->best / badly->worse->worst / easily->more easily / 最高級子句嚴禁將一般動詞換成 is)
  3. Write Right 3 U5 假設語氣與 14 處抓錯題 (If I had... I would... / cost vs spend)
  4. Grammar 3 U15 容器量詞 (seven slices of bread 嚴禁加 breads)

請根據上述學生實戰弱點，量身生成 4 題「100% 相同考核語法內核、全新日常生活情境」的深度變式題（包含 2 題長句改寫題與 2 題點詞抓錯題），並附上標準答案與三色避坑教研詳解。請用繁體中文輸出。`;

        if (textarea) textarea.value = promptText;
        if (modal) modal.style.display = 'flex';
      };
    }

    if (closeBtn) {
      closeBtn.onclick = () => { modal.style.display = 'none'; };
    }
    if (copyBtn && textarea) {
      copyBtn.onclick = () => {
        textarea.select();
        navigator.clipboard.writeText(textarea.value).then(() => {
          showToast('✅ 已複製 AI 出題 Prompt！');
          modal.style.display = 'none';
        });
      };
    }
  }

  // ==========================================================================
  // 14. 應用程式進入點 (Initialization)
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    loadState();

    // 頂部導覽列按鈕綁定
    const homeBtn = document.getElementById('nav-home');
    if (homeBtn) {
      homeBtn.onclick = () => {
        state.view = 'dashboard';
        render();
      };
    }

    const userBtn = document.getElementById('nav-user');
    if (userBtn) userBtn.onclick = openUserModal;

    const ttsBtn = document.getElementById('nav-tts-speed');
    if (ttsBtn) {
      ttsBtn.onclick = () => {
        state.ttsSpeed = (state.ttsSpeed === 1.0) ? 0.8 : 1.0;
        localStorage.setItem(GLOBAL_KEYS.ttsSpeed, String(state.ttsSpeed));
        updateNavBadges();
        showToast(`TTS 語速切換為 ${state.ttsSpeed.toFixed(1)}x`);
      };
    }

    const errBtn = document.getElementById('nav-errors');
    if (errBtn) {
      errBtn.onclick = () => {
        state.view = 'error_book';
        render();
      };
    }

    const printBtn = document.getElementById('nav-print');
    if (printBtn) {
      printBtn.onclick = () => {
        state.view = 'print';
        render();
      };
    }

    initAiPromptModal();
    render();
    // 開啟網頁自動背景與雲端 Firebase 同步最新進度
    syncFromCloud(state.currentUser, false).catch(() => {});
  });

  window.App = { state, render, USERS, loadState, saveState, switchUser, resetTestUser, pushToCloud, syncFromCloud, pushAnswerLog, speakText, getBooksList, getUnitsForBook };
})();
