# AI 自動化執行與省額度防錯最高準則 (AGENTS.md)

本文件為「C:\@植善課業\AI」所有子專案之通用代理人行為指導原則。
Antigravity 於進入專案時自動載入並嚴格遵循。

---

## 1. 階段切分與模型分級標註鐵律 (Phase, Model & Effort Tagging)
- 面對中大型任務，嚴禁單次一股腦寫完。必須拆分為獨立階段（Phase A / B / C / D），每階段聚焦單一職責。
- 規劃階段時，必須同時標註「模型 + 思考強度 (Effort)」，嚴格依額度池分工：
  - **[Orchestrator (Argon) / Gemini 4 Argon (High)]** *(長週期配額，最謹慎使用)*：僅限 Phase A 跨系統架構總控、Pre-Flight 規格對齊、重大重構決策。禁止拿來寫大量樣板碼或批次資料。
  - **[Gemini 4 Hydrogen (Medium / High)]** *(短週期主力)*：預設複雜開發、中等難度除錯、核心業務邏輯與驗證腳本設計。僅在極複雜推理時升至 `High / Extra`。
  - **[Gemini 3.8 Flash (Low / Medium)]** *(極速省額度)*：所有資料轉換、50+ 筆題庫/單字生成、批次腳本、音訊/檔案處理、標準前端/CSS 實作。
  - **[Claude Sonnet 5.5 / Opus 5.5 (Medium)]** *(獨立額度池／異質審查)*：
    1. **異質 Code Review**：Gemini 完成核心實作後，可於驗收階段派發執行邏輯審查與邊界抓漏，消除單一模型家族盲點。
    2. **額度備援**：當 Gemini 主池接近耗盡時無縫接手。
  - **[GPT-OSS 120B (Medium)]** *(獨立額度池／純文字粗工)*：離線規格整理、Log 摘要或非關鍵性文字轉換備援。

---

## 2. 子代理與 Swarm 雙軌隔離原則 (Subagent & Swarm Routing)
- **輕量平行任務（`invoke_subagent`）**：
  - 凡涉及大量文字生成（如 50+ 筆單字/題庫）、批次檔案處理、多步驟寫碼，**強制派發子代理執行**；若資料量龐大，優先切分為平行 Flash 子代理同步處理。
  - ⚠️ **工具參數限制**：`invoke_subagent` 僅支援抽象層級 `Model: "flash" | "flash_lite" | "pro" | "inherit"`（預設傳 `"flash"`，僅高難度委託傳 `"pro"`）。
  - 子代理回傳給主視窗的報告必須精簡（僅回傳統計數據與驗證結果，禁止把幾千行原始碼貼回主視窗消耗 Token）。
- **重型團隊協作（`/teamwork` / `swarm`）**：
  - 若需精準指定異質模型或 Effort（如 `"gemini-3.8-flash-medium"`、`"claude-sonnet-5-5-medium"`、`"gemini-4-hydrogen-high"`），主控代理應使用 `swarm` 的 `add{model}` 明確覆寫 worker 模型。
  - **授權覆寫預設值**：本專案明確授權 Swarm Coordinator 依任務屬性為不同 worker 降級或分派異質模型（例如 `author` 用 `gemini-3.8-flash-medium`、`verifier` 用 `claude-sonnet-5-5-medium`），避免整隊繼承昂貴的 `Argon` / `Hydrogen High` 模型燒光配額。

---

## 3. 零誤差獨立驗證鐵律 (Strict Verification Gate)
- **絕不盲信子代理的口頭回報**。每個 Phase 完成後，必須撰寫並執行獨立的自動化驗證腳本（如 `node verify_phase_x.js` 或語法檢查）。
- 驗證腳本必須達到 100% PASS (`exit code 0`) 才算該階段驗收完成。

---

## 4. 無人值守連續執行模式 (Unattended Auto-Pipeline)
- **手動確認模式**：當使用者指示「先規劃 / 分階段確認」時，每階段驗證通過後停下回報，等待使用者指示。
- **全自動無人值守模式**：當使用者指示「全自動執行 / 連續執行 Phase X ~ Y / 我不在電腦前」時：
  1. Phase N 完成後，主代理執行 `verify_phase_N.js`。
  2. 若驗證通過 (`exit code 0`)，**主代理不等待人類輸入，立即自動啟動 Phase N+1**，一路推進直到所有指定階段全部完成才輸出總結報告。
  3. 若驗證失敗，自動派子代理修復（最多重試 2 次）；若仍失敗才中斷並回報。
  4. **撞額度不斷線（Quota Fallback）**：若執行期間任一模型出現額度耗盡（Quota Exhausted）或限流：
     - **Swarm 模式**：立即用 `swarm{action:"model"}` 將卡住的 worker 無縫切換至獨立額度池（優先序：`gemini-4-hydrogen-medium` ➔ `claude-sonnet-5-5-medium` ➔ `gpt-oss-120b-medium`），保留原對話脈絡繼續推進，**禁止直接 kill 重來**。
     - **一般階段**：自動改派剩餘額度較高的對應等級模型完成該 Phase，並於最終報告註明實際切換軌跡。

---

