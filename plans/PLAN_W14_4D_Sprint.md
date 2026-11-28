# 執行計畫書：Week 14 (12/02) *EL-3C 四科衝刺、Spelling Bee 單字對齊與三週切換升級 (`PLAN_W14_4D_Sprint`)

- **建立日期**：2026-11-28
- **狀態**：✅ 已結案歸檔
- **目標分支**：`feat/w14-4d-sprint`（還原基準 Tag：`pre-w14-4d-sprint`）
- **適用對象**：國小六年級上學期（Rex，*EL-3C）｜Zero-Build Vanilla SPA (`index.html`, `style.css`, `app.js`, `english_data.js`, `midterm_data.js`)

---

## 1. TL;DR 決策摘要、目標範圍與 Non-Goals

### 1.1 Week 14 (12/02 三，*EL-3C) 必考四科與已拍板決議
1. **`Oxford Discover 3 (Unit 17) : Spelling`** (*My Journey with Captain Magellan*, p.168–175)：
   - 跨專案唯讀對齊 `C:\@植善課業\AI\Tiger_spelling Bee_6 年級\data_courses.js` (`unitId: "d3_u17"`) 與 `data\word_details_courses.js` 之 **20 個精準單字**（沿用一致諧音記憶錨點與音節切分）。
   - 補齊雙層 MD `六年級上/課本/01_Oxford_Discover_3/Unit_17_My_Journey_with_Captain_Magellan.md` 與模組 `data/units/od3_u17.js`：雙語課文、文法卡（`look` 片語動詞 & `before / after` 時間複合句）、Mistake Buster（>= 6）與 **35 題 KET-4D**（含 **20 題全覆蓋零洩漏 `spelling_listen`** + 15 題手寫／選擇與 >= 10 題 `visualBlock`）。
2. **`Oxford Discover Grammar 3 (Unit 17)`** (*Staying Safe*, p.85–88)：
   - 建置雙層 MD `六年級上/課本/02_Oxford_Discover_Grammar_3/Unit_17_Staying_Safe.md` 與模組 `data/units/odg3_u17.js`：Imperatives 祈使句（`V` / `Don't + V` / `Please` 句首與句尾逗號）、10 大動態介系詞（`into / out of / up / down / over / under / from / to / around / through`）＋ 緊急避難地圖指引造句，共 **32 題 KET-4D**（>= 12 題 `visualBlock`）。
3. **`Oxford Discover Grammar 3 (Unit 16)`** (*Food Facts*, p.80–83)：
   - 直接沿用已依 W12 真卷校正的 `data/units/odg3_u16.js`（既有 36 題），補上 `"is_week14": true` 並增補 **3 題「U16 情緒形容詞介系詞 × U17 動態介系詞／祈使句」跨單元防混淆實戰題**（總計 **39 題**，保留 `is_week12: true, is_week13: true`）。
4. **`Write Right 3 (Unit 7)`** (*Hope You Feel Better*, p.54–61)：
   - 先從現有 `六年級上/課本/Write right 3_05_08.pdf` 補抽最後 2 頁（PDF p.23–24 對應課本 p.60–61）至 `images/wr3_u5_pdf_p23.png` & `p24.png` 補齊 8 頁原圖（同時交叉比對 `WR3_U7_U8_背誦與考前重點_A4正反兩面.html`，以課本原圖為 Ground Truth）。
   - 建置雙層 MD `六年級上/課本/04_Write_Right_3/Unit_07_Hope_You_Feel_Better.md` 與模組 `data/units/wr3_u07.js`：8 大傷病片語與不規則過去式（`broke / caught / cut / hurt`）、`If you want, I can...`、`We all want you to...`、慰問卡稱謂與署名逗號格式（`Dear ...,` / `Your friend,`）、3 題 Outline ➔ 完整 Get-Well Card 寫作、2 篇預判短文改錯，共 **34 題 KET-4D**（>= 12 題 `visualBlock`）。
5. **首頁三週膠囊切換 (`SPRINT_WEEKS`) 與防快取更新**：
   - 在 `app.js` `SPRINT_WEEKS` 首位新增 `w14`（預設 `[🚨 W14 (12/02)]` 四科 ~140 題，保留 `[✅ W13 (11/25)]` 與 `[✅ W12 (11/18)]` 三週自由切換）。
   - 編譯 `WEEK14_ALL`、連動本週 A4 出卷，並更新 `index.html` 四資產 `?v=20261128_p13`。

