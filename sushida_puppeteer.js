/**
 * 寿司打 自動入力ボット（Puppeteer版）
 * 
 * 使い方:
 *   1. npm install puppeteer を実行
 *   2. node sushida_puppeteer.js を実行
 *   3. ブラウザが起動したら、手動でコースを選択してゲームを開始
 *   4. ゲーム中はキーボード入力を自動で行います
 * 
 * 注意: 画面に表示されるワードの自動認識は行いません。
 *       ローマ字入力例を見て手動でワードを指定するか、
 *       辞書から検索して入力します。
 */

const puppeteer = require('puppeteer');
const readline = require('readline');

// ワード辞書（日本語ワード → ローマ字入力）
const WORD_DICT = {
    "ああ言えばこう言う": "aaiebakouiu",
    "開いた口がふさがらない": "aitakutigafusagaranai",
    "愛に国境はない": "ainikokkyouhanai",
    "青い空、白い雲": "aoisora,siroikumo",
    "赤いチューリップ": "akaityu-rippu",
    "赤ちゃんから目が離せない": "akathankaramegahanasenai",
    "アカデミー賞受賞": "akademi-shoujushou",
    "あけましておめでとう": "akemasiteomedetou",
    "あこがれのセーラー服": "akogarenose-ra-fuku",
    "アサリのお味噌汁": "asarinoomisosiru",
    "足がしびれました": "asigasibiremasita",
    "あしたからダイエット": "asitakaradaietto",
    "あした天気になーれ": "asitatenkinina-re",
    "あしたはあしたの風が吹く": "asitahaasitanokazegafuku",
    "あすの天気予報は雨です": "asunotenkiyohou",
    "あせると間違えますよ": "aserutomatigaemasuyo",
    "新しい ゲームソフト": "atarasiige-musofuto",
    "アップルパイを焼きました": "appurupaiwoyakimasita",
    "あとは野となれ山となれ": "atohanotonareyamatonare",
    "アナゴ一本握り": "anagoippoxnnigiri",
    "あなたに一目ぼれ": "anatanihitomebore",
    "あの夕日に向かってダッシュだ": "anoyuuhinimukattedasshuda",
    "アプリケーションエラーです": "apurike-shoxnera-desu",
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
    "暗証番号": "anshoubangou",
    "いいニュースと悪いニュース": "iinyu-sutowaruinyu-su",
    "家に帰るまでが遠足": "ienikaerumadegaensoku",
    "いざ尋常に勝負": "izajinjounishoubu",
    "石の上にも三年": "isinouenimosaxnnexn",
    "伊勢海老食べ放題": "iseebitabehoudai",
    "イソップ物語": "isoppumonogatari",
    "痛いの痛いの飛んで行け": "itainoitainotondeike",
    "痛かったら右手を上げてください": "itakattaramigitewoagetekudasai",
    "イチゴショート ケーキ": "itigosho-toke-ki",
    "いつからそこにいたんですか？": "itukarasokoniitandesuka?",
    "一球入魂": "ikkyuunyuukoxn",
    "いつ見てもきれいだね": "itumitemokireidane",
    "犬は英語でドッグです": "inuhaeigodedoggudesu",
    "イヌも歩けば棒にあたる": "inumoarukebabouniataru",
    "犬用シャンプー": "inuyoushanpu-",
    "今何時ですか？": "imananjidesuka?",
    "今まで本当にお世話になりました": "imamadehontouniosewaninarimasita",
    "言われた通りにやったのに": "iwaretatooriniyattanoni",
    "インクジェットプリンター": "inkujettopurinta-",
    "インスピレーション": "insupire-shoxn",
    "インターナショナル": "inta-nashonaru",
    "インターネットの仕組み": "inta-nettonosikumi",
    "インテリアコーディネーター": "interiako-dhine-ta-",
    "ウイスキーをオンザロックで": "uisuki-woonzarokkude",
    "上から読んでも新聞紙": "uekarayondemosinbunsi",
    "ウクレレ教室": "ukurerekyousitu",
    "ウサギをモフモフする": "usagiwomofumofusuru",
    "嘘ついたら針千本飲ーます": "usotuitaraharisenboxnno-masu",
    "嘘つきは泥棒の始まり": "usotukihadorobounohajimari",
    "宇宙人に会いましたよ": "utyuujixnniaimasitayo",
    "宇宙船地球号": "utyuusentikyuugou",
    "美しい日本語": "utukusiinihongo",
    "馬の耳に念仏": "umanomimininenbutu",
    "生まれ変わった僕を見てください": "umarekawattabokuwomitekudasai",
    "運命なんて信じない": "unmeinantesinjinai",
    "運命の赤い糸": "unmeinoakaiito",
    "運も実力のうち": "unmojituryokunouti",
    "英会話教室": "eikaiwakyousitu",
    "英会話レッスン": "eikaiwaressuxn",
    "映画館で昼寝": "eigakandehirune",
    "エイリアンがやってきた": "eiriangayattekita",
    "液晶ディスプレイ": "ekishoudhisupurei",
    "エサを与えないで下さい": "eswoataenaidekudasai",
    "枝毛が増えて気になります": "edagegafuetekininarimasu",
    "エネルギー節約": "enerugi-setuyaku",
    "エビフライ定食": "ebifuraiteishoku",
    "エルニーニョ現象": "eruni-nyogenshou",
    "遠距離恋愛": "enkyorirexnai",
    "エンゼルフィッシュ": "enzerufisshu",
    "縁の下の力持ち": "exnnositanotikaramoti",
    "遠慮しないでたくさん食べてね": "enryosinaidetakusantabetene",
    "お遊びはここまでだ": "oasobihakokomadeda",
    "おいしいお肉が食べたいな": "oisiionikugatabetaina",
    "大食い選手権": "ooguisenshukexn",
    "大化けの可能性あり": "oobakenokanouseiari",
    "おかげ様で元気です": "okagesamadegenkidesu",
    "お気に入りに登録": "okiniirinitouroku",
    "お酒は大人になってから": "osakehaotonaninattekara",
    "おじいさんは山へ柴刈りに": "ojiisanhayamahesibakarini",
    "おしゃれなデザイン": "osharenadezaixn",
    "お醤油取って下さい": "oshouyutottekudasai",
    "お中元の季節": "otyuugexnnokisetu",
    "お疲れ様でした": "otukaresamadesita",
    "お手洗いはあちらです": "otearaihaatiradesu",
    "男ばっかり三兄弟": "otokobakkarisankyoudai",
    "お年玉ちょうだい": "otosidamatyoudai",
    "鬼の居ぬ間に洗濯": "oninoinumanisentaku",
    "鬼は外、福は内": "onihasoto,fukuhauti",
    "おばあさんは川へ洗濯に": "obaasanhakawahesentakuni",
    "主な登場人物": "omonatoujoujinbutu",
    "おやつは戸棚に入っています": "oyatuhatodananihaitteimasu",
    "お料理教室": "oryourikyousitu",
    "温泉に行きたいな": "onsexnniikitaina",
    "女心と秋の空": "oxnnagokorotoakinosora",
    "オンラインショッピング": "onrainshoppingu",
    "恩を仇で返す": "onwoadadekaesu",
    "ガーデニングが趣味です": "ga-deningugashumidesu",
    "飼い犬に手を咬まれる": "kaiinunitewokamareru",
    "海水浴でスイカ割り": "kaisuiyokudesuikawari",
    "懐中電灯": "kaityuudentou",
    "解答欄に記入してください": "kaitouraxnnikinyuusitekudasai",
    "海洋深層水": "kaiyousinsousui",
    "カエルの子はカエル": "kaerunokohakaeru",
    "カキ氷始めました": "kakigoorihajimemasita",
    "隠し味はお醤油": "kakusiajihaoshouyu",
    "隠れても無駄だ！": "kakuretemomudada!",
    "駆け込み乗車はおやめください": "kakekomijoushahaoyamekudasai",
    "傘でゴルフの練習": "kasadegorufunorenshuu",
    "貸切露天風呂": "kasikirirotenburo",
    "火星人襲来": "kaseijinshuurai",
    "学校給食": "gakkoukyuushoku",
    "学校の七不思議": "gakkounonanafusigi",
    "果肉入りオレンジジュース": "kanikuiriorenjiju-su",
    "カブトムシ対クワガタムシ": "kabutomusitaikuwagatamusi",
    "壁に耳あり障子に目あり": "kabenimimiarishoujinimeari",
    "亀の甲より年の功": "kamenokouyoritosinokou",
    "火曜日は定休日です": "kayoubihateikyuubidesu",
    "カラクリ人形": "karakuriningyou",
    "辛子明太子おにぎり": "karasimentaikoonigiri",
    "カリフォルニアロール": "kariforuniaro-ru",
    "カルシウムが足りない": "karusiumugatarinai",
    "カレーライスとハンバーグが好きです": "kare-raisutohanba-gugasukidesu",
    "可愛いチワワですね": "kawaiitiwawadesune",
    "変わった趣味をお持ちですね": "kawattashumiwoomotidesune",
    "関西国際空港": "kansaikokusaikuukou",
    "完全燃焼": "kanzexnnenshou",
    "感動的な再会": "kandoutekinasaikai",
    "カンヌ国際映画祭": "kaxnnukokusaieigasai",
    "頑張ってください": "ganbattekudasai",
    "観葉植物": "kaxnyoushokubutu",
    "記憶にございません": "kiokunigozaimasexn",
    "期待して損した": "kitaisitesonsita",
    "キツネとタヌキの化かし合い": "kitunetotanukinobakasiai",
    "昨日のことは覚えていません": "kinounokotohaoboeteimasexn",
    "昨日の敵は今日の友": "kinounotekihakyounotomo",
    "逆転サヨナラ満塁ホームラン": "gyakutensayonaramanruiho-muraxn",
    "キャビアはチョウザメの卵": "kyabiahatyouzamenotamago",
    "キャラメルポップコーン": "kyaramerupoppuko-xn",
    "キャンプファイヤー": "kyanpufaiya-",
    "キャンペーン実施中": "kyanpe-njissityuu",
    "究極の選択": "kyuukyokunosentaku",
    "給食当番": "kyuushokutoubaxn",
    "牛肉のカルパッチョ": "gyuunikunokarupattyo",
    "驚愕の事実": "kyougakunojijitu",
    "強制終了": "kyouseishuuryou",
    "今日のおすすめ品": "kyounoosusumehixn",
    "今日はいい天気ですね": "kyouhaiitenkidesune",
    "今日は楽しかったよ": "kyouhatanosikattayo",
    "行列の絶えない人気店": "gyouretunotaenaininkitexn",
    "きれいな花にはトゲがある": "kireinahananihatogegaaru",
    "キンキンに冷えたビール": "kinkixnnihietabi-ru",
    "禁断の魔術": "kindaxnnomajutu",
    "筋肉は裏切らない": "kixnnikuhauragiranai",
    "金の斧ですか銀の斧ですか": "kixnnoonodesukagixnnoonodesuka",
    "グアムとサイパンは近い": "guamutosaipanhatikai",
    "空気清浄機": "kuukiseijouki",
    "空中ブランコ": "kuutyuuburanko",
    "雲行きが怪しい": "kumoyukigaayasii",
    "クラシック音楽": "kurasikkuongaku",
    "グラフィックデザイナー": "gurafikkudezaina-",
    "クリスマスツリー点灯": "kurisumasuturi-tentou",
    "クリスマスパーティー": "kurisumasupa-thi-",
    "くるみ割り人形": "kurumiwariningyou",
    "経営コンサルタント": "keieikonsarutanto",
    "継続は力なり": "keizokuhatikaranari",
    "携帯の電源をお切り下さい": "keitainodengenwookirikudasai",
    "血液型占い": "ketuekigatauranai",
    "結婚おめでとう": "kekkoxnomedetou",
    "決定的瞬間": "ketteitekishunkaxn",
    "ゲルマン民族の大移動": "gerumanminzokunodaiidou",
    "後悔先に立たず": "koukaisakinitatazu",
    "合格発表": "goukakuhappyou",
    "高級チョコレート": "koukyuutyokore-to",
    "甲子園球場": "kousienkyuujou",
    "紅 茶専門店": "koutyasenmontexn",
    "交通ルールを守りましょう": "koutuuru-ruwomamorimashou",
    "コウモリは哺乳類です": "koumorihahonyuuruidesu",
    "コーヒー牛乳": "ko-hi-gyuunyuu",
    "コーヒーにミルク入れる？": "ko-hi-nimirukuireru?",
    "ご活躍をお祈りします": "gokatuyakuwooinorisimasu",
    "極秘プロジェクト始動": "gokuhipurojekutosidou",
    "国民健康保険": "kokuminkenkouhokexn",
    "ここからが本番です": "kokokaragahonbandesu",
    "ここだけの話ですが": "kokodakenohanasidesuga",
    "ここで会ったが百年目": "kokodeattagahyakunenme",
    "ここは俺が食い止める！": "kokohaoregakuitomeru!",
    "ここはどこ、私は誰": "kokohadoko,watasihadare",
    "ご自由にお持ち下さい": "gojiyuuniomotikudasai",
    "こたつから出られない": "kotatukaraderarenai",
    "こたつでみかんを食べる": "kotatudemikanwotaberu",
    "ごちそうさまでした": "gotisousamadesita",
    "言葉の魔術師": "kotobanomajutusi",
    "子供の頃からの夢でした": "kodomonokorokaranoyumedesita",
    "子猫の肉球": "konekononikukyuu",
    "コラーゲン配合": "kora-genhaigou",
    "ご利用は計画的に": "goriyouhakeikakutekini",
    "これは訓練ではない": "korehakunrendehanai",
    "これはペンですか？": "korehapendesuka?",
    "怖い話しようぜ": "kowaihanasisiyouze",
    "今週のベストセラー": "konshuunobesutosera-",
    "今度は大丈夫です": "kondohadaijoubudesu",
    "コンビニエンスストア": "konbiniensusutoa",
    "今夜はカレーライスよ": "koxnyahakare-raisuyo",
    "今夜はロールキャベツです": "koxnyaharo-rukyabetudesu",
    "読書感想文": "dokushokansoubuxn"
    // 残りの辞書エントリは省略（完全版は sushida_bot.js を参照）
};

