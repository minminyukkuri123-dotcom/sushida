"""
寿司打 自動プレイボット（Python版）

使い方:
    1. pip install -r requirements.txt
    2. python sushida_bot.py
    3. ゲームを開始して、表示されたローマ字を入力

必要なパッケージ:
    - pyautogui: キーボード入力シミュレーション
    - selenium: ブラウザ自動化
    - pytesseract: OCR（オプション）
    - Pillow: 画像処理
"""

import pyautogui
import time
import random
import threading
from typing import Optional

# PyAutoGUIの設定
pyautogui.PAUSE = 0.01  # 各コマンド間の待機時間
pyautogui.FAILSAFE = True  # 画面左上隅にマウスを移動で緊急停止

# ========================================
# ワード辞書（日本語 → ローマ字）
# ========================================
WORD_DICT = {
    "ああ言えばこう言う": "aaiebakouiu",
    "開いた口がふさがらない": "aitakutigafusagaranai",
    "愛に国境はない": "ainikokkyouhanai",
    "青い空、白い雲": "aoisora,siroikumo",
    "赤いチューリップ": "akaityu-rippu",
    "アカデミー賞受賞": "akademi-shoujushou",
    "あけましておめでとう": "akemasiteomedetou",
    "アサリのお味噌汁": "asarinoomisosiru",
    "足がしびれました": "asigasibiremasita",
    "あしたからダイエット": "asitakaradaietto",
    "あした天気になーれ": "asitatenkinina-re",
    "あしたはあしたの風が吹く": "asitahaasitanokazegafuku",
    "あせると間違えますよ": "aserutomatigaemasuyo",
    "アップルパイを焼きました": "appurupaiwoyakimasita",
    "あとは野となれ山となれ": "atohanotonareyamatonare",
    "あなたに一目ぼれ": "anatanihitomebore",
    "甘いものは別腹": "amaimonohabetubara",
    "甘酸っぱい思い出": "amazuppaiomoide",
    "雨上がりの夜空": "ameagarinoyozora",
    "雨がやんだら虹が出た": "amegayandaranijigadeta",
    "アメリカンフットボール": "amerikanfuttobo-ru",
    "ありがとうございました": "arigatougozaimasita",
    "アリの巣の観察": "arinosunokansatu",
    "アルバイト募集中": "arubaitoboshuutyuu",
    "暗証番号": "anshoubangou",
    "いいニュースと悪いニュース": "iinyu-sutowaruinyu-su",
    "家に帰るまでが遠足": "ienikaerumadegaensoku",
    "いざ尋常に勝負": "izajinjounishoubu",
    "伊勢海老食べ放題": "iseebitabehoudai",
    "イソップ物語": "isoppumonogatari",
    "痛いの痛いの飛んで行け": "itainoitainotondeike",
    "一球入魂": "ikkyuunyuukon",
    "いつ見てもきれいだね": "itumitemokireidane",
    "犬は英語でドッグです": "inuhaeigodedoggudesu",
    "今何時ですか？": "imananjidesuka?",
    "今まで本当にお世話になりました": "imamadehontouniosewaninarimasita",
    "インターネットの仕組み": "inta-nettonosikumi",
    "ウサギをモフモフする": "usagiwomofumofusuru",
    "宇宙人に会いましたよ": "utyuujinniaimasitayo",
    "美しい日本語": "utukusiinihongo",
    "馬の耳に念仏": "umanomimininenbutu",
    "運命の赤い糸": "unmeinoakaiito",
    "英会話教室": "eikaiwakyousitu",
    "映画館で昼寝": "eigakandehirune",
    "エビフライ定食": "ebifuraiteishoku",
    "遠距離恋愛": "enkyorirenai",
    "お遊びはここまでだ": "oasobihakokomadeda",
    "おいしいお肉が食べたいな": "oisiionikugatabetaina",
    "大食い選手権": "ooguisenshuken",
    "おかげ様で元気です": "okagesamadegenkidesu",
    "お気に入りに登録": "okiniirinitouroku",
    "お酒は大人になってから": "osakehaotonaninattekara",
    "お疲れ様でした": "otukaresamadesita",
    "男ばっかり三兄弟": "otokobakkarisankyoudai",
    "鬼は外、福は内": "onihasoto,fukuhauti",
    "お料理教室": "oryourikyousitu",
    "温泉に行きたいな": "onsennikitaina",
    "オンラインショッピング": "onrainshoppingu",
    "頑張ってください": "ganbattekudasai",
    "今日はいい天気ですね": "kyouhaiitenkidesune",
    "今日は楽しかったよ": "kyouhatanosikattayo",
    "空気清浄機": "kuukiseijouki",
    "クラシック音楽": "kurasikkuongaku",
    "クリスマスパーティー": "kurisumasupa-thi-",
    "継続は力なり": "keizokuhatikaranari",
    "結婚おめでとう": "kekkonomedetou",
    "後悔先に立たず": "koukaisakinitatazu",
    "高級チョコレート": "koukyuutyokore-to",
    "コーヒー牛乳": "ko-hi-gyuunyuu",
    "ここからが本番です": "kokokaragahonbandesu",
    "ここだけの話ですが": "kokodakenohanasidesuga",
    "こたつから出られない": "kotatukaraderarenai",
    "ごちそうさまでした": "gotisousamadesita",
    "子供の頃からの夢でした": "kodomonokorokaranoyumedesita",
    "これはペンですか？": "korehapendesuka?",
    "今週のベストセラー": "konshuunobesutosera-",
    "今度は大丈夫です": "kondohadaijoubudesu",
    "サービス残業": "sa-bisuzangyou",
    "最高の雪景色": "saikounoyukigesiki",
    "砂糖と塩を間違えた": "satoutosioomatigaeta",
    "寒い日が続いています": "samuihigatuduiteimasu",
    "シェフの気まぐれサラダ": "shefunokimaguresarada",
    "自己紹介をしてください": "jikoshoukaiwositekudasai",
    "宿題を忘れました": "shukudaiwowasuremasita",
    "少年よ大志を抱け": "shounenyotaisiwoidake",
    "食後のコーヒー": "shokugonoko-hi-",
    "白いご飯が食べたい": "siroigohangatabetai",
    "新入社員": "shinnyuushain",
    "心理学を専攻する": "sinrigakuwosenkousuru",
    "スイーツ食べ放題": "sui-tutabehoudai",
    "睡魔には勝てなかった": "suimanihakatenakatta",
    "ストレス解消": "sutoresukaishou",
    "世界一周旅行": "sekaiisshuuryokou",
    "絶体絶命の大ピンチ": "zettaizetumeinodaipinti",
    "全力を尽くします": "zenryokuwotukusimasu",
    "そこをまっすぐ行ってください": "sokowomassuguittekudasai",
    "卒業文集": "sotugyoubunshuu",
    "そろそろ心が折れそうです": "sorosorokokorogaoresoudesu",
    "大切な書類": "taisetunashorui",
    "台風接近中": "taifuusekkintyuu",
    "太陽系第三惑星地球": "taiyoukeidaisanwakuseitikyuu",
    "ダウンロードを開始します": "daunro-dowokaisisimasu",
    "ただ今準備中です": "tadaimajunbityuudesu",
    "脱出成功！": "dasshutsuseikou!",
    "立つ鳥跡を濁さず": "tatutoriatowonigosazu",
    "食べたら歯を磨こうね": "tabetarahawomigakoune",
    "だるまさんが転んだ": "darumasangakoronda",
    "誕生日おめでとう": "tanjoubiomedetou",
    "誕生日プレゼント": "tanjoubipurezento",
    "地球は青かった": "tikyuuhaaokatta",
    "チャレンジ精神": "tyarenjiseishin",
    "ちょっと待ってください": "tyottomattekudasai",
    "月がきれいですね": "tukigakireidesune",
    "低気圧が発達中": "teikiatugahattatutyuu",
    "電気を大切に": "denkiwotaisetuni",
    "伝説の勇者": "densetunoyuusha",
    "トイレはどこですか？": "toirehadokodesuka?",
    "東京と京都": "toukyoutokyouto",
    "どうしても思い出せない": "dousitemoomoidasenai",
    "読書感想文": "dokushokansoubun",
    "時計が壊れたんです": "tokeigakowaretandesu",
    "隣の客はよく柿食う客だ": "tonarinokyakuhayokukakikuukyakuda",
    "ドラマチックな出会い": "doramatikkunadeai",
    "とりあえずビールちょうだい": "toriaezubi-rutyoudai",
    "長い夜になりそうです": "nagaiyoruninarisoudesu",
    "仲良しこよしのお友達": "nakayosikoyosinootomodati",
    "夏休みの宿題終わった？": "natuyasuminoshukudaiowatta?",
    "何だか嫌な予感がする": "nandakaiyanayokangasuru",
    "日本の首都は東京": "nihonnoshutohatoukyou",
    "庭には二羽にわとりがいる": "niwanihaniwaniwatorigairu",
    "猫の手も借りたいです": "nekonotemokaritaidesu",
    "熱帯雨林気候": "nettaiurinkikou",
    "布団から出られない": "futonkaraderarenai",
    "冬将軍の到来": "fuyushogunnnotourai",
    "プログラミング言語": "puroguramingugengo",
    "プロフェッショナル": "purofesshonaru",
    "平均寿命": "heikinjumyou",
    "北海道直送": "hokkaidoutyokusou",
    "本当にあった怖い話": "hontouniattakowaihanasi",
    "迷子のご案内": "maigonogoannai",
    "見つかってしまった": "mitukattesimatta",
    "身分証明書": "mibunshoumeisho",
    "無人島生活": "mujintouseikatu",
    "メールアドレスを間違えた": "me-ruadoresuwomatigaeta",
    "もう一度やり直そう": "mouitidoyarinaosou",
    "もう少し待ってください": "mousukosimattekudasai",
    "桃がドンブラコと流れてきました": "momogadonburakotonagaretekimasita",
    "盛り上がってまいりました": "moriagattemairimasita",
    "やっぱりやめておけばよかった": "yappariyameteokebayokatta",
    "遊園地でデート": "yuuentidede-to",
    "有給休暇": "yuukyuukyuuka",
    "優勝おめでとう！": "yuushouomedetou!",
    "よろしくお願いします": "yorosikuonegaisimasu",
    "来年のカレンダー": "rainennnokarenda-",
    "料理は愛情": "ryourihaaijou",
    "ルールを守りましょう": "ru-ruwomamorimashou",
    "冷蔵庫のプリン知らない？": "reizoukonopurinsiranai?",
    "廊下を走らない": "roukawohasiranai",
    "労働基準法": "roudoukijunhou",
    "ログインしてください": "roguinsitekudasai",
    "分かった人は手を挙げて": "wakattahitohatewoagete"
}


