/**
 * 岱崙美語 Tiger English Academy 3C Quiz — Week 12 (Page 25 & Page 26)
 * 實考成績：38 / 46 (82%) | Part A: 13/16, Part B: 7/10, Part C: 18/20
 * 四層數位化對應原圖：IMG_4385.jpg (Page 25) & IMG_4386.jpg (Page 26)
 */

const quizzes = [
  // =========================================================================
  // Part A: Grammar 3 (Unit 16) — Adjective + Preposition + because ...
  // =========================================================================
  {
    id: 'TEA_W12_A_01',
    week: 'W12',
    type: 'paper_rewrite',
    category_tag: 'rewrite',
    part: 'Part A',
    part_title: 'Part A: Grammar 3 (Unit 16) — Adjectives with Prepositions + because',
    part_instructions:
      'Choose a preposition from the box (by / at / about / in / with / of / for) to go with the given adjective, and write a sentence about something or someone you know. Your sentence must give a reason.',
    word_bank: ['by', 'at', 'about', 'in', 'with', 'of', 'for'],
    sentence_form: '<subject> + <verb "to be"> + <adjective + preposition> + <object> + because ...',
    difficulty: '★★★☆☆',
    difficulty_level: 4,
    question:
      'Use the given adjective [excited] and the sentence form (<subject> + <verb "to be"> + <adjective + preposition> + <object> + because ...) to write a complete sentence with a reason.',
    answer: 'He was excited about the movie because it was a funny movie.',
    options: [],
    trapCodes: ['ENG_VERB_OMISSION', 'ENG_CHINGLISH_LITERAL', 'ENG_PREP_COLLOCATION'],
    triadGroup: { groupId: 'TEA_W12_ODG3_01', tier: 'L4-6', role: 'twist' },
    self_check: [
      'excited 後方是否正確搭配介系詞 about（excited about）',
      'because 子句內是否有明確主詞 it 與動詞 was / is（絕不可寫成 it funny）',
      '形容詞 funny 修飾電影時，動詞片語與名詞詞尾是否無贅詞重複（勿寫 in the movie）'
    ],
    explanation: {
      point: '情緒形容詞搭配 excited about ＋ because 原因子句必備 be 動詞',
      examPurpose:
        '考核學生對 excited about（對事件或期待事物感到興奮）的介系詞搭配，以及在 because 原因子句中維持「主詞＋動詞」完整結構的能力。',
      correctReason:
        '對電影、派對或即將發生的事件感到興奮固定使用 be excited about；連接詞 because 引導原因子句時，形容詞 funny 不能單獨當動詞，必須補上 be 動詞 was（或 is）。',
      note: 'Rex 實戰紀錄：原寫 "He was excited about the movie, because it funny in the movie." 老師紅筆於 funny 上方補 "is a" 並畫掉結尾 "in the movie"，扣分點主要在原因子句漏動詞與句尾贅詞。',
      trap: '受中文「因為它很好笑」直譯影響，常漏掉 be 動詞而寫成 because it funny。',
      commonTraps: [
        '中式直譯漏動詞：中文說「它很好笑」沒有「是」字，但英文形容詞 funny 前方一定要有 be 動詞（it was funny / it is a funny movie）。',
        '名詞重複贅詞陷阱：前句已說 the movie，後句又寫 in the movie 會造成語意重複與文法殘缺，應用代名詞 it 指代即可。'
      ],
      steps: [
        '步驟 1：決定情緒搭配詞 ➔ excited + about（對即將觀看或發生的事件感到興奮）。',
        '步驟 2：套用前半句公式 ➔ He was excited about the movie。',
        '步驟 3：補齊 because 原因子句 ➔ 檢查主詞 it 後面是否一定要有動詞 was / is（because it was a funny movie）。'
      ],
      insight: '💡 中文「很＋形容詞」翻成英文，一定要補上 is / am / are / was / were，絕對不能寫 it funny！',
      visualBlock: {
        kind: 'slot_box',
        title: '📦 excited about + because 完整五格造句槽',
        data: {
          slots: [
            { role: '主詞 + be', text: 'He was', accent: 'pri' },
            { role: '形容詞 + 介系詞', text: 'excited about', accent: 'warn' },
            { role: '受詞', text: 'the movie', accent: 'pri' },
            { role: '原因連接詞', text: 'because', accent: 'ok' },
            { role: '完整主詞+be+補語', text: 'it was a funny movie.', accent: 'ok' }
          ]
        },
        caption: '📊 第 5 格一定要檢查「主詞 + 動詞」齊全，不可省略 was/is！'
      }
    },
    extensionStudy: {
      synonyms: ['be thrilled about (對……感到激動)', 'look forward to (期待……)'],
      grammarCompare: 'excited about ＋期待發生的事（如 movie / trip）；surprised by/at ＋意外發生的事實或數據。',
      examVariations: '若改為動名詞結構：He was excited about watching the comedy movie because he loves funny stories.'
    }
  },
  {
    id: 'TEA_W12_A_02',
    week: 'W12',
    type: 'paper_rewrite',
    category_tag: 'rewrite',
    part: 'Part A',
    part_title: 'Part A: Grammar 3 (Unit 16) — Adjectives with Prepositions + because',
    part_instructions:
      'Choose a preposition from the box (by / at / about / in / with / of / for) to go with the given adjective, and write a sentence about something or someone you know. Your sentence must give a reason.',
    word_bank: ['by', 'at', 'about', 'in', 'with', 'of', 'for'],
    sentence_form: '<subject> + <verb "to be"> + <adjective + preposition> + <object> + because ...',
    difficulty: '★★★★☆',
    difficulty_level: 5,
    question:
      'Use the given adjective [disappointed] and the sentence form (<subject> + <verb "to be"> + <adjective + preposition> + <object> + because ...) to write a complete sentence with a reason.',
    answer: 'He is disappointed with his quiz because he got a bad score.',
    options: [],
    trapCodes: ['ENG_PREP_COLLOCATION', 'ENG_TENSE_MISMATCH', 'ENG_UNCOUNTABLE_SVA'],
    triadGroup: { groupId: 'TEA_W12_ODG3_02', tier: 'L4-6', role: 'twist' },
    self_check: [
      'disappointed 對事物失望是否使用 with（而非 of）',
      '「考到壞成績」是否使用單純過去式 got（而非與過去語境衝突的 have got）',
      'a bad 後方是否接單數可數名詞 score（不可寫成 a bad points）'
    ],
    explanation: {
      point: '形容詞固定介系詞 disappointed with ＋單數名詞 score 搭配',
      examPurpose:
        '同時測驗「對事物失望用 disappointed with」、「考不好用過去式 got」與「不定冠詞 a 不可配複數 points」三重實戰細節。',
      correctReason:
        '對具體成績或物品感到失望使用 disappointed with（對人表現失望常用 in，絕不可用 of）；考試結果已是過去事實用 got；a bad 後接單數 score（points 須為複數且不加 a）。',
      note: 'Rex 實戰紀錄：原寫 "He is disappointed of the quiz, because he have got a bad points." 老師紅筆連改四處：of ➔ with、the ➔ his、圈掉 have 留 got、圈起 points 改 score。',
      trap: '誤將中文「對……失望」套用 of（寫成 disappointed of），且 a 後面誤接複數 points。',
      commonTraps: [
        '介系詞致命陷阱：disappointed 只能配 with（事物）或 in（人）或 about（結果），絕對沒有 disappointed of！',
        '冠詞與單複數衝突：不定冠詞 a 只能配單數名詞（a bad score），不可寫成 a bad points；若用 points 則寫 got low points。'
      ],
      steps: [
        '步驟 1：判斷失望對象 quiz 為事物 ➔ 選擇介系詞 with（disappointed with his quiz）。',
        '步驟 2：檢查動詞時態 ➔ 考差了是已發生的動作，直接寫過去式 he got（勿寫 he have got，且第三人稱單數也不可用 have）。',
        '步驟 3：核對名詞單複數 ➔ a bad score（單數），不可寫 a bad points。'
      ],
      insight: '💡 對物失望 with、對人失望 in、絕對不用 of；不定冠詞 a 後面絕不能出現 -s 複數名詞！',
      visualBlock: {
        kind: 'prep_ladder',
        title: '🧭 disappointed 介系詞與成績用語對照階梯',
        data: {
          levels: [
            {
              prep: 'with',
              scope: '對具體事物、結果、表現感到失望（本題必考 ✅）',
              examples: ['disappointed with his quiz', 'happy with the product'],
              highlight: true
            },
            {
              prep: 'in',
              scope: '對某人的品行或表現感到失望',
              examples: ['disappointed in you', 'disappointed in my friend'],
              highlight: false
            },
            {
              prep: 'of ❌',
              scope: '錯誤搭配！disappointed 永遠不搭配 of',
              examples: ['disappointed of ❌ (應改 with)'],
              highlight: false
            }
          ]
        },
        caption: '📊 成績用語補充：a bad score / a low grade ✅ vs. a bad points ❌'
      }
    },
    extensionStudy: {
      synonyms: ['unhappy with (對……不滿意)', 'upset about (對……感到沮喪)'],
      grammarCompare: 'get a good/bad score（單數可數）vs. get many points（複數，不可加 a）；第三人稱單數現在完成式為 has got，非 have got。',
      examVariations: '若對象改為人：The coach was disappointed in the players because they did not try their best.'
    }
  },
  {
    id: 'TEA_W12_A_03',
    week: 'W12',
    type: 'paper_rewrite',
    category_tag: 'rewrite',
    part: 'Part A',
    part_title: 'Part A: Grammar 3 (Unit 16) — Adjectives with Prepositions + because',
    part_instructions:
      'Choose a preposition from the box (by / at / about / in / with / of / for) to go with the given adjective, and write a sentence about something or someone you know. Your sentence must give a reason.',
    word_bank: ['by', 'at', 'about', 'in', 'with', 'of', 'for'],
    sentence_form: '<subject> + <verb "to be"> + <adjective + preposition> + <object> + because ...',
    difficulty: '★★★★☆',
    difficulty_level: 5,
    question:
      'Use the given adjective [confused] and the sentence form (<subject> + <verb "to be"> + <adjective + preposition> + <object> + because ...) to write a complete sentence with a reason.',
    answer: "She is confused about the quiz because she didn't understand the questions.",
    options: [],
    trapCodes: ['ENG_PREP_COLLOCATION', 'ENG_TENSE_MISMATCH', 'ENG_POS_CONFUSION'],
    triadGroup: { groupId: 'TEA_W12_ODG3_03', tier: 'L4-6', role: 'twist' },
    self_check: [
      'confused 後方是否正確使用介系詞 about（或 by），而非 with',
      '第三人稱單數 she 的過去否定助動詞是否用 didn’t（而非 don’t）',
      '動詞組是否簡潔正確為 didn’t understand（或 didn’t know how to understand）'
    ],
    explanation: {
      point: 'confused about 固定搭配與過去式否定 didn’t understand',
      examPurpose:
        '檢測學生是否能正確使用 confused about（對問題或指令感到困惑），並避免第三人稱單數錯用 don’t 及不定詞漏 to 的複合錯誤。',
      correctReason:
        '「對某件事／問題感到困惑」標準搭配為 confused about（亦可用 confused by）；小考題目是當時沒看懂，過去式否定須用 didn’t + 原形動詞 understand。',
      note: 'Rex 實戰紀錄：原寫 "She is confused with her quiz, because she don\'t know how understand the questions." 老師紅筆改四處：with ➔ about、her ➔ the、don\'t ➔ didn\'t、畫掉 know how understand 改為 understand。',
      trap: '容易把 confused 誤配 with，或第三人稱單數 she 後面錯寫 don’t，以及 know how 後面漏掉 to。',
      commonTraps: [
        '介系詞搭配陷阱：confused 搭配 about 或 by（confused about the rules），不與 with 連用（與某人混淆才會偶見 confuse A with B 動詞用法）。',
        '不定詞漏 to 陷阱：know how 後面若要接動詞，必須寫 know how to understand，絕不可直接寫 know how understand！更簡潔的寫法是直接用 didn’t understand。'
      ],
      steps: [
        '步驟 1：選對介系詞 ➔ confused + about（對測驗題目感到困惑）。',
        '步驟 2：核對主詞與否定助動詞 ➔ 主詞 she 不可寫 don’t，考題看不懂發生在作答時，用過去式 didn’t。',
        '步驟 3：精簡動詞結構 ➔ 直接用 didn’t understand the questions，避免冗長又漏 to 的 know how understand。'
      ],
      insight: '💡 對問題困惑用 confused about；know how 後面一定要加 to + V，或乾脆直接寫 didn’t understand！',
      visualBlock: {
        kind: 'compare_table',
        title: '⚖️ 困惑句型三大錯誤急救對照表',
        data: {
          headers: ['考場錯寫 ❌', '老師紅筆訂正 ✅', '核心文法原因'],
          rows: [
            ['confused with the quiz', 'confused about the quiz', '形容詞對事物感到困惑固定搭配 about / by'],
            ["she don't know...", "she didn't understand...", '單數主詞 she 不可配 don’t，且過往作答經驗應用過去式 didn’t'],
            ['know how understand', 'know how to understand / understand', '疑問詞 how 後須接不定詞 to V，或直接用一般動詞 understand']
          ]
        },
        caption: '📊 寫完句子念一遍：didn’t + 原形動詞，句子越乾淨越不易扣分！'
      }
    },
    extensionStudy: {
      synonyms: ['puzzled about (對……感到迷惑)', 'unsure about (對……不確定)'],
      grammarCompare: 'be confused about + N（感到困惑的形容詞句型）vs. confuse A with B（動詞：把 A 和 B 搞混）。',
      examVariations: '若改為說明當下狀態：Tom is confused about the math homework because the instructions are too difficult.'
    }
  },
  {
    id: 'TEA_W12_A_04',
    week: 'W12',
    type: 'paper_rewrite',
    category_tag: 'rewrite',
    part: 'Part A',
    part_title: 'Part A: Grammar 3 (Unit 16) — Adjectives with Prepositions + because',
    part_instructions:
      'Choose a preposition from the box (by / at / about / in / with / of / for) to go with the given adjective, and write a sentence about something or someone you know. Your sentence must give a reason.',
    word_bank: ['by', 'at', 'about', 'in', 'with', 'of', 'for'],
    sentence_form: '<subject> + <verb "to be"> + <adjective + preposition> + <object> + because ...',
    difficulty: '★★★★☆',
    difficulty_level: 5,
    question:
      'Use the given adjective [famous] and the sentence form (<subject> + <verb "to be"> + <adjective + preposition> + <object> + because ...) to write a complete sentence with a reason.',
    answer: 'He is famous for a drawing because the drawing is very beautiful.',
    options: [],
    trapCodes: ['ENG_POS_CONFUSION', 'ENG_ARTICLE_ERROR'],
    triadGroup: { groupId: 'TEA_W12_ODG3_04', tier: 'L4-6', role: 'twist' },
    self_check: [
      'famous 後方是否正確搭配介系詞 for（famous for + 成名原因或作品）',
      '初次提及的單數可數名詞 drawing 前是否用不定冠詞 a（或 his）',
      '若句尾使用形容詞 beautiful，主詞是否為事物 the drawing + be 動詞 is（若用動作 drew 則須改副詞 beautifully）'
    ],
    explanation: {
      point: 'famous for 搭配與形容詞 beautiful vs. 副詞 beautifully 詞性辨析',
      examPurpose:
        '測驗 famous for（以……聞名）的正確介系詞，並檢驗學生能否區分「動作動詞＋副詞 (drew beautifully)」與「名詞＋be 動詞＋形容詞 (the drawing is beautiful)」。',
      correctReason:
        '「因某項才藝或作品而聞名」固定用 be famous for；beautiful 是形容詞，只能放在 be 動詞後形容名詞（the drawing is very beautiful），若要修飾動詞 drew 則必須改成副詞 beautifully。',
      note: 'Rex 實戰紀錄：原寫 "He is famous for the drawing because he drew very beautiful." 老師紅筆在 the 下補 a，並將後面改寫為 "the drawing is very beautiful."。',
      trap: '直接把形容詞 beautiful 接在一般動詞 drew 後面，違反「副詞才能修飾動詞」的詞性鐵律。',
      commonTraps: [
        '詞性錯位陷阱：drew 是動作動詞，後面不能寫 very beautiful ❌，必須改寫成 drew very beautifully ✅，或換成主詞 the drawing is very beautiful ✅。',
        '冠詞指涉陷阱：首次提到某幅畫作時用 a drawing（或 his drawings）較自然，第二個子句再次提到該幅畫時才改用定冠詞 the drawing。'
      ],
      steps: [
        '步驟 1：鎖定介系詞 ➔ famous + for（以某作品／特點聞名）。',
        '步驟 2：檢查冠詞 ➔ 前句初提用 a drawing，後句特指該幅畫才用 the drawing。',
        '步驟 3：檢查詞性搭配 ➔ beautiful 是形容詞，配 be 動詞 is（the drawing is very beautiful）；若保留動詞 drew，則必須加 -ly 寫成 beautifully。'
      ],
      insight: '💡 一般動詞配副詞 (-ly)，be 動詞才配形容詞！寫完 beautiful 先回頭看前面是 drew 還是 is！',
      visualBlock: {
        kind: 'compare_table',
        title: '⚖️ 形容詞 beautiful vs. 副詞 beautifully 雙軌切換表',
        data: {
          headers: ['句型路線', '主詞 + 動詞', '修飾語詞性', '完整正確句'],
          rows: [
            ['路線 A：be 動詞路線 ✅', 'the drawing + is', '形容詞 (very beautiful)', 'because the drawing is very beautiful.'],
            ['路線 B：動作動詞路線 ✅', 'he + drew', '副詞 (very beautifully)', 'because he drew very beautifully.'],
            ['常見錯寫 ❌', 'he + drew', '形容詞 (beautiful ❌)', 'because he drew very beautiful. ❌']
          ]
        },
        caption: '📊 兩條正確路線任選其一，千萬不可混搭「一般動詞＋形容詞」！'
      }
    },
    extensionStudy: {
      synonyms: ['well-known for (以……聞名)', 'noted for (因……著稱)'],
      grammarCompare: 'famous for + 特色/作品（以……著名）vs. famous as + 身份職業（作為……而聞名，如 famous as an artist）。',
      examVariations: '若套用於人物傳記單元：Leonardo da Vinci is famous for his painting, the "Mona Lisa," because it is a masterpiece.'
    }
  },

  // =========================================================================
  // Part B: Read and Discover 6 (Chapter 6) — Open-Book Mars & Alien Life
  // =========================================================================
  {
    id: 'TEA_W12_B_01',
    week: 'W12',
    type: 'paper_rewrite',
    category_tag: 'rewrite',
    part: 'Part B',
    part_title: 'Part B: Read and Discover 6 (Chapter 6) — Open-Book Comprehension',
    part_instructions:
      '依據 Read and Discover 6 (Chapter 6: Life on Other Planets) 課文內容，用完整句子回答下列問題，並盡量在適當位置使用代名詞（Use pronouns wherever you can）。',
    difficulty: '★★★★☆',
    difficulty_level: 5,
    question:
      'Read and Discover 6 (Chapter 6): Why did people think Martians were living on Mars? (Write complete sentences and use pronouns wherever you can.)',
    answer:
      'They thought Martians were living on Mars because astronomers thought that they saw lines on the surface of Mars, and some people thought that they were canals.',
    options: [],
    trapCodes: ['ENG_ARTICLE_ERROR', 'ENG_CHINGLISH_LITERAL'],
    triadGroup: { groupId: 'TEA_W12_SPACE_01', tier: 'L4-6', role: 'twist' },
    self_check: [
      '是否寫出完整主句開頭（They thought Martians were living on Mars because...），避免只寫片語式 Because...',
      '是否同時涵蓋「看到表面線條 (saw lines)」與「以為線條是運河 (thought they were canals)」兩段因果',
      'on the surface of Mars 中的定冠詞 the 是否沒有漏掉，且適切使用代名詞 they 指代 people/astronomers 與 lines'
    ],
    explanation: {
      point: '火星運河歷史誤會雙重因果整合與代名詞指涉',
      examPurpose:
        '訓練學生從科普文章提取完整兩階段因果鏈（看到線條 ➔ 誤以為是人工運河 ➔ 推論有火星人），並落實完整句與代名詞替換。',
      correctReason:
        '一百年前望遠鏡較小，天文學家以為在火星表面（on the surface of Mars）看到線條，且有些人認為那些線條是運河（canals），進而聯想出火星人建造運河。',
      note: 'Rex 實戰紀錄：原寫 "Because astronomers thought that they saw lines on surface of Mars." 老師紅筆在句尾補寫 "and they thought the lines were canals."，點出因果證據不完整與漏掉「運河」關鍵字。',
      trap: '只答出「看到線條」就停筆，遺漏「線條被誤認為運河 (canals)」的關鍵推論橋梁；以及 on the surface 漏加 the。',
      commonTraps: [
        '證據斷裂陷阱：光看到「線條 (lines)」不足以證明有生命，必須補上「以為那些線條是運河 (canals)」才構成完整解答。',
        '冠詞與不完整句陷阱：on the surface of Mars 固定須加定冠詞 the；正式書寫問答盡量從主詞 They thought... 開頭，避免直接用 Because 獨立成句。'
      ],
      steps: [
        '步驟 1：用代名詞改寫問句起手式 ➔ They thought Martians were living on Mars because...',
        '步驟 2：寫出觀測現象 ➔ astronomers thought that they saw lines on the surface of Mars,',
        '步驟 3：補齊關鍵誤解推論 ➔ and some people thought that they (the lines) were canals.'
      ],
      insight: '💡 回答 Why 科普推理題：現象（saw lines）＋ 推論（thought they were canals），兩段缺一不可！',
      visualBlock: {
        kind: 'slot_box',
        title: '📦 火星人傳說雙重因果邏輯鏈',
        data: {
          slots: [
            { role: '1. 望遠鏡限制', text: 'telescopes were smaller', accent: 'pri' },
            { role: '2. 視覺錯覺', text: 'saw lines on the surface', accent: 'warn' },
            { role: '3. 關鍵誤判', text: 'thought they were canals', accent: 'ok' },
            { role: '4. 延伸幻想', text: 'Martians lived on Mars', accent: 'pri' }
          ]
        },
        caption: '📊 紅色第 3 格 canals 是課文關鍵詞，作答漏掉就會被老師補字扣分！'
      }
    },
    extensionStudy: {
      synonyms: ['artificial waterways (人工水道 / canals)', 'observe clearly (看清楚 / see clearly)'],
      grammarCompare: '句子第一個 they 指代 astronomers；第二個 they 指代複數名詞 lines（替代重複寫 the lines）。',
      examVariations: '若改為簡答選擇或填充：People imagined Martians building _____ and living in cities on Mars. (答案：canals)'
    }
  },
  {
    id: 'TEA_W12_B_02',
    week: 'W12',
    type: 'paper_rewrite',
    category_tag: 'rewrite',
    part: 'Part B',
    part_title: 'Part B: Read and Discover 6 (Chapter 6) — Open-Book Comprehension',
    part_instructions:
      '依據 Read and Discover 6 (Chapter 6: Life on Other Planets) 課文內容，用完整句子回答下列問題，並盡量在適當位置使用代名詞（Use pronouns wherever you can）。',
    difficulty: '★★★★★',
    difficulty_level: 6,
    question:
      "Read and Discover 6 (Chapter 6): Why isn't there any life on the surface of Mars? (Write complete sentences and use pronouns wherever you can.)",
    answer:
      "There isn't any life on the surface of Mars because it is very cold, and there isn't any liquid water on the surface—there is only ice on it.",
    options: [],
    trapCodes: ['ENG_UNCOUNTABLE_SVA', 'ENG_THERE_BE_VS_HAVE', 'ENG_CHINGLISH_LITERAL'],
    triadGroup: { groupId: 'TEA_W12_SPACE_02', tier: 'L7-10', role: 'challenge' },
    self_check: [
      'water 為不可數名詞，存在句否定是否使用 there isn’t any water（絕不可用 aren’t）',
      '表達「表面只有冰」是否使用 there is only ice（絕不可寫成中式英文 only have ice）',
      '是否點出關鍵科學事實：火星表面太冷導致沒有液態水（liquid water）'
    ],
    explanation: {
      point: '不可數名詞 water 主謂一致 (isn’t) ＋ 存在句 there is (非 only have)',
      examPurpose:
        '精準狙擊小六最高頻的兩大文法殺手：不可數名詞 water 配複數動詞 aren’t、以及受中文「只有冰」直譯而誤用 only have ice 取代存在句 there is only ice。',
      correctReason:
        'water 與 ice 皆為不可數名詞，表示某處「存在／不存在」一律用單數 there is / there isn’t；課文指出火星表面極度寒冷，所有地表的水都是冰（all the water on the surface is ice），沒有液態水。',
      note: 'Rex 實戰紀錄：原寫 "Because there aren\'t any water, only have ice." 老師紅筆把 aren\'t 劃掉改 isn\'t，並劃掉 have，補寫 "on the surface. only ice on the surface"。',
      trap: '將不可數名詞 water 當作複數搭配 aren’t，並用中文「只有冰」直接寫出缺乏主詞的 only have ice。',
      commonTraps: [
        '不可數名詞主謂一致：water、ice、air、food 皆不可數，因此「沒有任何水」必須寫 there isn’t any water，絕對不能寫 there aren’t any water！',
        '存在句誤用 have：中文「桌上只有書／表面只有冰」千萬不能直接寫 only have ice ❌，必須寫 there is only ice on the surface ✅。'
      ],
      steps: [
        '步驟 1：核對主詞水 (water) 的數性 ➔ 不可數名詞，所以存在句否定只能選 there isn’t any water。',
        '步驟 2：轉換中式「只有冰」➔ 存在句必須用 there is only ice（或名詞片語接續），嚴禁寫 only have ice。',
        '步驟 3：補齊課文科學邏輯 ➔ 因為很冷（it is very cold），地表缺乏液態水，全部結成了冰。'
      ],
      insight: '💡 看到 water 立刻反射單數 isn’t；看到中文「有／沒有／只有」描述地點存在物，一律用 there is / isn’t，禁止寫 have！',
      visualBlock: {
        kind: 'compare_table',
        title: '⚖️ 不可數名詞與存在句雙重排雷表',
        data: {
          headers: ['考場中式錯寫 ❌', '標準文法訂正 ✅', '必背文法鐵律'],
          rows: [
            ["there aren't any water", "there isn't any water", 'water 為不可數名詞，存在句否定一律用單數 isn’t'],
            ['only have ice', 'there is only ice on the surface', '「某地有/只有某物」用 there is，不可無主詞寫 only have'],
            ['on surface of Mars', 'on the surface of Mars', '特定星球表面必須加定冠詞 the']
          ]
        },
        caption: '📊 這一題一錯就是兩個紅筆訂正，考前務必熟記這兩條紅線！'
      }
    },
    extensionStudy: {
      synonyms: ['liquid water (液態水)', 'frozen water / ice (冰凍的水 / 冰)'],
      grammarCompare: 'there is no water / there isn’t any water（不可數單數）vs. there aren’t any Martians（可數複數）。',
      examVariations: '若改為簡答填空：It is very cold on Mars, so all the water on the _____ is _____. (答案：surface / ice)'
    }
  },
  {
    id: 'TEA_W12_B_03',
    week: 'W12',
    type: 'paper_rewrite',
    category_tag: 'rewrite',
    part: 'Part B',
    part_title: 'Part B: Read and Discover 6 (Chapter 6) — Open-Book Comprehension',
    part_instructions:
      '依據 Read and Discover 6 (Chapter 6: Life on Other Planets) 課文內容，用完整句子回答下列問題，並盡量在適當位置使用代名詞（Use pronouns wherever you can）。',
    difficulty: '★★★★★',
    difficulty_level: 6,
    question:
      'Read and Discover 6 (Chapter 6): Could there be any life on Mars? Explain your answer. (Write complete sentences and use pronouns wherever you can.)',
    answer:
      'Yes, there could be life on Mars because many scientists think there is liquid water in the soil or in underground rivers, where simple living things like bacteria could live.',
    options: [],
    trapCodes: ['ENG_ARTICLE_ERROR', 'ENG_CHINGLISH_LITERAL'],
    triadGroup: { groupId: 'TEA_W12_SPACE_03', tier: 'L7-10', role: 'challenge' },
    self_check: [
      '是否依課本科學證據正面作答 Yes, there could be life on Mars（注意題幹問的是「有沒有可能」，非地表有沒有）',
      '解釋原因 (Explain your answer) 是否提及「土壤或地下河流可能有液態水」與「細菌等簡單生命」',
      '專有名詞 Mars 與不可數抽象名詞 life 前是否不濫加定冠詞 the（絕不寫 the life on the Mars）'
    ],
    explanation: {
      point: '火星地底液態水科學推論 ＋ 專有名詞 Mars 零冠詞鐵律',
      examPurpose:
        '考驗學生在 Open-book 題型中精準區分「地表無水」與「地底可能有液態水 (underground rivers / soil)」的閱讀理解能力，並糾正專有名詞濫加 the 的錯誤。',
      correctReason:
        '題目問的是 Could there be（有沒有可能存在），課本第 2 段明確指出許多科學家認為火星土壤（soil）或地下河（underground rivers）中有液態水，因此「有可能存在生命 (Yes, there could be life)」；此外，行星名 Mars 與抽象名詞 life 前不可加 the。',
      note: 'Rex 實戰紀錄：原寫 "No, because astronomers didn\'t see the life on the Mars." 被老師畫上大紅叉（全題扣分），錯在誤判課文結論且寫出 the life 與 the Mars。',
      trap: '誤將「目前還沒看見地表生物」當成「完全不可能有生命」，且習慣性在 Mars 前加 the 寫成 on the Mars。',
      commonTraps: [
        '課文資訊混淆陷阱：課文確實說「地表太冷只有冰、沒有火星人 (Martians)」，但緊接著強調「土壤與地下河可能有液態水，所以也許有生命 (Maybe there is life on Mars, too)」。',
        '冠詞濫加陷阱：行星專有名詞（Mars, Venus, Jupiter, Saturn）與不可數泛指名詞 life 前面絕對不加 the（the Earth 為少數例外，但 on Earth 常省略）。'
      ],
      steps: [
        '步驟 1：看懂助動詞 Could 語氣 ➔ 問的是「有沒有可能性」，回課文找 Maybe / could 線索，先答 Yes, there could be life on Mars。',
        '步驟 2：補充科學證據 ➔ because many scientists think there is liquid water in the soil or in underground rivers。',
        '步驟 3：冠詞健檢 ➔ 刪除 life 與 Mars 前多餘的 the，寫成 life on Mars。'
      ],
      insight: '💡 Could there be 問的是「地底可能性」不是「地表現在看得到嗎」！行星 Mars 前永遠不加 the！',
      visualBlock: {
        kind: 'compare_table',
        title: '⚖️ 火星地表 vs. 火星地底生命可能性對照',
        data: {
          headers: ['區域位置', '水分型態', '是否有生命可能', '課文科學依據'],
          rows: [
            ['火星地表 (on the surface)', '太冷，只有冰 (only ice)', '無生命 ❌', '缺乏生命所需的液態水 (liquid water)'],
            ['土壤與地下河 (soil / underground)', '可能有液態水 (liquid water)', '可能有生命 ✅', '簡單生物如細菌 (bacteria) 可在此生存']
          ]
        },
        caption: '📊 考試做 Open-book 題時，先比對「表面 surface」還是「整顆火星 could there be」再下筆！'
      }
    },
    extensionStudy: {
      synonyms: ['beneath the surface / underground (在地底下)', 'microscopic organisms / bacteria (微生物 / 細菌)'],
      grammarCompare: 'Could there be...?（表推測可能性：有可能有……嗎？）答句搭配 Yes, there could be... or Maybe there is...。',
      examVariations: '若改為 Explain 填空：Scientists are looking for _____ on Mars because they can live in extreme places.'
    }
  },
  {
    id: 'TEA_W12_B_04',
    week: 'W12',
    type: 'paper_rewrite',
    category_tag: 'rewrite',
    part: 'Part B',
    part_title: 'Part B: Read and Discover 6 (Chapter 6) — Open-Book Comprehension',
    part_instructions:
      '依據 Read and Discover 6 (Chapter 6: Life on Other Planets) 課文內容，用完整句子回答下列問題，並盡量在適當位置使用代名詞（Use pronouns wherever you can）。',
    difficulty: '★★★★☆',
    difficulty_level: 5,
    question:
      "Read and Discover 6 (Chapter 6): What type of alien life do you think we'll discover first? Explain your answer.",
    answer:
      'I think we will discover bacteria first because they are simple living things that can live in very hot and cold places, even inside rocks.',
    options: [],
    trapCodes: ['ENG_ARTICLE_ERROR', 'ENG_TENSE_MISMATCH'],
    triadGroup: { groupId: 'TEA_W12_SPACE_04', tier: 'L7-10', role: 'challenge' },
    self_check: [
      '是否正確對齊問句主詞 we（I think we will discover...），而非無端換成 They would',
      '泛指複數名詞 bacteria 前是否沒有濫加定冠詞 the',
      '是否完整回答 Explain your answer（說明為何細菌最可能先被發現，且用代名詞 they 指代 bacteria）'
    ],
    explanation: {
      point: '泛指複數名詞 bacteria 零冠詞與 Explain your answer 雙段作答',
      examPurpose:
        '評量學生是否能看懂問句兩大指令（回答種類 ＋ Explain your answer），並掌握泛指複數名詞不加 the 及代名詞 they 回指複數 bacteria 的一致性。',
      correctReason:
        '問句用 we’ll（we will）詢問你的看法，答句應以 I think we will discover bacteria first 開頭；bacteria 是泛指「細菌這類生物」的複數名詞，前面不可加 the；接著用 because they... 解釋原因。',
      note: 'Rex 實戰紀錄：原寫 "They would first find the bacteria." 老師紅筆打叉畫掉 bacteria 前的 the，且 Rex 完全漏寫了後半句的 Explain your answer。',
      trap: '只答出名詞就結束，忘記寫 Explain your answer；並在泛指複數名詞 bacteria 前面加上多餘的 the。',
      commonTraps: [
        '漏答第二問句陷阱：題目只要出現 "Explain your answer."，就佔了一半的分數！一定要用 because... 接出課文理由。',
        '泛指複數加 the 陷阱：表達一般概念或生物種類（如 bacteria, aliens, humans）時，前面不可加定冠詞 the。'
      ],
      steps: [
        '步驟 1：回應主問題並對齊人稱 ➔ 問句問 do you think we’ll...，答句寫 I think we will discover bacteria first。',
        '步驟 2：檢查冠詞 ➔ bacteria 為泛指複數，刪除 the。',
        '步驟 3：補寫 Explain your answer（搭配代名詞 they）➔ because they are simple living things that can live in extreme places.'
      ],
      insight: '💡 看到 Explain your answer 就像看到警報器：沒寫 because... 就等於直接送掉一半的分數！',
      visualBlock: {
        kind: 'slot_box',
        title: '📦 兩段式思辨問答必備結構槽',
        data: {
          slots: [
            { role: '1. 立場回答', text: 'I think we will discover bacteria first', accent: 'pri' },
            { role: '2. 零冠詞檢查', text: 'bacteria (不加 the ❌)', accent: 'warn' },
            { role: '3. Explain 連接詞', text: 'because', accent: 'ok' },
            { role: '4. 代名詞 + 課文理由', text: 'they are simple living things that can live in extreme places.', accent: 'ok' }
          ]
        },
        caption: '📊 細菌 (bacteria) 已經是複數，後方代名詞記得用 they 和複數動詞 are！'
      }
    },
    extensionStudy: {
      synonyms: ['extreme environments (極端環境：very hot and cold places)', 'microbes (微生物)'],
      grammarCompare: 'bacterium（單數，極少考）➔ bacteria（複數不規則變化，不可寫 bacterias，搭配動詞 are 與代名詞 they）。',
      examVariations: '開放題亦可發揮：I think we will discover simple living things like bacteria first because planets like Europa might have oceans under the ice.'
    }
  },
  {
    id: 'TEA_W12_B_05',
    week: 'W12',
    type: 'paper_rewrite',
    category_tag: 'rewrite',
    part: 'Part B',
    part_title: 'Part B: Read and Discover 6 (Chapter 6) — Open-Book Comprehension',
    part_instructions:
      '依據 Read and Discover 6 (Chapter 6: Life on Other Planets) 課文內容，用完整句子回答下列問題，並盡量在適當位置使用代名詞（Use pronouns wherever you can）。',
    difficulty: '★★★★☆',
    difficulty_level: 5,
    question:
      'Read and Discover 6 (Chapter 6): Will it be good or bad if we find alien life? Explain your answer.',
    answer:
      'It will be bad if aliens are dangerous and they might eat humans. (Or: It will be good because scientists can learn more about life in the universe.)',
    options: [],
    trapCodes: ['ENG_ARTICLE_ERROR', 'ENG_CHINGLISH_LITERAL'],
    triadGroup: { groupId: 'TEA_W12_SPACE_05', tier: 'L4-6', role: 'twist' },
    self_check: [
      '泛指複數名詞 aliens 與 humans 前是否皆未加定冠詞 the',
      '表達「也許會」時是否正確使用情態助動詞 might / may + 原形動詞（避免寫出 maybe will）',
      '是否清楚寫出 good 或 bad 的原因說明（Explain your answer）'
    ],
    explanation: {
      point: '泛指複數 zero-article (aliens / humans) ＋ 避免 maybe will 冗贅直譯',
      examPurpose:
        '檢驗學生自由論述時是否仍能遵守「泛指複數名詞不加 the」與「情態助動詞 might / may 不可與 maybe + will 重疊」的文法準則。',
      correctReason:
        'aliens 與 humans 在句中指代「外星生物」與「人類」這整個群體，屬於泛指複數名詞，前面不加 the；表達推測「也許會吃掉人類」，英文使用情態助動詞 might eat 或 may eat，不用 maybe will eat。',
      note: 'Rex 實戰紀錄：原寫 "It will be bad because the aliens maybe will eat the humans." 老師紅筆一口氣畫掉兩個 the（the aliens / the humans）與多餘的 will。',
      trap: '受中文「那些外星人也許會吃掉人類」影響，連加兩個不需要的 the，並寫出中式結構 maybe will。',
      commonTraps: [
        '雙重冠詞濫加陷阱：當 aliens、humans、animals 指的是全體或一般種類時，絕對不加 the（除非特指某電影裡的那群外星人）。',
        'maybe will 直譯陷阱：maybe 是副詞，通常放在句首（Maybe aliens will eat humans.）；在句中動詞前表達「可能」，直接用助動詞 might / may + V 即可，勿寫 maybe will + V。'
      ],
      steps: [
        '步驟 1：明確表態 good 或 bad ➔ It will be bad / good because...',
        '步驟 2：刪除泛指複數名詞前的 the ➔ 保留乾淨的 aliens 與 humans。',
        '步驟 3：修正推測動詞組 ➔ 把 maybe will eat 升級為道地的情態助動詞 might eat（或句首寫 Maybe they will eat...）。'
      ],
      insight: '💡 泛指一群生物（aliens / humans / bacteria）不加 the！句中表「也許會」用 might + V，比 maybe will 更道地！',
      visualBlock: {
        kind: 'compare_table',
        title: '⚖️ 推測語氣與泛指複數名詞雙重修正表',
        data: {
          headers: ['考場中式錯寫 ❌', '老師與道地改寫 ✅', '修正原因'],
          rows: [
            ['the aliens ... the humans', 'aliens ... humans', '泛指全體族群的複數名詞不加定冠詞 the'],
            ['aliens maybe will eat', 'aliens might eat / Maybe aliens will eat', '句中用助動詞 might 表推測；maybe 置句首才配 will'],
            ['without because...', 'because we can learn more...', '必須回應 Explain your answer 寫出合理原因']
          ]
        },
        caption: '📊 寫自由意見題時，用簡潔正確的文法就能穩穩拿滿分！'
      }
    },
    extensionStudy: {
      synonyms: ['might / may (也許、可能)', 'human beings / humans (人類)'],
      grammarCompare: 'Maybe + S + will + V（maybe 為副詞放句首）vs. S + might/may + V（情態助動詞放主詞後）。',
      examVariations: '正向論點寫法：It will be good because they might help us learn how life began in our solar system.'
    }
  },

  // =========================================================================
  // Part C: Write Right 3 (Unit 6) — Guided Biography Writing from Outline
  // =========================================================================
  {
    id: 'TEA_W12_C_01',
    week: 'W12',
    type: 'paper_rewrite',
    category_tag: 'rewrite',
    part: 'Part C',
    part_title: 'Part C: Write Right 3 (Unit 6) — Biography Writing from Outline',
    part_instructions:
      'Write a complete 3-paragraph biography essay from the outline below. Add necessary articles, prepositions, and linking words, and think carefully about your verb tenses (Past vs. Present).',
    difficulty: '★★★★★',
    difficulty_level: 6,
    question:
      'Write a full biography essay ("The Person I Admire") based on the outline: Person I admire: Leonardo da Vinci | Occupation: artist | Country: Italy | Birth: 1452, Death: 1519 | Accomplishments: make many great drawings & paintings; paint the "Mona Lisa" | Thanks to him: can enjoy some really great art | Why admire?: gifted and talented; drew almost 2,500 drawings; one of the greatest artists of his time.',
    answer:
      'The Person I Admire\nThe person I admire the most is Leonardo da Vinci. Da Vinci was an artist from Italy. He was born in 1452 and died in 1519. He made many great drawings and paintings. His most famous painting is the "Mona Lisa". Thanks to Leonardo, we can enjoy some really great art.\nLeonardo was gifted and talented. However, I admire Leonardo most of all because he drew almost 2,500 drawings. He was one of the greatest artists of his time.\nFor these reasons, I think Leonardo da Vinci was a great person.',
    options: [],
    trapCodes: ['ENG_TENSE_MISMATCH', 'ENG_ARTICLE_ERROR', 'ENG_CHINGLISH_LITERAL'],
    triadGroup: { groupId: 'TEA_W12_WR3_01', tier: 'L7-10', role: 'challenge' },
    self_check: [
      '單一國名 Italy 前是否沒有誤加定冠詞 the（from Italy，非 from the Italy）',
      '提綱裡的原形動詞 make 是否已改為歷史過去式 made（He made many great drawings and paintings.）',
      '身份句「是當代最偉大藝術家之一」是否使用 be 動詞 was（He was one of the greatest artists...，非 made）',
      '全篇校對是否無換行重複字（artists artists）與錯置他人姓名（如誤把課本的 Tomas 寫進 Leonardo 前面）'
    ],
    explanation: {
      point: '提綱傳記過去式切換 ＋ 國名零冠詞 ＋ 完稿指讀校對',
      examPurpose:
        '全面考查 Write Right 3 Unit 6 歷史人物傳記寫作的四大支柱：國名零冠詞、歷史生平動詞轉過去式、至今影響保留現在式 can、以及考後自我校對去重。',
      correctReason:
        '達文西生卒於 1452–1519 年，所有生平事蹟皆為過去事實，故須使用 was、was born、died、made、drew；單一國名 Italy 不加 the；表達「至今我們仍能欣賞」用 Thanks to Leonardo, we can enjoy... 切換回現在式。',
      note: 'Rex 實戰紀錄（本大題高分拿下 18/20，僅 4 處微扣分）：① from the Italy（紅筆畫掉 the）；② He make many...（紅筆圈 make 應為 made）；③ He made one of the greatest artists artists...（圈 made 改 was、畫掉重複 artists）；④ 結尾受課本 Thomas Edison 慣性影響寫成 Tomas Leonardo（紅筆圈掉 Tomas）。',
      trap: '直接抄寫提綱原形動詞 make 而忘記改過去式；國名加 the；以及把課本範文主角 Thomas (Tomas) 誤植到新人物身上。',
      commonTraps: [
        '國名加 the 陷阱：只有聯邦或複數名詞國名才加 the（the United States / the UK），一般單一國名 Italy, Taiwan, England 絕對不加 the！',
        '提綱原形詞誘導：Outline 常以原形動詞提示（make many drawings），寫成傳記必須依時代轉換成過去式 made；身份句則要補 was 而非用 made。',
        '記憶干擾與換行重複：寫完作文一定要留 30 秒用手指指著每個字重讀一遍，就能秒抓出 Tomas Leonardo 與跨行重複的 artists artists！'
      ],
      steps: [
        '步驟 1：導入與身份 ➔ The person I admire the most is Leonardo da Vinci. + was an artist from Italy（不加 the）。',
        '步驟 2：生平與成就（過去式）➔ was born in 1452, died in 1519, made many great drawings（記得 make ➔ made）。',
        '步驟 3：當今影響（現在式）➔ His most famous painting is... / Thanks to Leonardo, we can enjoy...',
        '步驟 4：欽佩原因與結尾（過去式 + 校對）➔ drew almost 2,500 drawings; He was one of the greatest artists of his time. 最後檢查姓名一致與有無重複字。'
      ],
      insight: '💡 寫傳記三口訣：單一國名不加 the、已逝生平全過去式、至今影響用現在式 can，寫完指讀抓重字！',
      visualBlock: {
        kind: 'timeline',
        title: '⏳ 達文西傳記「過去 vs. 現在」雙時態時間軸',
        data: {
          events: [
            {
              time: 'Past (1452–1519)',
              label: 'was an artist from Italy / was born / died / made drawings / drew 2,500 / was one of the greatest',
              highlight: true
            },
            {
              time: 'Legacy (Now)',
              label: 'The person I admire the most is... / His most famous painting is... / Thanks to Leonardo, we can enjoy...',
              highlight: false
            }
          ],
          rule: '歷史人物已故生平全用過去式 (was / made / drew)，至今仍存在的作品與影響才用現在式 (is / can enjoy)！'
        },
        caption: '📊 寫作看到「make / paint / invent」在 Outline 裡，先畫箭頭提醒自己改成過去式！'
      }
    },
    extensionStudy: {
      synonyms: ['gifted and talented (天賦異稟且才華洋溢)', 'admire most of all (最為欽佩)'],
      grammarCompare: 'from Italy / from England（單一國名零冠詞）vs. from the United States（含複數/政治體制名稱之國名必加 the）。',
      examVariations: 'Week 13 預測題型：可能將人物換成 Albert Einstein / Marie Curie，或直接改寫成 12–14 處短文改錯卷，專考 the Germany / make / made one of the greatest！'
    }
  }
];

