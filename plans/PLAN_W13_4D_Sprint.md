# 執行計畫書：Week 13 衝刺、4D 英文科視覺圖解與 Week 12 真卷閉環升級 (`PLAN_W13_4D_Sprint`)

- **建立日期**：2026-11-22
- **狀態**：✅ 已結案歸檔（2026-11-22 P0~P7 全數驗收通過）
- **目標分支**：`feat/w13-4d-sprint`（基準還原 Tag：`pre-w13-4d-sprint`）
- **適用對象**：國小六年級上學期（Rex，*EL-3C）｜Zero-Build Vanilla SPA (`index.html`, `style.css`, `app.js`, `english_data.js`, `midterm_data.js`)

---

## 1. TL;DR 決策摘要、目標範圍與 Non-Goals

### 1.1 五項已拍板核心決議
1. **4D 規範雙層落地**：
   - 保留並微修 [`4D_跨學科通用_深度出題與詳解總綱.md`](../4D_跨學科通用_深度出題與詳解總綱.md)（修正第 43 行泰文 typo `เห็น` ➔ `看到`、補非選擇題彈性條款與英文子規範連結）。
   - 新建 [`4D_英文科_出題與詳解規範.md`](../4D_英文科_出題與詳解規範.md) 對接現有網頁 Schema 與 10 大英文標準 `trapCode`。
   - 前端升級支援 D4 視覺化圖解積木渲染（`timeline` / `slot_box` / `prep_ladder` / `compare_table`）。
2. **難度分層策略**：
   - 僅對「選擇題與文法實戰題」套用「同源三階（基礎直球 `L1-3` ➔ 逆向變式 `L4-6` ➔ 素養深水 `L7-10`）」並映射到既有 `1★~5★`（`★☆☆☆☆`~`★★★★★`）。
   - 聽寫（單字／段落）與作文維持實戰分層，不破壞既有星級驗證與統計。
3. **Week 13 範圍（11/25 三，*EL-3C）與 RWW6 U6 段落盲聽**：
   - 涵蓋 `Reading with Writing 6 (Unit 6)` 整篇 p.40–41（前兩段複習＋重點強化 p.41 後兩段 Line 26–36）。
   - 新增前端「段落逐句盲聽模式 (`passage_dictation`)」（支援 `1.0x`/`0.8x` 逐句點播與整段連播、標點／雙引號／括號自檢清單、嚴格翻牌前零洩漏防線）。
   - 同步依 Week 12 真卷強化續考兩科：`Oxford Discover Grammar 3 (Unit 16)` 與 `Write Right 3 (Unit 6)`。
4. **Week 12 真卷完整入庫與模擬考全面校正**：
   - 確認 Week 12 真卷共 2 頁（`IMG_4385.HEIC` Page 25 + `IMG_4386.HEIC` Page 26，Rex 實考 `38 / 46 = 82%`），產出高清轉正 JPG、四層分離 MD 與 `data/exams/tea_w12.js`，併入 `TEA_QUIZ_REVIEW`。
   - 依真卷紅筆失分點全面校正模擬考與 Mistake Buster：
     - `data/units/odg3_u16.js`：補 8 題 `<S>+<be>+<adj+prep>+<O>+because...` 公式造句 + 4 句 Rex 真錯進 Mistake Buster。
     - `data/units/wr3_u06.js`：補 3 題 Outline ➔ 三段傳記引導寫作 + 2 篇預判 W13 之 12–14 錯傳記改錯（含紙筆實戰與拆解 Mistake Buster）+ 4 處 Rex 真錯。
     - `data/units/space_ch06.js`：補 5 題 Open-book `Explain your answer` & `Use pronouns` 思辨題 + 5 處 Rex 真錯進 Mistake Buster。
5. **首頁可切換週次衝刺膠囊**：
   - 將寫死的 `<aside class="banner-week12">` 重構為資料驅動 `SPRINT_WEEKS` 註冊表＋「膠囊切換按鈕列」（預設 `[🚨 W13 (11/25)]`，可切換 `[✅ W12 (11/18)]` 與未來擴充週次）。
   - 切換時動態重算單元卡、各題型題數統計與 `🚀 X合一總模考` 按鈕；已考週次自動呈現 `📄 該週真卷回顧 & 抓錯` 入口；同步連動「A4 出卷」（含 `passage_dictation` 多行橫線手寫卷）。