class SushidaBot:
    """寿司打自動入力ボット"""
    
    def __init__(self):
        self.is_running = False
        self.type_delay_min = 0.03  # 最小入力間隔（秒）
        self.type_delay_max = 0.06  # 最大入力間隔（秒）
        
    def _get_random_delay(self) -> float:
        """ランダムな遅延時間を取得"""
        return random.uniform(self.type_delay_min, self.type_delay_max)
    
    def type_text(self, text: str, instant: bool = False) -> None:
        """
        テキストをキーボード入力する
        
        Args:
            text: 入力するテキスト（ローマ字）
            instant: Trueの場合、遅延なしで即座に入力
        """
        print(f"⌨️  入力中: {text}")
        
        for char in text:
            if not self.is_running and not instant:
                print("⏹️  入力が中断されました")
                return
                
            pyautogui.press(char)
            
            if not instant:
                time.sleep(self._get_random_delay())
        
        print("✅ 完了")
    
    def type_word(self, japanese_word: str) -> bool:
        """
        日本語ワードを辞書から検索して入力
        
        Args:
            japanese_word: 日本語のワード
            
        Returns:
            成功した場合True、辞書にない場合False
        """
        if japanese_word in WORD_DICT:
            romaji = WORD_DICT[japanese_word]
            print(f"📚 辞書: {japanese_word} → {romaji}")
            self.type_text(romaji)
            return True
        else:
            print(f"❌ 辞書に「{japanese_word}」がありません")
            self.search(japanese_word)
            return False
    
    def search(self, keyword: str) -> list:
        """
        辞書を検索
        
        Args:
            keyword: 検索キーワード
            
        Returns:
            マッチした (日本語, ローマ字) のリスト
        """
        results = [
            (word, romaji) for word, romaji in WORD_DICT.items()
            if keyword in word or keyword in romaji
        ]
        
        if not results:
            print(f"🔍 「{keyword}」に一致する単語が見つかりません")
            return []
        
        print(f"🔍 「{keyword}」の検索結果:")
        for word, romaji in results[:15]:
            print(f"   {word} → {romaji}")
        
        if len(results) > 15:
            print(f"   ... 他 {len(results) - 15} 件")
        
        return results
    
    def start(self) -> None:
        """自動モードを開始"""
        self.is_running = True
        print("🚀 自動モードを開始しました")
        print("💡 停止するには stop() を呼び出してください")
    
    def stop(self) -> None:
        """自動モードを停止"""
        self.is_running = False
        print("⏹️  自動モードを停止しました")
    
    def type_many(self, romaji_list: list, delay_between: float = 0.5) -> None:
        """
        複数のローマ字を連続入力
        
        Args:
            romaji_list: ローマ字のリスト
            delay_between: ワード間の待機時間（秒）
        """
        self.start()
        
        print(f"📝 {len(romaji_list)}個のワードを連続入力します")
        
        for i, romaji in enumerate(romaji_list):
            if not self.is_running:
                print("⏹️  連続入力が中断されました")
                break
            
            print(f"[{i + 1}/{len(romaji_list)}]", end=" ")
            self.type_text(romaji)
            time.sleep(delay_between)
        
        self.stop()
        print("✅ 連続入力完了")