// ===========================================================================
// Mistake Buster (神探點詞抓錯) — 100% 源自 Rex Week 12 Page 25 & Page 26 紅筆錯處
// 嚴格遵守：tokens = sentence.split(' ')（無內部空白）、tokens[wrong_index] === wrong_word
// ===========================================================================
const mistake_buster = [
  {
    id: 'MB_TEA_W12_01',
    week: 'W12',
    trap_id: 'ENG_VERB_OMISSION',
    point: 'W12 Part A Q1：because 子句漏寫 be 動詞',
    sentence: 'He was excited about the movie, because it funny.',
    tokens: ['He', 'was', 'excited', 'about', 'the', 'movie,', 'because', 'it', 'funny.'],
    wrong_index: 8,
    error_token_index: 8,
    wrong_word: 'funny.',
    correct_word: 'was funny. (或 is a funny movie.)',
    correct_text: 'He was excited about the movie, because it was funny.',
    fixed_sentence: 'He was excited about the movie, because it was funny.',
    reason: '【W12 實卷真錯 #1】形容詞 funny 不能單獨當動詞使用！在 because it... 後面必須補上 be 動詞 was 或 is（it was funny），不可中式直譯成 it funny。',
    explanation: '【W12 實卷真錯 #1】形容詞 funny 不能單獨當動詞使用！在 because it... 後面必須補上 be 動詞 was 或 is（it was funny），不可中式直譯成 it funny。'
  },
  {
    id: 'MB_TEA_W12_02',
    week: 'W12',
    trap_id: 'ENG_PREP_COLLOCATION',
    point: 'W12 Part A Q2：disappointed 介系詞誤用 of',
    sentence: 'He is disappointed of his quiz because he got a bad score.',
    tokens: ['He', 'is', 'disappointed', 'of', 'his', 'quiz', 'because', 'he', 'got', 'a', 'bad', 'score.'],
    wrong_index: 3,
    error_token_index: 3,
    wrong_word: 'of',
    correct_word: 'with',
    correct_text: 'He is disappointed with his quiz because he got a bad score.',
    fixed_sentence: 'He is disappointed with his quiz because he got a bad score.',
    reason: '【W12 實卷真錯 #2】對考試成績或具體事物感到失望，固定搭配介系詞 with（disappointed with）；對人感到失望則用 in，絕不可寫成 disappointed of！',
    explanation: '【W12 實卷真錯 #2】對考試成績或具體事物感到失望，固定搭配介系詞 with（disappointed with）；對人感到失望則用 in，絕不可寫成 disappointed of！'
  },
  {
    id: 'MB_TEA_W12_03',
    week: 'W12',
    trap_id: 'ENG_TENSE_MISMATCH',
    point: 'W12 Part A Q2：第三人稱單數誤用 have got',
    sentence: 'He is disappointed with his quiz because he have got a bad score.',
    tokens: ['He', 'is', 'disappointed', 'with', 'his', 'quiz', 'because', 'he', 'have', 'got', 'a', 'bad', 'score.'],
    wrong_index: 8,
    error_token_index: 8,
    wrong_word: 'have',
    correct_word: '(刪除 have，直接用過去式 got)',
    correct_text: 'He is disappointed with his quiz because he got a bad score.',
    fixed_sentence: 'He is disappointed with his quiz because he got a bad score.',
    reason: '【W12 實卷真錯 #3】主詞 he 為第三人稱單數不可配 have；且描述考試考差的過去事實，直接用過去式 got 即可（老師紅筆圈掉 have）。',
    explanation: '【W12 實卷真錯 #3】主詞 he 為第三人稱單數不可配 have；且描述考試考差的過去事實，直接用過去式 got 即可（老師紅筆圈掉 have）。'
  },
  {
    id: 'MB_TEA_W12_04',
    week: 'W12',
    trap_id: 'ENG_UNCOUNTABLE_SVA',
    point: 'W12 Part A Q2：不定冠詞 a 與複數名詞 points 衝突',
    sentence: 'He is disappointed with his quiz because he got a bad points.',
    tokens: ['He', 'is', 'disappointed', 'with', 'his', 'quiz', 'because', 'he', 'got', 'a', 'bad', 'points.'],
    wrong_index: 11,
    error_token_index: 11,
    wrong_word: 'points.',
    correct_word: 'score.',
    correct_text: 'He is disappointed with his quiz because he got a bad score.',
    fixed_sentence: 'He is disappointed with his quiz because he got a bad score.',
    reason: '【W12 實卷真錯 #4】前面有單數不定冠詞 a，後面不可接複數名詞 points！老師紅筆圈起 points 改為單數名詞 score（a bad score）。',
    explanation: '【W12 實卷真錯 #4】前面有單數不定冠詞 a，後面不可接複數名詞 points！老師紅筆圈起 points 改為單數名詞 score（a bad score）。'
  },
  {
    id: 'MB_TEA_W12_05',
    week: 'W12',
    trap_id: 'ENG_PREP_COLLOCATION',
    point: 'W12 Part A Q3：confused 介系詞誤用 with',
    sentence: "She is confused with the quiz because she didn't understand the questions.",
    tokens: ['She', 'is', 'confused', 'with', 'the', 'quiz', 'because', 'she', "didn't", 'understand', 'the', 'questions.'],
    wrong_index: 3,
    error_token_index: 3,
    wrong_word: 'with',
    correct_word: 'about',
    correct_text: "She is confused about the quiz because she didn't understand the questions.",
    fixed_sentence: "She is confused about the quiz because she didn't understand the questions.",
    reason: '【W12 實卷真錯 #5】表示「對某個測驗或問題感到困惑」應使用 confused about（或 by），不可寫成 confused with！',
    explanation: '【W12 實卷真錯 #5】表示「對某個測驗或問題感到困惑」應使用 confused about（或 by），不可寫成 confused with！'
  },
  {
    id: 'MB_TEA_W12_06',
    week: 'W12',
    trap_id: 'ENG_TENSE_MISMATCH',
    point: 'W12 Part A Q3：單數主詞 she 誤用 don’t',
    sentence: "She is confused about the quiz because she don't understand the questions.",
    tokens: ['She', 'is', 'confused', 'about', 'the', 'quiz', 'because', 'she', "don't", 'understand', 'the', 'questions.'],
    wrong_index: 8,
    error_token_index: 8,
    wrong_word: "don't",
    correct_word: "didn't",
    correct_text: "She is confused about the quiz because she didn't understand the questions.",
    fixed_sentence: "She is confused about the quiz because she didn't understand the questions.",
    reason: '【W12 實卷真錯 #6】主詞是第三人稱單數 she，永遠不能配 don’t！根據作答當時沒聽懂題目的情境，應改為過去式否定助動詞 didn’t。',
    explanation: '【W12 實卷真錯 #6】主詞是第三人稱單數 she，永遠不能配 don’t！根據作答當時沒聽懂題目的情境，應改為過去式否定助動詞 didn’t。'
  },
  {
    id: 'MB_TEA_W12_07',
    week: 'W12',
    trap_id: 'ENG_POS_CONFUSION',
    point: 'W12 Part A Q3：know how 後漏掉不定詞 to',
    sentence: "She didn't know how understand the questions on the quiz.",
    tokens: ['She', "didn't", 'know', 'how', 'understand', 'the', 'questions', 'on', 'the', 'quiz.'],
    wrong_index: 4,
    error_token_index: 4,
    wrong_word: 'understand',
    correct_word: 'to understand (或刪除 know how 留 understand)',
    correct_text: "She didn't know how to understand the questions on the quiz.",
    fixed_sentence: "She didn't know how to understand the questions on the quiz.",
    reason: '【W12 實卷真錯 #7】know how 後方不可直接接原形動詞 understand，必須加上不定詞標記 to（know how to understand），或依老師批改直接精簡為 didn’t understand！',
    explanation: '【W12 實卷真錯 #7】know how 後方不可直接接原形動詞 understand，必須加上不定詞標記 to（know how to understand），或依老師批改直接精簡為 didn’t understand！'
  },
  {
    id: 'MB_TEA_W12_08',
    week: 'W12',
    trap_id: 'ENG_POS_CONFUSION',
    point: 'W12 Part A Q4：一般動詞 drew 後誤接形容詞 beautiful',
    sentence: 'He is famous for a drawing because he drew very beautiful.',
    tokens: ['He', 'is', 'famous', 'for', 'a', 'drawing', 'because', 'he', 'drew', 'very', 'beautiful.'],
    wrong_index: 10,
    error_token_index: 10,
    wrong_word: 'beautiful.',
    correct_word: 'beautifully. (或改寫為 the drawing is very beautiful.)',
    correct_text: 'He is famous for a drawing because he drew very beautifully.',
    fixed_sentence: 'He is famous for a drawing because he drew very beautifully.',
    reason: '【W12 實卷真錯 #8】動詞 drew（畫）需要副詞 beautifully 修飾；若保留形容詞 beautiful，前方的結構就必須依老師改法換成「the drawing is very beautiful」。',
    explanation: '【W12 實卷真錯 #8】動詞 drew（畫）需要副詞 beautifully 修飾；若保留形容詞 beautiful，前方的結構就必須依老師改法換成「the drawing is very beautiful」。'
  },
  {
    id: 'MB_TEA_W12_09',
    week: 'W12',
    trap_id: 'ENG_UNCOUNTABLE_SVA',
    point: 'W12 Part B Q2：不可數名詞 water 誤配 aren’t',
    sentence: "There aren't any water on the surface of Mars.",
    tokens: ['There', "aren't", 'any', 'water', 'on', 'the', 'surface', 'of', 'Mars.'],
    wrong_index: 1,
    error_token_index: 1,
    wrong_word: "aren't",
    correct_word: "isn't",
    correct_text: "There isn't any water on the surface of Mars.",
    fixed_sentence: "There isn't any water on the surface of Mars.",
    reason: '【W12 實卷真錯 #9】water 是不可數名詞，即使前面有 any，存在句的 be 動詞也只能使用單數 isn’t（There isn’t any water），絕對不可寫成 aren’t！',
    explanation: '【W12 實卷真錯 #9】water 是不可數名詞，即使前面有 any，存在句的 be 動詞也只能使用單數 isn’t（There isn’t any water），絕對不可寫成 aren’t！'
  },
  {
    id: 'MB_TEA_W12_10',
    week: 'W12',
    trap_id: 'ENG_THERE_BE_VS_HAVE',
    point: 'W12 Part B Q2：中式存在句誤用 only have ice',
    sentence: 'On the surface of Mars, only have ice.',
    tokens: ['On', 'the', 'surface', 'of', 'Mars,', 'only', 'have', 'ice.'],
    wrong_index: 6,
    error_token_index: 6,
    wrong_word: 'have',
    correct_word: '(改用存在句 there is only ice)',
    correct_text: 'On the surface of Mars, there is only ice.',
    fixed_sentence: 'On the surface of Mars, there is only ice.',
    reason: '【W12 實卷真錯 #10】表示某個地方「只有某物」，中文常說「只有冰」，但英文不能缺主詞寫成 only have ice，必須使用存在句 there is only ice！',
    explanation: '【W12 實卷真錯 #10】表示某個地方「只有某物」，中文常說「只有冰」，但英文不能缺主詞寫成 only have ice，必須使用存在句 there is only ice！'
  },
  {
    id: 'MB_TEA_W12_11',
    week: 'W12',
    trap_id: 'ENG_ARTICLE_ERROR',
    point: 'W12 Part B Q3：行星專有名詞 Mars 濫加 the',
    sentence: "Astronomers didn't see any life on the Mars.",
    tokens: ['Astronomers', "didn't", 'see', 'any', 'life', 'on', 'the', 'Mars.'],
    wrong_index: 6,
    error_token_index: 6,
    wrong_word: 'the',
    correct_word: '(刪除 the)',
    correct_text: "Astronomers didn't see any life on Mars.",
    fixed_sentence: "Astronomers didn't see any life on Mars.",
    reason: '【W12 實卷真錯 #11】太陽系行星的專有名詞（Mars, Venus, Jupiter, Saturn）前面不可加定冠詞 the，應寫為 on Mars。',
    explanation: '【W12 實卷真錯 #11】太陽系行星的專有名詞（Mars, Venus, Jupiter, Saturn）前面不可加定冠詞 the，應寫為 on Mars。'
  },
  {
    id: 'MB_TEA_W12_12',
    week: 'W12',
    trap_id: 'ENG_ARTICLE_ERROR',
    point: 'W12 Part B Q4：泛指複數名詞 bacteria 濫加 the',
    sentence: 'Scientists will first find the bacteria on Mars.',
    tokens: ['Scientists', 'will', 'first', 'find', 'the', 'bacteria', 'on', 'Mars.'],
    wrong_index: 4,
    error_token_index: 4,
    wrong_word: 'the',
    correct_word: '(刪除 the)',
    correct_text: 'Scientists will first find bacteria on Mars.',
    fixed_sentence: 'Scientists will first find bacteria on Mars.',
    reason: '【W12 實卷真錯 #12】此處 bacteria 泛指「細菌這類簡單生物」，前面不需要加定冠詞 the，老師紅筆直接劃除 the。',
    explanation: '【W12 實卷真錯 #12】此處 bacteria 泛指「細菌這類簡單生物」，前面不需要加定冠詞 the，老師紅筆直接劃除 the。'
  },
  {
    id: 'MB_TEA_W12_13',
    week: 'W12',
    trap_id: 'ENG_ARTICLE_ERROR',
    point: 'W12 Part B Q5：泛指複數名詞 aliens 濫加 the',
    sentence: 'It will be bad because the aliens might eat humans.',
    tokens: ['It', 'will', 'be', 'bad', 'because', 'the', 'aliens', 'might', 'eat', 'humans.'],
    wrong_index: 5,
    error_token_index: 5,
    wrong_word: 'the',
    correct_word: '(刪除 the)',
    correct_text: 'It will be bad because aliens might eat humans.',
    fixed_sentence: 'It will be bad because aliens might eat humans.',
    reason: '【W12 實卷真錯 #13】當 aliens 與 humans 泛指「外星人」與「人類」全體類別時，不加定冠詞 the。',
    explanation: '【W12 實卷真錯 #13】當 aliens 與 humans 泛指「外星人」與「人類」全體類別時，不加定冠詞 the。'
  },
  {
    id: 'MB_TEA_W12_14',
    week: 'W12',
    trap_id: 'ENG_CHINGLISH_LITERAL',
    point: 'W12 Part B Q5：maybe 後疊加 will 與 the humans 錯誤',
    sentence: 'It will be bad because aliens maybe will eat humans.',
    tokens: ['It', 'will', 'be', 'bad', 'because', 'aliens', 'maybe', 'will', 'eat', 'humans.'],
    wrong_index: 7,
    error_token_index: 7,
    wrong_word: 'will',
    correct_word: '(刪除 will，或直接用 might eat)',
    correct_text: 'It will be bad because aliens might eat humans.',
    fixed_sentence: 'It will be bad because aliens might eat humans.',
    reason: '【W12 實卷真錯 #14】老師紅筆將 maybe 後方的 will 與前方多餘的 the 一起劃掉；表達推測「可能會」直接寫 aliens might eat humans 或把 Maybe 放句首最道地！',
    explanation: '【W12 實卷真錯 #14】老師紅筆將 maybe 後方的 will 與前方多餘的 the 一起劃掉；表達推測「可能會」直接寫 aliens might eat humans 或把 Maybe 放句首最道地！'
  },
  {
    id: 'MB_TEA_W12_15',
    week: 'W12',
    trap_id: 'ENG_ARTICLE_ERROR',
    point: 'W12 Part C：單一國名 Italy 前濫加定冠詞 the',
    sentence: 'Leonardo da Vinci was an artist from the Italy.',
    tokens: ['Leonardo', 'da', 'Vinci', 'was', 'an', 'artist', 'from', 'the', 'Italy.'],
    wrong_index: 7,
    error_token_index: 7,
    wrong_word: 'the',
    correct_word: '(刪除 the)',
    correct_text: 'Leonardo da Vinci was an artist from Italy.',
    fixed_sentence: 'Leonardo da Vinci was an artist from Italy.',
    reason: '【W12 實卷真錯 #15】只有聯邦/王國/複數島國國名才加 the（如 the United States / the UK）；單一國名 Italy, Taiwan, England 前絕對不加 the！',
    explanation: '【W12 實卷真錯 #15】只有聯邦/王國/複數島國國名才加 the（如 the United States / the UK）；單一國名 Italy, Taiwan, England 前絕對不加 the！'
  },
  {
    id: 'MB_TEA_W12_16',
    week: 'W12',
    trap_id: 'ENG_TENSE_MISMATCH',
    point: 'W12 Part C：傳記歷史事實動詞漏改過去式 (make)',
    sentence: 'He make many great drawings and paintings.',
    tokens: ['He', 'make', 'many', 'great', 'drawings', 'and', 'paintings.'],
    wrong_index: 1,
    error_token_index: 1,
    wrong_word: 'make',
    correct_word: 'made',
    correct_text: 'He made many great drawings and paintings.',
    fixed_sentence: 'He made many great drawings and paintings.',
    reason: '【W12 實卷真錯 #16】達文西逝世於 1519 年，生平創作屬於過去事實，且主詞為單數 He，提綱動詞 make 必須改成過去式 made！',
    explanation: '【W12 實卷真錯 #16】達文西逝世於 1519 年，生平創作屬於過去事實，且主詞為單數 He，提綱動詞 make 必須改成過去式 made！'
  },
  {
    id: 'MB_TEA_W12_17',
    week: 'W12',
    trap_id: 'ENG_CHINGLISH_LITERAL',
    point: 'W12 Part C：身份句誤用 made 代替 be 動詞 was',
    sentence: 'He made one of the greatest artists of his time.',
    tokens: ['He', 'made', 'one', 'of', 'the', 'greatest', 'artists', 'of', 'his', 'time.'],
    wrong_index: 1,
    error_token_index: 1,
    wrong_word: 'made',
    correct_word: 'was',
    correct_text: 'He was one of the greatest artists of his time.',
    fixed_sentence: 'He was one of the greatest artists of his time.',
    reason: '【W12 實卷真錯 #17】表達某人「是……當中最偉大的人物之一」，必須用 be 動詞過去式 was（He was one of...），不可寫成 made！',
    explanation: '【W12 實卷真錯 #17】表達某人「是……當中最偉大的人物之一」，必須用 be 動詞過去式 was（He was one of...），不可寫成 made！'
  },
  {
    id: 'MB_TEA_W12_18',
    week: 'W12',
    trap_id: 'ENG_SPELLING_PHONICS',
    point: 'W12 Part C：課本範文名字誤植 (Tomas Leonardo)',
    sentence: 'For these reasons, I think Tomas Leonardo was a great person.',
    tokens: ['For', 'these', 'reasons,', 'I', 'think', 'Tomas', 'Leonardo', 'was', 'a', 'great', 'person.'],
    wrong_index: 5,
    error_token_index: 5,
    wrong_word: 'Tomas',
    correct_word: '(刪除誤植的 Tomas)',
    correct_text: 'For these reasons, I think Leonardo was a great person.',
    fixed_sentence: 'For these reasons, I think Leonardo was a great person.',
    reason: '【W12 實卷真錯 #18】受課本 Unit 6 範文主角 Thomas Edison 記憶干擾，筆誤寫出 Tomas 後卻忘記擦除！寫完作文務必逐字指讀校對。',
    explanation: '【W12 實卷真錯 #18】受課本 Unit 6 範文主角 Thomas Edison 記憶干擾，筆誤寫出 Tomas 後卻忘記擦除！寫完作文務必逐字指讀校對。'
  }
];

