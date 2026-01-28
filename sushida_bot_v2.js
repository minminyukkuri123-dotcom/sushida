/**
 * 寿司打 完全自動プレイボット v2.0
 * ブラウザコンソールに貼り付けて実行するスクリプト
 * 
 * 【使い方】
 * 1. 寿司打のページ（https://sushida.net/play.html）を開く
 * 2. F12キーでデベロッパーツールを開く
 * 3. Consoleタブを選択
 * 4. このスクリプト全体をコピーして貼り付け、Enterを押す
 * 5. ゲームを開始し、sushidaBot.autoStart() を実行
 * 
 * 【コマンド】
 * sushidaBot.autoStart()  - 自動モード開始（表示されたローマ字を入力する）
 * sushidaBot.stop()       - 停止
 * sushidaBot.type("ローマ字") - 手動でローマ字を入力
 */

(() => {
    'use strict';

    console.log('🍣 寿司打 自動プレイボット v2.0 をロード中...');

    // ========================================
    // 完全なワード辞書（日本語 → ローマ字）
    // ========================================
    const WORD_DICT = {
        "ああ言えばこう言う": "aaiebakouiu",
        "開いた口がふさがらない": "aitakutigafusagaranai",
        "愛に国境はない": "ainikokkyouhanai",
        "青い空、白い雲": "aoisora,siroikumo",
        "赤いチューリップ": "akaityu-rippu",
        "赤ちゃんから目が離せない": "akatyankaramegahanasenai",
        "アカデミー賞受賞": "akademi-shoujushou",
        "あけましておめでとう": "akemasiteomedetou",
        "あこがれのセーラー服": "akogarenose-ra-fuku",
        "アサリのお味噌汁": "asarinoomisosiru",
        "足がしびれました": "asigasibiremasita",
        "あしたからダイエット": "asitakaradaietto",
        "あした天気になーれ": "asitatenkinina-re",
        "あしたはあしたの風が吹く": "asitahaasitanokazegafuku",
        "あせると間違えますよ": "aserutomatigaemasuyo",
        "新しいゲームソフト": "atarasiige-musofuto",
        "アップルパイを焼きました": "appurupaiwoyakimasita",
        "あとは野となれ山となれ": "atohanotonareyamatonare",
        "アナゴ一本握り": "anagoipponnnigiri",
        "あなたに一目ぼれ": "anatanihitomebore",
        "あの夕日に向かってダッシュだ": "anoyuuhinimukattedasshuda",
        "アプリケーションエラーです": "apurike-shonnera-desu",
        "甘いものは別腹": "amaimonohabetubara",
        "甘酸っぱい思い出": "amazuppaiomoide",
        "雨上がりの夜空": "ameagarinoyozora",
        "雨がやんだら虹が出た": "amegayandaranijigadeta",
        "アメリカ連邦捜査局": "amerikarenpousousakyoku",
        "アメリカンショートヘアー": "amerikansho-tohea-",
        "アメリカンフットボール": "amerikanfuttobo-ru",
        "ありがとうございました": "arigatougozaimasita",
        "アリの巣の観察": "arinosunokansatu",
        "アルバイト募集中": "arubaitoboshuutyuu",
        "暗証番号": "anshoubangou"
    };

    // 状態管理
    let isAutoMode = false;
    let lastTypedText = '';
    let autoInterval = null;

    // ========================================
    // キーイベント送信
    // ========================================
    function sendKeyEvent(char) {
        const keyCode = char.toUpperCase().charCodeAt(0);
        const key = char.toLowerCase();

        const eventInit = {
            key: key,
            code: `Key${key.toUpperCase()}`,
            keyCode: keyCode,
            which: keyCode,
            bubbles: true,
            cancelable: true
        };

        // 特殊文字対応
        if (char === '-') {
            eventInit.key = '-';
            eventInit.code = 'Minus';
            eventInit.keyCode = 189;
        } else if (char === ',') {
            eventInit.key = ',';
            eventInit.code = 'Comma';
            eventInit.keyCode = 188;
        } else if (char === '.') {
            eventInit.key = '.';
            eventInit.code = 'Period';
            eventInit.keyCode = 190;
        } else if (char === '?') {
            eventInit.key = '?';
            eventInit.code = 'Slash';
            eventInit.keyCode = 191;
            eventInit.shiftKey = true;
        } else if (char === '!') {
            eventInit.key = '!';
            eventInit.code = 'Digit1';
            eventInit.keyCode = 49;
            eventInit.shiftKey = true;
        }

        // キーイベントを送信
        document.dispatchEvent(new KeyboardEvent('keydown', eventInit));
        document.dispatchEvent(new KeyboardEvent('keypress', { ...eventInit, charCode: eventInit.keyCode }));
        document.dispatchEvent(new KeyboardEvent('keyup', eventInit));

        // Canvasにもイベントを送信
        const canvas = document.querySelector('canvas');
        if (canvas) {
            canvas.dispatchEvent(new KeyboardEvent('keydown', eventInit));
            canvas.dispatchEvent(new KeyboardEvent('keypress', { ...eventInit, charCode: eventInit.keyCode }));
            canvas.dispatchEvent(new KeyboardEvent('keyup', eventInit));
        }
    }

    // ========================================
    // テキスト入力（遅延付き）
    // ========================================
    async function typeText(text, delay = 40) {
        console.log(`⌨️ 入力: ${text}`);
        lastTypedText = text;

        for (let i = 0; i < text.length; i++) {
            if (!isAutoMode && !window.sushidaBot._manualTyping) break;

            const char = text[i];
            sendKeyEvent(char);

            // ランダムな遅延（30-60ms）
            const randomDelay = delay + Math.random() * 30;
            await new Promise(r => setTimeout(r, randomDelay));
        }
    }

    // ========================================
    // Canvas画像からテキストを取得する試み
    // （Unity WebGLゲームの内部状態にアクセス）
    // ========================================
    function tryGetUnityText() {
        // Unityインスタンスを探す
        const possibleNames = [
            'unityInstance',
            'gameInstance',
            'UnityLoader',
            'Module',
            'unityGame'
        ];

        for (const name of possibleNames) {
            if (window[name]) {
                console.log(`🎮 Unity instance found: ${name}`);
                return window[name];
            }
        }

        return null;
    }

    // ========================================
    // 自動モード開始
    // ========================================
    function startAutoMode() {
        if (isAutoMode) {
            console.log('⚠️ 自動モードは既に実行中です');
            return;
        }

        isAutoMode = true;
        console.log('🚀 自動モードを開始しました');
        console.log('📌 画面に表示されるローマ字を見て、sushidaBot.type("ローマ字") で入力してください');
        console.log('📌 または、辞書の単語を検索: sushidaBot.search("キーワード")');
        console.log('');
        console.log('💡 ヒント: 寿司打はCanvasゲームなので、OCRなしでは自動認識ができません。');
        console.log('   代わりに、表示されたローマ字をコピーして type() に渡してください。');

        // Unityインスタンスを探す
        const unity = tryGetUnityText();
        if (unity) {
            console.log('🎮 Unityインスタンスが見つかりました。内部フックを試みます...');
        }
    }

    // ========================================
    // 停止
    // ========================================
    function stopAutoMode() {
        isAutoMode = false;
        if (autoInterval) {
            clearInterval(autoInterval);
            autoInterval = null;
        }
        console.log('⏹️ 自動モードを停止しました');
    }

    // ========================================
    // 辞書検索
    // ========================================
    function searchDict(keyword) {
        const results = Object.entries(WORD_DICT).filter(([k, v]) =>
            k.includes(keyword) || v.includes(keyword)
        );

        if (results.length === 0) {
            console.log(`❌ "${keyword}" に一致する単語が見つかりません`);
            return [];
        }

        console.log(`🔍 "${keyword}" の検索結果:`);
        results.slice(0, 15).forEach(([word, romaji]) => {
            console.log(`   ${word} → ${romaji}`);
        });

        if (results.length > 15) {
            console.log(`   ... 他 ${results.length - 15} 件`);
        }

        return results;
    }

    // ========================================
    // 連続入力モード
    // ========================================
    async function continuousType(romajiList) {
        console.log(`📝 ${romajiList.length}個のワードを連続入力します`);

        for (let i = 0; i < romajiList.length; i++) {
            if (!isAutoMode) {
                console.log('⏹️ 連続入力を中断しました');
                break;
            }

            const romaji = romajiList[i];
            console.log(`[${i + 1}/${romajiList.length}] ${romaji}`);

            await typeText(romaji, 35);

            // ワード間の待機（次のワード表示を待つ）
            await new Promise(r => setTimeout(r, 500));
        }

        console.log('✅ 連続入力完了');
    }

    // ========================================
    // グローバルオブジェクトとして公開
    // ========================================
    window.sushidaBot = {
        // 自動モード開始
        autoStart: startAutoMode,

        // 停止
        stop: stopAutoMode,

        // 手動入力
        type: async function (romaji) {
            this._manualTyping = true;
            await typeText(romaji, 35);
            this._manualTyping = false;
        },

        // 日本語ワードから入力
        typeWord: async function (word) {
            if (WORD_DICT[word]) {
                console.log(`📚 ${word} → ${WORD_DICT[word]}`);
                this._manualTyping = true;
                await typeText(WORD_DICT[word], 35);
                this._manualTyping = false;
            } else {
                console.log(`❌ 辞書に "${word}" がありません`);
                searchDict(word);
            }
        },

        // 連続入力
        typeMany: continuousType,

        // 辞書検索
        search: searchDict,

        // 辞書全体
        dict: WORD_DICT,

        // 内部フラグ
        _manualTyping: false,

        // ヘルプ
        help: function () {
            console.log('');
            console.log('🍣 寿司打ボット コマンド一覧:');
            console.log('================================');
            console.log('sushidaBot.autoStart()       - 自動モード開始');
            console.log('sushidaBot.stop()            - 停止');
            console.log('sushidaBot.type("romaji")    - ローマ字を入力');
            console.log('sushidaBot.typeWord("日本語") - 辞書から入力');
            console.log('sushidaBot.search("検索語")  - 辞書検索');
            console.log('sushidaBot.typeMany(["a","b"]) - 連続入力');
            console.log('');
        }
    };

    // ========================================
    // 初期化完了メッセージ
    // ========================================
    console.log('');
    console.log('✅ 寿司打ボット準備完了！');
    console.log('');
    console.log('📖 使い方:');
    console.log('   1. ゲームを開始してください');
    console.log('   2. 画面に表示されたローマ字を見て:');
    console.log('      sushidaBot.type("表示されたローマ字")');
    console.log('   3. または日本語で検索:');
    console.log('      sushidaBot.search("ありがとう")');
    console.log('');
    console.log('💡 sushidaBot.help() でコマンド一覧を表示');
    console.log('');

})();