// ローマ字 → 逆引き辞書を作成
const ROMAJI_TO_WORD = {};
for (const [word, romaji] of Object.entries(WORD_DICT)) {
    ROMAJI_TO_WORD[romaji] = word;
}

// 遅延関数
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ランダムな遅延（人間らしく）
const randomDelay = () => 50 + Math.random() * 50;

async function main() {
    console.log('🍣 寿司打 自動入力ボット（Puppeteer版）');
    console.log('========================================');

    // ブラウザを起動
    const browser = await puppeteer.launch({
        headless: false,  // ブラウザを表示
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = await browser.newPage();

    // 寿司打のページを開く
    console.log('📱 寿司打を開いています...');
    await page.goto('https://sushida.net/play.html', { waitUntil: 'networkidle2' });

    console.log('✅ ページを開きました');
    console.log('');
    console.log('📖 使い方:');
    console.log('  1. ゲーム画面でコースを選択してゲームを開始してください');
    console.log('  2. ターミナルにローマ字を入力すると自動でタイプします');
    console.log('  3. "quit" で終了');
    console.log('  4. "search キーワード" で辞書を検索');
    console.log('');

    // readline インターフェースをセットアップ
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const prompt = () => {
        rl.question('入力 > ', async (input) => {
            input = input.trim();

            if (input === 'quit' || input === 'exit') {
                console.log('👋 終了します');
                await browser.close();
                rl.close();
                process.exit(0);
            }

            if (input.startsWith('search ')) {
                const keyword = input.substring(7);
                console.log(`🔍 "${keyword}" を検索中...`);
                const results = Object.entries(WORD_DICT).filter(([k, v]) =>
                    k.includes(keyword) || v.includes(keyword)
                );
                if (results.length > 0) {
                    results.slice(0, 10).forEach(([k, v]) => {
                        console.log(`  ${k} → ${v}`);
                    });
                    if (results.length > 10) {
                        console.log(`  ... 他 ${results.length - 10} 件`);
                    }
                } else {
                    console.log('  見つかりませんでした');
                }
                prompt();
                return;
            }

            // 日本語ワードの場合は辞書から取得
            let romaji = input;
            if (WORD_DICT[input]) {
                romaji = WORD_DICT[input];
                console.log(`📚 辞書: ${input} → ${romaji}`);
            }

            // ローマ字を1文字ずつ入力
            console.log(`⌨️ 入力中: ${romaji}`);
            for (const char of romaji) {
                await page.keyboard.press(char);
                await sleep(randomDelay());
            }
            console.log('✅ 完了');

            prompt();
        });
    };

    prompt();
}

main().catch(console.error);