// ===========================================================================
// Passages (精讀範文與檢討對照段落)
// ===========================================================================
const passages = [
  {
    section_title: 'Week 12 Page 26 實戰傳記訂正版：Leonardo da Vinci (18/20 高分作答)',
    eng: 'The person I admire the most is Leonardo da Vinci. Da Vinci was an artist from Italy. He was born in 1452 and died in 1519. He made many great drawings and paintings. His most famous painting is the "Mona Lisa". Thanks to Leonardo, we can enjoy some really great art. Leonardo was gifted and talented. However, I admire Leonardo most of all because he drew almost 2,500 drawings. He was one of the greatest artists of his time. For these reasons, I think Leonardo da Vinci was a great person.',
    chi: '我最欽佩的人是李奧納多·達文西。達文西是一位來自義大利的藝術家。他出生於 1452 年，並於 1519 年逝世。他創作了許多偉大的素描和畫作。他最著名的畫作是《蒙娜麗莎》。多虧了李奧納多，我們才能欣賞到如此真正偉大的藝術。李奧納多天賦異稟且才華洋溢。然而，我最欽佩李奧納多的地方在於他畫了將近 2,500 幅素描。他是他那個時代最偉大的藝術家之一。基於這些原因，我認為李奧納多·達文西是一位偉大的人。',
    sentences: [
      { en: 'The person I admire the most is Leonardo da Vinci.', zh: '我最欽佩的人是李奧納多·達文西。' },
      { en: 'Da Vinci was an artist from Italy.', zh: '達文西是一位來自義大利的藝術家。（國名 Italy 不加 the）' },
      { en: 'He was born in 1452 and died in 1519.', zh: '他出生於 1452 年，並於 1519 年逝世。' },
      { en: 'He made many great drawings and paintings.', zh: '他創作了許多偉大的素描和畫作。（過去式 made）' },
      { en: 'His most famous painting is the "Mona Lisa".', zh: '他最著名的畫作是《蒙娜麗莎》。' },
      { en: 'Thanks to Leonardo, we can enjoy some really great art.', zh: '多虧了李奧納多，我們才能欣賞到真正偉大的藝術。' },
      { en: 'Leonardo was gifted and talented.', zh: '李奧納多天賦異稟且才華洋溢。' },
      { en: 'However, I admire Leonardo most of all because he drew almost 2,500 drawings.', zh: '然而，我最欽佩李奧納多的地方在於他畫了將近 2,500 幅素描。' },
      { en: 'He was one of the greatest artists of his time.', zh: '他是他那個時代最偉大的藝術家之一。（be 動詞 was）' },
      { en: 'For these reasons, I think Leonardo da Vinci was a great person.', zh: '基於這些原因，我認為李奧納多·達文西是一位偉大的人。' }
    ],
    key_sentences: [
      {
        sentence: 'Da Vinci was an artist from Italy.',
        point: '單一國名零冠詞：Italy、Taiwan、England 前絕對不可加 the。'
      },
      {
        sentence: 'He made many great drawings and paintings.',
        point: '傳記過去式動詞：已故人物生平事蹟須將 make 轉為過去式 made。'
      },
      {
        sentence: 'He was one of the greatest artists of his time.',
        point: '最高級身份句：表達「是……之一」用 was one of the + 最高級 + 複數名詞。'
      }
    ]
  },
  {
    section_title: 'Week 12 Page 25 檢討重點對照段落：Grammar 3 U16 & Space Ch6 黃金訂正句',
    eng: "He was excited about the movie because it was a funny movie. He is disappointed with his quiz because he got a bad score. She is confused about the quiz because she didn't understand the questions. He is famous for a drawing because the drawing is very beautiful. Astronomers thought they saw lines on the surface of Mars, and they thought the lines were canals. There isn't any water on the surface of Mars—there is only ice on it. Yes, there could be life on Mars because scientists think there is liquid water underground, where bacteria could live.",
    chi: '他對那部電影感到非常興奮，因為它是一部很有趣的電影。他對他的小考感到失望，因為他考了一個很差的成績。她對這份小考感到困惑，因為她當時沒有看懂題目。他因一幅畫而聞名，因為那幅畫非常美麗。天文學家以為他們在火星表面看到了線條，且以為那些線條是運河。火星表面上沒有任何液態水——表面只有冰。是的，火星上可能存在生命，因為科學家認為地底下存在液態水，細菌可能在那裡生存。',
    sentences: [
      { en: 'He was excited about the movie because it was a funny movie.', zh: '他對那部電影感到興奮，因為它是一部有趣的電影。（because 子句必補 be 動詞）' },
      { en: 'He is disappointed with his quiz because he got a bad score.', zh: '他對小考感到失望，因為他考了壞成績。（disappointed with + 事物；a bad score）' },
      { en: "She is confused about the quiz because she didn't understand the questions.", zh: '她對小考感到困惑，因為她沒聽懂題目。（confused about；didn’t understand）' },
      { en: 'He is famous for a drawing because the drawing is very beautiful.', zh: '他因一幅畫而聞名，因為那幅畫非常美麗。（the drawing is beautiful）' },
      { en: 'Astronomers thought they saw lines on the surface of Mars, and they thought the lines were canals.', zh: '天文學家以為他們在火星表面看到了線條，且以為那些線條是運河。' },
      { en: "There isn't any water on the surface of Mars—there is only ice on it.", zh: '火星表面上沒有任何水——表面上只有冰。（isn’t any water；there is only ice）' },
      { en: 'Yes, there could be life on Mars because scientists think there is liquid water underground, where bacteria could live.', zh: '是的，火星上可能有生命，因為科學家認為地底有液態水，細菌可能在那裡生存。' }
    ],
    key_sentences: [
      {
        sentence: "There isn't any water on the surface of Mars—there is only ice on it.",
        point: '不可數名詞與存在句雙核心：water 用單數 isn’t，且表示「只有冰」要用 there is only ice 而非 only have ice。'
      },
      {
        sentence: 'Yes, there could be life on Mars because scientists think there is liquid water underground, where bacteria could live.',
        point: 'Open-book 推理與零冠詞：火星 Mars 與泛指複數 bacteria 前面均不可加 the。'
      }
    ]
  }
];

module.exports = {
  quizzes,
  mistake_buster,
  passages
};