### 1.2 Non-Goals（明確不做）
- ❌ 不補寫 `OD3 U13~U15` 或期中舊書其餘 10 個單元（留待下一輪 Phase）。
- ❌ 不改寫或搬移根目錄既有 `verify_phase_1..11.js`（`build_exam_bank.js` 第 10 行直接 `require('./verify_phase_2.js')`）。
- ❌ 不更動 Firebase / LocalStorage 既有帳號與錯題紀錄鍵名（100% 向下相容現有學習資料）。
- ❌ 未經使用者明確確認，絕不執行 `git push` 或覆寫 `main`。

---

## 2. 技術規格與不可違反邊界條件

### 2.1 既有受保護檔案與設計鐵律 (`[#WHY-*]`)
- **保護檔案清單與驗證承接矩陣**：
  - `verify_phase_1.js` ~ `verify_phase_11.js` 維持於專案根目錄原位，嚴禁修改或刪除（`build_exam_bank.js` 第 10 行直接 `require('./verify_phase_2.js')`）。
  - **持續綠燈既有閘門**：`verify_phase_1.js`, `verify_phase_2.js`, `verify_phase_3.js` 必須維持 100% PASS。
  - **歷史快照腳本處理**：`verify_phase_4/5/11.js` 寫死舊 `?v=` 快取版號、`verify_phase_6/7/8.js` 寫死舊題數 `=== 28/32/156`、`verify_phase_9.js` 寫死 `md.length === 18`、`verify_phase_10.js` 寫死靜態 `<aside class="banner-week12">` HTML 片段。因此不動舊檔，而是由 **`verify_phase_12.js` 完整承接並驗證全部既有核心不變量**（零縮寫書名、零空膠囊 `matchQuizType`、全庫 `renderStructuredStemHtml` 0 例外與 0 洩漏、顯式三態自評、`Topbar` 與 `@media print` 隔離、Phase 11 字體控制器與 A/B 雙模式課文）＋ P12 全部新功能斷言！
- **UX 與防呆鐵律**：
  1. 保留雙速 TTS 防抖 `window.speechSynthesis.cancel()` 與純淨英文例句清洗 (`extractCleanEnglishForSpeech`)。
  2. 保留顯式三態自評計分：翻牌與點選選項皆不自動寫入掌握度／錯題本，僅點擊 `[data-rate]` 才寫入。
  3. Topbar 與 `@media print` 嚴格鎖定 `--text-scale: 1`，不受螢幕字體縮放設定影響而跑版。
  4. **平行寫檔安全鐵律 (`AGENTS.md` §3)**：嚴禁兩個以上使用 `Workspace: "inherit"` 的平行子代理寫入同一檔案；每個子代理必須鎖定唯一獨立檔案。

### 2.2 向下相容 4D 英文科 Schema 擴充
保留所有舊欄位：`options: string[]`、`explanation.{point, examPurpose, correctReason, note, trap, distractorAnalysis, commonTraps}`、`extensionStudy.{synonyms, grammarCompare, examVariations}`、`self_check[]`。

新增可選欄位（未填之舊題安全降級，不報錯）：
```javascript
{
  trapCodes: ["ENG_PREP_COLLOCATION", "ENG_VERB_OMISSION"],
  triadGroup: {
    groupId: "ODG3_U16_TRIAD_01", // 僅選擇題與文法實戰題使用
    tier: "L1-3" | "L4-6" | "L7-10",
    role: "foundation" | "twist" | "challenge"
  },
  explanation: {
    // ...既有 point / examPurpose / correctReason / note / trap / distractorAnalysis / commonTraps
    steps: [
      "步驟 1：圈出形容詞 disappointed，判斷後接物品或人。",
      "步驟 2：套用固定搭配 disappointed with (物品) / in (人或表現)。",
      "步驟 3：檢查 because 子句不可缺少 be 動詞或一般動詞。"
    ],
    insight: "💡 對物失望用 with，對人失望用 in，千千萬萬別寫成 of！",
    visualBlock: {
      kind: "timeline" | "slot_box" | "prep_ladder" | "compare_table",
      title: "視覺圖解標題",
      data: { /* 依 kind 定義結構，詳見 4D_英文科_出題與詳解規範.md */ },
      caption: "📊 考場 10 秒定錨提示"
    }
  }
}
```