def interactive_mode():
    """対話モード"""
    bot = SushidaBot()
    
    print()
    print("🍣 寿司打 自動プレイボット（Python版）")
    print("=" * 50)
    print()
    print("コマンド:")
    print("  入力したいローマ字を直接入力してEnter")
    print("  search <キーワード>  - 辞書検索")
    print("  word <日本語>        - 辞書からローマ字を取得して入力")
    print("  delay <秒>           - 入力速度を変更（例: delay 0.05）")
    print("  quit                 - 終了")
    print()
    print("💡 先に寿司打のゲーム画面をアクティブにしてください！")
    print("   入力開始まで3秒間の猶予があります。")
    print()
    
    while True:
        try:
            user_input = input("入力 > ").strip()
            
            if not user_input:
                continue
            
            if user_input.lower() == "quit":
                print("👋 終了します")
                break
            
            if user_input.lower().startswith("search "):
                keyword = user_input[7:]
                bot.search(keyword)
                continue
            
            if user_input.lower().startswith("word "):
                word = user_input[5:]
                print("⏳ 3秒後に入力開始...")
                time.sleep(3)
                bot.type_word(word)
                continue
            
            if user_input.lower().startswith("delay "):
                try:
                    delay = float(user_input[6:])
                    bot.type_delay_min = delay
                    bot.type_delay_max = delay * 1.5
                    print(f"⏱️  入力速度を {delay}秒 に変更しました")
                except ValueError:
                    print("❌ 無効な値です")
                continue
            
            # ローマ字として入力
            print("⏳ 3秒後に入力開始... 寿司打の画面をクリックしてください！")
            time.sleep(3)
            bot.start()
            bot.type_text(user_input)
            bot.stop()
            
        except KeyboardInterrupt:
            print("\n👋 終了します")
            break


if __name__ == "__main__":
    interactive_mode()
