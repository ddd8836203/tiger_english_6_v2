#!/usr/bin/env node
/**
 * Phase 3 Verification Gate:
 * Validates RWW6 U09, Space Ch06, and WR3 U06 dual-layer MDs + KET-4D JS unit modules.
 */

const { runSuite } = require('./verify_phase_2.js');

runSuite('Phase 3', [
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
]);