#### 10 大英文標準 `trapCode`
1. `ENG_TENSE_MISMATCH`（時態與時間訊號／前後句衝突，如 `He make` 漏改 `made`、`did + V-ed`）
2. `ENG_CHINGLISH_LITERAL`（中式英文逐字直譯，如「因為它很有趣」寫成 `because it funny`）
3. `ENG_POS_CONFUSION`（詞性誤用，形容詞／副詞／動名詞／不定詞混淆，如 `how understand` 漏 `to`）
4. `ENG_PREP_COLLOCATION`（形容詞或動詞介系詞搭配錯誤，如 `disappointed of`、`confused with`）
5. `ENG_ARTICLE_ERROR`（冠詞漏加或濫加，如 `from the Italy`、`on the Mars`、`the bacteria`、`a bad points`）
6. `ENG_VERB_OMISSION`（句中遺漏 `be` 動詞或主要動詞）
7. `ENG_THERE_BE_VS_HAVE`（存在句誤用 `have`，如 `only have ice` 應為 `there is only ice`）
8. `ENG_UNCOUNTABLE_SVA`（不可數名詞誤配複數動詞或不定冠詞，如 `there aren't any water`）
9. `ENG_SPELLING_PHONICS`（字音字形／靜音字母／複數拼寫失誤，如 `directiones`、`comepass`）
10. `ENG_PUNCT_DICTATION`（聽寫漏標點、雙引號或括號格式錯誤）

#### 4 種 `visualBlock.kind` 資料契約（供 `app.js` 渲染器與 `verify_phase_12.js` 校驗）
- `timeline`：`{ events: Array<{ time: string, label: string, highlight?: boolean }>, rule?: string }`
- `slot_box`：`{ slots: Array<{ role: string, text: string, accent?: 'pri'|'ok'|'warn'|'bad' }> }`
- `prep_ladder`：`{ levels: Array<{ prep: string, scope: string, examples: string[], highlight?: boolean }> }`
- `compare_table`：`{ headers: string[], rows: string[][] }`

### 2.3 段落逐句盲聽 (`passage_dictation`) 規格
- `type: 'passage_dictation'`，`options: []`（無選擇題按鈕，強制紙筆手寫）。
- 必備欄位：
  - `dictation_sentences: Array<{ idx: number, en: string, zh_cue?: string, punct_focus?: string }>`
  - `full_audio_text: string`（供「🔊 整段連播 1.0x / 🐢 0.8x」使用）
  - `answer: string`（完整標準段落正文，僅在點擊「👁️ 看詳解與對答案」抽屜展開後顯示）
  - `question: string`（僅含中文情境引導、句數與標點重點，如 `含雙引號對話與括號，請聽語調補標點`）
  - `self_check: string[]`（至少 3 條：拼字／標點／引號括號核對）
- **零洩漏硬性邊界**：
  - 翻牌前 DOM 與 `question` / `target_chi` / `part_instructions` 不可出現任何 `dictation_sentences[].en` 超過 3 個連續英文詞的子字串（僅純 TTS 按鈕內部讀取 `full_audio_text` 與 `dictation_sentences[i].en`）。
- **A4 列印 (`unit_custom`)**：遇到 `type === 'passage_dictation'` 時，印出題幹提示＋根據 `dictation_sentences.length` 自動計算之 **6~12 行標準空白手寫橫線**（比照 Tiger 3C Week 5 Page 7 樣式）。