### 1.2 Non-Goals（明確不做）
- ❌ **嚴禁修改、刪除或新增任何檔案於跨專案 `C:\@植善課業\AI\Tiger_spelling Bee_6 年級`**（僅唯讀參照）。
- ❌ 本輪不處理 Week 13 考卷（尚未發回）、不補寫 `OD3 U13~U15` 或期中舊書其餘單元。
- ❌ 不修改或搬移根目錄既有 `verify_phase_1.js` ~ `verify_phase_12.js`（由新 `verify_phase_13.js` 承接全站不變量＋W14 新斷言）。
- ❌ 未經使用者明確確認，絕不執行 `git push`。

---

## 2. 技術規格與不可違反邊界條件

### 2.1 跨專案唯讀對齊清單 (`OD3_U17` 20 字 Exact List)
- **唯讀來源**：`C:\@植善課業\AI\Tiger_spelling Bee_6 年級\data_courses.js` (`unitId: "d3_u17"`, `id: 181..200`) 與 `data\word_details_courses.js`。
- **20 個必考目標詞彙（逐字比對集合完全一致）**：
  `clouds`, `fog`, `healthy`, `journey`, `look after`, `look for`, `look through`, `river`, `storm`, `waterfall`, `coast`, `hail`, `island`, `lightning`, `look around`, `look out`, `look up`, `sail`, `strait`, `windy`。
- **防洩漏規格**：全部 20 字在 `od3_u17.js` 各須有 1 張完整 17 欄 `vocab` 卡＋1 題 `spelling_listen`；針對片語動詞（如 `look after`），`question` / `masked_example` / `target_chi` / `target_pos` 不可出現完整片語或動詞＋介系詞搭配外露（使用 `________` 完整遮罩）。

### 2.2 4D 英文科規格與雙層 MD 標準
- 嚴格遵守 [`4D_英文科_出題與詳解規範.md`](../4D_英文科_出題與詳解規範.md)：
  - `trapCodes` 對應 10 大英文標準碼；
  - 選擇題 (`choice`) 與文法實戰題 (`paper_rewrite`) 套用 `triadGroup`（`L1-3` / `L4-6` / `L7-10` 映射 `★☆☆☆☆`~`★★★★★`）；
  - 4 種 `explanation.visualBlock`：`timeline` / `slot_box` / `prep_ladder` / `compare_table`；
  - 非選擇題具 `commonTraps >= 2` 與 `self_check >= 3`；嚴禁任何頁碼引用（`page 168` / `p.85`）出現在 `question` 中。

### 2.3 編譯管線與向下相容邊界 (`build_exam_bank.js`)
- `MODULAR_UNIT_SPECS` 擴充至 9 個單元：原 6 單元 + `od3_u17.js` (`OD3_U17`, `od3_17`, `od3`)、`odg3_u17.js` (`ODG3_U17`, `gra3_17`, `gra3`)、`wr3_u07.js` (`WR3_U07`, `wr3_7`, `wr3`)。
- **週次旗標隔離鐵律**：
  - `od3_u17`, `odg3_u17`, `wr3_u07` 均設 `is_week12: false, is_week13: false, is_week14: true`（確保 `WEEK12_ALL` 總字彙維持 71 字不污染 W12/W13）。
  - `odg3_u16` 設 `is_week12: true, is_week13: true, is_week14: true`（且不刪除既有詞彙與題目）。
- `build_exam_bank.js` 冪等組裝 `WEEK12_ALL`、`WEEK13_ALL`、`WEEK14_ALL`，並保留 `TEA_QUIZ_REVIEW`（含 `tea_w12`）與 `ed.quizzes` 既有 `brain_gym` 題目不誤刪。

### 2.4 前端三週切換與相容性 (`app.js`, `index.html`)
- `GLOBAL_KEYS.sprintWeek` 升級為 `'eng_sprint_week_v2'`（預設 `'w14'`），使曾保存 `'w13'` 的舊裝置自動切至最新 Week 14，同時支援點選 `[🚨 W14 (12/02)]` / `[✅ W13 (11/25)]` / `[✅ W12 (11/18)]` 三週切換。
- `getUnitsForBook('tea_midterm')` 首位新增 `week14_all`；`getUnitsForBook(bookId)` 新增 `WEEK14_UNIT_IDS = ['od3_17', 'gra3_17', 'gra3_16', 'wr3_7']` 徽章處理（`gra3_16` 同時屬 W12/13/14 標示 `🚨 Week 12–14 必考`）。
- 保留 `.banner-week12`、`#btn-launch-w12-mock`、`[data-open-w12-unit]`、`BOOK_META` 全英文書名零縮寫、顯式三態自評、Topbar 與 `@media print` 鎖定 `--text-scale: 1`。
- `index.html` 四項靜態資源版號同步更新為 `?v=20261128_p13`。

