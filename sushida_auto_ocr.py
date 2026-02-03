"""
寿司打 完全自動プレイボット（Python + OCR版）

OCRで画面からローマ字を読み取り、自動で入力します。

使い方:
    1. pip install -r requirements_ocr.txt
    2. Tesseract OCRをインストール（brew install tesseract）
    3. python sushida_auto_ocr.py
    4. 寿司打のゲームを開始すると自動でプレイします
"""

import pyautogui
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter
import time
import re
import threading
from typing import Optional, Tuple

# OCRの設定
# macOSの場合、Homebrewでインストールした場合のパス
# pytesseract.pytesseract.tesseract_cmd = '/opt/homebrew/bin/tesseract'

# 画面キャプチャ設定
CAPTURE_CONFIG = {
    # ローマ字表示領域（モニターの解像度に合わせて調整が必要）
    # これらの値は寿司打のウィンドウ位置によって変わります
    "region": None,  # Noneの場合は手動で設定
    
    # OCR間隔（秒）
    "ocr_interval": 0.1,
    
    # 入力速度（秒）
    "type_delay": 0.035,
}


class SushidaAutoBot:
    """OCR付き寿司打自動プレイボット"""
    
    def __init__(self):
        self.is_running = False
        self.last_text = ""
        self.capture_region = None
        self.word_count = 0
        
    def calibrate_region(self) -> Tuple[int, int, int, int]:
        """
        画面キャプチャ領域を手動で設定
        
        Returns:
            (left, top, width, height) のタプル
        """
        print("🎯 キャプチャ領域を設定します")
        print("   寿司打のゲーム画面で、ローマ字が表示される領域を指定してください")
        print()
        
        print("⏳ 5秒後にマウスカーソルの位置を左上として記録します...")
        print("   ローマ字表示領域の左上にマウスを移動してください")
        time.sleep(5)
        
        left, top = pyautogui.position()
        print(f"✅ 左上: ({left}, {top})")
        
        print()
        print("⏳ 5秒後にマウスカーソルの位置を右下として記録します...")
        print("   ローマ字表示領域の右下にマウスを移動してください")
        time.sleep(5)
        
        right, bottom = pyautogui.position()
        print(f"✅ 右下: ({right}, {bottom})")
        
        width = right - left
        height = bottom - top
        
        self.capture_region = (left, top, width, height)
        print()
        print(f"📐 キャプチャ領域: left={left}, top={top}, width={width}, height={height}")
        
        return self.capture_region
    
    def set_region(self, left: int, top: int, width: int, height: int) -> None:
        """キャプチャ領域を直接設定"""
        self.capture_region = (left, top, width, height)
        print(f"📐 キャプチャ領域を設定: {self.capture_region}")
    
    def capture_screen(self) -> Image.Image:
        """画面をキャプチャ"""
        if self.capture_region is None:
            raise ValueError("キャプチャ領域が設定されていません。calibrate_region() を実行してください")
        
        screenshot = pyautogui.screenshot(region=self.capture_region)
        return screenshot
    
    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """OCR精度向上のための画像前処理"""
        # グレースケール変換
        gray = image.convert('L')
        
        # コントラスト強調
        enhancer = ImageEnhance.Contrast(gray)
        enhanced = enhancer.enhance(2.0)
        
        # シャープネス強調
        sharpened = enhanced.filter(ImageFilter.SHARPEN)
        
        # 拡大（OCR精度向上）
        width, height = sharpened.size
        resized = sharpened.resize((width * 2, height * 2), Image.Resampling.LANCZOS)
        
        # 二値化
        threshold = 128
        binary = resized.point(lambda x: 255 if x > threshold else 0)
        
        return binary
    
    def recognize_text(self, image: Image.Image) -> str:
        """OCRでテキストを認識"""
        # 前処理
        processed = self.preprocess_image(image)
        
        # OCR実行（英数字のみ）
        config = '--psm 7 -c tessedit_char_whitelist=abcdefghijklmnopqrstuvwxyz-,!?.'
        text = pytesseract.image_to_string(processed, lang='eng', config=config)
        
        # テキストをクリーンアップ
        text = text.strip().lower()
        text = re.sub(r'[^a-z\-,!?.]', '', text)
        
        return text
    
    def type_text(self, text: str) -> None:
        """テキストをキーボード入力"""
        print(f"⌨️  入力: {text}")
        
        for char in text:
            if not self.is_running:
                return
            pyautogui.press(char)
            time.sleep(CAPTURE_CONFIG["type_delay"])
    
    def auto_play_loop(self) -> None:
        """自動プレイのメインループ"""
        print("🔄 自動プレイループを開始...")
        
        empty_count = 0
        
        while self.is_running:
            try:
                # 画面キャプチャ
                screenshot = self.capture_screen()
                
                # OCR認識
                text = self.recognize_text(screenshot)
                
                # 空の結果が続く場合
                if not text or len(text) < 2:
                    empty_count += 1
                    if empty_count > 50:
                        print("🏁 ゲーム終了を検出（空の結果が続いた）")
                        break
                    time.sleep(CAPTURE_CONFIG["ocr_interval"])
                    continue
                
                empty_count = 0
                
                # 同じテキストはスキップ
                if text == self.last_text:
                    time.sleep(CAPTURE_CONFIG["ocr_interval"])
                    continue
                
                # 新しいワードを検出
                self.last_text = text
                self.word_count += 1
                
                print(f"📝 ワード {self.word_count}: {text}")
                
                # 入力
                self.type_text(text)
                
                # 次のワードを待つ
                time.sleep(0.2)
                
            except Exception as e:
                print(f"❌ エラー: {e}")
                time.sleep(0.5)
        
        print(f"🎉 自動プレイ完了！ 合計 {self.word_count} ワード入力しました")
    
    def start(self) -> None:
        """自動プレイを開始"""
        if self.capture_region is None:
            print("❌ キャプチャ領域が設定されていません")
            print("   calibrate_region() または set_region() を実行してください")
            return
        
        self.is_running = True
        self.word_count = 0
        self.last_text = ""
        
        print("🚀 自動プレイを開始します")
        print("💡 停止するには Ctrl+C を押してください")
        print()
        
        # 別スレッドで実行
        thread = threading.Thread(target=self.auto_play_loop)
        thread.start()
    
    def stop(self) -> None:
        """自動プレイを停止"""
        self.is_running = False
        print("⏹️  自動プレイを停止しました")