### 2.4 `SPRINT_WEEKS` 週次註冊表規格 (`app.js`)
- 註冊表結構（預設首筆為最新衝刺週 `w13`）：
  ```javascript
  const SPRINT_WEEKS = [
    {
      id: 'w13',
      shortLabel: '🚨 W13 (11/25)',
      badgeLabel: '🚨 下週三 11/25 (W13) *EL-3C 小考總衝刺',
      title: 'Week 13 必考三大範圍',
      subtitle: '含 RWW6 Unit 6 全篇段落聽寫＋Grammar 3 U16 公式造句＋Write Right 3 U6 傳記寫作與改錯預測',
      mockUnitId: 'week13_all',
      reviewUnitId: null,
      units: [
        { bookId: 'rw6', unitId: 'rw6_6', icon: '📖', bookName: 'Reading with Writing 6', title: 'Unit 6：定向越野（段落聽寫特訓）' },
        { bookId: 'gra3', unitId: 'gra3_16', icon: '📘', bookName: 'Oxford Discover Grammar 3', title: 'Unit 16：飲食事實 Facts（because 造句強化）' },
        { bookId: 'wr3', unitId: 'wr3_6', icon: '📝', bookName: 'Write Right 3', title: 'Unit 6：歷史偉人傳記（寫作＋改錯狙擊）' }
      ]
    },
    {
      id: 'w12',
      shortLabel: '✅ W12 (11/18)',
      badgeLabel: '✅ 第 12 週 11/18 (W12) *EL-3C 已考複習 & 真卷檢討',
      title: 'Week 12 五大範圍',
      subtitle: '含五書必考題庫與 Week 12 實考真卷（38/46）錯題狙擊閉環。',
      mockUnitId: 'week12_all',
      reviewUnitId: 'tea_w12',
      units: [ /* rw6_9, rd6_6, gra3_16, wr3_6, od3_16 */ ]
    }
  ];
  ```
- 偏好週次持久化於 `localStorage` key：`eng_sprint_week_v1`（預設 `'w13'`；若值不存在註冊表則退回 `'w13'`）。
- 向下相容既有 CSS／舊版選擇器：外層保留 `.banner-week12`（可併掛 `.banner-sprint`），每個切換按鈕具 `[data-sprint-week="w13"]` / `[data-sprint-week="w12"]`。
- 題數統計（單字聽寫 / 段落盲聽 / 手寫實戰 / 選擇）一律由 `getQuizzesForUnit()` 即時加總，禁止寫死字串。
- 單元卡與 `tea_midterm` 清單同步納入 `week13_all` 與 `tea_w12`，`getUnitsForBook()` 對同時在 Week 13 的單元（`rw6_6`, `gra3_16`, `wr3_6`）優先顯示 `🚨 Week 13 必考` 徽章（並保留 `is_week12` 旗標相容舊斷言）。

### 2.5 編譯管線 (`build_exam_bank.js`) 與靜態防快取版號
- `MODULAR_UNIT_SPECS` 涵蓋 6 個單元：`odg3_u16.js`、`od3_u16.js`、`rww6_u09.js`、`space_ch06.js`、`wr3_u06.js`、`rww6_u06.js`（對應 `rw6_6` / `RWW6_U06`）。
- 冪等組裝 `WEEK12_ALL`（5 科）與 `WEEK13_ALL`（3 科：`RWW6_U06`, `ODG3_U16`, `WR3_U06`）。
- 冪等讀取 `data/exams/tea_w12.js`：先過濾 `TEA_QUIZ_REVIEW.quizzes` 中 `id` 以 `TEA_W12_` 開頭者、與 `mistake_buster` 中 `id` 以 `MB_TEA_W12_` 開頭者，再合併新資料，確保連跑多次不重複膨脹。
- `index.html` 中 4 個資源 `?v=` 參數全部統一更新為 `?v=20261122_p12`：`style.css`、`english_data.js`、`midterm_data.js`、`app.js`。

---

## 3. Phase 執行總表（P0 ~ P7）

