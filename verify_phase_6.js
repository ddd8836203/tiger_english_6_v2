#!/usr/bin/env node
/**
 * Phase 6 Verification Gate:
 * Validates upgraded ODG3_U16 (28 Qs + 4 visual grammar cards) and
 * OD3_U16 (32 Qs + 3 visual grammar cards, 100% 17-word dictation coverage).
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { validateUnit } = require('./verify_phase_2.js');

const ROOT = __dirname;
let failures = 0;

function fail(msg) {
  console.error('FAIL:', msg);
  failures++;
}

function assert(cond, msg) {
  if (!cond) fail(msg);
}

// 1. JS syntax checks
for (const rel of ['data/units/odg3_u16.js', 'data/units/od3_u16.js']) {
  try {
    execFileSync(process.execPath, ['--check', path.join(ROOT, rel)], { stdio: 'pipe' });
  } catch (err) {
    fail(`node --check ${rel} failed: ${err.stderr ? err.stderr.toString() : err.message}`);
  }
}

// 2. Run standard Phase 2 validateUnit gate
const specs = [
  {
    mdRel: '六年級上/課本/02_Oxford_Discover_Grammar_3/Unit_16_Food_Facts.md',
    jsRel: 'data/units/odg3_u16.js',
    expected: { id: 'ODG3_U16', unit_id: 'gra3_16', book_id: 'gra3' }
  },
  {
    mdRel: '六年級上/課本/01_Oxford_Discover_3/Unit_16_The_Garden_of_Happiness.md',
    jsRel: 'data/units/od3_u16.js',
    expected: { id: 'OD3_U16', unit_id: 'od3_16', book_id: 'od3' }
  }
];
for (const spec of specs) {
  failures += validateUnit(spec);
}

function checkUnitGrammarVisuals(unit, expectedCount) {
  assert(Array.isArray(unit.grammar) && unit.grammar.length === expectedCount,
    `${unit.id}: grammar.length expected ${expectedCount}, got ${unit.grammar?.length}`);
  (unit.grammar || []).forEach((g, idx) => {
    assert(typeof g.formula === 'string' && g.formula.trim().length >= 6,
      `${unit.id} grammar[${idx}] missing non-empty formula`);
    assert(
      (Array.isArray(g.categories) && g.categories.length > 0) ||
      (Array.isArray(g.pitfalls) && g.pitfalls.length >= 2),
      `${unit.id} grammar[${idx}] needs non-empty categories or >=2 pitfalls`
    );
  });
}

function checkUnitQuizzesDistribution(unit, expected) {
  const qs = unit.quizzes || [];
  assert(qs.length === expected.total, `${unit.id}: quizzes.length expected ${expected.total}, got ${qs.length}`);

  const listen = qs.filter(q => q.type === 'spelling_listen');
  const hand = qs.filter(q => q.type === 'paper_rewrite');
  const choice = qs.filter(q => q.type === 'choice');
  const gramChoice = choice.filter(q => q.category_tag === 'grammar');
  const readChoice = choice.filter(q => q.category_tag === 'reading');

  assert(listen.length === expected.listen, `${unit.id}: spelling_listen expected ${expected.listen}, got ${listen.length}`);
  assert(hand.length === expected.handwrite, `${unit.id}: paper_rewrite expected ${expected.handwrite}, got ${hand.length}`);
  assert(choice.length === expected.choice, `${unit.id}: choice expected ${expected.choice}, got ${choice.length}`);
  assert(gramChoice.length === expected.gramChoice, `${unit.id}: grammar choice expected ${expected.gramChoice}, got ${gramChoice.length}`);
  assert(readChoice.length === expected.readChoice, `${unit.id}: reading choice expected ${expected.readChoice}, got ${readChoice.length}`);

  listen.forEach(q => {
    assert(Array.isArray(q.options) && q.options.length === 0, `${unit.id} ${q.id}: spelling_listen options must be []`);
    assert(q.vocab_card && q.vocab_card.word && q.vocab_card.word.toLowerCase() === String(q.answer || '').toLowerCase(),
      `${unit.id} ${q.id}: spelling_listen missing matching vocab_card`);
  });

  hand.forEach(q => {
    assert(Array.isArray(q.options) && q.options.length === 0, `${unit.id} ${q.id}: paper_rewrite options must be []`);
    assert(q.category_tag === 'rewrite', `${unit.id} ${q.id}: paper_rewrite category_tag must be 'rewrite'`);
    assert(typeof q.part_instructions === 'string' && q.part_instructions.trim().length >= 8,
      `${unit.id} ${q.id}: paper_rewrite missing part_instructions`);
    assert(typeof q.sentence_form === 'string' && q.sentence_form.trim().length >= 5,
      `${unit.id} ${q.id}: paper_rewrite missing sentence_form`);
    assert(Array.isArray(q.self_check) && q.self_check.length >= 2,
      `${unit.id} ${q.id}: paper_rewrite missing self_check (>= 2 items)`);
  });

  if (expected.coverAllVocab) {
    const vocabWords = new Set((unit.vocab || []).map(v => String(v.word || '').toLowerCase()));
    const listenWords = new Set(listen.map(q => String(q.answer || '').toLowerCase()));
    for (const vw of vocabWords) {
      assert(listenWords.has(vw), `${unit.id}: vocab word "${vw}" missing from spelling_listen dictation coverage`);
    }
  }
}

const odg3 = require('./data/units/odg3_u16.js');
const od3 = require('./data/units/od3_u16.js');

checkUnitGrammarVisuals(odg3, 4);
checkUnitQuizzesDistribution(odg3, {
  total: 28,
  listen: 6,
  handwrite: 10,
  choice: 12,
  gramChoice: 6,
  readChoice: 6,
  coverAllVocab: false
});

checkUnitGrammarVisuals(od3, 3);
checkUnitQuizzesDistribution(od3, {
  total: 32,
  listen: 17,
  handwrite: 5,
  choice: 10,
  gramChoice: 5,
  readChoice: 5,
  coverAllVocab: true
});

if (failures === 0) {
  console.log('Phase 6 verification PASSED (0 failures)');
  console.log(`Summary: ODG3_U16=${odg3.quizzes.length} Qs (6 listen / 10 handwrite / 12 choice), OD3_U16=${od3.quizzes.length} Qs (17 listen / 5 handwrite / 10 choice)`);
  process.exit(0);
} else {
  console.error(`Phase 6 verification FAILED (${failures} failures)`);
  process.exit(1);
}
