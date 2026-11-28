#!/usr/bin/env node
/**
 * Phase 13 / Week 14 Verification Gate:
 * Validates Week 14 modular units (OD3_U17, ODG3_U17, ODG3_U16, WR3_U07),
 * exact 20-word OD3 U17 alignment, zero-leak phrasal verb dictation,
 * compiled ENGLISH_DATA (WEEK14_ALL + W12/W13 regression),
 * and frontend app.js + index.html (?v=20261128_p13).
 *
 * Supports `--data-only` for Phase P3 before Phase P4 frontend edits.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const {
  validateModularUnit,
  validateVisualBlockShape,
  hasDictationPhraseLeak,
} = require('./verify_phase_12.js');

const ROOT = __dirname;
const DATA_ONLY = process.argv.includes('--data-only');

const EXPECTED_OD3_U17_WORDS = [
  'clouds', 'fog', 'healthy', 'journey', 'look after', 'look for', 'look through',
  'river', 'storm', 'waterfall', 'coast', 'hail', 'island', 'lightning',
  'look around', 'look out', 'look up', 'sail', 'strait', 'windy',
].sort();

let failures = 0;

function pass(msg) {
  console.log(`  ✅ PASS: ${msg}`);
}

function fail(msg) {
  console.error(`  ❌ FAIL: ${msg}`);
  failures++;
}

function loadScriptWindow(relPath) {
  const full = path.join(ROOT, relPath);
  const src = fs.readFileSync(full, 'utf8');
  const ctx = { window: {}, console };
  vm.runInNewContext(src, ctx, { filename: relPath });
  return ctx.window;
}

function main() {
  console.log(`\n=== Phase 13 Verification Gate (${DATA_ONLY ? 'DATA-ONLY' : 'FULL'}) ===\n`);

  // 1. Validate 4 Week 14 unit modules + MDs
  const specs = [
    {
      mdRel: '六年級上/課本/01_Oxford_Discover_3/Unit_17_My_Journey_with_Captain_Magellan.md',
      jsRel: 'data/units/od3_u17.js',
      expected: { id: 'OD3_U17', unit_id: 'od3_17', book_id: 'od3', is_week13: false },
      requireWeek12: false,
      expectedWeek12: false,
      expectedWeek14: true,
      minVocab: 20,
      minQuizzes: 35,
      minVisual: 10,
      minListening: 20,
    },
    {
      mdRel: '六年級上/課本/02_Oxford_Discover_Grammar_3/Unit_17_Staying_Safe.md',
      jsRel: 'data/units/odg3_u17.js',
      expected: { id: 'ODG3_U17', unit_id: 'gra3_17', book_id: 'gra3', is_week13: false },
      requireWeek12: false,
      expectedWeek12: false,
      expectedWeek14: true,
      minVocab: 10,
      minQuizzes: 32,
      minVisual: 12,
      minListening: 6,
    },
    {
      mdRel: '六年級上/課本/04_Write_Right_3/Unit_07_Hope_You_Feel_Better.md',
      jsRel: 'data/units/wr3_u07.js',
      expected: { id: 'WR3_U07', unit_id: 'wr3_7', book_id: 'wr3', is_week13: false },
      requireWeek12: false,
      expectedWeek12: false,
      expectedWeek14: true,
      minVocab: 10,
      minQuizzes: 34,
      minVisual: 12,
      minListening: 8,
    },
    {
      mdRel: '六年級上/課本/02_Oxford_Discover_Grammar_3/Unit_16_Food_Facts.md',
      jsRel: 'data/units/odg3_u16.js',
      expected: { id: 'ODG3_U16', unit_id: 'gra3_16', book_id: 'gra3', is_week13: true },
      requireWeek12: true,
      expectedWeek12: true,
      expectedWeek14: true,
      minVocab: 12,
      exactVocab: 12,
      minQuizzes: 39,
      minVisual: 17,
      minListening: 6,
    },
  ];

  for (const s of specs) {
    console.log(`-- Checking ${s.expected.id} (${s.jsRel}) --`);
    const modFails = validateModularUnit({
      mdRel: s.mdRel,
      jsRel: s.jsRel,
      expected: s.expected,
      requireWeek12: s.requireWeek12,
    });
    if (modFails > 0) {
      fail(`${s.expected.id} failed validateModularUnit (${modFails} errors)`);
    }

    const mod = require(path.join(ROOT, s.jsRel));
    if (!mod) {
      fail(`${s.expected.id} failed to load via require`);
      continue;
    }

    if (Boolean(mod.is_week12) !== s.expectedWeek12) {
      fail(`${s.expected.id} is_week12 expected ${s.expectedWeek12}, got ${mod.is_week12}`);
    } else {
      pass(`${s.expected.id} is_week12 === ${s.expectedWeek12}`);
    }

    if (Boolean(mod.is_week14) !== s.expectedWeek14) {
      fail(`${s.expected.id} is_week14 expected ${s.expectedWeek14}, got ${mod.is_week14}`);
    } else {
      pass(`${s.expected.id} is_week14 === ${s.expectedWeek14}`);
    }

    if (s.exactVocab && mod.vocab.length !== s.exactVocab) {
      fail(`${s.expected.id} vocab count expected ${s.exactVocab}, got ${mod.vocab.length}`);
    } else if (mod.vocab.length < s.minVocab) {
      fail(`${s.expected.id} vocab count ${mod.vocab.length} < ${s.minVocab}`);
    } else {
      pass(`${s.expected.id} vocab count = ${mod.vocab.length}`);
    }

    if (mod.quizzes.length < s.minQuizzes) {
      fail(`${s.expected.id} quizzes count ${mod.quizzes.length} < ${s.minQuizzes}`);
    } else {
      pass(`${s.expected.id} quizzes count = ${mod.quizzes.length}`);
    }

    const visualCount = mod.quizzes.filter((q) => Boolean((q.explanation && q.explanation.visualBlock) || q.visualBlock)).length;
    if (visualCount < s.minVisual) {
      fail(`${s.expected.id} visualBlock count ${visualCount} < ${s.minVisual}`);
    } else {
      pass(`${s.expected.id} visualBlock count = ${visualCount}`);
    }

    const listenQs = mod.quizzes.filter((q) => q.type === 'spelling_listen');
    if (listenQs.length < s.minListening) {
      fail(`${s.expected.id} spelling_listen count ${listenQs.length} < ${s.minListening}`);
    } else {
      pass(`${s.expected.id} spelling_listen count = ${listenQs.length}`);
    }

    // Extra strict OD3_U17 checks: exact 20-word set + phrasal verb zero-leak
    if (s.expected.id === 'OD3_U17') {
      const actualWords = mod.vocab.map((v) => String(v.word || '').trim().toLowerCase()).sort();
      if (JSON.stringify(actualWords) !== JSON.stringify(EXPECTED_OD3_U17_WORDS)) {
        fail(`OD3_U17 vocab words mismatch.\nExpected: ${EXPECTED_OD3_U17_WORDS.join(', ')}\nActual:   ${actualWords.join(', ')}`);
      } else {
        pass('OD3_U17 exact 20-word set 100% aligned with Spelling Bee d3_u17');
      }

      const listenWords = new Set();
      let leakCount = 0;
      const escRx = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      for (const q of listenQs) {
        const ans = String(q.answer || '').trim().toLowerCase();
        listenWords.add(ans);
        const stemText = `${q.question || ''} || ${q.masked_example || ''} || ${q.target_chi || ''} || ${q.target_pos || ''}`;
        const ansRx = new RegExp(`\\b${escRx(ans)}\\b`, 'i');
        if (ansRx.test(stemText)) {
          fail(`OD3_U17 spelling_listen leak detected in ${q.id} (answer="${ans}")`);
          leakCount++;
        }
        // Extra check for "look <particle>": ensure no partial "look" remains unmasked in question/masked_example/target_chi/target_pos
        if (ans.startsWith('look ')) {
          if (/\blook\b/i.test(stemText)) {
            fail(`OD3_U17 phrasal verb leak in ${q.id}: unmasked "look" remains for "${ans}"`);
            leakCount++;
          }
          if (!String(q.question || '').includes('________') || !String(q.masked_example || '').includes('________')) {
            fail(`OD3_U17 phrasal verb ${q.id} missing ________ mask in question/masked_example`);
            leakCount++;
          }
        }
      }
      const missingListen = EXPECTED_OD3_U17_WORDS.filter((w) => !listenWords.has(w));
      if (missingListen.length > 0) {
        fail(`OD3_U17 spelling_listen missing words: ${missingListen.join(', ')}`);
      } else {
        pass('OD3_U17 spelling_listen covers all 20 target words');
      }
      if (leakCount === 0) {
        pass('OD3_U17 zero dictation leaks (including all 6 look phrasal verbs)');
      }
    }
  }

  // 2. Compiled english_data.js checks
  console.log('\n-- Checking compiled english_data.js --');
  const edWin = loadScriptWindow('english_data.js');
  const ed = edWin.ENGLISH_DATA;
  if (!ed) {
    fail('window.ENGLISH_DATA missing');
  } else {
    const w14Meta = ed.metadata && ed.metadata.week14_modules;
    const expectedW14Ids = ['od3_17', 'gra3_17', 'gra3_16', 'wr3_7'];
    if (!Array.isArray(w14Meta) || expectedW14Ids.some((id) => !w14Meta.includes(id))) {
      fail(`ed.metadata.week14_modules invalid: ${JSON.stringify(w14Meta)}`);
    } else {
      pass(`ed.metadata.week14_modules = [${w14Meta.join(', ')}]`);
    }

    for (const uId of expectedW14Ids) {
      const unitObj = (ed.units || []).find((u) => u.unit_id === uId);
      if (!unitObj) {
        fail(`Missing unit ${uId} in ed.units`);
      } else {
        pass(`ed.units includes ${uId} (is_week14=${unitObj.is_week14})`);
      }
    }

    const midWin = loadScriptWindow('midterm_data.js');
    const midDb = midWin.MIDTERM_DATABASE || [];
    for (const compositeId of ['WEEK12_ALL', 'WEEK13_ALL', 'WEEK14_ALL']) {
      const unitObj = midDb.find((u) => u.id === compositeId);
      if (!unitObj) {
        fail(`Missing composite unit ${compositeId} in midterm_data.js`);
      } else {
        pass(`MIDTERM_DATABASE includes ${compositeId} (${(unitObj.quizzes || []).length} quizzes)`);
      }
    }

    const w14QuizCount = (ed.quizzes || []).filter((q) => expectedW14Ids.includes(q.unit_id) && q.type !== 'brain_gym').length;
    if (w14QuizCount < 140) {
      fail(`Week 14 core quiz total ${w14QuizCount} < 140`);
    } else {
      pass(`Week 14 core quiz total = ${w14QuizCount}`);
    }

    let vbErr = 0;
    for (const q of (ed.quizzes || [])) {
      const vb = (q.explanation && q.explanation.visualBlock) || q.visualBlock;
      const vbErrMsg = vb ? validateVisualBlockShape(vb) : null;
      if (vbErrMsg) {
        fail(`Invalid visualBlock shape in compiled quiz ${q.id}: ${vbErrMsg}`);
        vbErr++;
      }
    }
    if (vbErr === 0) {
      pass('All compiled quizzes with visualBlock pass shape check');
    }
  }

  if (DATA_ONLY) {
    console.log(`\n[DATA-ONLY] Complete with ${failures} failure(s).\n`);
    process.exit(failures > 0 ? 1 : 0);
  }

  // 3. Frontend app.js & index.html checks
  console.log('\n-- Checking app.js & index.html --');
  const appSrc = fs.readFileSync(path.join(ROOT, 'app.js'), 'utf8');
  try {
    new vm.Script(appSrc, { filename: 'app.js' });
    pass('app.js parses cleanly with zero syntax errors');
  } catch (err) {
    fail(`app.js syntax error: ${err.message}`);
  }

  const appChecks = [
    { re: /sprintWeek:\s*'w14'/, label: "state.sprintWeek defaults to 'w14'" },
    { re: /sprintWeek:\s*'eng_sprint_week_v2'/, label: "GLOBAL_KEYS.sprintWeek === 'eng_sprint_week_v2'" },
    { re: /SPRINT_WEEKS\s*=\s*\[/, label: 'SPRINT_WEEKS array defined' },
    { re: /id:\s*'w14'/, label: "SPRINT_WEEKS includes 'w14'" },
    { re: /id:\s*'w13'/, label: "SPRINT_WEEKS includes 'w13'" },
    { re: /id:\s*'w12'/, label: "SPRINT_WEEKS includes 'w12'" },
    { re: /WEEK14_UNIT_IDS/, label: 'WEEK14_UNIT_IDS defined' },
    { re: /unitId\s*===\s*'week14_all'/, label: "handles unitId === 'week14_all'" },
  ];
  for (const chk of appChecks) {
    if (chk.re.test(appSrc)) pass(chk.label);
    else fail(`app.js missing: ${chk.label}`);
  }

  const w14Idx = appSrc.indexOf("id: 'w14'");
  const w13Idx = appSrc.indexOf("id: 'w13'");
  const w12Idx = appSrc.indexOf("id: 'w12'");
  if (w14Idx > -1 && w13Idx > w14Idx && w12Idx > w13Idx) {
    pass('SPRINT_WEEKS order is w14 -> w13 -> w12');
  } else {
    fail(`SPRINT_WEEKS order unexpected (w14=${w14Idx}, w13=${w13Idx}, w12=${w12Idx})`);
  }

  // Test 12 rendering helper functions extracted from app.js across all compiled quizzes
  const helperNames = [
    'escapeHtml', 'escapeRegex', 'extractCleanEnglishForSpeech', 'formatFormulaBlocks',
    'getQuizTypeBadgeLabel', 'highlightBlanksAndWordHints', 'maskAnswerFallback',
    'mapRewriteTaskTitle', 'mapChoiceLeadTitle', 'renderStructuredStemHtml',
    'renderVisualBlockHtml', 'matchQuizType',
  ];
  const lines = appSrc.split(/\r?\n/);
  const extracted = [];
  for (const name of helperNames) {
    const startIdx = lines.findIndex((l) => l.trim().startsWith(`function ${name}(`));
    if (startIdx < 0) {
      fail(`Missing named helper function ${name} in app.js`);
      continue;
    }
    let depth = 0;
    let started = false;
    const fnLines = [];
    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i];
      fnLines.push(line);
      for (const ch of line) {
        if (ch === '{') { depth++; started = true; }
        else if (ch === '}') { depth--; }
      }
      if (started && depth === 0) break;
    }
    extracted.push(fnLines.join('\n'));
  }

  if (ed && extracted.length === helperNames.length) {
    const helperCtx = { console, state: { errorBook: [] } };
    vm.runInNewContext(extracted.join('\n\n') + '\nthis.__helpers = { renderStructuredStemHtml, renderVisualBlockHtml, matchQuizType };', helperCtx);
    const { renderStructuredStemHtml, renderVisualBlockHtml, matchQuizType } = helperCtx.__helpers;
    let renderErrs = 0;
    let orphanTypes = 0;
    const w14IdSet = new Set(['od3_17', 'gra3_17', 'gra3_16', 'wr3_7']);
    for (const q of (ed.quizzes || [])) {
      try {
        const html = renderStructuredStemHtml(q);
        if (typeof html !== 'string' || !html.trim()) renderErrs++;
        const vb = (q.explanation && q.explanation.visualBlock) || q.visualBlock;
        if (vb) {
          const vhtml = renderVisualBlockHtml(vb);
          if (typeof vhtml !== 'string' || !vhtml.trim()) renderErrs++;
        }
        if (w14IdSet.has(q.unit_id) && q.type !== 'brain_gym') {
          const matchedAny = ['vocab', 'handwrite', 'grammar', 'reading'].some((ft) => matchQuizType(q, ft));
          if (!matchedAny) {
            fail(`W14 quiz ${q.id} (type=${q.type}) matched zero filter categories in matchQuizType`);
            orphanTypes++;
          }
        }
      } catch (err) {
        fail(`Stem render threw on ${q.id}: ${err.message}`);
        renderErrs++;
      }
    }
    if (renderErrs === 0) {
      pass(`All ${ed.quizzes.length} compiled quizzes render cleanly via app.js helpers`);
    } else {
      fail(`${renderErrs} quiz stem render errors`);
    }
    if (orphanTypes === 0) {
      pass('All Week 14 quizzes map cleanly via matchQuizType (0 orphaned)');
    }
  }

  const bookMetaMatch = appSrc.match(/const BOOK_META\s*=\s*\{[\s\S]*?\n  \};/);
  if (bookMetaMatch && /\b(OD3|ODG3|WR3|RWW6)\b/.test(bookMetaMatch[0])) {
    fail('BOOK_META contains abbreviated book code (OD3/ODG3/WR3/RWW6)');
  } else {
    pass('BOOK_META uses full book names without abbreviations');
  }

  const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  for (const asset of [
    'style.css?v=20261128_p13',
    'english_data.js?v=20261128_p13',
    'midterm_data.js?v=20261128_p13',
    'app.js?v=20261128_p13',
  ]) {
    if (indexHtml.includes(asset)) pass(`index.html includes ${asset}`);
    else fail(`index.html missing ${asset}`);
  }

  console.log(`\n=== Phase 13 Verification Complete: ${failures} failure(s) ===\n`);
  process.exit(failures > 0 ? 1 : 0);
}

main();