| Phase 編號 | 名稱 | 單一職責與產出檔案 | 主責能力級別／建議模型 | 執行通道 | 硬性驗收斷言 (Exact Assertions) | 狀態 |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **P0** | 規格定案、Git 安全網與 Test-First 驗證器 | 1. 建立 `feat/w13-4d-sprint` 與 Tag `pre-w13-4d-sprint`<br>2. 微修 `4D_跨學科通用_深度出題與詳解總綱.md`<br>3. 新建 `4D_英文科_出題與詳解規範.md`<br>4. 新建 `verify_phase_12.js` | **T2** (`Gemini 4 Hydrogen Medium`) | 主視窗 | • `git rev-parse --verify pre-w13-4d-sprint` exit 0<br>• `4D_跨學科通用_*.md` 不含 `เห็น`<br>• `4D_英文科_*.md` 含 10 大 `trapCode` 與 4 種 `visualBlock` 契約<br>• `node -c verify_phase_12.js` exit 0 | ✅ 已驗收 |
| **P1** | Week 12 實體真卷四層數位化與 Rex 錯題入庫 | 1. 產出 `preview_jpg/IMG_4385.jpg` & `IMG_4386.jpg`<br>2. 新建 `考券_六上_Week12_Page25.md` & `Page26.md`<br>3. 更新 `00_Overview_歷史考券.md`<br>4. 新建 `data/exams/tea_w12.js` | **T3** (`Gemini 3.8 Flash Medium`) | `invoke_subagent` (`flash`) | • 2 張 JPG 存在且尺寸正常<br>• 2 份 MD 具 `Layer 1~4` 與 `AI_SPEC`<br>• `tea_w12.js` 含 `quizzes >= 10`（含 4 題 ODG3 + 5 題 Space + 1 篇 WR3 Outline）、`mistake_buster >= 12` 且 `tokens.join(' ') === sentence` | ✅ 已驗收 |
| **P2** | `RWW6_U06` 模組化升級與段落逐句盲聽題組 | 新建 `data/units/rww6_u06.js`（p.40–41 全文雙語分句、12+ 單字 7 錨點、3+ 視覺文法卡、6+ Mistake Buster、30+ 題 KET-4D，含 4+ 題 `passage_dictation` 覆蓋 p.40 前兩段與 p.41 後兩段、同源三階、`visualBlock`） | **T3** (`Gemini 3.8 Flash Medium`) | `invoke_subagent` (`flash`) *(可與 P1/P3 平行)* | • `validateUnit` PASS (`0 failures`)<br>• `passage_dictation >= 4`（覆蓋 p.40 Line 1–25 與 p.41 Line 26–36）<br>• `visualBlock >= 8` 題<br>• 翻牌前 0 英文洩漏 | ✅ 已驗收 |
| **P3** | 依 W12 真卷升級 `ODG3_U16`、`WR3_U06`、`SPACE_CH06` | 3 個獨立子代理各寫 1 檔：<br>1. `data/units/odg3_u16.js`（+8 題 `because` 公式造句、+4 Rex 真錯 MB、>=10 `visualBlock`、同源三階）<br>2. `data/units/wr3_u06.js`（+3 Outline 三段寫作、+2 篇 W13 預判 12–14 錯短文改錯、+4 Rex 真錯 MB、>=10 `visualBlock`、同源三階）<br>3. `data/units/space_ch06.js`（+5 Open-book `Explain` & pronouns 題、+5 Rex 真錯 MB、>=8 `visualBlock`） | **T3** (`Gemini 3.8 Flash Medium`) | 3 個平行 `invoke_subagent` (`flash`) *(嚴格一代理一檔)* | • 3 檔全數 `validateUnit` PASS<br>• `odg3_u16`: `because` 造句 `>= 8`<br>• `wr3_u06`: Outline 寫作 `>= 3` 且短文改錯 `>= 2`<br>• `space_ch06`: `Explain your answer` `>= 3`<br>• 全部 `visualBlock` 與 `triadGroup` 結構合法、0 洩漏 | ✅ 已驗收 |
| **P4** | 編譯管線升級與資料層全套驗證 | 升級 `build_exam_bank.js`（納入 `rww6_u06.js`、`WEEK13_ALL`、`tea_w12.js` 冪等併入 `TEA_QUIZ_REVIEW` 與 `passage_dictation` 零洩漏檢核），重編 `midterm_data.js` & `english_data.js` | **T2** (`Gemini 4 Hydrogen Medium`) | 主視窗 | • `node build_exam_bank.js` 連跑 2 次統計數 100% 一致<br>• `verify_phase_1/2/3.js` 全數 `exit code 0`<br>• `verify_phase_12.js` 資料層斷言 PASS | ✅ 已驗收 |
| **P5** | 前端四大升級（週次切換膠囊、D4 視覺圖解、段落盲聽 UI、A4 出卷連動） | 更新 `app.js`、`style.css`、`index.html`（實作 `SPRINT_WEEKS` 膠囊切換與 `tea_w12` 回顧入口、`renderVisualBlockHtml` 四圖解渲染器、`passage_dictation` 逐句／整段盲聽播放器、`unit_custom` 多行橫線列印、四資源 `?v=20261122_p12` 同步） | **T2** (`Gemini 4 Hydrogen Medium`) | 主視窗 | • `node -c app.js` exit 0<br>• `node verify_phase_12.js` 全數斷言 PASS（含版號一致性檢查） | ✅ 已驗收 |
| **P6** | 雙軌獨立驗收（腳本 + 10.2" iPad 橫向實機瀏覽器） | 1. 重跑 `verify_phase_1/2/3.js` 與全功能閘門 `verify_phase_12.js`<br>2. 啟動本地靜態伺服器，派 `browser` 子代理於 `1080×680`（iPad 橫向）與桌機檢查並截圖確認 | **T2** + `browser (flash)` | 主視窗 + `invoke_subagent` (`browser`, `flash`) | • `verify_phase_1/2/3/12.js` 全數 0 Failures<br>• Console `0` Error<br>• W13/W12 膠囊切換、W12 真卷回顧、段落盲聽播放與零洩漏、4 種 D4 視覺圖解於 1.3x 字體無破版溢位、A4 列印預覽正常 | ✅ 已驗收 |
| **P7** | 4-Log 同步、暫存清理與歸檔 | 1. 同步更新 4 份 `.log`（快照日期 `2026-11-22`、錨點與細節）<br>2. 清理 `./temp/` 暫存檔<br>3. 更新本 `PLAN` 狀態為 `✅ 已結案歸檔`<br>4. 整理 `git status` 與建議 commit 訊息（**不自動 push**） | **T3/T4** | 主視窗 | • 4 份 `.log` 皆含 `2026-11-22` 快照與新錨點<br>• `./temp/` 空或已刪除<br>• 本 `PLAN` 狀態全為 ✅ | ✅ 已驗收 |

