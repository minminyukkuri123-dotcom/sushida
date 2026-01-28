/**
 * 寿司打 完全自動プレイボット
 * 
 * OCR + Puppeteer を使用して寿司打を自動プレイします
 * 
 * 使い方:
 *   1. npm install を実行
 *   2. node sushida_auto.js を実行
 *   3. 自動でゲームが開始され、タイピングが行われます
 */

const puppeteer = require('puppeteer');
const Tesseract = require('tesseract.js');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 設定
const CONFIG = {
    // ゲームURL
    GAME_URL: 'https://sushida.net/play.html',

    // Canvas内のゲーム領域（寿司打は660x480）
    GAME_WIDTH: 660,
    GAME_HEIGHT: 480,

    // ローマ字表示領域（Canvas内の相対座標）
    ROMAJI_REGION: {
        x: 120,      // 左端からのオフセット
        y: 275,      // 上端からのオフセット
        width: 420,  // 幅
        height: 50   // 高さ
    },

    // 入力速度（ミリ秒）
    TYPE_DELAY_MIN: 30,
    TYPE_DELAY_MAX: 60,

    // OCRチェック間隔（ミリ秒）
    OCR_INTERVAL: 100,

    // デバッグモード
    DEBUG: true,

    // スクリーンショット保存先
    SCREENSHOT_DIR: './screenshots'
};

// 遅延関数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ランダムな遅延
const randomDelay = () => CONFIG.TYPE_DELAY_MIN + Math.random() * (CONFIG.TYPE_DELAY_MAX - CONFIG.TYPE_DELAY_MIN);

// ログ出力
const log = (message) => {
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    console.log(`[${timestamp}] ${message}`);
};

// デバッグログ
const debug = (message) => {
    if (CONFIG.DEBUG) {
        const timestamp = new Date().toLocaleTimeString('ja-JP');
        console.log(`[${timestamp}] [DEBUG] ${message}`);
    }
};

// スクリーンショットディレクトリの作成
if (!fs.existsSync(CONFIG.SCREENSHOT_DIR)) {
    fs.mkdirSync(CONFIG.SCREENSHOT_DIR, { recursive: true });
}

/**
 * Canvas要素の位置を取得
 */
async function getCanvasPosition(page) {
    return await page.evaluate(() => {
        const canvas = document.querySelector('canvas');
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        return {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
        };
    });
}

/**
 * ローマ字表示領域のスクリーンショットを取得
 */
async function captureRomajiRegion(page, canvasPos) {
    // ページ全体のスクリーンショット
    const screenshot = await page.screenshot({ encoding: 'binary' });

    // Canvas内のローマ字領域を計算
    const scaleX = canvasPos.width / CONFIG.GAME_WIDTH;
    const scaleY = canvasPos.height / CONFIG.GAME_HEIGHT;

    const clipX = Math.round(canvasPos.x + CONFIG.ROMAJI_REGION.x * scaleX);
    const clipY = Math.round(canvasPos.y + CONFIG.ROMAJI_REGION.y * scaleY);
    const clipWidth = Math.round(CONFIG.ROMAJI_REGION.width * scaleX);
    const clipHeight = Math.round(CONFIG.ROMAJI_REGION.height * scaleY);

    debug(`クリップ領域: x=${clipX}, y=${clipY}, w=${clipWidth}, h=${clipHeight}`);

    // 画像を切り抜き、OCR用に前処理
    const processedImage = await sharp(screenshot)
        .extract({ left: clipX, top: clipY, width: clipWidth, height: clipHeight })
        .resize(clipWidth * 2, clipHeight * 2)  // 拡大してOCR精度向上
        .greyscale()  // グレースケール化
        .normalise()  // コントラスト調整
        .sharpen()    // シャープネス向上
        .toBuffer();

    // デバッグ用にスクリーンショットを保存
    if (CONFIG.DEBUG) {
        const timestamp = Date.now();
        await sharp(processedImage).toFile(path.join(CONFIG.SCREENSHOT_DIR, `romaji_${timestamp}.png`));
    }

    return processedImage;
}

/**
 * OCRでローマ字を認識
 */
async function recognizeRomaji(imageBuffer) {
    try {
        const result = await Tesseract.recognize(
            imageBuffer,
            'eng',  // 英語モード（ローマ字認識用）
            {
                logger: m => {
                    if (CONFIG.DEBUG && m.status === 'recognizing text') {
                        // 進捗表示は省略
                    }
                }
            }
        );

        // 認識結果からローマ字を抽出
        let text = result.data.text.trim();

        // 不要な文字を除去（英数字、ハイフン、カンマ、記号のみ残す）
        text = text.replace(/[^a-zA-Z0-9\-,!?.\s]/g, '');
        text = text.toLowerCase().trim();

        // 空白を除去
        text = text.replace(/\s+/g, '');

        debug(`OCR結果: "${text}"`);

        return text;
    } catch (error) {
        console.error('OCRエラー:', error.message);
        return '';
    }
}

