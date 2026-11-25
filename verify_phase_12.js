#!/usr/bin/env node
/**
 * Phase 12 綜合自動化驗收閘門 (verify_phase_12.js)
 *
 * 雙用途設計：
 * 1. 匯出 validateModularUnit({ mdRel, jsRel, expected, requireWeek12 }) 供 build_exam_bank.js 共用；
 * 2. 直接執行：
 *    - `node verify_phase_12.js --data-only`：驗證規格文件、W12 真卷、6 單元模組與編譯資料庫 (P4)；
 *    - `node verify_phase_12.js`：全套驗證（資料層 + 前端 SPRINT_WEEKS / visualBlock / passage_dictation / A4 列印 / P10~P11 承接不變量 / 快取版號）。
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = __dirname;
const PAGE_REF_RE = /\b(page\s*\d+|p\.\s*\d+|exercise\s+[a-h]\b|part\s+[a-h]\s+on\s+page)\b|第\s*\d+\s*頁|課本第/i;
const VALID_VB_KINDS = new Set(['timeline', 'slot_box', 'prep_ladder', 'compare_table']);
const EXPECTED_TRAP_CODES = [
  'ENG_TENSE_MISMATCH',
  'ENG_CHINGLISH_LITERAL',
  'ENG_POS_CONFUSION',
  'ENG_PREP_COLLOCATION',
  'ENG_ARTICLE_ERROR',
  'ENG_VERB_OMISSION',
  'ENG_THERE_BE_VS_HAVE',
  'ENG_UNCOUNTABLE_SVA',
  'ENG_SPELLING_PHONICS',
  'ENG_PUNCT_DICTATION'
];

function escapeRegExp(s) {
  return String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(s) {
  return String(s || '').replace(/\u2019/g, "'").replace(/\s+/g, ' ').trim();
}

function stripTags(html) {
  return String(html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function hasDictationPhraseLeak(visibleText, sentences) {
  const normVis = normalizeText(visibleText).toLowerCase();
  if (!normVis || !Array.isArray(sentences)) return null;
  for (const s of sentences) {
    const words = normalizeText(s && s.en).toLowerCase().replace(/[^a-z0-9'\s]/g, ' ').trim().split(/\s+/).filter(Boolean);
    if (words.length < 3) continue;
    for (let i = 0; i <= words.length - 3; i++) {
      const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      if (normVis.includes(trigram)) return trigram;
    }
  }
  return null;
}

function validateVisualBlockShape(vb) {
  if (!vb || typeof vb !== 'object') return 'visualBlock not an object';
  if (!VALID_VB_KINDS.has(vb.kind)) return `invalid visualBlock.kind: ${vb.kind}`;
  if (!vb.title || typeof vb.title !== 'string') return 'visualBlock missing title';
  if (!vb.data || typeof vb.data !== 'object') return 'visualBlock missing data';
  if (vb.kind === 'timeline' && !Array.isArray(vb.data.events)) return 'timeline missing data.events';
  if (vb.kind === 'slot_box' && !Array.isArray(vb.data.slots)) return 'slot_box missing data.slots';
  if (vb.kind === 'prep_ladder' && !Array.isArray(vb.data.levels)) return 'prep_ladder missing data.levels';
  if (vb.kind === 'compare_table' && (!Array.isArray(vb.data.headers) || !Array.isArray(vb.data.rows))) {
    return 'compare_table missing headers/rows';
  }
  return null;
}

function validateModularUnit({ mdRel, jsRel, expected, requireWeek12 = false }) {
  let failures = 0;
  function fail(msg) {
    console.error('FAIL:', msg);
    failures++;
  }
  function assert(cond, msg) {
    if (!cond) fail(msg);
  }

  const mdPath = path.join(ROOT, mdRel);
  const jsPath = path.join(ROOT, jsRel);

  assert(fs.existsSync(mdPath), `Missing MD file: ${mdRel}`);
  if (fs.existsSync(mdPath)) {
    const md = fs.readFileSync(mdPath, 'utf8');
    assert(md.length >= 1500, `${mdRel} too short (${md.length} chars)`);
    const hasLayer1 = md.includes('第一層') || md.includes('PART 1');
    assert(hasLayer1 && md.includes('AI_SPEC'), `${mdRel} missing Dual-Layer sections`);
  }

  assert(fs.existsSync(jsPath), `Missing JS module: ${jsRel}`);
  if (!fs.existsSync(jsPath)) return failures;

  delete require.cache[require.resolve(jsPath)];
  const u = require(jsPath);

  assert(u.id === expected.id, `${jsRel}: id expected ${expected.id}, got ${u.id}`);
  assert(u.unit_id === expected.unit_id, `${jsRel}: unit_id expected ${expected.unit_id}, got ${u.unit_id}`);
  assert(u.book_id === expected.book_id, `${jsRel}: book_id expected ${expected.book_id}, got ${u.book_id}`);
  assert(u.is_midterm === true, `${jsRel}: is_midterm must be true`);
  if (requireWeek12) assert(u.is_week12 === true, `${jsRel}: is_week12 must be true`);
  if (expected.is_week13) assert(u.is_week13 === true, `${jsRel}: is_week13 must be true`);
  assert(Array.isArray(u.page_images) && u.page_images.length > 0, `${jsRel}: missing page_images`);

  assert(Array.isArray(u.passages) && u.passages.length >= 2, `${jsRel}: passages.length >= 2`);
  (u.passages || []).forEach((p, idx) => {
    assert(p.section_title && p.eng && p.chi, `${jsRel} passage[${idx}] missing section_title/eng/chi`);
    assert(!/_{3,}/.test(p.eng), `${jsRel} passage[${idx}] contains cloze underscores ___`);
    assert(Array.isArray(p.sentences) && p.sentences.length >= 2, `${jsRel} passage[${idx}] needs >= 2 sentences`);
    assert(Array.isArray(p.key_sentences) && p.key_sentences.length >= 1, `${jsRel} passage[${idx}] needs key_sentences`);
  });

  assert(Array.isArray(u.vocab) && u.vocab.length >= 10, `${jsRel}: vocab.length >= 10 (got ${u.vocab?.length})`);
  const reqVocab = ['word', 'ipa', 'phonetic', 'syllables', 'pos', 'chi', 'meaning', 'breakdown', 'trick', 'scene', 'collocation', 'context_eng', 'example', 'context_chi', 'chant', 'compare', 'note'];
  (u.vocab || []).forEach((v, idx) => {
    for (const k of reqVocab) {
      assert(v[k] && String(v[k]).trim().length > 0, `${jsRel} vocab[${idx}] (${v.word}) missing field: ${k}`);
    }
  });

  assert(Array.isArray(u.grammar) && u.grammar.length >= 2, `${jsRel}: grammar.length >= 2`);
  (u.grammar || []).forEach((g, idx) => {
    assert(g.rule_title && g.eng_exp && g.chi_exp && Array.isArray(g.examples) && g.examples.length >= 2, `${jsRel} grammar[${idx}] incomplete`);
  });

  assert(Array.isArray(u.mistake_buster) && u.mistake_buster.length >= 6, `${jsRel}: mistake_buster.length >= 6`);
  (u.mistake_buster || []).forEach((m, idx) => {
    assert(Array.isArray(m.tokens) && m.tokens.join(' ') === m.sentence, `${jsRel} mb[${idx}] tokens.join(' ') !== sentence`);
    assert(m.tokens[m.wrong_index] === m.wrong_word, `${jsRel} mb[${idx}] tokens[${m.wrong_index}]="${m.tokens?.[m.wrong_index]}" !== "${m.wrong_word}"`);
    assert(m.correct_word && m.fixed_sentence && m.reason, `${jsRel} mb[${idx}] missing fix/reason`);
  });

  assert(Array.isArray(u.quizzes) && u.quizzes.length >= 20, `${jsRel}: quizzes.length >= 20 (got ${u.quizzes?.length})`);
  let tier1 = 0, tier2 = 0, tier3 = 0;
  (u.quizzes || []).forEach((q, idx) => {
    const label = `${jsRel} quiz[${idx}] (${q.id})`;
    assert(q.id && q.type && q.difficulty && q.question && q.answer, `${label}: missing base fields`);
    assert(!PAGE_REF_RE.test(q.question), `${label}: non-self-contained page ref in question: "${q.question}"`);
    if (q.difficulty === '★☆☆☆☆' || q.difficulty === '★★☆☆☆') tier1++;
    else if (q.difficulty === '★★★☆☆' || q.difficulty === '★★★★☆') tier2++;
    else if (q.difficulty === '★★★★★') tier3++;

    const exp = q.explanation || {};
    assert(exp.point && exp.point.length >= 10, `${label}: explanation.point too short`);
    assert(exp.examPurpose && exp.examPurpose.length >= 18, `${label}: explanation.examPurpose < 18 chars`);
    assert(exp.correctReason && exp.correctReason.length >= 20, `${label}: explanation.correctReason < 20 chars`);
    assert(exp.note && exp.trap, `${label}: missing explanation.note or trap`);

    if (exp.visualBlock) {
      const vbErr = validateVisualBlockShape(exp.visualBlock);
      assert(!vbErr, `${label}: ${vbErr}`);
    }
    if (q.triadGroup) {
      assert(q.triadGroup.groupId && ['L1-3', 'L4-6', 'L7-10'].includes(q.triadGroup.tier), `${label}: invalid triadGroup`);
    }

    if (q.type === 'passage_dictation') {
      assert(Array.isArray(q.dictation_sentences) && q.dictation_sentences.length >= 2, `${label}: passage_dictation needs >= 2 dictation_sentences`);
      assert(typeof q.full_audio_text === 'string' && q.full_audio_text.trim().length >= 20, `${label}: passage_dictation missing full_audio_text`);
      assert(Array.isArray(q.self_check) && q.self_check.length >= 3, `${label}: passage_dictation needs >= 3 self_check items`);
      const leak = hasDictationPhraseLeak(`${q.question} ${q.target_chi || ''} ${q.part_instructions || ''}`, q.dictation_sentences);
      assert(!leak, `${label}: passage_dictation leaked English trigram "${leak}" before reveal`);
    }

    if (Array.isArray(q.options) && q.options.length > 0) {
      assert(q.options.length === 4, `${label}: choice question must have 4 distinct options`);
      assert(new Set(q.options).size === 4, `${label}: duplicate options detected`);
      assert(q.options.includes(q.answer), `${label}: answer "${q.answer}" not in options`);
      const da = exp.distractorAnalysis || {};
      const wrongs = q.options.filter((opt) => opt !== q.answer);
      for (const w of wrongs) {
        assert(da[w] && String(da[w]).trim().length >= 12, `${label}: distractorAnalysis missing/short for wrong option "${w}"`);
      }
    } else {
      assert(Array.isArray(exp.commonTraps) && exp.commonTraps.length >= 2, `${label}: non-choice question must have commonTraps.length >= 2`);
    }

    const ext = q.extensionStudy || {};
    assert(Array.isArray(ext.synonyms) && ext.synonyms.length >= 2, `${label}: extensionStudy.synonyms.length >= 2`);
    assert(ext.grammarCompare && ext.grammarCompare.length >= 18, `${label}: extensionStudy.grammarCompare < 18 chars`);
    assert(ext.examVariations && ext.examVariations.length >= 18, `${label}: extensionStudy.examVariations < 18 chars`);
  });

  assert(tier1 >= 6 && tier2 >= 6 && tier3 >= 3, `${jsRel}: uneven difficulty tiers (t1=${tier1}, t2=${tier2}, t3=${tier3})`);
  console.log(`OK [${expected.id}] vocab=${u.vocab?.length}, passages=${u.passages?.length}, mb=${u.mistake_buster?.length}, quizzes=${u.quizzes?.length} (tiers ${tier1}/${tier2}/${tier3})`);
  return failures;
}

function runMainVerification(dataOnly = false) {
  let passes = 0;
  let failures = 0;
  function check(cond, msg) {
    if (cond) passes++;
    else {
      failures++;
      console.error('FAIL:', msg);
    }
  }

  console.log(`=== [Phase 12 綜合驗收開始${dataOnly ? ' (data-only)' : ''}] ===`);

  // 1. JS Syntax checks
  const jsFiles = [
    'app.js',
    'build_exam_bank.js',
    'midterm_data.js',
    'english_data.js',
    'data/units/odg3_u16.js',
    'data/units/od3_u16.js',
    'data/units/rww6_u09.js',
    'data/units/space_ch06.js',
    'data/units/wr3_u06.js',
    'data/units/rww6_u06.js',
    'data/exams/tea_w12.js'
  ];
  for (const rel of jsFiles) {
    const abs = path.join(ROOT, rel);
    check(fs.existsSync(abs), `檔案存在：${rel}`);
    if (fs.existsSync(abs)) {
      try {
        execFileSync(process.execPath, ['--check', abs], { stdio: 'pipe' });
        check(true, `語法檢查通過：${rel}`);
      } catch (err) {
        check(false, `語法檢查失敗 ${rel}: ${err.stderr ? err.stderr.toString() : err.message}`);
      }
    }
  }

  // 2. 4D 規範檔與 Week 12 真卷資產
  const univMdPath = path.join(ROOT, '4D_跨學科通用_深度出題與詳解總綱.md');
  const engMdPath = path.join(ROOT, '4D_英文科_出題與詳解規範.md');
  check(fs.existsSync(univMdPath), '4D_跨學科通用_深度出題與詳解總綱.md 存在');
  if (fs.existsSync(univMdPath)) {
    const uMd = fs.readFileSync(univMdPath, 'utf8');
    check(!uMd.includes('เห็น'), '4D 跨學科總綱已清除泰文錯字 เห็น');
    check(uMd.includes('4D_英文科_出題與詳解規範.md'), '4D 跨學科總綱已連結英文科子規範');
  }
  check(fs.existsSync(engMdPath), '4D_英文科_出題與詳解規範.md 存在');
  if (fs.existsSync(engMdPath)) {
    const eMd = fs.readFileSync(engMdPath, 'utf8');
    for (const tc of EXPECTED_TRAP_CODES) {
      check(eMd.includes(tc), `4D 英文科規範包含 ${tc}`);
    }
    for (const k of VALID_VB_KINDS) {
      check(eMd.includes(k), `4D 英文科規範包含 visualBlock kind: ${k}`);
    }
  }

  for (const rel of [
    '六年級上/考券/六年級上_考券/preview_jpg/IMG_4385.jpg',
    '六年級上/考券/六年級上_考券/preview_jpg/IMG_4386.jpg',
    '六年級上/考券/六年級上_考券/考券_六上_Week12_Page25.md',
    '六年級上/考券/六年級上_考券/考券_六上_Week12_Page26.md'
  ]) {
    check(fs.existsSync(path.join(ROOT, rel)), `W12 真卷資產存在：${rel}`);
  }
  const ovPath = path.join(ROOT, '六年級上/考券/六年級上_考券/00_Overview_歷史考券.md');
  if (fs.existsSync(ovPath)) {
    const ov = fs.readFileSync(ovPath, 'utf8');
    check(ov.includes('Week 12') && ov.includes('Page25'), '00_Overview_歷史考券.md 已索引 Week 12');
  }

  // 3. 6 個單元模組逐一驗證
  const unitSpecs = [
    { mdRel: '六年級上/課本/02_Oxford_Discover_Grammar_3/Unit_16_Food_Facts.md', jsRel: 'data/units/odg3_u16.js', expected: { id: 'ODG3_U16', unit_id: 'gra3_16', book_id: 'gra3', is_week13: true }, requireWeek12: true },
    { mdRel: '六年級上/課本/01_Oxford_Discover_3/Unit_16_The_Garden_of_Happiness.md', jsRel: 'data/units/od3_u16.js', expected: { id: 'OD3_U16', unit_id: 'od3_16', book_id: 'od3' }, requireWeek12: true },
    { mdRel: '六年級上/課本/03_Reading_with_Writing_6/Unit_09_Getting_to_Know_You.md', jsRel: 'data/units/rww6_u09.js', expected: { id: 'RWW6_U09', unit_id: 'rw6_9', book_id: 'rw6' }, requireWeek12: true },
    { mdRel: '六年級上/課本/05_Read_and_Discover_6_Space/Chapter_06_Life_on_Other_Planets.md', jsRel: 'data/units/space_ch06.js', expected: { id: 'SPACE_CH06', unit_id: 'rd6_6', book_id: 'rd6' }, requireWeek12: true },
    { mdRel: '六年級上/課本/04_Write_Right_3/Unit_06_A_Great_Person_in_History.md', jsRel: 'data/units/wr3_u06.js', expected: { id: 'WR3_U06', unit_id: 'wr3_6', book_id: 'wr3', is_week13: true }, requireWeek12: true },
    { mdRel: '六年級上/課本/03_Reading_with_Writing_6/Unit_06_Amazing_Journeys.md', jsRel: 'data/units/rww6_u06.js', expected: { id: 'RWW6_U06', unit_id: 'rw6_6', book_id: 'rw6', is_week13: true }, requireWeek12: false }
  ];
  for (const spec of unitSpecs) {
    const f = validateModularUnit(spec);
    check(f === 0, `${spec.jsRel} validateModularUnit 0 failures (got ${f})`);
  }

  // Specific W12/W13 content checks on raw unit modules
  if (fs.existsSync(path.join(ROOT, 'data/units/rww6_u06.js'))) {
    const rww6 = require(path.join(ROOT, 'data/units/rww6_u06.js'));
    const pds = (rww6.quizzes || []).filter(q => q.type === 'passage_dictation');
    check(pds.length >= 4, `RWW6_U06 passage_dictation >= 4 (got ${pds.length})`);
    const allPdAudio = pds.map(q => q.full_audio_text || '').join(' ');
    check(allPdAudio.includes('Imagine you are in a new city') && allPdAudio.includes('At each control'), 'RWW6_U06 passage_dictation 覆蓋 p.40 前兩段與 p.41 後兩段');
    const vbCount = (rww6.quizzes || []).filter(q => q.explanation && q.explanation.visualBlock).length;
    check(vbCount >= 8, `RWW6_U06 visualBlock >= 8 (got ${vbCount})`);
  }
  if (fs.existsSync(path.join(ROOT, 'data/units/odg3_u16.js'))) {
    const odg3 = require(path.join(ROOT, 'data/units/odg3_u16.js'));
    const becauseQs = (odg3.quizzes || []).filter(q => q.type === 'paper_rewrite' && /because/i.test(String(q.sentence_form || '') + ' ' + String(q.question || '')));
    check(becauseQs.length >= 8, `ODG3_U16 because 公式造句實戰題 >= 8 (got ${becauseQs.length})`);
    const vbCount = (odg3.quizzes || []).filter(q => q.explanation && q.explanation.visualBlock).length;
    check(vbCount >= 10, `ODG3_U16 visualBlock >= 10 (got ${vbCount})`);
  }
  if (fs.existsSync(path.join(ROOT, 'data/units/wr3_u06.js'))) {
    const wr3 = require(path.join(ROOT, 'data/units/wr3_u06.js'));
    const outlineQs = (wr3.quizzes || []).filter(q => q.type === 'paper_rewrite' && /outline|biography essay|full story/i.test(String(q.question || '') + ' ' + String(q.part_title || '')));
    check(outlineQs.length >= 3, `WR3_U06 Outline 三段傳記引導寫作 >= 3 (got ${outlineQs.length})`);
    const proofPassageQs = (wr3.quizzes || []).filter(q => q.type === 'paper_rewrite' && /1[24]\s*error|correct the (twelve|fourteen|12|14) errors/i.test(String(q.question || '') + ' ' + String(q.part_instructions || '')));
    check(proofPassageQs.length >= 2, `WR3_U06 預判 W13 短文改錯實戰 >= 2 (got ${proofPassageQs.length})`);
    const vbCount = (wr3.quizzes || []).filter(q => q.explanation && q.explanation.visualBlock).length;
    check(vbCount >= 10, `WR3_U06 visualBlock >= 10 (got ${vbCount})`);
  }
  if (fs.existsSync(path.join(ROOT, 'data/units/space_ch06.js'))) {
    const sp6 = require(path.join(ROOT, 'data/units/space_ch06.js'));
    const explainQs = (sp6.quizzes || []).filter(q => /explain your answer/i.test(String(q.question || '')));
    check(explainQs.length >= 3, `SPACE_CH06 Explain your answer >= 3 (got ${explainQs.length})`);
    const vbCount = (sp6.quizzes || []).filter(q => q.explanation && q.explanation.visualBlock).length;
    check(vbCount >= 8, `SPACE_CH06 visualBlock >= 8 (got ${vbCount})`);
  }
  if (fs.existsSync(path.join(ROOT, 'data/exams/tea_w12.js'))) {
    const tw12 = require(path.join(ROOT, 'data/exams/tea_w12.js'));
    check(Array.isArray(tw12.quizzes) && tw12.quizzes.length >= 10, `tea_w12.quizzes >= 10 (got ${tw12.quizzes?.length})`);
    check(Array.isArray(tw12.mistake_buster) && tw12.mistake_buster.length >= 12, `tea_w12.mistake_buster >= 12 (got ${tw12.mistake_buster?.length})`);
    (tw12.quizzes || []).forEach(q => {
      check(String(q.id || '').startsWith('TEA_W12_'), `tea_w12 quiz id prefix TEA_W12_: ${q.id}`);
    });
    (tw12.mistake_buster || []).forEach(m => {
      check(String(m.id || '').startsWith('MB_TEA_W12_'), `tea_w12 mb id prefix MB_TEA_W12_: ${m.id}`);
      check(Array.isArray(m.tokens) && m.tokens.join(' ') === m.sentence, `tea_w12 mb tokens match sentence: ${m.id}`);
      check(m.tokens && m.tokens[m.wrong_index] === m.wrong_word, `tea_w12 mb wrong_index match: ${m.id}`);
    });
  }

  // 4. Compiled Databases Checks
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'english_data.js'), 'utf8'), sandbox);
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'midterm_data.js'), 'utf8'), sandbox);
  const ed = sandbox.window.ENGLISH_DATA;
  const md = sandbox.window.MIDTERM_DATABASE;

  check(ed && Array.isArray(ed.quizzes), 'ENGLISH_DATA 存在');
  check(Array.isArray(md) && md.length >= 19, `MIDTERM_DATABASE >= 19 單元 (實為 ${md?.length})`);
  const w12All = md.find(u => u && u.id === 'WEEK12_ALL');
  const w13All = md.find(u => u && u.id === 'WEEK13_ALL');
  const teaRev = md.find(u => u && u.id === 'TEA_QUIZ_REVIEW');
  check(!!w12All && w12All.quizzes.length >= 156, `MIDTERM_DATABASE 含 WEEK12_ALL (quizzes=${w12All?.quizzes?.length})`);
  check(!!w13All && w13All.quizzes.length >= 90, `MIDTERM_DATABASE 含 WEEK13_ALL (quizzes=${w13All?.quizzes?.length})`);
  const w12InTea = teaRev ? (teaRev.quizzes || []).filter(q => String(q.id || '').startsWith('TEA_W12_')) : [];
  const mb12InTea = teaRev ? (teaRev.mistake_buster || []).filter(m => String(m.id || '').startsWith('MB_TEA_W12_')) : [];
  check(w12InTea.length >= 10, `TEA_QUIZ_REVIEW 含 TEA_W12_* >= 10 (實為 ${w12InTea.length})`);
  check(mb12InTea.length >= 12, `TEA_QUIZ_REVIEW 含 MB_TEA_W12_* >= 12 (實為 ${mb12InTea.length})`);

  // Full DB dictation zero leak (both spelling_listen & passage_dictation)
  let leakCount = 0;
  for (const u of md) {
    for (const q of u.quizzes || []) {
      if (q.type === 'spelling_listen') {
        const ans = String(q.answer || '').trim();
        if (ans) {
          const rx = new RegExp(`\\b${escapeRegExp(ans)}\\b`, 'i');
          if (rx.test(q.question || '') || rx.test(q.masked_example || '')) {
            leakCount++;
            console.error('Leak in spelling_listen:', u.id, q.id);
          }
        }
      } else if (q.type === 'passage_dictation') {
        const leak = hasDictationPhraseLeak(`${q.question} ${q.target_chi || ''} ${q.part_instructions || ''}`, q.dictation_sentences);
        if (leak) {
          leakCount++;
          console.error('Leak in passage_dictation:', u.id, q.id, leak);
        }
      }
    }
  }
  check(leakCount === 0, `MIDTERM_DATABASE 全庫聽寫零洩漏 (洩漏數: ${leakCount})`);

  if (dataOnly) {
    console.log(`=== [Phase 12 Data-Only 驗收結果] PASS: ${passes} | FAIL: ${failures} ===`);
    return failures === 0 ? 0 : 1;
  }

  // 5. Frontend, CSS & index.html Checks (including inherited P8/P10/P11 invariants)
  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const assetName of ['style.css', 'english_data.js', 'midterm_data.js', 'app.js']) {
    check(indexHtml.includes(`${assetName}?v=20261122_p13`), `index.html ${assetName} 版號已更新至 ?v=20261122_p13`);
  }
  check(indexHtml.includes('id="nav-font"') && indexHtml.includes('id="fontControlPopover"'), 'index.html 保留字體控制器 UI');

  const styleCss = fs.readFileSync(path.join(ROOT, 'style.css'), 'utf8');
  for (const cls of [
    '--text-scale: 1;',
    'body.warm-paper',
    '.reading-layout-switch',
    '.quiz-interactive-options.options-grid-2x2',
    '.banner-week12',
    '.sprint-week-tabs',
    '.sprint-week-pill',
    '.vb-card',
    '.vb-timeline',
    '.vb-slot-grid',
    '.vb-ladder',
    '.vb-compare-table',
    '.dictation-passage-player'
  ]) {
    check(styleCss.includes(cls), `style.css 包含 "${cls}"`);
  }

  const appJs = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  for (const tok of [
    'SPRINT_WEEKS',
    'eng_sprint_week_v1',
    'week13_all',
    'week12_all',
    'tea_w12',
    'renderVisualBlockHtml',
    'passage_dictation',
    'dictation-passage-player',
    'btn-play-passage-full',
    'btn-play-passage-slow',
    'data-speak-dict-idx',
    'banner-week12',
    'btn-launch-w12-mock',
    'data-open-w12-unit'
  ]) {
    check(appJs.includes(tok), `app.js 包含 "${tok}"`);
  }

  // Explicit self-grading invariant
  const revealBlockMatch = appJs.match(/if \(revealBtn && ansDrawer\) \{([\s\S]*?)\r?\n\s*\}/);
  check(!!revealBlockMatch && !revealBlockMatch[1].includes('recordAnswerResult'), '顯式自評鐵律：翻牌不自動計分');
  const rateMatch = appJs.match(/container\.querySelectorAll\('\[data-rate\]'\)\.forEach\(([\s\S]*?)\r?\n\s*\}\);/);
  check(!!rateMatch && rateMatch[1].includes('recordAnswerResult(q, rate)'), '顯式自評鐵律：僅 [data-rate] 寫入成績');

  // Inherited P10 full-book-name check on BOOK_META + SPRINT_WEEKS
  const bmStart = appJs.indexOf('const BOOK_META = {');
  const bmEnd = appJs.indexOf('function getUnitsForBook(', bmStart);
  check(bmStart !== -1 && bmEnd !== -1, 'app.js 定位 BOOK_META 區塊');
  if (bmStart !== -1 && bmEnd !== -1) {
    const metaSlice = appJs.slice(bmStart, bmEnd);
    for (const fullName of ['Oxford Discover Grammar 3', 'Write Right 3', 'Reading with Writing 6', 'Read and Discover 6: Space', 'Oxford Discover 3']) {
      check(metaSlice.includes(fullName), `BOOK_META 保留完整書名 "${fullName}"`);
    }
    for (const abbr of ['RWW 6', 'OD3 課本', 'OD3 主課本', 'Space 科普', "'Grammar 3'"]) {
      check(!metaSlice.includes(abbr), `BOOK_META 不含縮寫 "${abbr}"`);
    }
  }

  // Inherited P8 zero-empty-pill check & P10 full-DB stem rendering VM test
  const extractFn = (src, prefix) => {
    const s = src.indexOf(prefix);
    if (s === -1) return null;
    const b = src.indexOf('{', s);
    let d = 0;
    for (let i = b; i < src.length; i++) {
      if (src[i] === '{') d++;
      else if (src[i] === '}') {
        d--;
        if (d === 0) return src.slice(s, i + 1);
      }
    }
    return null;
  };
  const helpers = [
    'function escapeHtml(',
    'function escapeRegex(',
    'function extractCleanEnglishForSpeech(',
    'function formatFormulaBlocks(',
    'function getQuizTypeBadgeLabel(',
    'function highlightBlanksAndWordHints(',
    'function maskAnswerFallback(',
    'function mapRewriteTaskTitle(',
    'function mapChoiceLeadTitle(',
    'function renderStructuredStemHtml(',
    'function renderVisualBlockHtml(',
    'function matchQuizType('
  ].map(p => extractFn(appJs, p)).filter(Boolean);
  check(helpers.length === 12, `成功提取 12 個 app.js 核心輔助函式 (實得 ${helpers.length})`);

  if (helpers.length === 12) {
    const vmCtx = { state: { errorBook: [] } };
    vm.createContext(vmCtx);
    vm.runInContext(
      helpers.join('\n') +
        '\nthis.renderStructuredStemHtml = renderStructuredStemHtml;' +
        '\nthis.getQuizTypeBadgeLabel = getQuizTypeBadgeLabel;' +
        '\nthis.renderVisualBlockHtml = renderVisualBlockHtml;' +
        '\nthis.matchQuizType = matchQuizType;',
      vmCtx
    );

    // Zero-empty-pill check on Week 12 & Week 13 units
    for (const uid of ['ODG3_U16', 'OD3_U16', 'RWW6_U09', 'SPACE_CH06', 'WR3_U06', 'RWW6_U06', 'WEEK12_ALL', 'WEEK13_ALL']) {
      const u = md.find(x => x.id === uid);
      if (!u) continue;
      const qs = u.quizzes || [];
      const covered = qs.filter(q =>
        vmCtx.matchQuizType(q, 'vocab') ||
        vmCtx.matchQuizType(q, 'handwrite') ||
        vmCtx.matchQuizType(q, 'grammar') ||
        vmCtx.matchQuizType(q, 'reading')
      );
      check(covered.length === qs.length, `${uid} 所有題目皆歸屬四大題型分類 (覆蓋 ${covered.length}/${qs.length})`);
    }

    // Stem + visualBlock VM render across ALL quizzes in MD and ED
    let renderErrs = 0;
    let pdLeakErrs = 0;
    let vbTested = 0;
    const allTargets = [...md.flatMap(u => u.quizzes || []), ...(ed.quizzes || [])];
    for (const q of allTargets) {
      try {
        const html = vmCtx.renderStructuredStemHtml(q);
        const badge = vmCtx.getQuizTypeBadgeLabel(q);
        if (!badge || /\[(?:Tiger\s+3C|3C\s+Handwritten)/i.test(html)) renderErrs++;
        if (q.type === 'passage_dictation') {
          const leak = hasDictationPhraseLeak(stripTags(html), q.dictation_sentences);
          if (leak) pdLeakErrs++;
        }
        if (q.explanation && q.explanation.visualBlock) {
          const vHtml = vmCtx.renderVisualBlockHtml(q.explanation.visualBlock);
          if (vHtml.includes('vb-card')) vbTested++;
        }
      } catch (e) {
        renderErrs++;
      }
    }
    check(renderErrs === 0, `全庫 ${allTargets.length} 題幹渲染 0 例外與 0 標籤外露 (錯誤 ${renderErrs})`);
    check(pdLeakErrs === 0, `段落盲聽渲染後 DOM 零洩漏 (洩漏 ${pdLeakErrs})`);
    check(vbTested >= 36, `renderVisualBlockHtml 實際渲染測試 >= 36 題 (實測 ${vbTested})`);
  }

  // 6. ErrorBook normalization & dynamic A4 print checks
  check(!appJs.includes('If I <u>have</u> 3000 dollars'), 'renderA4PaperContent 已移除寫死的 W2~W7 假考卷 HTML');
  check(appJs.includes('normalizeErrorBookList') && appJs.includes('buildAllQuizzesMap'), 'app.js 包含錯題本正規化與跨庫查詢函式');
  const errFns = [
    'function getErrorId(',
    'function normalizeErrorBookList(',
    'function buildAllQuizzesMap(',
    'function shuffleArrayCopy(',
    'function getTrapHintText(',
    'function renderDynamicExamSections(',
    'function renderA4PaperContent('
  ].map(p => extractFn(appJs, p)).filter(Boolean);
  check(errFns.length === 7, `成功提取 7 個錯題本與 A4 出卷函式 (實得 ${errFns.length})`);
  if (errFns.length === 7 && helpers.length === 12) {
    const sampleQ = md.flatMap(u => u.quizzes || []).find(q => q && q.id && q.question) || (ed.quizzes || [])[0];
    const printCtx = {
      window: { ENGLISH_DATA: ed, MIDTERM_DATABASE: md, location: { href: 'http://localhost/' } },
      state: {
        errorBook: ['q_dup_1', { id: 'q_dup_1', question: 'x' }, { id: sampleQ.id, question: sampleQ.question }],
        printConfig: { printType: 'errorbook', bookId: 'tea_midterm', unitId: 'week13_all', count: 20, answerMode: 'student' },
        sprintWeek: 'w13'
      },
      SPRINT_WEEKS: [{ id: 'w13', title: 'W13', mockUnitId: 'week13_all', units: [] }],
      BOOK_META: { tea_midterm: { id: 'tea_midterm', shortName: '岱崙' } },
      getCurrentUserObj: () => ({ id: 'rex', name: 'Rex' }),
      getActiveSprintWeek: () => ({ id: 'w13', title: 'W13', mockUnitId: 'week13_all', units: [] }),
      getQuizzesForUnit: () => [],
      getVocabsForUnit: () => [],
      getUnitsForBook: () => []
    };
    vm.createContext(printCtx);
    vm.runInContext(
      helpers.join('\n') + '\n' + errFns.join('\n') +
      '\nthis.normalizeErrorBookList = normalizeErrorBookList;\nthis.getErrorId = getErrorId;\nthis.renderA4PaperContent = renderA4PaperContent;',
      printCtx
    );
    const norm = printCtx.normalizeErrorBookList(['a1', { id: 'a1' }, { id: 'b2' }, null, '']);
    check(Array.isArray(norm) && norm.length === 2 && norm[0] === 'a1' && norm[1] === 'b2', 'normalizeErrorBookList 可去重並將物件轉純字串 ID');
    const afterRemove = norm.filter(x => printCtx.getErrorId(x) !== 'b2');
    check(afterRemove.length === 1 && afterRemove[0] === 'a1', '錯題移除比對 getErrorId 可正確移除目標 ID');
    const mockSheet = { innerHTML: '' };
    printCtx.renderA4PaperContent(mockSheet);
    check(mockSheet.innerHTML.includes(sampleQ.answer || '') || mockSheet.innerHTML.includes('Part '), 'A4 errorbook 卷型渲染真實 state.errorBook 題目');
  }

  console.log(`=== [Phase 12 驗收結果] PASS: ${passes} | FAIL: ${failures} ===`);
  return failures === 0 ? 0 : 1;
}

if (require.main === module) {
  const dataOnly = process.argv.includes('--data-only');
  process.exit(runMainVerification(dataOnly));
}

module.exports = {
  validateModularUnit,
  validateVisualBlockShape,
  hasDictationPhraseLeak
};