## 5. 檔案讀寫與零彈窗沙盒原則 (Zero-Popup Sandbox Hygiene)
1. **嚴禁在專案目錄外建立任何暫存檔、腳本或產出物**；所有暫存一律置於專案內的 `./temp/` 或根目錄，執行完畢自動清理。
2. **跨專案資料存取原則**：
   - 允許跨子專案讀取參考資料（如參考隔壁專案的邏輯或題庫格式）。
   - **嚴格限於唯讀（Read-only）**，絕對嚴禁跨目錄修改、刪除或建立其他專案的檔案，防止狀態污染。
3. 優先使用單一檔案腳本（如 `node verify.js` 或獨立 `.py`）取代複雜的多行 PowerShell 內嵌跳脫字串，確保相容性與無人值守順暢度。

---

## 6. 專案四大核心 Log 檔自動化管理制度 (4-Log & Progressive Disclosure System)
每個專案根目錄必須維持以下 4 份標準化紀錄檔（若新專案尚無，應於 Phase A 規劃定案時自動初始化建立）。
所有 Log 檔強制採用「**⚡ 0. 當下狀態快照 (TL;DR Current Snapshot) ➔ 🧭 一、錨點索引大綱 (Indexed Outline — 標題 + 一句話結論) ➔ 📖 二、單一真實來源細節 (Single-Source Detailed Specifications)**」三段式漸進揭露結構（Progressive Disclosure），廢除重複冗長的中段大綱，消滅同檔雙重維護漏改問題：

### 📐 三段式標準結構規範：
- **`⚡ 0. 當下狀態快照 (TL;DR Current Snapshot)`**：永遠置頂於檔案前 25 行內，記錄最後更新日期、當前版本狀態、線上網址/本地埠號、以及下一步待辦（Next Actions）。
- **`🧭 一、錨點索引大綱 (Indexed Outline — 標題 + 一句話結論)`**：每條目以唯一搜尋錨點（如 `- [#WHY-2.3] 標題：一句話核心結論`）呈現，供 AI 快速掃描全局並透過 `grep` 精準跳轉。
- **`📖 二、單一真實來源細節 (Single-Source Detailed Specifications)`**：對應上方錨點（如 `### [#WHY-2.3] 標題`）展開完整技術規格、決策原因與清冊，作為全檔唯一細節來源（Single Source of Truth）。

### 📁 四大核心 Log 檔職責：
1. **`goals_and_roadmap.log`（目標與路線圖 / `/to-tickets` — 錨點前綴 `#GOAL-`）**：
   - 記錄教育目標、功能願景、以及拆分為 Phase A ~ D 的具體執行計畫與驗收標準。
2. **`web_architecture_and_design.log`（系統架構與設計決策 / `/to-spec` — 錨點前綴 `#ARCH-`, `#WHY-`, `#SPEC-`）**：
   - 記錄技術架構（預設採用 Zero-Build Vanilla SPA）、資料結構規格，以及最重要的**「關鍵設計決策與原因 (Why Behind Design Decisions)」**。
3. **`source_manifest.log`（教材與題庫資產清冊 — 錨點前綴 `#MAN-`）**：
   - 全面追蹤原始教材圖檔/文字檔、關卡配置、每一道題目/單字的處理狀態與待校對 Checklist。
4. **`memory.log`（跨視窗完整記憶交接檔 / `/handoff` — 錨點前綴 `#MEM-`）**：
   - 按時間軸記錄每一階段的對話決策、產出檔案與實作細節。

### 🔄 自動讀取與更新時機（Memory Lifecycle）：
- **對話啟動時（Boot）**：AI 接獲任務時，若目錄下存在上述 `.log` 檔，必須優先讀取各檔前 45 行（`0. 當下狀態快照` 與 `一、錨點索引大綱`）以極小 Token 成本還原全局上下文；僅針對本次需修改之模組透過 `[#錨點]` 跳轉讀取細節，嚴禁盲目改碼。
- **階段完成時（Handoff）**：每完成一個重大功能或 Phase 驗收通過後，必須自動同步更新 `⚡ 0. 當下狀態快照`、`🧭 一、錨點索引大綱`（新增一行錨點結論）與 `📖 二、單一真實來源細節`（追加完整紀錄），確保隨時開啟新對話視窗皆可無縫接手。

---

## 7. 工程嚴謹度與防退化規範 (Matt Pocock Engineering Discipline)
1. **動工前魔鬼對齊（Pre-Flight Grill）**：
   - 面對新專案或需求有模糊空間時，嚴禁自行腦補猜測；必須先盤點邊界條件（Edge Cases）向使用者提問對齊，確認無誤後才轉換為規格與代碼。
2. **尊重既有設計原因（Respect the "Why"）**：
   - 修改現有代碼前，必須核對 `web_architecture_and_design.log` 中的 `[#WHY-*]` 設計原因，嚴禁在重構過程中破壞既有的防呆邏輯（如語音合成 workaround、狀態鎖定或帳號保護機制）。
3. **測試先行（Test-First Implementation）**：
   - 實作前先明確定義該階段 `verify_phase_x.js` 的驗證斷言，以自動化測試驅動開發。