### 2.5 驗證承接矩陣
- **持續綠燈既有閘門**：`verify_phase_1.js`, `verify_phase_2.js`, `verify_phase_3.js`（不動舊檔）。
- **本輪總閘門 (`verify_phase_13.js`)**：承接 `verify_phase_12.js` 全部核心不變量（全庫 `renderStructuredStemHtml` 0 例外、聽寫與 `passage_dictation` 0 洩漏、4 種 `visualBlock` 渲染、`matchQuizType` 零空膠囊、零縮寫書名、顯式自評）＋ W14 四單元／20 字集合比對／三週切換／`WEEK14_ALL`／`?v=20261128_p13` 全斷言。

---

## 3. Phase 執行總表（P0 ~ P6）

| Phase 編號 | 名稱 | 單一職責與產出檔案 | 主責能力級別／建議模型 | 執行通道 | 硬性驗收斷言 (Exact Assertions) | 狀態 |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **P0** | Git 安全網、WR3 U7 補抽圖與 Test-First 驗證器 | 1. 建立 Tag `pre-w14-4d-sprint` 與分支 `feat/w14-4d-sprint`<br>2. 從 `Write right 3_05_08.pdf` 補抽 `wr3_u5_pdf_p23.png`, `p24.png`<br>3. 新建 `verify_phase_13.js`（支援 `--data-only`） | **T2** (`Gemini 4 Hydrogen Medium`) | 主視窗 | • `git rev-parse --verify pre-w14-4d-sprint` exit 0<br>• `wr3_u5_pdf_p23.png` & `p24.png` 存在且 > 50KB<br>• `node -c verify_phase_13.js` exit 0 | ✅ 已驗收 |
| **P1** | 三路平行：建置 `OD3_U17`、`ODG3_U17`、`WR3_U07` 雙層 MD 與 4D JS | 嚴格一代理一組獨立檔：<br>• **P1-A**：`01_Oxford_Discover_3/Unit_17_My_Journey_with_Captain_Magellan.md` + `data/units/od3_u17.js`（對齊 Spelling Bee 20 字、35 題含 20 聽寫、>=10 `visualBlock`）<br>• **P1-B**：`02_ODG3/Unit_17_Staying_Safe.md` + `data/units/odg3_u17.js`（32 題含祈使句+10 動態介系詞+地圖指路、>=12 `visualBlock`）<br>• **P1-C**：`04_WR3/Unit_07_Hope_You_Feel_Better.md` + `data/units/wr3_u07.js`（34 題含 8 傷病過去式+3 慰問卡寫作+2 改錯、>=12 `visualBlock`） | **T3** (`Gemini 3.8 Flash Medium`) | 3× 平行 `invoke_subagent` (`flash`) | • 3 檔全通過 `validateModularUnit` (`0 failures`)<br>• `od3_u17` 20 字與 Spelling Bee `d3_u17` 集合 100% 一致<br>• 全數 0 聽寫洩漏、0 頁碼引用 | ✅ 已驗收 (`OD3_U17`:36, `ODG3_U17`:34, `WR3_U07`:36) |
| **P2** | `ODG3_U16` 納編 W14 與跨單元防混淆補強 *(可與 P1 平行)* | 升級 `data/units/odg3_u16.js`：新增 `"is_week14": true`（保留 W12/13 與既有 36 題），增補 3 題「U16 情緒介系詞 × U17 動態介系詞/祈使句」辨析題（共 39 題，含 `visualBlock` & `triadGroup`） | **T3** (`Gemini 3.8 Flash Medium`) | `invoke_subagent` (`flash`) | • `verify_phase_2.js` `validateUnit` 與 `validateModularUnit` 皆 0 failures<br>• `odg3_u16.quizzes.length >= 39` | ✅ 已驗收 (39 題, 20 visualBlock) |
| **P3** | 編譯管線升級與資料層冪等驗收 | 升級 `build_exam_bank.js`（納入新 3 單元、`WEEK14_ALL`、更新 `books` 說明），重編 `midterm_data.js` & `english_data.js` | **T2** (`Gemini 4 Hydrogen Medium`) | 主視窗 | • `node build_exam_bank.js` 連跑 2 次筆數 100% 一致<br>• `verify_phase_1/2/3.js` 與 `verify_phase_13.js --data-only` 全數 `exit code 0` | ✅ 已驗收 (`WEEK14_ALL=145`, `0 failures`) |
| **P4** | 前端三週膠囊切換 (`SPRINT_WEEKS` W14/W13/W12) 與防快取更新 | 更新 `app.js`（`SPRINT_WEEKS` 首位加 `w14`、`eng_sprint_week_v2`、`week14_all` 路由、`WEEK14_UNIT_IDS` 徽章、`BOOK_META`）與 `index.html`（`?v=20261128_p13`） | **T2** (`Gemini 4 Hydrogen Medium`) | 主視窗 | • `node --check app.js` exit 0<br>• `node verify_phase_13.js` 全數斷言 PASS (`0 failures`) | ✅ 已驗收 (1899 題渲染 0 錯誤) |
| **P5** | 雙軌獨立驗收（全腳本 + 10.2" iPad 橫向實機瀏覽器） | 1. 連跑 `verify_phase_1/2/3/13.js`<br>2. 啟動靜態伺服器，派 `browser` 子代理於 `1080×680` 實機檢查並截圖 | **T2** + `browser (flash)` | 主視窗 + `invoke_subagent` (`browser`, `flash`) | • `verify_phase_1/2/3/13.js` 全數 0 Failures<br>• Console `0` Error<br>• 首頁預設 W14 四科、W14/W13/W12 三週切換、`OD3_U17` 聽寫零洩漏、`ODG3_U17`/`WR3_U07` 圖解於 `1.30x` 無溢位、W14 A4 出卷正常 | ✅ 已驗收 (`Console=0`, `0 overflow`, `final_step_34.png`) |
| **P6** | 4-Log 同步、暫存清理與歸檔 | 1. 同步更新 4 份 `.log`（日期 `2026-11-28`，新增 `[#GOAL-12]`, `[#SPEC-7]`, `[#MAN-7]`, `[#MEM-28]`）<br>2. 清理 `./temp/`<br>3. 更新本 `PLAN` 為 `✅ 已結案歸檔`<br>4. 回報 `git status`（**不自動 push**） | **T3** | 主視窗 | • `verify_phase_1/2/3/13.js` 全數 0 Failures<br>• `./temp/` 無殘留<br>• 跨專案 `Tiger_spelling Bee_6 年級` 無任何改動 | ✅ 已驗收 |