def main():
    """メイン関数"""
    print()
    print("🍣 寿司打 完全自動プレイボット（OCR版）")
    print("=" * 50)
    print()
    
    bot = SushidaAutoBot()
    
    print("📖 手順:")
    print("  1. 寿司打のゲームを開いてください")
    print("  2. ゲームをスタートする直前まで進めてください")
    print("  3. 'c' を入力してキャプチャ領域を設定")
    print("  4. 's' を入力して自動プレイを開始")
    print("  5. Ctrl+C で停止")
    print()
    
    while True:
        try:
            cmd = input("コマンド (c=キャリブレーション, s=開始, q=終了) > ").strip().lower()
            
            if cmd == 'q':
                print("👋 終了します")
                break
            
            elif cmd == 'c':
                bot.calibrate_region()
                print()
                print("✅ キャリブレーション完了！")
                print("   's' を入力して自動プレイを開始できます")
                print()
            
            elif cmd == 's':
                if bot.capture_region is None:
                    print("❌ 先にキャリブレーション ('c') を実行してください")
                    continue
                
                print()
                print("⏳ 5秒後に自動プレイを開始します...")
                print("   寿司打でゲームをスタートしてください！")
                time.sleep(5)
                
                bot.start()
                
                # メインスレッドで待機
                try:
                    while bot.is_running:
                        time.sleep(0.5)
                except KeyboardInterrupt:
                    bot.stop()
            
            elif cmd == 'test':
                # テスト用：スクリーンショットを保存
                if bot.capture_region:
                    screenshot = bot.capture_screen()
                    screenshot.save('test_capture.png')
                    print("📸 test_capture.png に保存しました")
                else:
                    print("❌ 先にキャリブレーションを実行してください")
            
        except KeyboardInterrupt:
            print("\n👋 終了します")
            break


if __name__ == "__main__":
    main()
