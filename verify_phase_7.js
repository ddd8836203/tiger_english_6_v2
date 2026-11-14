#!/usr/bin/env node
/**
 * Phase 7 Verification Gate:
 * Validates upgraded RWW6_U09 (32 Qs + 3 visual grammar cards),
 * SPACE_CH06 (32 Qs + 3 visual grammar cards), and
 * WR3_U06 (32 Qs + 4 visual grammar cards), all with 100% vocab dictation coverage.
 */

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
for (const rel of ['data/units/rww6_u09.js', 'data/units/space_ch06.js', 'data/units/wr3_u06.js']) {
  try {
    execFileSync(process.execPath, ['--check', path.join(ROOT, rel)], { stdio: 'pipe' });
  } catch (err) {
    fail(`node --check ${rel} failed: ${err.stderr ? err.stderr.toString() : err.message}`);
  }
}

// 2. Run standard Phase 2 validateUnit gate
const specs = [
  {
    mdRel: '六年級上/課本/03_Reading_with_Writing_6/Unit_09_Getting_to_Know_You.md',
    jsRel: 'data/units/rww6_u09.js',
    expected: { id: 'RWW6_U09', unit_id: 'rw6_9', book_id: 'rw6' }
  },
  {
    mdRel: '六年級上/課本/05_Read_and_Discover_6_Space/Chapter_06_Life_on_Other_Planets.md',
    jsRel: 'data/units/space_ch06.js',
    expected: { id: 'SPACE_CH06', unit_id: 'rd6_6', book_id: 'rd6' }
  },
  {
    mdRel: '六年級上/課本/04_Write_Right_3/Unit_06_A_Great_Person_in_History.md',
    jsRel: 'data/units/wr3_u06.js',
    expected: { id: 'WR3_U06', unit_id: 'wr3_6', book_id: 'wr3' }
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

  const vocabWords = new Set((unit.vocab || []).map(v => String(v.word || '').toLowerCase()));
  const listenWords = new Set(listen.map(q => String(q.answer || '').toLowerCase()));
  for (const vw of vocabWords) {
    assert(listenWords.has(vw), `${unit.id}: vocab word "${vw}" missing from spelling_listen dictation coverage`);
  }
}

const rww6 = require('./data/units/rww6_u09.js');
const space6 = require('./data/units/space_ch06.js');
const wr3 = require('./data/units/wr3_u06.js');

checkUnitGrammarVisuals(rww6, 3);
checkUnitQuizzesDistribution(rww6, { total: 32, listen: 14, handwrite: 8, choice: 10, gramChoice: 5, readChoice: 5 });

checkUnitGrammarVisuals(space6, 3);
checkUnitQuizzesDistribution(space6, { total: 32, listen: 14, handwrite: 8, choice: 10, gramChoice: 5, readChoice: 5 });

checkUnitGrammarVisuals(wr3, 4);
checkUnitQuizzesDistribution(wr3, { total: 32, listen: 14, handwrite: 10, choice: 8, gramChoice: 4, readChoice: 4 });

if (failures === 0) {
  console.log('Phase 7 verification PASSED (0 failures)');
  console.log(`Summary: RWW6_U09=${rww6.quizzes.length}, SPACE_CH06=${space6.quizzes.length}, WR3_U06=${wr3.quizzes.length}`);
  process.exit(0);
} else {
  console.error(`Phase 7 verification FAILED (${failures} failures)`);
  process.exit(1);
}
