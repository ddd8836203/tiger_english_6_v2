#!/usr/bin/env node
/**
 * build_exam_bank.js
 * Validates and compiles modular data/units/*.js Week 12 modules (+ WEEK12_ALL 100-question mock)
 * idempotently into window.MIDTERM_DATABASE (midterm_data.js) and ENGLISH_DATA (english_data.js).
 */

const fs = require('fs');
const path = require('path');
const { validateUnit } = require('./verify_phase_2.js');

const ROOT = __dirname;

const WEEK12_SPECS = [
  {
    mdRel: '六年級上/課本/02_Oxford_Discover_Grammar_3/Unit_16_Food_Facts.md',
    jsRel: 'data/units/odg3_u16.js',
    expected: { id: 'ODG3_U16', unit_id: 'gra3_16', book_id: 'gra3' },
  },
  {
    mdRel: '六年級上/課本/01_Oxford_Discover_3/Unit_16_The_Garden_of_Happiness.md',
    jsRel: 'data/units/od3_u16.js',
    expected: { id: 'OD3_U16', unit_id: 'od3_16', book_id: 'od3' },
  },
  {
    mdRel: '六年級上/課本/03_Reading_with_Writing_6/Unit_09_Getting_to_Know_You.md',
    jsRel: 'data/units/rww6_u09.js',
    expected: { id: 'RWW6_U09', unit_id: 'rw6_9', book_id: 'rw6' },
  },
  {
    mdRel: '六年級上/課本/05_Read_and_Discover_6_Space/Chapter_06_Life_on_Other_Planets.md',
    jsRel: 'data/units/space_ch06.js',
    expected: { id: 'SPACE_CH06', unit_id: 'rd6_6', book_id: 'rd6' },
  },
  {
    mdRel: '六年級上/課本/04_Write_Right_3/Unit_06_A_Great_Person_in_History.md',
    jsRel: 'data/units/wr3_u06.js',
    expected: { id: 'WR3_U06', unit_id: 'wr3_6', book_id: 'wr3' },
  },
];

const FULL_BOOK_NAME_BY_UNIT_ID = {
  ODG3_U16: 'Oxford Discover Grammar 3 • Unit 16',
  OD3_U16: 'Oxford Discover 3 • Unit 16',
  RWW6_U09: 'Reading with Writing 6 • Unit 9',
  SPACE_CH06: 'Read and Discover 6: Space • Chapter 6',
  WR3_U06: 'Write Right 3 • Unit 6',
};

