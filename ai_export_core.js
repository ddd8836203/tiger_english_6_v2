/**
 * 統一「匯出給 AI（Gemini Canvas 4D 互動網頁）」與 Firebase 做法 B+ 時間紀錄共用核心
 * Zero-Build Vanilla JS UMD/IIFE — 嚴禁外部相依，確保獨立部署至各 GitHub Pages 倉庫
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.AIExportCore = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  const VERSION = '3.1.0';

  const SUBJECT_PROFILES = {
    g2_chinese: {
      title: '二上國語特訓（南一版）',
      gradeLabel: '國小二年級上學期',
      primaryColor: '#5b4bdb',
      bgColor: '#f5f3ff',
      theme: 'light',
      toneRule: '必須全程使用對國小二年級小朋友溫柔、有耐心、鼓勵性的語氣（8歲看得懂的淺白短句），所有重點解說與題目用語避免艱深文法術語。',
      zhuyinRule: [
        '**全頁國字強制標註注音（極重要，沒注音二年級看不懂）**：題幹、閱讀短文、選項與 4D 詳解中的每一個國字，都必須使用原生 HTML `<ruby>國<rt>ㄍㄨㄛˊ</rt></ruby>` 標註注音！',
        '**內建右置直排注音 CSS（零外部字型相依）**：務必在 `<style>` 加入：`ruby { display: inline-flex; flex-direction: row; align-items: center; ruby-align: center; } rt { writing-mode: vertical-rl; text-orientation: upright; font-size: 0.44em; line-height: 1; margin-left: 1px; color: #475569; font-weight: 500; } body.hide-zhuyin rt { display: none; }`（輕聲 `˙` 置於聲韻母最上方；亦支援點擊頂部按鈕 **`🔤 全句注音：開／關`** 切換顯示，預設為開啟）。',
        '**嚴格防洩題鐵律**：凡題目測驗「國字讀音／多音字／寫注音」時，**被考的那個目標字（例如『請選出「角」字的讀音』中的「角」）絕對不可標注音**（僅該字不放 `<rt>`，句子其餘國字仍須標注音）；凡測驗「看注音寫國字」時，空格只標注音不顯國字！',
        '**破音字嚴格核對**：輸出 HTML 前請逐字複查多音字／破音字讀音（如還、長、樂、行、覺、著、重、得、為、好、中、發、數、量、轉、空、和、教、背、當等），確保詞義與讀音 100% 正確！'
      ].join('\n     - '),
      d4VisualRule: 'D4 視覺積木請依題型選用：部首／生字筆畫對照卡片、多音字紅綠燈分流卡、或「誰＋做什麼＋怎麼做」句子積木方塊（使用原生 HTML 表格或圓角卡片，禁止純文字分隔線）。',
      questionTypesRule: '同時包含「選擇題（點擊選項即時批改）」與「紙筆手寫／造句練功題（顯示田字格／造句提示，提供『👀 核對答案』與『✅ 全對熟練 / ⏳ 想很久 / ❌ 需重練』三態自評）」。',
      extraPedagogyRule: '每題詳解內必須額外折疊提供一欄「👨‍👩‍👧 家長陪讀小抄（含 3 個小老師批改檢查點與多音字/形近字記憶口訣）」，且頁面預設字體放大清晰（題幹 >= 19px）。'
    },
    g5_chinese: {
      title: '五上國語特訓（翰林版）',
      gradeLabel: '國小五年級上學期',
      primaryColor: '#5b4bdb',
      bgColor: '#f5f3ff',
      theme: 'light',
      toneRule: '使用親切清晰、具考場點撥感的國小高年級家教口吻。',
      d4VisualRule: 'D4 視覺積木依題型選用：形近字/同音字比較矩陣表、成語紅綠燈情境對照卡、或閱讀理解因果結構流程圖（HTML 表格/CSS 積木或 inline SVG）。',
      questionTypesRule: '同時包含「四選一選擇題（即時批改）」與「紙筆手寫國字注音題（提示寫在紙上後點擊『👀 核對答案』＋三態自評）」。',
      extraPedagogyRule: '選項必須長度對稱避免猜題漏洞；每題附 D1 命題核心、D2 破題步驟與秒殺口訣、D3 避坑診斷、D4 視覺積木、3E 延伸自修折疊卡。'
    },
    g6_chinese: {
      title: '六上國語特訓（南一版）',
      gradeLabel: '國小六年級上學期',
      primaryColor: '#5b4bdb',
      bgColor: '#f5f3ff',
      theme: 'light',
      toneRule: '使用精準、有啟發性的國小六年級段考衝刺家教口吻。',
      d4VisualRule: 'D4 視覺積木依題型選用：形近字／部首比較矩陣表（radical_matrix）、成語誤用紅綠燈對照（idiom_traffic）、或文章主旨／修辭結構流程圖（structure_flow）。',
      questionTypesRule: '同時包含「四選一選擇題（即時批改）」與「紙筆手寫國字注音／語詞改錯題（提供『👀 核對答案』＋『✅ 全對秒殺 / ⏳ 想很久 / ❌ 我有寫錯』三態自評）」。',
      extraPedagogyRule: '若原錯題涉及多音字、形近字或成語望文生義，變形題與延伸題必須針對該易混字詞設計高誘答干擾項，並於 D3 逐項拆解為何其他選項是陷阱。'
    },
    g6_math: {
      title: '六上數學特訓（翰林版）',
      gradeLabel: '國小六年級上學期',
      primaryColor: '#5b4bdb',
      bgColor: '#f5f3ff',
      theme: 'light',
      toneRule: '使用國小六年級算術邏輯，嚴禁出現國中一元一次方程式 X/Y 代數移項，必須用基準量/比與比值/線段圖/倒推法等小學方法講解。',
      d4VisualRule: 'D4 視覺積木強制使用圖表化呈現：分數請用 CSS 上下分數排版，應用題用 inline `<svg viewBox="0 0 420 130">` 畫線段圖/圓餅圖/幾何標註圖，計算題用對齊直式或短除法階梯表。',
      questionTypesRule: '支援「選擇題（即時批改）」與「紙筆計算題（提示先在紙上列式計算，點擊『👀 核對答案』展開逐步推導，再點『✅ 秒殺算對 / ⏳ 算對想很久 / ❌ 算錯』三態自評）」。',
      extraPedagogyRule: '你生成每一題數學新題前，必須先在心中完成精確驗算確保答案唯一正確；延伸題可適度融入資優／AMC 8 初階思維，並在 D3 寫出對應的錯題盲點（如單位沒換算、間隔漏加 1、半徑直徑搞混）。'
    },
    g5_math: {
      title: '五上數學特訓（康軒版）',
      gradeLabel: '國小五年級上學期',
      primaryColor: '#5b4bdb',
      bgColor: '#f5f3ff',
      theme: 'light',
      toneRule: '使用國小五年級算術思維（嚴禁使用小寫 x/y 代數方程），幾何題可明確標註「點 A、線段 AB、面 AEHD」。',
      d4VisualRule: 'D4 視覺積木必須包含 inline `<svg viewBox="...">` 幾何/線對稱/線段圖、CSS 上下分數或因數倍數短除法表，嚴禁純文字空行拼湊圖形。',
      questionTypesRule: '支援「選擇題（即時批改）」與「紙筆列式計算題（『👀 核對答案』＋三態自評）」。',
      extraPedagogyRule: '每題必須經內部精確驗算無誤；D3 必須點破五年級常見陷阱（如平行四邊形高與底不垂直、面積忘記除以 2、公因數與公倍數混淆）。'
    },
    g6_science: {
      title: '六上自然科特訓（康軒版）',
      gradeLabel: '國小六年級上學期',
      primaryColor: '#059669',
      bgColor: '#f2f7f4',
      theme: 'light',
      toneRule: '用清晰的實驗因果與生活觀察語言引導六年級學生破除科學迷思。',
      d4VisualRule: 'D4 視覺積木使用紅綠改錯高亮對比卡（錯誤敘述紅字劃線 ➔ 正確觀念綠字）、變因控制對照表（操縱／控制／應變變因）、或實驗因果流程圖 / inline SVG 示意圖。',
      questionTypesRule: '支援「四選一觀念/實驗題（即時批改）」、「是非判斷題」與「紙筆簡答/實作思考題（『👀 核對答案』＋三態自評）」。',
      extraPedagogyRule: 'D3 必含「偷換關鍵字／絕對化字眼（一定、只有、完全）」防雷剖析；延伸題著重生活現象推理與實驗對照組設計。'
    },
    g6_social: {
      title: '六上社會科特訓（康軒版）',
      gradeLabel: '國小六年級上學期',
      primaryColor: '#0284c7',
      bgColor: '#f0f9ff',
      theme: 'light',
      toneRule: '用清楚的歷史脈絡、公民制度與經濟生活實例引導六年級學生理解，不死背年份。',
      d4VisualRule: 'D4 視覺積木使用紅綠錯字/觀念改錯對比卡、制度比較雙欄表（如中央 vs 地方、權利 vs 義務）、或時間軸／因果鏈 HTML 圖卡。',
      questionTypesRule: '支援「情境選擇題（即時批改）」與「是非辨析／簡答自評題（『👀 核對答案』＋三態自評）」。',
      extraPedagogyRule: 'D3 必須逐項指出誘答選項把哪兩個時期、法條或人物張冠李戴；延伸題多結合時事或生活消費／社區情境。'
    },
    g5_science: {
      title: '五上自然科特訓（康軒版）',
      gradeLabel: '國小五年級上學期',
      primaryColor: '#059669',
      bgColor: '#f2f7f4',
      theme: 'light',
      toneRule: '用清晰的實驗步驟與現象對比引導五年級學生建立科學推理力。',
      d4VisualRule: 'D4 視覺積木使用紅綠改錯卡、實驗對照組表格或 inline SVG 裝置示意圖。',
      questionTypesRule: '支援「選擇題（即時批改）」與「紙筆問答自評題（『👀 核對答案』＋三態自評）」。',
      extraPedagogyRule: '針對錯題中的實驗變因、太陽高度角/植物構造/水溶液性質/力與運動迷思做跨情境變式。'
    },
    g5_social: {
      title: '五上社會科特訓（康軒版）',
      gradeLabel: '國小五年級上學期',
      primaryColor: '#0284c7',
      bgColor: '#f0f9ff',
      theme: 'light',
      toneRule: '用好懂的故事脈絡與地理空間對比幫助五年級學生釐清台灣地形氣候與早期歷史。',
      d4VisualRule: 'D4 視覺積木使用紅綠改錯卡、地形氣候比較表或歷史時代因果時間軸。',
      questionTypesRule: '支援「選擇題（即時批改）」與「紙筆辨析自評題（『👀 核對答案』＋三態自評）」。',
      extraPedagogyRule: 'D3 清楚標示選項把哪個朝代、地形區或原住民族群混淆。'
    },
    g6_english: {
      title: '六年級英語特訓（School + Extra）',
      gradeLabel: '國小六年級',
      primaryColor: '#5b4bdb',
      bgColor: '#f5f3ff',
      theme: 'light',
      toneRule: '題幹使用自然道地的國小進階英語，詳解與口訣使用繁體中文＋關鍵英文句型標色。',
      d4VisualRule: 'D4 視覺積木使用句型填空槽（Slot Box）、時態時間軸 SVG、或介系詞/單複數對照表。',
      questionTypesRule: '同時包含「文法/閱讀選擇題（即時批改）」與「手寫重組/翻譯改寫題（『👀 核對答案』＋三態自評）」，可附帶瀏覽器內建 `speechSynthesis` 朗讀按鈕（若失敗靜默容錯）。',
      extraPedagogyRule: '保留相同的文法核心（如時態、比較級、疑問詞、介系詞搭配），全面替換為全新日常校園或旅遊情境，並逐一剖析中式英文誤區。'
    },
    g6_spelling: {
      title: 'Spelling Bee 六年級單字拼寫特訓',
      gradeLabel: '國小六年級 Spelling Bee',
      primaryColor: '#0ea5e9',
      bgColor: '#0f172a',
      theme: 'dark',
      toneRule: '英文單字與自然發音切塊講解結合繁體中文記憶法，激發拼寫成就感。',
      d4VisualRule: 'D4 視覺積木使用音節/字根拆塊彩色標籤（Phonics Chunks Table）與易混淆拼字對比卡（例如 -tion vs -sion、雙寫子音規則）。',
      questionTypesRule: '包含「聽音/詞義拼寫輸入框或紙筆默寫（支援『👀 核對答案』＋三態自評，並可選用 Web Speech API 朗讀）」與「易錯字形辨析選擇題」。',
      extraPedagogyRule: '針對錯拼單字的母音組合、不發音字母或字尾變化出延伸拼字與詞性填空題。'
    },
    ket: {
      title: '劍橋英檢 Cambridge A2 KET 特訓',
      gradeLabel: 'Cambridge A2 KET 備考',
      primaryColor: '#10b981',
      bgColor: '#f7f4eb',
      theme: 'light',
      toneRule: '模擬 Cambridge A2 Key (KET) 真題語域，詳解使用繁體中文點出 Part 考法與考官誘答陷阱。',
      d4VisualRule: 'D4 視覺積木使用公告/短訊關鍵字鎖定表、克漏字語法定位槽、或字根詞性延伸表。',
      questionTypesRule: '包含「KET 閱讀/文法四選一或三選一選擇題（即時批改）」與「句子改寫/開放填空題（『👀 核對答案』＋三態自評）」。',
      extraPedagogyRule: 'D3 明確指出同義改寫陷阱（Paraphrase Trap）或時態/介系詞誤判；延伸題提升至實戰生活閱讀應用。'
    }
  };

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function formatTaipeiTime(ms) {
    const num = Number(ms);
    if (!Number.isFinite(num) || num <= 0) return '';
    const d = new Date(num);
    if (Number.isNaN(d.getTime())) return '';
    try {
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).formatToParts(d);
      const map = {};
      for (const p of parts) map[p.type] = p.value;
      const hh = map.hour === '24' ? '00' : map.hour;
      return `${map.year}/${map.month}/${map.day} ${hh}:${map.minute}:${map.second}`;
    } catch (e) {
      const utc = d.getTime() + 8 * 3600 * 1000;
      const td = new Date(utc);
      return `${td.getUTCFullYear()}/${pad2(td.getUTCMonth() + 1)}/${pad2(td.getUTCDate())} ${pad2(td.getUTCHours())}:${pad2(td.getUTCMinutes())}:${pad2(td.getUTCSeconds())}`;
    }
  }

  function formatDateInputValue(ms) {
    const num = Number(ms);
    if (!Number.isFinite(num) || num <= 0) return '';
    const str = formatTaipeiTime(num);
    return str ? str.slice(0, 10).replace(/\//g, '-') : '';
  }

  function parseDateInputStartMs(ymd) {
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return 0;
    const ms = Date.parse(`${ymd}T00:00:00+08:00`);
    return Number.isFinite(ms) ? ms : 0;
  }

  function parseDateInputEndMs(ymd) {
    if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return 0;
    const ms = Date.parse(`${ymd}T23:59:59.999+08:00`);
    return Number.isFinite(ms) ? ms : 0;
  }

  function parseTaipeiStringToMs(str) {
    if (!str || typeof str !== 'string') return 0;
    const s = str.trim();
    // 2026/11/25 21:30:12 or 2026-11-25 21:30:12
    let m = s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})\s+(上午|下午)?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      const ampm = m[4] || '';
      let h = Number(m[5]);
      const mi = Number(m[6]);
      const se = Number(m[7] || 0);
      if (ampm === '下午' && h < 12) h += 12;
      if (ampm === '上午' && h === 12) h = 0;
      if (h === 24) h = 0;
      const iso = `${y}-${pad2(mo)}-${pad2(d)}T${pad2(h)}:${pad2(mi)}:${pad2(se)}+08:00`;
      const parsed = Date.parse(iso);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    const direct = Date.parse(s);
    return Number.isFinite(direct) ? direct : 0;
  }

  function parseLogTimestamp(entry, fallbackKey) {
    if (entry && typeof entry === 'object') {
      const nTs = Number(entry.ts);
      if (Number.isFinite(nTs) && nTs > 1000000000000) return nTs;
      const nTs2 = Number(entry.timestamp);
      if (Number.isFinite(nTs2) && nTs2 > 1000000000000) return nTs2;
      if (entry.time) {
        const p = Date.parse(entry.time);
        if (Number.isFinite(p) && p > 0) return p;
      }
      if (entry.lastUpdated) {
        const p2 = Date.parse(entry.lastUpdated);
        if (Number.isFinite(p2) && p2 > 0) return p2;
      }
      if (entry.t) {
        const p3 = parseTaipeiStringToMs(entry.t);
        if (p3 > 0) return p3;
      }
    }
    if (fallbackKey) {
      const m = String(fallbackKey).match(/^(\d{13})(?:_|$)/);
      if (m) {
        const kTs = Number(m[1]);
        if (Number.isFinite(kTs) && kTs > 1000000000000) return kTs;
      }
    }
    return 0;
  }

  function extractCorrectFromOpts(optsStr) {
    if (!optsStr || typeof optsStr !== 'string') return '';
    if (/手寫正解:|正解:/.test(optsStr)) {
      return optsStr.replace(/^(?:.*?正解:\s*)/, '').trim();
    }
    const parts = optsStr.split('|').map(s => s.trim());
    const hit = parts.find(p => p.endsWith('*'));
    return hit ? hit.slice(0, -1).trim() : '';
  }

  function normalizeLogRecord(raw, fallbackKey) {
    if (!raw || typeof raw !== 'object') return null;
    const id = raw.id || raw.qId || raw.qid || '';
    if (!id) return null;
    const ts = parseLogTimestamp(raw, fallbackKey);
    const t = raw.t || (ts ? formatTaipeiTime(ts) : '');
    let res = raw.res || raw.result || '';
    if (!res && typeof raw.isCorrect === 'boolean') {
      res = raw.isCorrect ? 'ok' : 'bad';
    }
    if (!res) res = 'bad';
    const ans = raw.ans != null ? String(raw.ans)
      : raw.userPick != null ? String(raw.userPick)
      : raw.userChoice != null ? String(raw.userChoice)
      : raw.selected != null ? String(raw.selected)
      : '';
    const opts = raw.opts != null ? String(raw.opts) : '';
    const correct = raw.correct != null ? String(raw.correct)
      : raw.correctAnswer != null ? String(raw.correctAnswer)
      : extractCorrectFromOpts(opts);
    return {
      v: raw.v || 1,
      ts,
      t,
      subj: raw.subj || '',
      id: String(id),
      unit: raw.unit || raw.unitId || raw.lessonId || '',
      cat: raw.cat || raw.category || raw.mode || '',
      sch: raw.sch || raw.school || '',
      q: raw.q != null ? String(raw.q) : (raw.question != null ? String(raw.question) : ''),
      opts,
      correct,
      ans,
      res,
      sec: Number(raw.sec || raw.durationSec || 1) || 1,
      trap: raw.trap || raw.trapCode || raw.misconception || '',
      concept: raw.concept || raw.coreConcept || '',
      pTxt: raw.pTxt || '',
      pTitle: raw.pTitle || '',
      fromLegacyHistory: !!raw.fromLegacyHistory
    };
  }

  function createSlimLogEntry(params) {
    const p = params || {};
    const nowMs = Number(p.ts) > 0 ? Number(p.ts) : Date.now();
    const nowStr = p.t || formatTaipeiTime(nowMs);
    const base = Object.assign({}, p.extra || {});
    base.v = 2;
    base.ts = nowMs;
    base.t = nowStr;
    base.subj = p.subj || base.subj || '';
    base.id = String(p.id || base.id || '');
    base.unit = p.unit != null ? String(p.unit) : (base.unit || '');
    base.cat = p.cat != null ? String(p.cat) : (base.cat || '');
    base.sch = p.sch != null ? String(p.sch) : (base.sch || '');
    base.q = p.q != null ? String(p.q) : (base.q || '');
    base.opts = p.opts != null ? String(p.opts) : (base.opts || '');
    base.correct = p.correct != null ? String(p.correct) : (base.correct || '');
    base.ans = p.ans != null ? String(p.ans) : (base.ans || '');
    base.res = p.res || base.res || 'bad';
    base.sec = Number(p.sec || base.sec || 1) || 1;
    base.trap = p.trap != null ? String(p.trap) : (base.trap || '');
    base.concept = p.concept != null ? String(p.concept) : (base.concept || '');
    return base;
  }

  function saveLocalAnswerLog(storageKey, entry, maxLen = 300) {
    if (!storageKey || !entry || typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(storageKey) || '[]';
      const arr = JSON.parse(raw);
      const list = Array.isArray(arr) ? arr : [];
      list.unshift(entry);
      if (list.length > maxLen) list.length = maxLen;
      localStorage.setItem(storageKey, JSON.stringify(list));
    } catch (e) {}
  }

  function normalizeBaseUrl(url) {
    if (!url || typeof url !== 'string') return '';
    return url.trim().replace(/\/+$/, '').replace(/\.json$/i, '');
  }

  async function pushLogToFirebase(dbUrl, logsNode, uid, qId, entry, fetchFn) {
    const base = normalizeBaseUrl(dbUrl);
    const fn = fetchFn || (typeof fetch === 'function' ? fetch : null);
    if (!base || !logsNode || !uid || !entry || !fn) return false;
    const safeId = String(qId || entry.id || 'q').replace(/[^a-zA-Z0-9_-]/g, '_');
    const ts = Number(entry.ts) > 0 ? Number(entry.ts) : Date.now();
    const logKey = `${ts}_${safeId}`;
    try {
      const res = await fn(`${base}/${logsNode}/${uid}/${logKey}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
      return !!(res && res.ok);
    } catch (e) {
      return false;
    }
  }

  function convertLegacyHistoryToLogs(legacyHistory) {
    if (!Array.isArray(legacyHistory)) return [];
    const out = [];
    for (const item of legacyHistory) {
      if (!item || typeof item !== 'object') continue;
      // Math / Chinese session wrapper: { date, answers: [ { qId, unitId, category, result, userChoice, trapCode, time } ] }
      if (Array.isArray(item.answers)) {
        for (const a of item.answers) {
          if (!a || !a.qId) continue;
          const ts = parseLogTimestamp(a, null) || parseTaipeiStringToMs(item.date || '');
          const norm = normalizeLogRecord({
            id: a.qId,
            ts,
            t: ts ? formatTaipeiTime(ts) : (item.date || ''),
            unit: a.unitId || item.unitId || '',
            cat: a.category || '',
            res: a.result || 'bad',
            ans: a.userChoice || '',
            trap: a.trapCode || '',
            fromLegacyHistory: true
          });
          if (norm) out.push(norm);
        }
      } else if (Array.isArray(item.details)) {
        // Chinese session details: [ { qId, unitId, category, result, userText, correctAns, time } ]
        for (const d of item.details) {
          if (!d || !d.qId) continue;
          const ts = parseLogTimestamp(d, null) || parseTaipeiStringToMs(item.date || '');
          const norm = normalizeLogRecord({
            id: d.qId,
            ts,
            t: ts ? formatTaipeiTime(ts) : (item.date || ''),
            unit: d.unitId || '',
            cat: d.category || '',
            res: d.result || 'bad',
            ans: d.userText || '',
            correct: d.correctAns || '',
            fromLegacyHistory: true
          });
          if (norm) out.push(norm);
        }
      } else if (item.qId || item.id) {
        // Science/Social flat full_history: { time, qId, type, unitId, school, selected, isCorrect, durationSec }
        const norm = normalizeLogRecord({
          id: item.qId || item.id,
          time: item.time,
          ts: item.ts,
          unit: item.unitId || '',
          cat: item.type || '',
          sch: item.school || '',
          ans: Array.isArray(item.selected) ? item.selected.join('、') : (item.selected || ''),
          isCorrect: item.isCorrect,
          res: item.result,
          sec: item.durationSec || 1,
          fromLegacyHistory: true
        });
        if (norm) out.push(norm);
      }
    }
    return out;
  }

  async function fetchCloudAnswerLogs(opts) {
    const cfg = opts || {};
    const base = normalizeBaseUrl(cfg.dbUrl);
    const logsNode = cfg.logsNode || '';
    const uid = cfg.uid || '';
    const startMs = Number(cfg.startMs) || 0;
    const endMs = Number(cfg.endMs) || 0;
    const limit = Number(cfg.limit) || 500;
    const fn = cfg.fetchFn || (typeof fetch === 'function' ? fetch : null);

    const cloudLogs = [];
    let source = 'local';
    let queryError = '';

    if (base && logsNode && uid && fn) {
      const nodeUrl = `${base}/${logsNode}/${encodeURIComponent(uid)}.json`;
      const queryUrl = (startMs > 0 && endMs > 0)
        ? `${nodeUrl}?orderBy=${encodeURIComponent('"$key"')}&startAt=${encodeURIComponent('"' + String(startMs) + '"')}&endAt=${encodeURIComponent('"' + String(endMs) + '\uf8ff"')}`
        : `${nodeUrl}?orderBy=${encodeURIComponent('"$key"')}&limitToLast=${limit}`;

      let data = null;
      try {
        let res = await fn(queryUrl);
        if (!res || !res.ok) {
          res = await fn(nodeUrl);
        }
        if (res && res.ok) {
          data = await res.json();
          source = 'cloud';
        } else {
          queryError = res ? `HTTP ${res.status}` : 'No response';
        }
      } catch (e) {
        queryError = e && e.message ? e.message : 'Network error';
      }

      if (data && typeof data === 'object' && !Array.isArray(data)) {
        for (const [k, v] of Object.entries(data)) {
          const norm = normalizeLogRecord(v, k);
          if (norm) cloudLogs.push(norm);
        }
      } else if (Array.isArray(data)) {
        for (const v of data) {
          const norm = normalizeLogRecord(v, null);
          if (norm) cloudLogs.push(norm);
        }
      }
    }

    const localNorm = (Array.isArray(cfg.localLogs) ? cfg.localLogs : [])
      .map(item => normalizeLogRecord(item, null))
      .filter(Boolean);
    const legacyNorm = convertLegacyHistoryToLogs(cfg.legacyHistory);

    // 合併去重：雲端與本機即時 log 優先於舊 session history
    const mergedMap = new Map();
    const allIncoming = [...cloudLogs, ...localNorm, ...legacyNorm];
    for (const rec of allIncoming) {
      const secBucket = rec.ts ? Math.floor(rec.ts / 1000) : 0;
      const dedupKey = `${secBucket}|${rec.id}|${rec.res}|${rec.ans}`;
      const prev = mergedMap.get(dedupKey);
      if (!prev) {
        mergedMap.set(dedupKey, rec);
      } else if (prev.fromLegacyHistory && !rec.fromLegacyHistory) {
        mergedMap.set(dedupKey, rec);
      } else if ((!prev.q && rec.q) || (!prev.ans && rec.ans)) {
        mergedMap.set(dedupKey, Object.assign({}, prev, rec));
      }
    }

    const logs = Array.from(mergedMap.values()).sort((a, b) => (b.ts || 0) - (a.ts || 0));
    return {
      source,
      queryError,
      cloudCount: cloudLogs.length,
      totalCount: logs.length,
      logs
    };
  }

  function buildMistakeCatalog(opts) {
    const cfg = opts || {};
    const nowMs = Number(cfg.nowMs) || Date.now();
    const rangeMode = cfg.rangeMode || 'error_book'; // 'error_book' | '7d' | '30d' | 'custom'
    const onlyUnresolved = !!cfg.onlyUnresolved;
    const includeSlow = !!cfg.includeSlow;
    const includeUndated = cfg.includeUndated !== false;
    const sortMode = cfg.sortMode || 'freq'; // 'freq' | 'recent'

    let startMs = 0;
    let endMs = nowMs;
    if (rangeMode === '7d') {
      startMs = nowMs - 7 * 24 * 3600 * 1000;
    } else if (rangeMode === '30d') {
      startMs = nowMs - 30 * 24 * 3600 * 1000;
    } else if (rangeMode === 'custom') {
      startMs = parseDateInputStartMs(cfg.customStartDate) || (nowMs - 7 * 24 * 3600 * 1000);
      endMs = parseDateInputEndMs(cfg.customEndDate) || nowMs;
      if (endMs < startMs) {
        const tmp = startMs;
        startMs = endMs;
        endMs = tmp;
      }
    }

    const qMap = cfg.allQuestionsMap || {};
    const ebSet = new Set((cfg.errorBookIds || []).map(String));
    const slowSet = new Set((cfg.slowIds || []).map(String));
    const errorCounts = cfg.errorCounts || {};
    const slowCounts = cfg.slowCounts || {};
    const logs = Array.isArray(cfg.logs) ? cfg.logs : [];

    const logsById = new Map();
    for (const log of logs) {
      if (!log || !log.id) continue;
      if (!logsById.has(log.id)) logsById.set(log.id, []);
      logsById.get(log.id).push(log);
    }

    const targetResults = new Set(['bad']);
    if (includeSlow) targetResults.add('slow');

    // Collect candidate IDs
    const candidateIds = new Set();
    if (rangeMode === 'error_book') {
      for (const id of ebSet) candidateIds.add(id);
      if (includeSlow) {
        for (const id of slowSet) candidateIds.add(id);
      }
    } else {
      for (const log of logs) {
        if (!targetResults.has(log.res)) continue;
        if (log.ts > 0 && log.ts >= startMs && log.ts <= endMs) {
          if (!onlyUnresolved || ebSet.has(log.id) || (includeSlow && slowSet.has(log.id))) {
            candidateIds.add(log.id);
          }
        }
      }
      // Always detect undated errorBook items
      for (const id of ebSet) {
        const qLogs = (logsById.get(id) || []).filter(l => targetResults.has(l.res) && l.ts > 0);
        if (qLogs.length === 0) {
          candidateIds.add(id);
        }
      }
      if (includeSlow) {
        for (const id of slowSet) {
          const qLogs = (logsById.get(id) || []).filter(l => targetResults.has(l.res) && l.ts > 0);
          if (qLogs.length === 0) {
            candidateIds.add(id);
          }
        }
      }
    }

    let undatedCount = 0;
    const items = [];
    const unitSet = new Set();

    for (const id of candidateIds) {
      const meta = qMap[id] || {};
      const allQLogs = (logsById.get(id) || []).slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
      const matchingLogs = allQLogs.filter(l => targetResults.has(l.res));
      const latestAnyMatch = matchingLogs[0] || null;
      const inRangeLogs = rangeMode === 'error_book'
        ? matchingLogs
        : matchingLogs.filter(l => l.ts > 0 && l.ts >= startMs && l.ts <= endMs);

      const hasTimestamp = matchingLogs.some(l => l.ts > 0);
      if (!hasTimestamp) {
        undatedCount++;
        if (rangeMode !== 'error_book' && !includeUndated) continue;
      }

      if (rangeMode !== 'error_book' && hasTimestamp && inRangeLogs.length === 0) {
        continue;
      }

      const fallbackLog = allQLogs[0] || {};
      const totalWrongCount = Math.max(
        Number(errorCounts[id] || 0) + (includeSlow ? Number(slowCounts[id] || 0) : 0),
        matchingLogs.length,
        ebSet.has(id) ? 1 : 0
      );

      const lastWrongTs = latestAnyMatch ? (latestAnyMatch.ts || 0) : 0;
      const lastWrongTime = latestAnyMatch ? (latestAnyMatch.t || (lastWrongTs ? formatTaipeiTime(lastWrongTs) : '')) : '';
      const unitLabel = meta.unit || fallbackLog.unit || '綜合單元';
      unitSet.add(unitLabel);

      items.push({
        id,
        code: meta.code || '',
        unit: unitLabel,
        cat: meta.cat || fallbackLog.cat || '',
        sch: meta.sch || fallbackLog.sch || '',
        q: meta.q || fallbackLog.q || `(題號 ${id})`,
        opts: meta.opts || fallbackLog.opts || '',
        correct: meta.correct || fallbackLog.correct || '',
        trap: meta.trap || fallbackLog.trap || '',
        concept: meta.concept || fallbackLog.concept || '',
        passage: meta.passage || fallbackLog.pTxt || '',
        qType: meta.qType || '',
        inErrorBook: ebSet.has(id),
        isSlow: slowSet.has(id),
        hasTimestamp,
        totalWrongCount,
        rangeWrongCount: inRangeLogs.length || (hasTimestamp ? 0 : 1),
        lastWrongTs,
        lastWrongTime: lastWrongTime || '早期紀錄（無時間戳）',
        lastWrongAns: latestAnyMatch ? (latestAnyMatch.ans || '') : '',
        wrongHistory: (rangeMode === 'error_book' ? matchingLogs : (inRangeLogs.length ? inRangeLogs : matchingLogs))
          .slice(0, 3)
          .map(l => ({
            ts: l.ts,
            t: l.t || (l.ts ? formatTaipeiTime(l.ts) : '無時間戳'),
            ans: l.ans || '未記錄選項',
            sec: l.sec || 1,
            res: l.res
          }))
      });
    }

    items.sort((a, b) => {
      if (sortMode === 'recent') {
        if ((b.lastWrongTs || 0) !== (a.lastWrongTs || 0)) return (b.lastWrongTs || 0) - (a.lastWrongTs || 0);
        return b.totalWrongCount - a.totalWrongCount;
      }
      if (b.totalWrongCount !== a.totalWrongCount) return b.totalWrongCount - a.totalWrongCount;
      return (b.lastWrongTs || 0) - (a.lastWrongTs || 0);
    });

    return {
      items,
      undatedCount,
      unitCount: unitSet.size,
      startMs,
      endMs
    };
  }

  function splitIntoBatches(items, batchSize = 8, splitMode = 'auto') {
    const list = Array.isArray(items) ? items : [];
    if (list.length === 0) return [];
    const size = Math.max(1, Number(batchSize) || 8);
    if (splitMode === 'all' || list.length <= size) return [list];
    const batches = [];
    for (let i = 0; i < list.length; i += size) {
      batches.push(list.slice(i, i + size));
    }
    return batches;
  }

  function getRangeLabel(rangeMode, customStartDate, customEndDate) {
    if (rangeMode === '7d') return '近 7 天錯題';
    if (rangeMode === '30d') return '近 30 天錯題';
    if (rangeMode === 'custom') return `自訂區間 (${customStartDate || '?'} ~ ${customEndDate || '?'})`;
    return '目前待消滅錯題本';
  }

  function buildPromptOutput(opts) {
    const cfg = opts || {};
    const mode = cfg.mode || 'canvas'; // 'canvas' | 'text' | 'json'
    const profile = SUBJECT_PROFILES[cfg.subjectKey] || SUBJECT_PROFILES.g6_chinese;
    const user = cfg.user || { name: '同學', role: '正式學員' };
    const selectedItems = Array.isArray(cfg.selectedItems) ? cfg.selectedItems : [];
    const batchItems = Array.isArray(cfg.batchItems) ? cfg.batchItems : selectedItems;
    const batchIndex = Number(cfg.batchIndex) || 0;
    const totalBatches = Math.max(1, Number(cfg.totalBatches) || 1);
    const splitMode = cfg.splitMode || 'auto';
    const multiplier = Math.max(1, Number(cfg.multiplier) || 2);
    const customTargetCount = Number(cfg.customTargetCount) || 0;
    const nowStr = formatTaipeiTime(cfg.nowMs || Date.now());
    const rangeLabel = getRangeLabel(cfg.rangeMode, cfg.customStartDate, cfg.customEndDate);

    // 目標題數計算：預設每 1 題錯題配 2 題（1 變形 + 1 延伸）
    const baseN = batchItems.length;
    const targetTotal = customTargetCount > 0
      ? customTargetCount
      : (baseN > 0 ? baseN * multiplier : 6);
    const varCount = Math.ceil(targetTotal / 2);
    const extCount = Math.max(0, targetTotal - varCount);

    if (mode === 'json') {
      const payload = {
        exportVersion: VERSION,
        exportedAt: nowStr,
        subjectKey: cfg.subjectKey || '',
        subjectTitle: profile.title,
        student: { id: user.id || '', name: user.name || '', role: user.role || '' },
        filter: {
          rangeMode: cfg.rangeMode || 'error_book',
          rangeLabel,
          onlyUnresolved: !!cfg.onlyUnresolved,
          includeSlow: !!cfg.includeSlow,
          sortMode: cfg.sortMode || 'freq',
          splitMode: 'all'
        },
        recommendedPracticeCount: {
          wrongCount: selectedItems.length,
          multiplier,
          totalTargetQuestions: selectedItems.length > 0 ? selectedItems.length * multiplier : 6
        },
        mistakes: selectedItems,
        recentMergedLogsSample: (cfg.mergedLogs || []).slice(0, 60)
      };
      return JSON.stringify(payload, null, 2);
    }

    const batchTag = splitMode === 'all'
      ? `全部整份（不分卷，共 ${batchItems.length} 題錯題）`
      : (totalBatches > 1 ? `第 ${batchIndex + 1} / ${totalBatches} 卷（本卷 ${batchItems.length} 題錯題，全部共 ${selectedItems.length} 題）` : `共 ${batchItems.length} 題錯題`);

    const mistakeLines = [];
    if (batchItems.length === 0) {
      mistakeLines.push('（目前篩選範圍內沒有待加強錯題，請針對本科目核心高頻易錯點設計挑戰題！）');
    } else {
      batchItems.forEach((m, idx) => {
        const starTag = m.totalWrongCount >= 2 ? ' ⭐高頻弱點' : '';
        const slowTag = (!m.inErrorBook && m.isSlow) ? ' ⏳想很久半熟題' : '';
        mistakeLines.push(`### ${idx + 1}. [${m.unit}${m.cat ? ' / ' + m.cat : ''}]${starTag}${slowTag} (累計錯 ${m.totalWrongCount} 次)`);
        mistakeLines.push(`- **最近答錯時間**：${m.lastWrongTime}`);
        if (m.lastWrongAns) mistakeLines.push(`- **小朋友上次錯答／作答**：\`${m.lastWrongAns}\``);
        if (m.passage) mistakeLines.push(`- **題組原文節錄**：${String(m.passage).slice(0, 180).replace(/\s+/g, ' ')}`);
        mistakeLines.push(`- **原題題幹**：${String(m.q || '').replace(/\s+/g, ' ')}`);
        if (m.opts) mistakeLines.push(`- **原題選項**：${m.opts}`);
        if (m.correct) mistakeLines.push(`- **正確答案**：\`${m.correct}\``);
        if (m.concept) mistakeLines.push(`- **命題核心**：${m.concept}`);
        if (m.trap) mistakeLines.push(`- **原題盲點診斷**：${m.trap}`);
        if (Array.isArray(m.wrongHistory) && m.wrongHistory.length > 0) {
          const histTxt = m.wrongHistory.map(h => `${h.t}（作答：${h.ans}，${h.sec}秒）`).join('；');
          mistakeLines.push(`- **歷次答錯軌跡**：${histTxt}`);
        }
        mistakeLines.push('');
      });
    }

    if (mode === 'text') {
      const textZhuyinLine = cfg.subjectKey === 'g2_chinese'
        ? '- **二年級注音規範（必守）**：本卷為國小二年級學生使用，請在題幹與選項的國字旁以括號標註注音（例：衣裳（ㄧ ㄕㄤ˙）），但測驗「讀音／多音字」的目標字絕對不可標注音以免洩題！'
        : '';
      return [
        `你是一位頂尖的「${profile.gradeLabel} ${profile.title}」一對一專屬家教。`,
        `請根據學生【${user.name}】以下真實錯題與作答時間紀錄，用繁體中文完成弱點診斷並出題練習：`,
        `- 篩選範圍：${rangeLabel}｜${batchTag}`,
        `- 出題數量：共 **${targetTotal} 題**（**${varCount} 題同考點變形題** ＋ **${extCount} 題生活／跨單元延伸題**，每題皆不得照抄原題）。`,
        `- 語氣規範：${profile.toneRule}`,
        ...(textZhuyinLine ? [textZhuyinLine] : []),
        '',
        '## 【請依下列 3 步驟輸出】：',
        '1. **👨‍👩‍👧 錯因總診斷與秒殺口訣**：先歸納 2～3 個核心觀念漏洞（點出為何會被誘答騙到），附上好記口訣。',
        `2. **📝 實戰練習題目（一次列出全部 ${targetTotal} 題，此區嚴禁先洩漏答案！）**：請標明每題是「變形題」還是「延伸題」，並混合選擇題與紙筆作答題。`,
        '3. **🔑 完整解答與 4D 詳解（統一放在最末段）**：每題必須提供【正確答案】、【D1 命題核心】、【D2 破題步驟】、【D3 避坑診斷（剖析各誘答陷阱）】與【延伸記憶點】。',
        '',
        '---',
        `## 📋 【${user.name}】真實錯題明細（匯出時間：${nowStr}）`,
        '',
        ...mistakeLines
      ].join('\n');
    }

    const zhuyinSectionLines = profile.zhuyinRule
      ? [
          '   - **🔤 二年級注音強制規範**：',
          `     - ${profile.zhuyinRule}`
        ]
      : [];

    // Default: Gemini Canvas mode
    return [
      `請開啟 **Gemini Canvas**，化身「${profile.gradeLabel} ${profile.title}」專業教研與前端工程師，為學生【${user.name}】製作一份**單檔可直接執行的互動式網頁考卷（HTML + CSS + JS）**。`,
      '',
      '## 一、任務參數與出題規模',
      `- **學員／科目**：${user.name} ｜ ${profile.title}（${profile.gradeLabel}）`,
      `- **錯題篩選**：${rangeLabel} ｜ ${batchTag}`,
      `- **出題總數**：請一次列出 **${targetTotal} 題**全新題目：`,
      `  - **${varCount} 題「同考點變形題」**：100% 鎖定下方錯題核心盲點（特別加倍針對標註 \`⭐高頻弱點\` 的題目），但必須**全面更換生活情境、詞彙或數字**，嚴禁照抄原題！`,
      `  - **${extCount} 題「生活／跨單元延伸題」**：在同樣觀念上向上延伸一層生活素養或跨單元綜合推理。`,
      '',
      '## 二、網頁外觀與工程防呆規範（嚴格遵守，防止白畫面或破版）',
      `1. **單檔純淨零外部相依**：只輸出完整單一 HTML 檔案（含 \`<style>\` 與 \`<script>\`）。**嚴禁引入任何外部 CDN \`<script>\` 或 \`<link>\`**（不可用 Tailwind CDN、Chart.js CDN 或 MathJax/KaTeX CDN），確保在手機與 Gemini Canvas 沙盒 100% 正常執行。`,
      `2. **視覺風格對齊原站**：背景色 \`${profile.bgColor}\`、主強調色 \`${profile.primaryColor}\`、深淺模式 \`${profile.theme}\`，卡片圓角 16px、響應式設計（手機 390px 單欄好點擊、電腦版置中 max-width 880px）。`,
      `3. **資料與畫面完全解耦**：所有題目必須先完整定義在頂部 \`const QUESTIONS = [ ... ];\` 陣列中；事件監聽統一使用 \`data-idx\` 與 \`addEventListener\`，**嚴禁在 HTML 屬性 \`onclick="..."\` 內拼接中文或引號字串**。`,
      `4. **內建 A4 列印考卷功能**：右上角放置「🖨️ 列印 A4 空白卷」按鈕（呼叫 \`window.print()\`），並寫好 \`@media print\` 規則（列印時自動隱藏操作按鈕與解答，保留題目與充足手寫作答空間）。`,
      '',
      '## 三、互動體驗與 4D＋3E 詳解規格（對齊學生平時用的練習網頁）',
      `1. **教學語氣**：${profile.toneRule}`,
      ...zhuyinSectionLines,
      `2. **頂部可折疊「👨‍👩‍👧 家長版錯因總診斷」**：總結本次錯題的 2～3 個核心漏洞、對應生活類比與必背秒殺口訣。`,
      `3. **一次列齊雙題型互動**：${profile.questionTypesRule}`,
      '   - **選擇題**：點擊選項後即時顯示「✅ 答對」或「❌ 答錯（標出你的錯選與正解）」，並立即展開 4D 詳解卡。',
      '   - **紙筆手寫／自評題**：顯示題目與手寫提示框，提供「👀 核對答案」按鈕；點擊後先展開標準答案與 4D 詳解，再顯示三態自評鈕：「✅ 秒殺答對」、「⏳ 想很久才對」、「❌ 答錯要重練」。',
      '4. **完整 4D＋3E 詳解卡片結構（每題答後必現）**：',
      '   - **🎯 D1 命題核心**：一句話點出這題在考課本/考卷哪個關鍵觀念。',
      '   - **🪜 D2 破題步驟 ＋ ⚡ 秒殺口訣**：分步驟列出清晰推導，並附上好記口訣。',
      '   - **⚠️ D3 避坑診斷與誘答剖析**：明確點出各錯誤選項為何是陷阱、學生原本為何容易中計。',
      `   - **🧩 D4 視覺化圖解積木**：${profile.d4VisualRule}`,
      '   - **📚 3E 延伸自修（`<details>` 折疊卡）**：列出易混淆比較、延伸變式提醒或生活應用舉一反三。',
      `5. **科別特別規範**：${profile.extraPedagogyRule}`,
      '6. **底部結算總表**：統計已完成題數、三態分佈（✅/⏳/❌）與得分率，並提供一顆「🔥 只重練本輪錯題 / 想很久」按鈕。',
      '',
      '---',
      `## 四、學員【${user.name}】真實錯題與時間歷程明細（匯出時間：${nowStr}）`,
      '',
      ...mistakeLines
    ].join('\n');
  }

  function copyTextSafe(text) {
    if (!text) return Promise.resolve(false);
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      return navigator.clipboard.writeText(text).then(() => true).catch(() => fallbackExecCopy(text));
    }
    return Promise.resolve(fallbackExecCopy(text));
  }

  function fallbackExecCopy(text) {
    if (typeof document === 'undefined') return false;
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, ta.value.length);
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return !!ok;
    } catch (e) {
      return false;
    }
  }

  function escHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function injectStylesOnce() {
    if (typeof document === 'undefined' || document.getElementById('ai-export-core-styles')) return;
    const style = document.createElement('style');
    style.id = 'ai-export-core-styles';
    style.textContent = `
      .aix-wrap { max-width: 920px; margin: 0 auto; padding: 12px 0 36px; box-sizing: border-box; color: var(--ink, #1e1b4b); }
      .aix-card { background: var(--card-solid, #ffffff); border: 1.5px solid var(--line, #e2e8f0); border-radius: 20px; padding: 20px; box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06); }
      .aix-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
      .aix-head h2 { margin: 0 0 4px; font-size: 20px; line-height: 1.3; }
      .aix-sub { font-size: 13px; color: var(--ink-2, #64748b); }
      .aix-head-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
      .aix-status { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #eef2ff; color: #4338ca; }
      .aix-status.is-local { background: #fef3c7; color: #92400e; }
      .aix-status.is-loading { background: #e0f2fe; color: #0369a1; }
      .aix-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px; }
      .aix-label { font-size: 13px; font-weight: 800; color: var(--ink-2, #475569); margin-right: 4px; }
      .aix-pill { border: 1.5px solid var(--line, #cbd5e1); background: #fff; color: var(--ink, #1e293b); padding: 7px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; cursor: pointer; transition: all .15s; }
      .aix-pill:hover { border-color: var(--primary, #5b4bdb); }
      .aix-pill.active { background: var(--primary, #5b4bdb); border-color: var(--primary, #5b4bdb); color: #fff; }
      .aix-pill.sm { padding: 5px 10px; font-size: 12px; }
      .aix-date-box { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 10px 12px; border-radius: 12px; background: #f8fafc; border: 1px solid var(--line, #e2e8f0); margin-bottom: 12px; }
      .aix-date-box input[type="date"] { padding: 5px 8px; border-radius: 8px; border: 1.5px solid #cbd5e1; font-size: 13px; color: #1e293b; background: #fff; }
      .aix-chk { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; cursor: pointer; padding: 5px 10px; border-radius: 10px; background: #f8fafc; border: 1px solid var(--line, #e2e8f0); }
      .aix-calc-bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; padding: 12px 14px; border-radius: 14px; background: #f5f3ff; border: 1.5px solid #ddd6fe; margin-bottom: 12px; color: #1e1b4b; }
      .aix-calc-main { font-size: 14px; font-weight: 800; }
      .aix-num-input { width: 62px; padding: 4px 6px; border-radius: 8px; border: 1.5px solid #c4b5fd; font-size: 13px; font-weight: 800; text-align: center; background: #fff; color: #1e1b4b; }
      .aix-list-box { border: 1.5px solid var(--line, #e2e8f0); border-radius: 14px; margin-bottom: 14px; overflow: hidden; background: #fff; }
      .aix-list-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 8px; padding: 10px 14px; background: #f8fafc; border-bottom: 1px solid var(--line, #e2e8f0); font-size: 13px; font-weight: 800; color: #334155; }
      .aix-list-scroll { max-height: 240px; overflow-y: auto; }
      .aix-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-size: 13px; cursor: pointer; color: #1e293b; }
      .aix-item:last-child { border-bottom: none; }
      .aix-item:hover { background: #f8fafc; }
      .aix-item input[type="checkbox"] { margin-top: 3px; width: 17px; height: 17px; accent-color: var(--primary, #5b4bdb); flex-shrink: 0; }
      .aix-item-body { flex: 1; min-width: 0; }
      .aix-item-meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-bottom: 3px; }
      .aix-tag { display: inline-block; padding: 2px 7px; border-radius: 6px; font-size: 11px; font-weight: 800; background: #e2e8f0; color: #334155; }
      .aix-tag.hot { background: #fee2e2; color: #b91c1c; }
      .aix-tag.slow { background: #fef3c7; color: #92400e; }
      .aix-tag.time { background: #e0f2fe; color: #0369a1; }
      .aix-item-stem { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #0f172a; font-weight: 600; }
      .aix-item-ans { font-size: 12px; color: #64748b; margin-top: 2px; }
      .aix-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; }
      .aix-btn { border: none; border-radius: 12px; padding: 10px 16px; font-size: 14px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: transform .1s, opacity .15s; }
      .aix-btn:active { transform: scale(0.98); }
      .aix-btn-primary { background: var(--primary, #5b4bdb); color: #fff; }
      .aix-btn-gemini { background: linear-gradient(135deg, #2563eb, #7c3aed); color: #fff; }
      .aix-btn-ghost { background: #f1f5f9; color: #1e293b; border: 1px solid #cbd5e1; }
      .aix-textarea { width: 100%; box-sizing: border-box; min-height: 290px; padding: 14px; border-radius: 14px; border: 1.5px solid var(--line, #cbd5e1); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12.5px; line-height: 1.55; background: #f8fafc; color: #0f172a; resize: vertical; }
      .aix-wrap.is-dark { color: #f8fafc; }
      .aix-wrap.is-dark .aix-card { background: #1e293b; border-color: #334155; color: #f8fafc; }
      .aix-wrap.is-dark .aix-sub, .aix-wrap.is-dark .aix-label { color: #cbd5e1; }
      .aix-wrap.is-dark .aix-pill { background: #0f172a; border-color: #475569; color: #e2e8f0; }
      .aix-wrap.is-dark .aix-pill.active { background: #0ea5e9; border-color: #0ea5e9; color: #fff; }
      .aix-wrap.is-dark .aix-date-box, .aix-wrap.is-dark .aix-chk { background: #0f172a; border-color: #334155; color: #e2e8f0; }
      .aix-wrap.is-dark .aix-date-box input[type="date"], .aix-wrap.is-dark .aix-num-input { background: #1e293b; border-color: #475569; color: #f8fafc; }
      .aix-wrap.is-dark .aix-calc-bar { background: rgba(14, 165, 233, 0.14); border-color: #0284c7; color: #f8fafc; }
      .aix-wrap.is-dark .aix-list-box { background: #0f172a; border-color: #334155; }
      .aix-wrap.is-dark .aix-list-head { background: #1e293b; border-color: #334155; color: #e2e8f0; }
      .aix-wrap.is-dark .aix-item { border-color: #1e293b; color: #e2e8f0; }
      .aix-wrap.is-dark .aix-item:hover { background: #1e293b; }
      .aix-wrap.is-dark .aix-item-stem { color: #f8fafc; }
      .aix-wrap.is-dark .aix-item-ans { color: #94a3b8; }
      .aix-wrap.is-dark .aix-btn-ghost { background: #0f172a; color: #e2e8f0; border-color: #475569; }
      .aix-wrap.is-dark .aix-textarea { background: #0f172a; border-color: #334155; color: #e2e8f0; }
      .aix-modal-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(15, 23, 42, 0.65); backdrop-filter: blur(4px); display: flex; align-items: flex-start; justify-content: center; padding: 18px 12px; overflow-y: auto; box-sizing: border-box; }
      .aix-modal-shell { width: 100%; max-width: 940px; position: relative; }
      .aix-modal-shell .aix-wrap { padding: 0; }
      @media (max-width: 600px) {
        .aix-card { padding: 14px; border-radius: 16px; }
        .aix-btn { width: 100%; justify-content: center; }
        .aix-head-actions { width: 100%; justify-content: space-between; }
        .aix-modal-overlay { padding: 8px; }
      }
    `;
    document.head.appendChild(style);
  }

  function mountExportCenter(containerEl, adapter) {
    if (!containerEl || !adapter) return null;
    injectStylesOnce();

    const todayStr = formatDateInputValue(Date.now());
    const sevenDaysAgoStr = formatDateInputValue(Date.now() - 7 * 24 * 3600 * 1000);

    const uiState = {
      mode: 'canvas', // 'canvas' | 'text' | 'json'
      rangeMode: 'error_book', // 'error_book' | '7d' | '30d' | 'custom'
      customStartDate: sevenDaysAgoStr,
      customEndDate: todayStr,
      onlyUnresolved: false,
      includeSlow: false,
      includeUndated: true,
      sortMode: 'freq', // 'freq' | 'recent'
      multiplier: 2,
      customTargetCount: 0,
      splitMode: 'auto', // 'auto' | 'all'
      batchSize: 8,
      batchIndex: 0,
      listCollapsed: false,
      cloudState: 'loading', // 'loading' | 'cloud' | 'local'
      cloudCount: 0,
      mergedLogs: [],
      deselectedIds: new Set(),
      knownIds: new Set()
    };

    const toast = (msg) => {
      if (typeof adapter.onToast === 'function') adapter.onToast(msg);
    };

    let currentCatalog = { items: [], undatedCount: 0, unitCount: 0 };
    let currentPrompt = '';
    let isDisposed = false;

    async function loadCloudLogs() {
      uiState.cloudState = 'loading';
      renderUI();
      let startMs = 0;
      let endMs = Date.now();
      if (uiState.rangeMode === '7d') startMs = Date.now() - 7 * 24 * 3600 * 1000;
      else if (uiState.rangeMode === '30d') startMs = Date.now() - 30 * 24 * 3600 * 1000;
      else if (uiState.rangeMode === 'custom') {
        startMs = parseDateInputStartMs(uiState.customStartDate);
        endMs = parseDateInputEndMs(uiState.customEndDate);
      }

      const res = await fetchCloudAnswerLogs({
        dbUrl: adapter.dbUrl,
        logsNode: adapter.logsNode,
        uid: adapter.uid,
        startMs,
        endMs,
        localLogs: adapter.localLogs || [],
        legacyHistory: adapter.legacyHistory || []
      });
      if (isDisposed) return;
      uiState.mergedLogs = res.logs;
      uiState.cloudCount = res.cloudCount;
      uiState.cloudState = res.source === 'cloud' ? 'cloud' : 'local';
      renderUI();
    }

    function computeState() {
      currentCatalog = buildMistakeCatalog({
        rangeMode: uiState.rangeMode,
        customStartDate: uiState.customStartDate,
        customEndDate: uiState.customEndDate,
        onlyUnresolved: uiState.onlyUnresolved,
        includeSlow: uiState.includeSlow,
        includeUndated: uiState.includeUndated,
        sortMode: uiState.sortMode,
        allQuestionsMap: adapter.allQuestionsMap || {},
        errorBookIds: adapter.errorBookIds || [],
        errorCounts: adapter.errorCounts || {},
        slowCounts: adapter.slowCounts || {},
        slowIds: adapter.slowIds || [],
        logs: uiState.mergedLogs
      });

      // Default select newly seen items
      for (const item of currentCatalog.items) {
        if (!uiState.knownIds.has(item.id)) {
          uiState.knownIds.add(item.id);
        }
      }
      const selectedItems = currentCatalog.items.filter(item => !uiState.deselectedIds.has(item.id));
      const effectiveSplit = uiState.mode === 'json' ? 'all' : uiState.splitMode;
      const batches = splitIntoBatches(selectedItems, uiState.batchSize, effectiveSplit);
      if (uiState.batchIndex >= batches.length) uiState.batchIndex = Math.max(0, batches.length - 1);
      const batchItems = batches[uiState.batchIndex] || [];

      currentPrompt = buildPromptOutput({
        mode: uiState.mode,
        subjectKey: adapter.subjectKey,
        user: adapter.user,
        rangeMode: uiState.rangeMode,
        customStartDate: uiState.customStartDate,
        customEndDate: uiState.customEndDate,
        onlyUnresolved: uiState.onlyUnresolved,
        includeSlow: uiState.includeSlow,
        sortMode: uiState.sortMode,
        multiplier: uiState.multiplier,
        customTargetCount: uiState.customTargetCount,
        splitMode: effectiveSplit,
        selectedItems,
        batchItems,
        batchIndex: uiState.batchIndex,
        totalBatches: batches.length,
        mergedLogs: uiState.mergedLogs
      });

      return { selectedItems, batches, batchItems, effectiveSplit };
    }

    function renderUI() {
      if (isDisposed) return;
      const profile = SUBJECT_PROFILES[adapter.subjectKey] || SUBJECT_PROFILES.g6_chinese;
      const { selectedItems, batches, batchItems, effectiveSplit } = computeState();

      const cloudBadgeText = uiState.cloudState === 'loading'
        ? '🔄 正在拉取雲端錯題時間...'
        : uiState.cloudState === 'cloud'
          ? `☁️ 已合併雲端 ${uiState.cloudCount} 筆時間紀錄`
          : `💾 使用本機與歷史紀錄 (${uiState.mergedLogs.length} 筆)`;
      const cloudBadgeClass = uiState.cloudState === 'loading' ? 'is-loading' : (uiState.cloudState === 'local' ? 'is-local' : '');

      const calcTarget = uiState.customTargetCount > 0
        ? uiState.customTargetCount
        : (batchItems.length > 0 ? batchItems.length * uiState.multiplier : 6);

      const batchPillsHtml = (effectiveSplit === 'auto' && batches.length > 1)
        ? `<div class="aix-row" style="margin-top:8px; margin-bottom:0;">
            <span class="aix-label">選擇分卷（防 Gemini 截斷）：</span>
            ${batches.map((b, idx) => {
              const startNo = idx * uiState.batchSize + 1;
              const endNo = startNo + b.length - 1;
              return `<button type="button" class="aix-pill sm ${uiState.batchIndex === idx ? 'active' : ''}" data-aix-batch="${idx}">第 ${idx + 1} 卷 (${startNo}~${endNo}題 ➔ 出${b.length * uiState.multiplier}題)</button>`;
            }).join('')}
          </div>`
        : '';

      const listHtml = currentCatalog.items.length === 0
        ? `<div style="padding:16px; text-align:center; font-size:13px; color:#64748b;">目前此條件下無錯題（仍可複製 Prompt 讓 AI 針對本冊高頻易錯點出挑戰題）。</div>`
        : currentCatalog.items.map(item => {
            const checked = !uiState.deselectedIds.has(item.id);
            const shortStem = String(item.q || '').replace(/\s+/g, ' ').slice(0, 56);
            return `
              <label class="aix-item">
                <input type="checkbox" data-aix-chk="${escHtml(item.id)}" ${checked ? 'checked' : ''}>
                <div class="aix-item-body">
                  <div class="aix-item-meta">
                    <span class="aix-tag">${escHtml(item.unit)}</span>
                    <span class="aix-tag hot">錯 ${item.totalWrongCount} 次${item.totalWrongCount >= 2 ? ' ⭐' : ''}</span>
                    ${(!item.inErrorBook && item.isSlow) ? `<span class="aix-tag slow">⏳ 想很久</span>` : ''}
                    <span class="aix-tag time">🕒 ${escHtml(item.lastWrongTime)}</span>
                  </div>
                  <div class="aix-item-stem">${escHtml(shortStem)}</div>
                  ${item.lastWrongAns ? `<div class="aix-item-ans">上次作答：${escHtml(item.lastWrongAns)}${item.correct ? ` ｜ 正解：${escHtml(item.correct)}` : ''}</div>` : ''}
                </div>
              </label>
            `;
          }).join('');

      containerEl.innerHTML = `
        <div class="aix-wrap${profile.theme === 'dark' ? ' is-dark' : ''}">
          <div class="aix-card">
            <div class="aix-head">
              <div>
                <h2>📤 匯出給 AI 互動練功（${escHtml(profile.title)}）</h2>
                <div class="aix-sub">複製後丟給手機或電腦 Gemini（開啟 Canvas），直接生成專屬 4D 互動練習網頁！</div>
              </div>
              <div class="aix-head-actions">
                <span class="aix-status ${cloudBadgeClass}">${escHtml(cloudBadgeText)}</span>
                <button type="button" class="aix-pill sm" id="aix-btn-refresh-logs">🔄 重拉雲端</button>
                ${typeof adapter.onBack === 'function' ? `<button type="button" class="aix-pill sm" id="aix-btn-back">← 返回</button>` : ''}
              </div>
            </div>

            <div class="aix-row">
              <span class="aix-label">1. 匯出模式：</span>
              <button type="button" class="aix-pill ${uiState.mode === 'canvas' ? 'active' : ''}" data-aix-mode="canvas">🎨 Gemini Canvas 互動網頁（推薦）</button>
              <button type="button" class="aix-pill ${uiState.mode === 'text' ? 'active' : ''}" data-aix-mode="text">💬 純文字家教＋4D詳解</button>
              <button type="button" class="aix-pill ${uiState.mode === 'json' ? 'active' : ''}" data-aix-mode="json">💻 整份 JSON（給 Antigravity / 除錯）</button>
            </div>

            <div class="aix-row">
              <span class="aix-label">2. 時間與範圍：</span>
              <button type="button" class="aix-pill ${uiState.rangeMode === 'error_book' ? 'active' : ''}" data-aix-range="error_book">🔥 目前待消滅錯題</button>
              <button type="button" class="aix-pill ${uiState.rangeMode === '7d' ? 'active' : ''}" data-aix-range="7d">🕒 近 7 天</button>
              <button type="button" class="aix-pill ${uiState.rangeMode === '30d' ? 'active' : ''}" data-aix-range="30d">📅 近 30 天</button>
              <button type="button" class="aix-pill ${uiState.rangeMode === 'custom' ? 'active' : ''}" data-aix-range="custom">🗓️ 自訂日期</button>
            </div>

            ${uiState.rangeMode === 'custom' ? `
              <div class="aix-date-box">
                <span class="aix-label">起訖日期：</span>
                <input type="date" id="aix-date-start" value="${escHtml(uiState.customStartDate)}">
                <span>至</span>
                <input type="date" id="aix-date-end" value="${escHtml(uiState.customEndDate)}">
                <button type="button" class="aix-pill sm active" id="aix-btn-apply-date">套用區間</button>
              </div>
            ` : ''}

            <div class="aix-row">
              ${uiState.rangeMode !== 'error_book' ? `
                <label class="aix-chk"><input type="checkbox" id="aix-chk-unresolved" ${uiState.onlyUnresolved ? 'checked' : ''}> 只含尚未消滅</label>
              ` : ''}
              ${adapter.supportsSlow ? `
                <label class="aix-chk"><input type="checkbox" id="aix-chk-slow" ${uiState.includeSlow ? 'checked' : ''}> ⏳ 一併納入「想很久」半熟題</label>
              ` : ''}
              ${(uiState.rangeMode !== 'error_book' && currentCatalog.undatedCount > 0) ? `
                <label class="aix-chk"><input type="checkbox" id="aix-chk-undated" ${uiState.includeUndated ? 'checked' : ''}> 含無時間戳舊錯題 (${currentCatalog.undatedCount})</label>
              ` : ''}
              <button type="button" class="aix-pill sm ${uiState.sortMode === 'freq' ? 'active' : ''}" data-aix-sort="freq">🔥 錯最多次優先</button>
              <button type="button" class="aix-pill sm ${uiState.sortMode === 'recent' ? 'active' : ''}" data-aix-sort="recent">🕒 最近答錯優先</button>
            </div>

            <div class="aix-calc-bar">
              <div>
                <div class="aix-calc-main">
                  已勾選 <b>${selectedItems.length}</b> 題錯題（共 ${currentCatalog.unitCount || 0} 個單元）➔ 本次出題目標：<b>${calcTarget} 題</b>
                </div>
                ${batchPillsHtml}
              </div>
              <div class="aix-row" style="margin-bottom:0;">
                <button type="button" class="aix-pill sm ${uiState.multiplier === 1 && !uiState.customTargetCount ? 'active' : ''}" data-aix-mult="1">×1</button>
                <button type="button" class="aix-pill sm ${uiState.multiplier === 2 && !uiState.customTargetCount ? 'active' : ''}" data-aix-mult="2">×2 預設</button>
                <button type="button" class="aix-pill sm ${uiState.multiplier === 3 && !uiState.customTargetCount ? 'active' : ''}" data-aix-mult="3">×3</button>
                <label style="font-size:12px; font-weight:700;">自訂總題數
                  <input type="number" min="1" max="60" class="aix-num-input" id="aix-custom-total" placeholder="${batchItems.length * uiState.multiplier || 6}" value="${uiState.customTargetCount || ''}">
                </label>
                ${uiState.mode !== 'json' ? `
                  <button type="button" class="aix-pill sm ${uiState.splitMode === 'auto' ? 'active' : ''}" data-aix-split="auto">📄 自動分卷(≤8錯題)</button>
                  <button type="button" class="aix-pill sm ${uiState.splitMode === 'all' ? 'active' : ''}" data-aix-split="all">📦 全部整份</button>
                ` : ''}
              </div>
            </div>

            <div class="aix-list-box">
              <div class="aix-list-head">
                <span>☑️ 勾選要交給 AI 的錯題（取消手滑題即時重算）：${selectedItems.length} / ${currentCatalog.items.length}</span>
                <div style="display:flex; gap:6px;">
                  <button type="button" class="aix-pill sm" id="aix-btn-select-all">全選</button>
                  <button type="button" class="aix-pill sm" id="aix-btn-select-none">全不選</button>
                  <button type="button" class="aix-pill sm" id="aix-btn-toggle-list">${uiState.listCollapsed ? '展開清單 ▾' : '收合清單 ▴'}</button>
                </div>
              </div>
              ${uiState.listCollapsed ? '' : `<div class="aix-list-scroll">${listHtml}</div>`}
            </div>

            <div class="aix-actions">
              <button type="button" class="aix-btn aix-btn-primary" id="aix-btn-copy">📋 一鍵複製 ${uiState.mode === 'json' ? 'JSON' : 'Prompt'}</button>
              <button type="button" class="aix-btn aix-btn-gemini" id="aix-btn-open-gemini">✨ 複製並開啟 Gemini（記得開 Canvas）</button>
              <button type="button" class="aix-btn aix-btn-ghost" id="aix-btn-dl">📥 下載 ${uiState.mode === 'json' ? '.json' : '.md'}</button>
            </div>

            <textarea id="ai-prompt-box" class="aix-textarea" readonly>${escHtml(currentPrompt)}</textarea>
          </div>
        </div>
      `;

      bindEvents();
    }

    function bindEvents() {
      const backBtn = containerEl.querySelector('#aix-btn-back');
      if (backBtn && typeof adapter.onBack === 'function') {
        backBtn.onclick = () => {
          isDisposed = true;
          adapter.onBack();
        };
      }
      const refBtn = containerEl.querySelector('#aix-btn-refresh-logs');
      if (refBtn) refBtn.onclick = () => loadCloudLogs();

      containerEl.querySelectorAll('[data-aix-mode]').forEach(btn => {
        btn.onclick = () => {
          uiState.mode = btn.getAttribute('data-aix-mode');
          renderUI();
        };
      });

      containerEl.querySelectorAll('[data-aix-range]').forEach(btn => {
        btn.onclick = () => {
          const nextRange = btn.getAttribute('data-aix-range');
          uiState.rangeMode = nextRange;
          uiState.batchIndex = 0;
          if (nextRange === 'custom') {
            renderUI();
          } else {
            loadCloudLogs();
          }
        };
      });

      const applyDateBtn = containerEl.querySelector('#aix-btn-apply-date');
      if (applyDateBtn) {
        applyDateBtn.onclick = () => {
          const sEl = containerEl.querySelector('#aix-date-start');
          const eEl = containerEl.querySelector('#aix-date-end');
          if (sEl) uiState.customStartDate = sEl.value;
          if (eEl) uiState.customEndDate = eEl.value;
          uiState.batchIndex = 0;
          loadCloudLogs();
        };
      }

      const unresChk = containerEl.querySelector('#aix-chk-unresolved');
      if (unresChk) unresChk.onchange = () => { uiState.onlyUnresolved = unresChk.checked; uiState.batchIndex = 0; renderUI(); };

      const slowChk = containerEl.querySelector('#aix-chk-slow');
      if (slowChk) slowChk.onchange = () => { uiState.includeSlow = slowChk.checked; uiState.batchIndex = 0; renderUI(); };

      const undatedChk = containerEl.querySelector('#aix-chk-undated');
      if (undatedChk) undatedChk.onchange = () => { uiState.includeUndated = undatedChk.checked; uiState.batchIndex = 0; renderUI(); };

      containerEl.querySelectorAll('[data-aix-sort]').forEach(btn => {
        btn.onclick = () => { uiState.sortMode = btn.getAttribute('data-aix-sort'); uiState.batchIndex = 0; renderUI(); };
      });

      containerEl.querySelectorAll('[data-aix-mult]').forEach(btn => {
        btn.onclick = () => {
          uiState.multiplier = Number(btn.getAttribute('data-aix-mult')) || 2;
          uiState.customTargetCount = 0;
          renderUI();
        };
      });

      const customTotalInput = containerEl.querySelector('#aix-custom-total');
      if (customTotalInput) {
        customTotalInput.onchange = () => {
          const v = parseInt(customTotalInput.value, 10);
          uiState.customTargetCount = (Number.isFinite(v) && v > 0) ? Math.min(60, v) : 0;
          renderUI();
        };
      }

      containerEl.querySelectorAll('[data-aix-split]').forEach(btn => {
        btn.onclick = () => {
          uiState.splitMode = btn.getAttribute('data-aix-split');
          uiState.batchIndex = 0;
          renderUI();
        };
      });

      containerEl.querySelectorAll('[data-aix-batch]').forEach(btn => {
        btn.onclick = () => {
          uiState.batchIndex = Number(btn.getAttribute('data-aix-batch')) || 0;
          renderUI();
        };
      });

      containerEl.querySelectorAll('[data-aix-chk]').forEach(chk => {
        chk.onchange = () => {
          const id = chk.getAttribute('data-aix-chk');
          if (chk.checked) uiState.deselectedIds.delete(id);
          else uiState.deselectedIds.add(id);
          uiState.batchIndex = 0;
          renderUI();
        };
      });

      const selAllBtn = containerEl.querySelector('#aix-btn-select-all');
      if (selAllBtn) selAllBtn.onclick = () => { uiState.deselectedIds.clear(); uiState.batchIndex = 0; renderUI(); };

      const selNoneBtn = containerEl.querySelector('#aix-btn-select-none');
      if (selNoneBtn) selNoneBtn.onclick = () => {
        currentCatalog.items.forEach(item => uiState.deselectedIds.add(item.id));
        uiState.batchIndex = 0;
        renderUI();
      };

      const togListBtn = containerEl.querySelector('#aix-btn-toggle-list');
      if (togListBtn) togListBtn.onclick = () => { uiState.listCollapsed = !uiState.listCollapsed; renderUI(); };

      const copyBtn = containerEl.querySelector('#aix-btn-copy');
      if (copyBtn) {
        copyBtn.onclick = () => {
          copyTextSafe(currentPrompt).then(ok => {
            toast(ok ? '✅ 已複製！貼給 Gemini 並開啟「Canvas」即可生成專屬練習網頁' : '⚠️ 自動複製受限，請長按下方文字框全選複製');
          });
        };
      }

      const gemBtn = containerEl.querySelector('#aix-btn-open-gemini');
      if (gemBtn) {
        gemBtn.onclick = () => {
          copyTextSafe(currentPrompt).then(() => {
            toast('✨ 已複製！正在開啟 Gemini，貼上後記得點「Canvas」送出');
            if (typeof window !== 'undefined' && typeof window.open === 'function') {
              window.open('https://gemini.google.com/app', '_blank', 'noopener');
            }
          });
        };
      }

      const dlBtn = containerEl.querySelector('#aix-btn-dl');
      if (dlBtn) {
        dlBtn.onclick = () => {
          const isJson = uiState.mode === 'json';
          const ext = isJson ? 'json' : 'md';
          const mime = isJson ? 'application/json;charset=utf-8' : 'text/markdown;charset=utf-8';
          const prefix = adapter.downloadFilenamePrefix || 'AI練習匯出';
          const uName = (adapter.user && adapter.user.name ? adapter.user.name : adapter.uid || 'student').replace(/\s+/g, '_');
          const dStr = formatDateInputValue(Date.now()).replace(/-/g, '') || 'export';
          const blob = new Blob([currentPrompt], { type: mime });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${prefix}_${uName}_${dStr}.${ext}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast(`📥 已下載 ${a.download}`);
        };
      }
    }

    renderUI();
    loadCloudLogs();
    return {
      refresh: loadCloudLogs,
      dispose: () => { isDisposed = true; }
    };
  }

  function openExportModal(adapter) {
    if (typeof document === 'undefined' || !adapter) return null;
    injectStylesOnce();
    let overlay = document.getElementById('aix-modal-overlay');
    if (overlay) overlay.remove();

    overlay = document.createElement('div');
    overlay.id = 'aix-modal-overlay';
    overlay.className = 'aix-modal-overlay no-print';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    const shell = document.createElement('div');
    shell.className = 'aix-modal-shell';
    overlay.appendChild(shell);
    document.body.appendChild(overlay);

    let ctrl = null;
    function closeModal() {
      if (ctrl && typeof ctrl.dispose === 'function') ctrl.dispose();
      document.removeEventListener('keydown', onKeyDown);
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (typeof adapter.onClose === 'function') adapter.onClose();
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') closeModal();
    }
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', onKeyDown);

    const wrappedAdapter = Object.assign({}, adapter, {
      onBack: closeModal
    });
    ctrl = mountExportCenter(shell, wrappedAdapter);
    return { close: closeModal, refresh: ctrl && ctrl.refresh };
  }

  return {
    VERSION,
    SUBJECT_PROFILES,
    formatTaipeiTime,
    formatDateInputValue,
    parseLogTimestamp,
    normalizeLogRecord,
    createSlimLogEntry,
    saveLocalAnswerLog,
    pushLogToFirebase,
    convertLegacyHistoryToLogs,
    fetchCloudAnswerLogs,
    buildMistakeCatalog,
    splitIntoBatches,
    buildPromptOutput,
    copyTextSafe,
    mountExportCenter,
    openExportModal
  };
});
