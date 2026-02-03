# 寿司打 自動プレイボット 🍣

寿司打タイピングゲームの自動プレイ補助ツール

## ファイル一覧

### JavaScript版
| ファイル | 説明 |
|---------|------|
| `sushida_bot_v2.js` | ブラウザコンソール用ボット（推奨） |
| `sushida_helper.html` | GUIヘルパーツール |
| `sushida_bot.js` | 辞書付きコンソールスクリプト |
| `sushida_puppeteer.js` | Puppeteer版（Node.js必要） |
| `sushida_auto.js` | OCR自動プレイ版（Node.js + Tesseract.js必要） |

### Python版
| ファイル | 説明 |
|---------|------|
| `sushida_bot.py` | 対話式ボット（PyAutoGUI使用） |
| `sushida_auto_ocr.py` | OCR自動プレイ版（Tesseract使用） |

---

## 🐍 Python版 クイックスタート

### セットアップ

```bash
# 依存パッケージをインストール
pip install -r requirements.txt

# OCR版を使う場合は追加で
pip install -r requirements_ocr.txt
brew install tesseract  # macOSの場合
```

### 使い方

```bash
# 対話式モード
python sushida_bot.py

# OCR自動プレイモード
python sushida_auto_ocr.py
```

### Python版コマンド

```
入力 > arigatougozaimasita   # ローマ字を直接入力
入力 > word ありがとうございました  # 辞書から入力
入力 > search ありがとう     # 辞書検索
入力 > delay 0.05           # 入力速度変更
入力 > quit                 # 終了
```

---

## 🌐 JavaScript版 クイックスタート

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

### JavaScript版コマンド

```javascript
sushidaBot.type("romaji")     // ローマ字を入力
sushidaBot.typeWord("日本語")  // 辞書から入力
sushidaBot.search("検索語")   // 辞書検索
sushidaBot.help()             // ヘルプ表示
```

---

## ⚠️ 注意事項

このツールは**学習・実験目的**で作成されています。
寿司打の利用規約では外部ツールの使用は禁止されているため、ランキング投稿などには使用しないでください。

## ライセンス

MIT License
