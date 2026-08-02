# 🎮 2048 多人線上對戰大廳 (2048 Multiplayer Hub)

一款基於 WebRTC 點對點（P2P）連線技術開發的網頁版 2048 多人線上對戰與觀戰平台。無須安裝額外套件或註冊複雜帳號，開啟瀏覽器即可創建房間，與好友進行即時對戰、觀戰與互動。

---

## ✨ 核心特色

* **🌐 點對點即時對戰 (WebRTC P2P)**
  * 使用 PeerJS 建立高效率點對點連線，低延遲同步玩家棋盤與分數。
  * 支援 6 位數房間號，可透過專屬邀請連結或 QR Code 一鍵加入。

* **👀 即時觀戰與動態排行榜**
  * 支援房間內玩家自由切換觀戰目標，即時掌握對手盤面局勢。
  * 內建即時排行榜，動態更新最高得分與目前遊戲狀態（對戰中 / 已淘汰）。

* **💬 多人互動與聊天室**
  * 房間內建即時文字聊天室，發送訊息同步零時差。
  * 支援發送表情符號（Emoji）浮動動畫與快捷嗆聲短語。

* **🧩 多種模式與自訂規格**
  * **單人練習模式**：支援 3x3 到 6x6 多種棋盤規格，提供無限復原（Undo）功能。
  * **狀態自動儲存**：離線或重新整理頁面時自動保存單人/多人局勢。

* **🎨 獨立且安全的極致體驗**
  * **無外部圖示庫依賴**：全站圖示皆採用內嵌 SVG 標籤，不受 CDN 斷線或廣告攔截器（AdBlock）影響。
  * **響應式設計 (RWD)**：針對桌面端與行動端（手機、平板）深度優化介面佈局與觸控手勢。

---

## 🛠️ 技術棧

* **Frontend:** HTML5, CSS3, JavaScript (ES6+)
* **UI Framework:** [Tailwind CSS](https://tailwindcss.com/)
* **P2P Networking:** [PeerJS (WebRTC)](https://peerjs.com/)
* **Fonts & Icons:** Google Fonts (Fredoka, Noto Sans TC), Inline Native SVGs
* **Audio:** Web Audio API (程式動態合成音效)

---

## 🚀 快速開始

本專案為純前端單頁應用程式（SPA），無須任何後端伺服器建置即可直接執行。

### 本地端開啟

1. 複製（Clone）此專案至本地端：
   ```bash
   git clone [https://github.com/your-username/2048-game.git](https://github.com/your-username/2048-game.git)
進入專案目錄，並使用任意 Web Server 伺服器開啟（如 VS Code Live Server 或 Node.js HTTP Server）：

Bash
# 使用 npx http-server 快速啟動
npx http-server .
在瀏覽器開啟 http://localhost:8080 即可開始遊玩。

📖 使用說明
進入大廳：選擇「創建 / 加入對戰房間」或「開始單人模式」。

創建房間：點擊創建房間後，系統將會產生專屬房間碼。

邀請好友：點擊右上角「分享房間」，將邀請連結或 QR Code 傳給好友。

進入對戰：好友點擊連結後即可自動加入房間，棋盤同步開啟，排行榜與聊天室隨即連線。

📄 授權條款
本專案採用 MIT License 授權條款。
