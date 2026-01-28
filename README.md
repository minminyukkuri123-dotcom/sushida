# 寿司打 自動プレイボット 🍣

寿司打タイピングゲームの自動プレイ補助ツール

## ファイル一覧

| ファイル | 説明 |
|---------|------|
| `sushida_bot_v2.js` | ブラウザコンソール用ボット（推奨） |
| `sushida_helper.html` | GUIヘルパーツール |
| `sushida_bot.js` | 辞書付きコンソールスクリプト |
| `sushida_puppeteer.js` | Puppeteer版（Node.js必要） |
| `sushida_auto.js` | OCR自動プレイ版（Node.js + Tesseract.js必要） |

## クイックスタート

### 方法1: ブラウザコンソール（最も簡単）

1. [寿司打](https://sushida.net/play.html) を開く
2. F12キーでデベロッパーツールを開く
3. `sushida_bot_v2.js` の内容をConsoleに貼り付けてEnter
4. ゲームを開始
5. 表示されたローマ字を入力:
   ```javascript
   sushidaBot.type("arigatougozaimasita")
   ```

### 方法2: HTMLヘルパー

1. `sushida_helper.html` をブラウザで開く
2. 画面の指示に従ってセットアップ
3. ローマ字入力や辞書検索が可能

## コマンド一覧

```javascript
// ローマ字を入力
sushidaBot.type("romaji")

// 日本語ワードから入力（辞書使用）
sushidaBot.typeWord("ありがとうございました")

// 辞書検索
sushidaBot.search("ありがとう")

// ヘルプ表示
sushidaBot.help()
```

## 注意事項

⚠️ このツールは**学習・実験目的**で作成されています。
寿司打の利用規約では外部ツールの使用は禁止されているため、ランキング投稿などには使用しないでください。

## ライセンス

MIT License
