
# 🎮 2048 經典單人版 - 專案開發自述 (README)

## 📌 專案簡介

本專案為一款採用 **原生 JavaScript (ES6+)** 與 **Tailwind CSS** 開發的純淨單人版 **2048 益智網頁遊戲**。

拋棄了複雜的後端依賴與連線機制，專注於提供**極致流暢的動畫體驗、響應式跨裝置適配、完備的本土儲存機制與沉浸式音效反饋**。

---

## ✨ 核心功能與特色

### 1. 🎯 多動態棋盤規格 (3x3 ~ 6x6)

* 支援 **3×3、4×4 (經典)、5×5、6×6** 四種棋盤規格切換。
* 各尺寸的最高得分（Best Score）與遊戲進度皆**獨立紀錄**，不會互相覆蓋。

### 2. 🎨 深淺色主題切換 (Dark / Light Mode)

* 支援一鍵切換深色（DarkMode）與淺色（Light Mode）視覺主題。
* 狀態自動記憶於 `LocalStorage`，再次開啟網頁時保持偏好設定。

### 3. 🎵 原生 Web Audio API 模擬合成音效

* 採用 **Web Audio API** 即時動態合成頻率音效，無需載入任何外部 `.mp3` 音訊檔案：
* **滑動音效**：輕微低頻 Sine 波震盪。
* **合成音效**：隨方塊數值動態升高頻率的 Triangle 三角波。
* **勝負與復原**：專屬多音階音效反饋。



### 4. 📱 跨裝置完美適配 (RWD & Touch)

* **全平台觸控支援**：手機/平板端支援原生 Touch 滑動手勢（`touchstart` / `touchend`），並精準收斂事件範圍至棋盤區域，避免頁面滾動誤觸。
* **虛擬方向鍵**：行動端自動顯示十字方向鍵按鈕，提供多重操作選擇。
* **全鍵盤快捷支援**：電腦端支援方向鍵（`↑ ↓ ← →`）與 `WASD` 按鍵操作。

### 5. 💾 完備的本地持久化儲存與復原（Undo）

* **自動存檔**：每一次滑動皆即時將盤面、分數與勝負狀態寫入 `LocalStorage`，意外重新整理頁面可無縫接續進度。
* **復原機能 (Undo)**：提供最長 15 步的歷史紀錄回退功能。

---

## 🛠️ 技術架構與使用工具

* **前端框架 / 樣式**：HTML5, Tailwind CSS (CDN), FontAwesome 6 Icons.
* **字型套件**：Google Fonts (`Fredoka One`, `Plus Jakarta Sans`).
* **核心邏輯**：原生 JavaScript (面向物件 OOP 設計 Class 導向).
* **音效處理**：Web Audio API (AudioContext / OscillatorNode / GainNode).
* **資料儲存**：Browser LocalStorage API.

---

## 💡 程式碼架構與邏輯說明

```
index_12.html
├── 🎨 <style>               # Tailwind 補充樣式、Tile 方塊色彩與動畫 Keyframes (tileAppear / tilePop)
├── 🖥️ <main>               # 遊戲主戰場、分數板、選單控制列與 Overlay 彈窗
└── 📜 <script>
    ├── SoundEngine         # Web Audio API 音效生成器 (PlayMove / PlayMerge / PlayVictory...)
    ├── Tile                # 方塊實體類別 (記錄座標、數值、動畫狀態與 ID)
    └── Game2048            # 遊戲核心引擎
        ├── initUI()        # 初始化主題、音效與介面綁定
        ├── restart()       # 棋盤初始化與存檔載入
        ├── move()          # 矩陣位移計算、方塊合併邏輯與動畫觸發
        ├── actuate()       # 透過 requestAnimationFrame 更新 DOM 方塊渲染
        └── setupInputs()   # 鍵盤/觸控手勢/按鈕事件監聽

```