/**
 * キーボード入力
 */
async function typeText(page, text) {
    log(`⌨️  入力中: ${text}`);

    for (const char of text) {
        await page.keyboard.press(char);
        await sleep(randomDelay());
    }
}

/**
 * ゲーム画面のクリック（Canvas座標）
 */
async function clickCanvas(page, canvasPos, relX, relY) {
    const scaleX = canvasPos.width / CONFIG.GAME_WIDTH;
    const scaleY = canvasPos.height / CONFIG.GAME_HEIGHT;

    const clickX = canvasPos.x + relX * scaleX;
    const clickY = canvasPos.y + relY * scaleY;

    debug(`クリック: Canvas(${relX}, ${relY}) → 画面(${Math.round(clickX)}, ${Math.round(clickY)})`);

    await page.mouse.click(clickX, clickY);
}

/**
 * ゲーム開始処理
 */
async function startGame(page, canvasPos) {
    log('🎮 ゲームを開始します...');

    // スタートボタンをクリック（画面中央付近）
    log('📍 スタートボタンをクリック...');
    await clickCanvas(page, canvasPos, 330, 340);
    await sleep(1500);

    // コース選択画面を待機
    log('📍 お手軽コースを選択...');
    await clickCanvas(page, canvasPos, 330, 260);  // お手軽3000円コース
    await sleep(1500);

    // ゲーム開始確認
    log('📍 ゲーム開始...');
    await clickCanvas(page, canvasPos, 330, 350);  // スタートボタン
    await sleep(2000);

    log('✅ ゲーム開始完了！');
}

/**
 * メインの自動プレイループ
 */
async function autoPlayLoop(page, canvasPos) {
    log('🔄 自動プレイループを開始...');

    let lastRomaji = '';
    let sameCount = 0;
    let wordCount = 0;
    let emptyCount = 0;

    while (true) {
        try {
            // ローマ字領域をキャプチャ
            const imageBuffer = await captureRomajiRegion(page, canvasPos);

            // OCRで認識
            const romaji = await recognizeRomaji(imageBuffer);

            // 空の結果が続く場合はゲーム終了の可能性
            if (!romaji || romaji.length < 2) {
                emptyCount++;
                if (emptyCount > 30) {
                    log('🏁 ゲーム終了を検出（空の結果が続いた）');
                    break;
                }
                await sleep(CONFIG.OCR_INTERVAL);
                continue;
            }

            emptyCount = 0;

            // 同じ結果が続く場合はスキップ（入力待ち中）
            if (romaji === lastRomaji) {
                sameCount++;
                if (sameCount > 10) {
                    debug(`同じ結果が続いています: "${romaji}"`);
                }
                await sleep(CONFIG.OCR_INTERVAL);
                continue;
            }

            // 新しいワードを検出
            sameCount = 0;
            lastRomaji = romaji;
            wordCount++;

            log(`📝 ワード ${wordCount}: "${romaji}"`);

            // 入力
            await typeText(page, romaji);

            // 少し待機して次のワードを待つ
            await sleep(200);

        } catch (error) {
            console.error('ループエラー:', error.message);
            await sleep(500);
        }
    }

    log(`🎉 自動プレイ完了！ 合計 ${wordCount} ワード入力しました`);
}

/**
 * 結果画面のスクリーンショットを保存
 */
async function captureResult(page) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(CONFIG.SCREENSHOT_DIR, `result_${timestamp}.png`);
    await page.screenshot({ path: filename });
    log(`📸 結果画面を保存: ${filename}`);
    return filename;
}

/**
 * メイン関数
 */
async function main() {
    log('🍣 寿司打 完全自動プレイボット v1.0');
    log('=====================================');

    // ブラウザを起動
    log('🌐 ブラウザを起動中...');
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [
            '--start-maximized',
            '--disable-web-security',
            '--no-sandbox'
        ]
    });

    const page = await browser.newPage();

    // 寿司打を開く
    log('📱 寿司打を開いています...');
    await page.goto(CONFIG.GAME_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // ページ読み込み完了を待機
    await sleep(3000);

    // Canvas位置を取得
    const canvasPos = await getCanvasPosition(page);
    if (!canvasPos) {
        console.error('❌ Canvasが見つかりません');
        await browser.close();
        return;
    }

    log(`✅ Canvas検出: ${Math.round(canvasPos.width)}x${Math.round(canvasPos.height)} at (${Math.round(canvasPos.x)}, ${Math.round(canvasPos.y)})`);

    // ゲーム開始
    await startGame(page, canvasPos);

    // 自動プレイ
    await autoPlayLoop(page, canvasPos);

    // 結果画面をキャプチャ
    await sleep(2000);
    await captureResult(page);

    // 終了を待機
    log('📌 ブラウザを開いたままにします。手動で閉じてください。');

    // 10分後に自動終了
    await sleep(600000);
    await browser.close();
}

// 実行
main().catch(error => {
    console.error('❌ エラー:', error);
    process.exit(1);
});