const LINE_EXCERPT_LOOKUP = {
  RWW6_U06: {
    'line 2': {
      excerpt: 'Standing on a corner, you ask someone how to get to a store.',
      target: 'corner',
      def: 'a place where two roads meet.',
    },
    'line 3': {
      excerpt: 'They tell you to "go two blocks north, turn left, and you\'ll be across the street from the bookstore."',
      target: 'Go two blocks',
      def: 'move this far.',
    },
    'line 4': {
      excerpt: 'They tell you to "go two blocks north, turn left, and you\'ll be across the street from the bookstore."',
      target: 'across the street from',
      def: 'on the other side.',
    },
    'line 33': {
      excerpt: 'In a race in a city, you might only need to cross the street to get to the finish line.',
      target: 'cross the street',
      def: 'go to the other side.',
    },
  },
  RWW6_U08: {
    'line 2': {
      excerpt: '"Can you hold the door?" the girl asked Erico in Italian.',
      target: 'Italian',
      def: 'a language from Italy.',
    },
    'line 10': {
      excerpt: '"You sound like you have a British accent, but you have an Italian name. Did you live in England, too?" asked Rosa.',
      target: 'accent',
      def: 'a way to pronounce words.',
    },
    'line 18': {
      excerpt: '"My name is Portuguese, but my family\'s from Australia."',
      target: 'Portuguese',
      def: 'from Portugal.',
    },
    'line 22': {
      excerpt: '"Do they speak Portuguese and English? Are they bilingual? Are you?"',
      target: 'bilingual',
      def: 'speaking two languages.',
    },
  },
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildMaskVariants(ans) {
  const clean = String(ans || '').trim();
  if (!clean) return [];
  const words = clean.split(/\s+/);
  if (words.length > 1) {
    const last = words[words.length - 1];
    const prefix = words.slice(0, -1).map(escapeRegExp).join('\\s+');
    const lastVars = buildMaskVariants(last);
    const first = words[0];
    const rest = words.slice(1).map(escapeRegExp).join('\\s+');
    const firstVars = buildMaskVariants(first);
    const out = [
      `${prefix}\\s+(?:${lastVars.join('|')})`,
      `(?:${firstVars.join('|')})\\s+${rest}`,
      escapeRegExp(clean),
    ];
    if (first.toLowerCase() === 'give') {
      out.push(`(?:gives|gave|given|giving|give)\\s+${rest}`);
    }
    return out;
  }
  const vars = new Set([escapeRegExp(clean)]);
  if (/ies$/i.test(clean) && clean.length > 3) {
    const base = escapeRegExp(clean.slice(0, -3));
    vars.add(`${base}(?:ies|ied|y)`);
  } else if (/oes$/i.test(clean) && clean.length > 3) {
    const base = escapeRegExp(clean.slice(0, -2));
    vars.add(`${base}(?:es|s)?`);
  } else if (/es$/i.test(clean) && clean.length > 3) {
    const base = escapeRegExp(clean.slice(0, -2));
    vars.add(`${base}(?:es|ed|ing|s)?`);
  } else if (/s$/i.test(clean) && !/ss$/i.test(clean) && clean.length > 3) {
    const base = escapeRegExp(clean.slice(0, -1));
    vars.add(`${base}(?:es|s|d|ed|ing)?`);
  } else if (/y$/i.test(clean) && clean.length > 2) {
    const base = escapeRegExp(clean.slice(0, -1));
    vars.add(`${base}(?:ies|ied|ying|y)`);
  } else {
    vars.add(`${escapeRegExp(clean)}(?:es|s|ed|d|ing)?`);
  }
  return Array.from(vars);
}

function maskAnswerInText(text, answer) {
  if (!text || !answer) return text || '';
  const vars = buildMaskVariants(answer);
  if (!vars.length) return text;
  const re = new RegExp(`\\b(?:${vars.join('|')})\\b`, 'gi');
  return String(text).replace(re, '________');
}

function enrichQuizItem(q, unitVocabMap, globalVocabMap, unitIdKey) {
  const next = clone(q);

  if (next.type === 'spelling_listen') {
    const ansLower = String(next.answer || '').toLowerCase().trim();
    const matchedVocab =
      next.vocab_card ||
      (unitVocabMap && unitVocabMap.get(ansLower)) ||
      (globalVocabMap && globalVocabMap.get(ansLower)) ||
      null;

    if (matchedVocab) {
      next.vocab_card = matchedVocab;
    }

    const maskedQ = maskAnswerInText(next.question || '', next.answer || '');
    next.question = maskedQ;

    // Derive target_chi cleanly
    let targetChi = '';
    const mFor = maskedQ.match(/Spell the target [^"]*?"([^"]+)"/);
    const mBracket = maskedQ.match(/表示「([^」]+)」/);
    if (mFor && mFor[1]) {
      targetChi = mFor[1].trim();
    } else if (mBracket && mBracket[1]) {
      targetChi = mBracket[1].trim();
    } else if (matchedVocab && (matchedVocab.chi || matchedVocab.meaning)) {
      targetChi = String(matchedVocab.chi || matchedVocab.meaning).trim();
    } else {
      const sentM = String(next.id || '').match(/TEA_W5_P07_A_Sent(\d+)/);
      if (sentM) {
        targetChi = `課文長篇整句聽寫默寫 — Reading with Writing 6 • Unit 6 定向越野（第 ${Number(sentM[1])} 句）`;
      } else if (next.explanation && typeof next.explanation === 'object' && next.explanation.point) {
        targetChi = String(next.explanation.point).trim();
      }
    }
    next.target_chi = maskAnswerInText(targetChi, next.answer || '');
    let rawPos = (matchedVocab && matchedVocab.pos) || next.target_pos || '';
    rawPos = maskAnswerInText(rawPos, next.answer || '').replace(/\)\s*________[\s\S]*$/, ')').trim();
    next.target_pos = rawPos;

    // Derive masked_example cleanly (prefer a sentence with an actual ________ blank)
    let maskedEx = '';
    let maskedExChi = '';
    const qQuoteM = maskedQ.match(/sentence:\s*"([^"]+)"/i);
    const qQuote = qQuoteM ? qQuoteM[1].trim() : '';
    const vcCtxRaw = (matchedVocab && (matchedVocab.context_eng || matchedVocab.example)) || '';
    const vcCtxMasked = vcCtxRaw ? maskAnswerInText(vcCtxRaw, next.answer || '') : '';

    if (qQuote && qQuote.includes('________')) {
      maskedEx = qQuote;
      if (vcCtxMasked === qQuote && matchedVocab && matchedVocab.context_chi) {
        maskedExChi = matchedVocab.context_chi;
      }
    } else if (vcCtxMasked && vcCtxMasked.includes('________')) {
      maskedEx = vcCtxMasked;
      maskedExChi = (matchedVocab && matchedVocab.context_chi) || '';
    } else if (qQuote) {
      maskedEx = qQuote;
    } else if (vcCtxMasked) {
      maskedEx = vcCtxMasked;
      maskedExChi = (matchedVocab && matchedVocab.context_chi) || '';
    }

    next.masked_example = maskedEx;
    if (maskedExChi) next.masked_example_chi = maskAnswerInText(maskedExChi, next.answer || '');
  }

  // Enrich legacy RWW6_U06 / RWW6_U08 "In line X, ..." questions with self-contained context
  const lineTable = LINE_EXCERPT_LOOKUP[unitIdKey];
  if (lineTable && /^In line \d+/i.test(next.question || '')) {
    const lineM = next.question.match(/In (line \d+)/i);
    const entry = lineM ? lineTable[lineM[1].toLowerCase()] : null;
    if (entry) {
      if (next.type === 'fill' || /______/.test(next.question)) {
        next.passage_excerpt = maskAnswerInText(entry.excerpt, entry.target);
        next.definition_clue = entry.def;
      } else {
        next.passage_excerpt = entry.excerpt;
      }
    }
  }

  return next;
}

function normalizeUnit(raw, globalVocabMap) {
  const u = clone(raw);

  u.passages = (u.passages || []).map((p, idx) => ({
    ...p,
    sequence: p.sequence || idx + 1,
    eng: p.eng || (Array.isArray(p.sentences) ? p.sentences.map((s) => s.en).join(' ') : ''),
    chi: p.chi || (Array.isArray(p.sentences) ? p.sentences.map((s) => s.zh).join(' ') : ''),
    key_sentences: (p.key_sentences || []).map((ks) => ({
      sentence: ks.sentence || '',
      tag: ks.tag || '⭐ Week 12 核心考點',
      note: ks.note || ks.point || '',
      point: ks.point || ks.note || '',
    })),
  }));

  u.vocab = (u.vocab || []).map((v, idx) => ({
    ...v,
    id: v.id || `voc_w12_${u.unit_id}_${idx + 1}`,
    book_id: u.book_id,
    unit_id: u.unit_id,
    is_midterm: true,
    is_week12: true,
    ipa: v.ipa || v.phonetic || '',
    phonetic: v.phonetic || v.ipa || '',
    chi: v.chi || v.meaning || '',
    meaning: v.meaning || v.chi || '',
    context_eng: v.context_eng || v.example || '',
    example: v.example || v.context_eng || '',
  }));

  u.grammar = (u.grammar || []).map((g, idx) => ({
    ...g,
    id: g.id || `gra_w12_${u.unit_id}_${idx + 1}`,
    book_id: u.book_id,
    unit_id: u.unit_id,
    is_week12: true,
  }));

  u.mistake_buster = (u.mistake_buster || []).map((m) => ({
    ...m,
    point: m.point || `${u.id} 必考偵錯`,
    wrong_index: m.wrong_index !== undefined ? m.wrong_index : m.error_token_index,
    error_token_index: m.error_token_index !== undefined ? m.error_token_index : m.wrong_index,
    fixed_sentence: m.fixed_sentence || m.correct_text || '',
    correct_text: m.correct_text || m.fixed_sentence || '',
    reason: m.reason || m.explanation || '',
    explanation: m.explanation || m.reason || '',
  }));

  const vocabByWord = new Map((u.vocab || []).map((v) => [String(v.word || '').toLowerCase().trim(), v]));
  u.quizzes = (u.quizzes || []).map((q) => {
    const enriched = enrichQuizItem(q, vocabByWord, globalVocabMap, u.id);
    return {
      ...enriched,
      book_id: u.book_id,
      unit_id: u.unit_id,
      is_midterm: true,
      is_week12: true,
    };
  });

  return u;
}

function buildCompositeWeek12(units) {
  return {
    id: 'WEEK12_ALL',
    unit_id: 'week12_all',
    book_id: 'tea_midterm',
    book: 'Week 12 Quiz (*EL-3C) 五科全範圍大模考',
    display_title: '🚨 Week 12 (11/18 三) *EL-3C 五科全範圍 156 題大模考 (含聽寫+手寫+選擇)',
    unit_title: '🚨 Week 12 Quiz (11/18 三) *EL-3C 五科全範圍總複習 (156 題)',
    big_question: '涵蓋 Reading with Writing 6 (Unit 9) + Read and Discover 6: Space (Chapter 6) + Oxford Discover Grammar 3 (Unit 16) + Write Right 3 (Unit 6) + Oxford Discover 3 (Unit 16) 全部 4D 實戰題',
    category: 'Week 12 必考衝刺',
    category_icon: '🚨',
    cefr: 'A2+ ~ B1',
    pages: 'Reading with Writing 6 p.62–67 · Read and Discover 6: Space p.24–27 · Oxford Discover Grammar 3 p.80–83 · Write Right 3 p.46–53 · Oxford Discover 3 p.156–163',
    is_midterm: true,
    is_week12: true,
    page_images: units.flatMap((u) => u.page_images || []),
    passages: units.flatMap((u) =>
      u.passages.map((p) => ({
        ...p,
        section_title: `【${FULL_BOOK_NAME_BY_UNIT_ID[u.id] || u.book}】${p.section_title}`,
      }))
    ),
    vocab: units.flatMap((u) => u.vocab),
    grammar: units.flatMap((u) => u.grammar),
    mistake_buster: units.flatMap((u) => u.mistake_buster),
    quizzes: units.flatMap((u) => u.quizzes),
  };
}

function main() {
  console.log('=== Step 1: Validating all 5 Week 12 unit modules ===');
  let errCount = 0;
  for (const spec of WEEK12_SPECS) {
    errCount += validateUnit(spec);
  }
  if (errCount > 0) {
    console.error(`Aborting build: ${errCount} unit validation error(s).`);
    process.exit(1);
  }

  // Load both databases early so we can assemble a complete global vocab lookup
  global.window = global.window || {};
  const midtermPath = path.join(ROOT, 'midterm_data.js');
  delete require.cache[require.resolve(midtermPath)];
  require(midtermPath);
  const existingMidterm = Array.isArray(global.window.MIDTERM_DATABASE) ? global.window.MIDTERM_DATABASE : [];

  const englishPath = path.join(ROOT, 'english_data.js');
  delete require.cache[require.resolve(englishPath)];
  const ed = require(englishPath);

  const rawWeek12Units = WEEK12_SPECS.map((spec) => require(path.join(ROOT, spec.jsRel)));

  const globalVocabMap = new Map();
  const addVocabToMap = (v) => {
    if (!v || !v.word) return;
    const key = String(v.word).toLowerCase().trim();
    if (!key) return;
    const prev = globalVocabMap.get(key);
    // Prefer richer records with chi + context_eng
    if (!prev || (!prev.context_eng && v.context_eng)) {
      globalVocabMap.set(key, v);
    }
  };
  (ed.vocabulary || []).forEach(addVocabToMap);
  existingMidterm.forEach((u) => (u.vocab || []).forEach(addVocabToMap));
  rawWeek12Units.forEach((u) => (u.vocab || []).forEach(addVocabToMap));

  const normalizedUnits = rawWeek12Units.map((raw) => normalizeUnit(raw, globalVocabMap));
  const week12All = buildCompositeWeek12(normalizedUnits);

  // --- Update midterm_data.js ---
  console.log('\n=== Step 2: Updating midterm_data.js ===');
  const targetIds = new Set([...normalizedUnits.map((u) => u.id), 'WEEK12_ALL']);
  const preservedMidterm = existingMidterm
    .filter((u) => !targetIds.has(u.id))
    .map((u) => {
      const nextU = clone(u);
      const unitVocabMap = new Map();
      (nextU.vocab || []).forEach((v) => {
        if (v && v.word) unitVocabMap.set(String(v.word).toLowerCase().trim(), v);
      });
      nextU.quizzes = (nextU.quizzes || []).map((q) => enrichQuizItem(q, unitVocabMap, globalVocabMap, nextU.id));
      return nextU;
    });

  const nextMidterm = [
    ...preservedMidterm,
    ...normalizedUnits.map((u) => ({
      id: u.id,
      book: u.book,
      book_id: u.book_id,
      unit_id: u.unit_id,
      display_title: u.display_title,
      category: u.category,
      category_icon: u.category_icon,
      cefr: u.cefr,
      pages: u.pages,
      is_midterm: true,
      is_week12: true,
      page_images: u.page_images,
      passages: u.passages,
      vocab: u.vocab,
      grammar: u.grammar,
      mistake_buster: u.mistake_buster,
      quizzes: u.quizzes,
    })),
    week12All,
  ];

  const midtermOut =
    `window.MIDTERM_DATABASE = ${JSON.stringify(nextMidterm, null, 2)};\n\n` +
    `if (typeof module !== 'undefined' && module.exports) {\n` +
    `  module.exports = window.MIDTERM_DATABASE;\n` +
    `}\n`;
  fs.writeFileSync(midtermPath, midtermOut, 'utf8');
  console.log(`Updated midterm_data.js: ${nextMidterm.length} units (upserted 5 Week 12 units + WEEK12_ALL, enriched ${preservedMidterm.length} preserved units)`);

  // --- Update english_data.js ---
  console.log('\n=== Step 3: Updating english_data.js ===');
  const w12UnitIds = new Set(normalizedUnits.map((u) => u.unit_id));

  // Update book titles & is_midterm status cleanly
  const bookTitleUpdates = {
    gra3: { book_name: '📘 Oxford Discover Grammar 3 (含 Week 12 U16 & U13~U15)', is_midterm: true },
    wr3: { book_name: '📝 Write Right Level 3 (含 Week 12 U6 & U4~U5)', is_midterm: true },
    rw6: { book_name: '📖 Reading with Writing Level 6 (含 Week 12 U9 & U5~U8)', is_midterm: true },
    rd6: { book_name: '🚀 Read and Discover 6: Space (含 Week 12 Ch6 & Ch4~Ch5)', is_midterm: true },
    od3: { book_name: '📚 Oxford Discover 3 (含 Week 12 U16 & 延伸 U7~U8)', is_midterm: true },
  };
  ed.books = (ed.books || []).map((b) => (bookTitleUpdates[b.book_id] ? { ...b, ...bookTitleUpdates[b.book_id] } : b));

  // Idempotent upsert on units, reading_content, vocabulary, grammar, quizzes
  ed.units = (ed.units || []).filter((u) => !w12UnitIds.has(u.unit_id));
  for (const u of normalizedUnits) {
    ed.units.push({
      book_id: u.book_id,
      unit_id: u.unit_id,
      unit_title: u.unit_title,
      big_question: u.big_question,
      is_midterm: true,
      is_week12: true,
      midterm_unit_id: u.id,
      page_images: u.page_images,
    });
  }

  ed.reading_content = (ed.reading_content || []).filter((r) => !w12UnitIds.has(r.unit_id));
  for (const u of normalizedUnits) {
    u.passages.forEach((p, idx) => {
      ed.reading_content.push({
        book_id: u.book_id,
        unit_id: u.unit_id,
        sequence: p.sequence || idx + 1,
        section_title: p.section_title,
        eng: p.eng,
        chi: p.chi,
        sentences: p.sentences || [],
        key_sentences: p.key_sentences,
        exp_eng: '',
        exp_chi: '',
        is_week12: true,
      });
    });
  }

  ed.vocabulary = (ed.vocabulary || []).filter((v) => !w12UnitIds.has(v.unit_id));
  for (const u of normalizedUnits) {
    for (const v of u.vocab) {
      ed.vocabulary.push({
        id: v.id,
        book_id: u.book_id,
        unit_id: u.unit_id,
        word: v.word,
        ipa: v.ipa,
        pos: v.pos,
        chi: v.chi,
        breakdown: v.breakdown,
        trick: v.trick,
        scene: v.scene,
        collocation: v.collocation,
        img: v.img || '📘',
        context_eng: v.context_eng,
        context_chi: v.context_chi,
        chant: v.chant,
        compare: v.compare,
        is_midterm: true,
        is_week12: true,
      });
    }
  }

  ed.grammar = (ed.grammar || []).filter((g) => !w12UnitIds.has(g.unit_id));
  for (const u of normalizedUnits) {
    for (const g of u.grammar) {
      ed.grammar.push({
        id: g.id,
        book_id: u.book_id,
        unit_id: u.unit_id,
        rule_title: g.rule_title,
        eng_exp: g.eng_exp,
        chi_exp: g.chi_exp,
        formula: g.formula || '',
        intro: g.intro || '',
        categories: g.categories || [],
        pitfalls: g.pitfalls || [],
        examples: g.examples || [],
        trap: g.trap || '',
        is_week12: true,
      });
    }
  }

  const edVocabByUnit = new Map();
  for (const v of ed.vocabulary || []) {
    if (!v || !v.unit_id || !v.word) continue;
    if (!edVocabByUnit.has(v.unit_id)) edVocabByUnit.set(v.unit_id, new Map());
    edVocabByUnit.get(v.unit_id).set(String(v.word).toLowerCase().trim(), v);
  }
  const edUnitToMid = { rw6_6: 'RWW6_U06', rw6_8: 'RWW6_U08' };
  ed.quizzes = (ed.quizzes || [])
    .filter((q) => !w12UnitIds.has(q.unit_id))
    .map((q) => enrichQuizItem(q, edVocabByUnit.get(q.unit_id) || null, globalVocabMap, edUnitToMid[q.unit_id] || q.unit_id));
  for (const u of normalizedUnits) {
    for (const q of u.quizzes) {
      ed.quizzes.push(q);
    }
  }

  ed.metadata = {
    ...(ed.metadata || {}),
    version: '2.2.0-week12-4d',
    generated_at: new Date().toISOString().slice(0, 10),
    total_books: ed.books.length,
    total_units: ed.units.length,
    total_vocab: ed.vocabulary.length,
    total_grammar: ed.grammar.length,
    total_reading: ed.reading_content.length,
    total_quizzes: ed.quizzes.length,
    week12_quizzes: normalizedUnits.reduce((acc, u) => acc + u.quizzes.length, 0),
  };

  const englishBanner =
    `/**\n` +
    ` * 六年級英語特訓系統 — 全域資料層 (v2.2.0 Week 12 KET-4D 整合版)\n` +
    ` * 包含：7大記憶錨點單字卡、100% 課本完整原文、KET-4D 四維詳解與衍伸學習重點\n` +
    ` */\n`;
  const englishOut =
    `${englishBanner}` +
    `const ENGLISH_DATA = ${JSON.stringify(ed, null, 2)};\n` +
    `window.ENGLISH_DATA = ENGLISH_DATA;\n\n` +
    `if (typeof module !== 'undefined' && module.exports) {\n` +
    `  module.exports = ENGLISH_DATA;\n` +
    `}\n`;
  fs.writeFileSync(englishPath, englishOut, 'utf8');
  console.log(`Updated english_data.js: units=${ed.units.length}, vocab=${ed.vocabulary.length}, grammar=${ed.grammar.length}, reading=${ed.reading_content.length}, quizzes=${ed.quizzes.length} (Week 12 = ${ed.metadata.week12_quizzes})`);
}

if (require.main === module) {
  main();
}
