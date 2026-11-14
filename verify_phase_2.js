#!/usr/bin/env node
/**
 * Phase 2 Verification Gate:
 * Validates ODG3 U16 and OD3 U16 dual-layer MDs + KET-4D JS unit modules.
 * Exports validateUnit & runSuite for reuse in verify_phase_3.js.
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PAGE_REF_RE = /\b(page\s*\d+|p\.\s*\d+|exercise\s+[a-h]\b|part\s+[a-h]\s+on\s+page)\b|第\s*\d+\s*頁|課本第/i;

function validateUnit({ mdRel, jsRel, expected }) {
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
    assert(md.includes('第一層') && md.includes('AI_SPEC'), `${mdRel} missing Dual-Layer sections`);
  }

  assert(fs.existsSync(jsPath), `Missing JS module: ${jsRel}`);
  if (!fs.existsSync(jsPath)) return failures;

  delete require.cache[require.resolve(jsPath)];
  const u = require(jsPath);

  assert(u.id === expected.id, `${jsRel}: id expected ${expected.id}, got ${u.id}`);
  assert(u.unit_id === expected.unit_id, `${jsRel}: unit_id expected ${expected.unit_id}, got ${u.unit_id}`);
  assert(u.book_id === expected.book_id, `${jsRel}: book_id expected ${expected.book_id}, got ${u.book_id}`);
  assert(u.is_midterm === true, `${jsRel}: is_midterm must be true`);
  assert(u.is_week12 === true, `${jsRel}: is_week12 must be true`);
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

function runSuite(phaseLabel, targets) {
  let totalFailures = 0;
  for (const t of targets) {
    totalFailures += validateUnit(t);
  }
  if (totalFailures > 0) {
    console.error(`\n${phaseLabel} verification FAILED with ${totalFailures} error(s).`);
    process.exit(1);
  }
  console.log(`\n${phaseLabel} verification PASSED (0 failures).`);
}

if (require.main === module) {
  runSuite('Phase 2', [
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
  ]);
}

module.exports = { validateUnit, runSuite };