---

## 4. 高風險與對策表

| 風險編號 | 潛在風險情境 | 嚴重度 | 預防與應對策略 |
| :---: | :--- | :---: | :--- |
| **R1** | **片語動詞（如 `look after / look through`）在 `spelling_listen` 遮罩不全造成洩漏** | 高 | `build_exam_bank.js` 之 `buildMaskVariants` 已支援多詞片語；於 P1-A 與 P3 由 `verify_phase_13.js` 對 `od3_u17` 20 題逐題驗證 `question` / `masked_example` / `target_chi` 無整個片語或尾字外露。 |
| **R2** | **`ODG3_U16` 跨 W12/W13/W14 共用，增補題目時撞爆 `verify_phase_2.js` 或舊測試** | 高 | 維持 `is_week12: true, is_week13: true, is_week14: true` 且不刪減既有 12 單字或 36 題（保留 W12 71 單字不變），P2/P3 同步跑 `verify_phase_2.js` 確保綠燈。 |
| **R3** | **舊裝置 `localStorage` 記憶 `'w13'` 導致打開首頁看不到新 W14** | 中 | 將儲存鍵升版為 `eng_sprint_week_v2`（預設 `'w14'`），確保所有裝置更新上線後優先呈現最新 W14，仍可一鍵切換 W13 / W12。 |
| **R4** | **跨專案參照時誤改外部目錄檔案** | 中 | 嚴守唯讀鐵律：P1-A 僅讀取 `Tiger_spelling Bee_6 年級\data_courses.js` 與 `word_details_courses.js`，所有產出皆寫入本專案目錄。 |