---

## 4. 高風險與對策表

| 風險編號 | 潛在風險情境 | 嚴重度 | 預防與應對策略 |
| :---: | :--- | :---: | :--- |
| **R1** | **既有 `verify_phase_1..11.js` 斷言與 W13 新週次 UI 衝突**（例如檢查 `.banner-week12` 或 `WEEK12_ALL` 題數） | 高 | P4/P5 動工前先檢查 `verify_phase_4..11.js` 的選擇器與門檻：保留 `.banner-week12` CSS class 並以 `>=` 檢驗題數；`WEEK12_ALL` 維持在 `MIDTERM_DATABASE` 中供切換與直接存取。 |
| **R2** | **段落盲聽 (`passage_dictation`) 英文洩漏到翻牌前 DOM** | 高 | `build_exam_bank.js` 與 `verify_phase_12.js` 雙重靜態掃描：確保 `question`、`target_chi`、`part_instructions` 皆不含 `dictation_sentences[].en` 連續 3 詞以上子字串；`app.js` 僅在 `#quiz-answer-drawer` 內渲染 `q.answer` 與逐句對照。 |
| **R3** | **D4 視覺圖解在 10.2" iPad 橫向放大 1.3x~1.45x 時破版** | 中 | 所有 `visualBlock` 元件外層強制設定 `max-width: 100%; overflow-x: auto;`，Flex 積木槽啟用 `flex-wrap: wrap`，並於 P6 在 `1080×680` + 字體倍率切換實測無水平捲軸爆版。 |
| **R4** | **平行子代理寫檔互撞或資料編譯重複累積** | 中 | P1/P2/P3 嚴格遵守「一個子代理只寫一個獨立檔」；`build_exam_bank.js` 採前置 id 過濾＋冪等覆寫，P4 驗收強制連跑兩次比對輸出筆數。 |
| **R5** | **iPad Safari / 靜態快取咬住舊版 `midterm_data.js` 或 `app.js`** | 中 | 依 `AGENTS.md` §5.3 將 `index.html` 四項靜態資源版號同步更新為 `?v=20261122_p12`，並由 `verify_phase_12.js` 進行字串一致斷言把關。 |
