import type { LocaleCode } from "./types";
import { legalLabelsFor, type LegalPageLabels } from "./legalLabels";

export type LegalPageKind = "privacy" | "terms";

export interface LegalSection {
  title: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
}

export interface LegalDocument {
  eyebrow: string;
  title: string;
  intro: string;
  updatedLabel: string;
  sections: readonly LegalSection[];
}

export interface LegalPageCopy extends LegalPageLabels {
  privacy: LegalDocument;
  terms: LegalDocument;
}

const PRIVACY_UPDATED_AT = "2026-08-20";
const TERMS_UPDATED_AT = "2026-07-18";

const LEGAL_COPY = {
  "zh-Hant": {
    ...legalLabelsFor("zh-Hant"),
    privacy: {
      eyebrow: "法律與隱私",
      title: "隱私政策",
      intro:
        "Jabiko 以免註冊即可使用為原則。這份政策說明資料會留在哪裡、登入同步與回報功能會送出什麼，以及你可以如何處理自己的資料。",
      updatedLabel: `最後更新：${PRIVACY_UPDATED_AT}`,
      sections: [
        {
          title: "1. 未登入時儲存在瀏覽器的資料",
          paragraphs: [
            "練習紀錄、作答內容、正誤、作答時間、收藏，以及語言、主題、注音、語速、目標級別等偏好，主要儲存在你目前瀏覽器的 localStorage。這些資料不會因為單純使用網站就自動變成 Jabiko 帳號資料。",
            "你可以透過瀏覽器的網站資料設定清除本機資料。清除瀏覽器資料、使用無痕模式或更換裝置，可能讓未同步的進度永久消失。"
          ]
        },
        {
          title: "2. Google 登入與跨裝置同步",
          paragraphs: [
            "登入是選用功能，由 Google OAuth 與 Supabase Auth 處理。登入時，Jabiko 會取得帳號識別碼，以及 Google 提供的基本帳號資訊，例如名稱與電子郵件地址。",
            "登入後，練習紀錄會同步到 Supabase。同步資料可能包含題目識別碼、單字識別碼、作答目標形式、題目提示、預期答案、你送出的答案、正誤、時間戳與作答時間，目的是讓進度可以在不同裝置合併與延續。每位使用者只能透過公開 API 讀取或寫入自己的練習紀錄。"
          ]
        },
        {
          title: "3. 使用分析",
          paragraphs: [
            "正式環境可能透過 Cloudflare Zaraz 收集粗略的使用事件，例如開啟哪個功能、練習模式、JLPT 級別、介面語言、是否答對、完成題數、文法頁識別碼或文章代稱。這些事件用來了解功能是否真的被使用。當分析啟用時，選定的淨化後使用事件（例如促銷外連互動）可能透過 Cloudflare Zaraz 轉交 Google Analytics，用於彙總使用分析。",
            "Jabiko 的自訂分析事件不傳送題目全文、你輸入的答案、電子郵件、Supabase 使用者 ID、文章正文、查詢字串或自由輸入文字。促銷外連互動僅傳送促銷識別碼、動作類型、版面位置與介面語言，不代表測量或追蹤 Airbnb 訂房轉換。Cloudflare 等基礎設施供應商仍可能為傳輸、安全與防濫用處理 IP 位址、裝置或請求資訊，並依其自身政策處理。"
          ]
        },
        {
          title: "4. 廣告與同意",
          paragraphs: [
            "Google AdSense 廣告基礎目前未啟用。停用、設定不完整、版位政策資格未確認或必要同意訊號缺少時，Jabiko 不會載入 AdSense 程式或送出廣告請求，也不會保留空白廣告版位。",
            "若日後完成帳號與版位核准並啟用，Google 與其廣告技術合作夥伴可能為廣告投放、個人化與成效衡量使用廣告 Cookie 或其他本機儲存，並處理 IP 位址、裝置、瀏覽器、廣告互動及相關個人資料。需要同意的流量會由 Google 認證且支援 IAB TCF 的同意管理平台處理；廣告同意獨立於選用的登入、學習進度儲存與 Zaraz 分析。Jabiko 不會要求觀看或點擊廣告才能繼續學習。"
          ]
        },
        {
          title: "5. 意見回饋與題目回報",
          paragraphs: [
            "送出一般回饋時，會保存類別、訊息、是否希望回覆，以及你自行填寫的聯絡方式。題目回報還會包含回報原因、題目 ID、題型標籤、作答目標形式、級別、單字表記、題目提示、預期答案、你所選的答案、介面語言，以及你自行填寫的補充說明，方便定位問題；若勾選希望回覆，也會保存你填寫的聯絡方式。",
            "若你已登入，Supabase 會在伺服器端記錄帳號 ID、電子郵件與登入提供者；匿名使用者則不會有這些帳號欄位。回報資料不會透過網站公開讀取。請不要在自由輸入欄位提供不必要的敏感資料。"
          ]
        },
        {
          title: "6. 外部服務",
          items: [
            "Cloudflare：網站傳遞、安全與選用的 Zaraz 分析。",
            "Google Analytics：分析啟用時，作為彙總使用分析的接收方。",
            "Google AdSense：只有在廣告另行通過帳號、政策、設定與同意閘門並啟用後，才會作為廣告供應商。",
            "Supabase：Google 登入、登入狀態、練習同步與回報資料庫。",
            "Google：你主動選擇 Google 登入時的身分驗證。",
            "ECPay 與其他外部連結：只有在你主動點擊後才會前往第三方網站；付款資料不會由 Jabiko 前端保存。"
          ]
        },
        {
          title: "7. 保存、刪除與聯絡",
          paragraphs: [
            "本機資料會保留到你清除瀏覽器網站資料為止。遠端練習紀錄與回報會保留到完成其同步、維護、回覆或問題追蹤用途，或由你提出刪除要求為止。",
            "目前尚未提供自助匯出介面。若要匯出或刪除其他與帳號相關的資料，請先登入相同帳號，再使用網站的「回饋」功能並勾選希望回覆；請勿在公開 GitHub issue 張貼個人資料。Jabiko 不會出售個人資料。"
          ]
        },
        {
          title: "8. 刪除已同步的練習紀錄",
          paragraphs: [
            "已登入的使用者可以由帳號區自助刪除該帳號已同步的練習作答紀錄。刪除成功時，也會清除目前裝置的練習紀錄、弱點與複習進度。",
            "此操作不會刪除登入帳號、收藏、語言與外觀設定。刪除不可復原；若刪除失敗，請重試，且不得宣稱資料已刪除。"
          ]
        },
        {
          title: "9. 政策變更",
          paragraphs: [
            "功能或資料處理方式有實質改變時，這份政策會同步更新日期與內容。若變更會明顯影響使用者權益，會以網站上的適當方式提醒。"
          ]
        }
      ]
    },
    terms: {
      eyebrow: "法律與隱私",
      title: "使用條款",
      intro:
        "Jabiko 是一項免費的日文學習輔助服務。以下條款用白話說明服務範圍、內容責任與使用限制。",
      updatedLabel: `最後更新：${TERMS_UPDATED_AT}`,
      sections: [
        {
          title: "1. 服務性質",
          paragraphs: [
            "Jabiko 提供日文文法、詞彙、漢字、題型練習、文章與學習進度工具。服務不隸屬於日本國際交流基金會、日本國際教育支援協會或 JLPT 官方，也不保證考試成績、合格或內容永遠沒有錯誤。"
          ]
        },
        {
          title: "2. 合理使用",
          items: [
            "不得以自動化請求、攻擊、繞過安全控制或其他方式干擾網站與其他使用者。",
            "不得利用回饋欄位傳送違法、侵害他人權利、惡意或大量垃圾內容。",
            "發現題目或解說有問題時，請使用回報功能；Jabiko 可依判斷修正、保留或移除內容。"
          ]
        },
        {
          title: "3. 程式碼、內容與品牌",
          paragraphs: [
            "程式碼可以在公開儲存庫中被查看，不代表已授權複製、修改、再散布或商業使用。除非特定檔案另有明確授權，Jabiko 的程式碼、原創文章、題庫、名稱、吉祥物與視覺素材均保留權利。",
            "日文語言本身、一般事實與你依法可使用的內容不受這段額外限制；第三方商標、作品名稱與外部內容仍屬各權利人。"
          ]
        },
        {
          title: "4. 外部服務與贊助連結",
          paragraphs: [
            "網站可能連到 Google、ECPay、GitHub 或其他第三方服務。第三方網站的內容、交易、隱私與可用性由該服務負責。贊助屬自願支持，並非購買考試成績，也不保證功能永久提供。"
          ]
        },
        {
          title: "5. 服務變更與可用性",
          paragraphs: [
            "Jabiko 可能新增、修改、暫停或移除功能與內容，也可能因維護、供應商故障或不可控制的原因暫時無法使用。會盡力維持服務與資料安全，但不保證完全不中斷或資料永不遺失；重要學習紀錄請自行保留必要備份。"
          ]
        },
        {
          title: "6. 責任限制與聯絡",
          paragraphs: [
            "在法律允許的範圍內，Jabiko 不對因使用或無法使用本服務、依賴學習內容、第三方服務或資料遺失所造成的間接損失負責。這不排除依法不能排除的責任。",
            "對條款、隱私或內容有疑問，可以使用網站的「回饋」功能聯絡。"
          ]
        }
      ]
    }
  },
  ja: {
    ...legalLabelsFor("ja"),
    privacy: {
      eyebrow: "法的情報・プライバシー",
      title: "プライバシーポリシー",
      intro:
        "Jabiko は、登録しなくても使えることを基本としています。本ポリシーでは、ブラウザ内に残る情報、ログイン同期やフィードバックで送信される情報、その管理方法を説明します。",
      updatedLabel: `最終更新：${PRIVACY_UPDATED_AT}`,
      sections: [
        {
          title: "1. ログイン前にブラウザへ保存される情報",
          paragraphs: [
            "練習履歴、回答、正誤、回答時間、ブックマーク、言語・テーマ・ふりがな・読み上げ速度・目標レベルなどの設定は、主に現在のブラウザの localStorage に保存されます。閲覧しただけで Jabiko のアカウント情報になることはありません。",
            "ブラウザのサイトデータ設定から削除できます。サイトデータの削除、シークレットモードの利用、端末変更により、同期していない進捗が失われる場合があります。"
          ]
        },
        {
          title: "2. Google ログインと端末間同期",
          paragraphs: [
            "ログインは任意で、Google OAuth と Supabase Auth を利用します。ログイン時にはアカウント識別子と、Google が提供する氏名・メールアドレスなどの基本情報を扱います。",
            "ログイン後の練習履歴は Supabase に同期されます。同期情報には問題 ID、語彙 ID、解答対象の形式、問題の提示文、想定解、送信した回答、正誤、日時、回答時間が含まれる場合があります。公開 API では、各利用者は自分の履歴だけを読み書きできます。"
          ]
        },
        {
          title: "3. 利用状況分析",
          paragraphs: [
            "本番環境では Cloudflare Zaraz を通じ、利用した機能、練習モード、JLPT レベル、表示言語、正誤、完了数、文法ページ ID、記事スラッグなどの大まかなイベントを収集する場合があります。分析が有効な場合、選定した浄化済みの利用イベント（プロモーションの外部リンクの操作など）は Cloudflare Zaraz を経由して Google Analytics に転送され、集計的な利用分析に使われることがあります。",
            "Jabiko 独自の分析イベントには、問題全文、入力した回答、メールアドレス、Supabase のユーザー ID、記事本文、クエリ文字列、自由入力文を含めません。プロモーションの外部リンクの操作では、プロモーション ID、操作の種類、掲載位置、表示言語のみを送信し、Airbnb の予約転換を測定・追跡するものではありません。ただし Cloudflare などの基盤事業者は、通信・安全対策・不正防止のため IP アドレスや端末・リクエスト情報を処理する場合があります。"
          ]
        },
        {
          title: "4. 広告と同意",
          paragraphs: [
            "Google AdSense の広告基盤は現在は有効化されていません。無効、設定不足、掲載面のポリシー適格性が未確認、または必要な同意シグナルがない場合、Jabiko は AdSense のスクリプトを読み込まず、広告リクエストを送信せず、空の広告枠も残しません。",
            "将来、アカウントと掲載面の承認を得て有効化した場合、Google と広告技術パートナーは広告配信・パーソナライズ・効果測定のため、広告 Cookie その他のローカルストレージを使用し、IP アドレス、端末、ブラウザ、広告操作その他の個人データを処理する場合があります。同意が必要なトラフィックは、Google 認定かつ IAB TCF 対応の同意管理プラットフォームで扱います。広告の同意は任意のログインとは別であり、学習進捗の保存や Zaraz 分析からも分離して扱われます。学習の継続に広告の閲覧やクリックを求めることはありません。"
          ]
        },
        {
          title: "5. フィードバックと問題報告",
          paragraphs: [
            "一般のフィードバックでは、種別、本文、返信希望の有無、任意で入力した連絡先を保存します。問題報告には、報告理由、問題 ID、問題形式のラベル、解答対象の形式、レベル、語彙の表記、問題の提示文、想定解、選択した回答、表示言語、任意の補足説明も含まれます。返信を希望した場合は、入力した連絡先も保存されます。",
            "ログイン中は、Supabase がサーバー側でアカウント ID、メールアドレス、ログイン事業者を記録します。匿名時はこれらの欄は空です。報告内容はサイトの公開 API から閲覧できません。不要な機微情報は入力しないでください。"
          ]
        },
        {
          title: "6. 外部サービス",
          items: [
            "Cloudflare：サイト配信、安全対策、任意の Zaraz 分析。",
            "Google Analytics：分析が有効な場合の集計的な利用分析の受信者。",
            "Google AdSense：アカウント、ポリシー、設定、同意の各条件を別途満たして有効化した場合のみ利用する広告事業者。",
            "Supabase：Google ログイン、セッション、練習同期、フィードバック保存。",
            "Google：利用者が Google ログインを選んだ場合の認証。",
            "ECPay その他の外部リンク：利用者がリンクを開いた後は第三者のサービスとなり、Jabiko のフロントエンドは決済情報を保存しません。"
          ]
        },
        {
          title: "7. 保存、削除、問い合わせ",
          paragraphs: [
            "ローカル情報はブラウザのサイトデータを削除するまで残ります。同期履歴とフィードバックは、同期・保守・返信・問題追跡に必要な期間、または削除依頼を受けるまで保持します。",
            "現時点では自己操作によるエクスポート画面はありません。エクスポートを希望する場合や、その他のアカウント関連情報の削除を希望する場合は、同じアカウントでログインし、サイトの「フィードバック」で返信希望を選んでください。公開 GitHub issue に個人情報を書かないでください。個人情報を販売することはありません。"
          ]
        },
        {
          title: "8. 同期した練習履歴の削除",
          paragraphs: [
            "ログイン中の利用者は、アカウント領域からこのアカウントに同期した練習の回答記録を自分で削除できます。削除に成功すると、この端末の練習記録・弱点・復習の進捗も消去されます。",
            "この操作では、アカウント・お気に入り・言語・表示設定は削除されません。削除は元に戻せません。削除に失敗した場合は、もう一度お試しください。データが削除されたと判断しないでください。"
          ]
        },
        {
          title: "9. ポリシーの変更",
          paragraphs: [
            "機能や情報の取扱いに実質的な変更がある場合、本ポリシーの内容と更新日を変更します。利用者への影響が大きい場合は、サイト上で適切にお知らせします。"
          ]
        }
      ]
    },
    terms: {
      eyebrow: "法的情報・プライバシー",
      title: "利用規約",
      intro:
        "Jabiko は無料の日本語学習補助サービスです。以下では、サービスの範囲、コンテンツに関する責任、利用上の制限を簡潔に説明します。",
      updatedLabel: `最終更新：${TERMS_UPDATED_AT}`,
      sections: [
        {
          title: "1. サービスの性質",
          paragraphs: [
            "Jabiko は文法、語彙、漢字、問題形式の練習、記事、学習進捗ツールを提供します。国際交流基金、日本国際教育支援協会、JLPT 公式とは関係がなく、試験結果や合格、内容の完全な正確性を保証しません。"
          ]
        },
        {
          title: "2. 適切な利用",
          items: [
            "自動化された過剰なリクエスト、攻撃、安全対策の回避など、サイトや他の利用者を妨害する行為は禁止します。",
            "フィードバック欄を使って、違法な内容、権利侵害、悪意ある内容、大量の迷惑投稿を送信しないでください。",
            "問題や解説の誤りは報告機能からお知らせください。Jabiko は判断により内容を修正、維持、削除できます。"
          ]
        },
        {
          title: "3. ソースコード、コンテンツ、ブランド",
          paragraphs: [
            "ソースコードが公開リポジトリで閲覧できても、複製、改変、再配布、商用利用が許可されたことにはなりません。個別ファイルに明示的なライセンスがない限り、Jabiko のコード、オリジナル記事、問題データ、名称、マスコット、視覚素材の権利は留保されます。",
            "日本語そのもの、一般的事実、法令上利用可能な内容を追加で制限するものではありません。第三者の商標、作品名、外部コンテンツの権利は各権利者に帰属します。"
          ]
        },
        {
          title: "4. 外部サービスと支援リンク",
          paragraphs: [
            "Google、ECPay、GitHub などの第三者サイトへリンクする場合があります。第三者サイトの内容、取引、プライバシー、可用性は各事業者が管理します。支援は任意であり、試験結果やサービスの恒久提供を購入するものではありません。"
          ]
        },
        {
          title: "5. 変更と可用性",
          paragraphs: [
            "機能やコンテンツを追加、変更、停止、削除する場合があります。保守、外部事業者の障害、その他管理できない事情により一時的に利用できないこともあります。安全と継続に努めますが、中断なく利用できることやデータの完全な保持は保証しません。必要な学習記録は利用者自身でも保管してください。"
          ]
        },
        {
          title: "6. 責任の制限と問い合わせ",
          paragraphs: [
            "法令で認められる範囲で、本サービスの利用・利用不能、学習内容への依存、第三者サービス、データ消失から生じた間接損害について責任を負いません。法令上排除できない責任を除外するものではありません。",
            "規約、プライバシー、コンテンツに関する質問は、サイトの「ご意見・ご感想」からお送りください。"
          ]
        }
      ]
    }
  },
  en: {
    ...legalLabelsFor("en"),
    privacy: {
      eyebrow: "Legal and privacy",
      title: "Privacy Policy",
      intro:
        "Jabiko is designed to work without registration. This policy explains what stays in your browser, what is sent when you use sign-in, sync, analytics, or feedback, and how you can manage that data.",
      updatedLabel: `Last updated: ${PRIVACY_UPDATED_AT}`,
      sections: [
        {
          title: "1. Data stored in your browser before sign-in",
          paragraphs: [
            "Practice history, submitted answers, correctness, response time, bookmarks, and preferences such as language, theme, furigana, speech rate, and target level are stored mainly in localStorage in your current browser. Simply using the site does not automatically turn this data into Jabiko account data.",
            "You can remove local data through your browser's site-data settings. Clearing browser data, using private browsing, or changing devices may permanently remove progress that has not been synced."
          ]
        },
        {
          title: "2. Google sign-in and cross-device sync",
          paragraphs: [
            "Sign-in is optional and is handled by Google OAuth and Supabase Auth. When you sign in, Jabiko handles an account identifier and basic profile information provided by Google, such as your name and email address.",
            "After sign-in, practice history is synced to Supabase. Synced records may include question and vocabulary IDs, target forms, prompts, expected answers, your submitted answer, correctness, timestamps, and response time. Public API access is restricted so each user can read or write only their own practice records."
          ]
        },
        {
          title: "3. Usage analytics",
          paragraphs: [
            "The production site may use Cloudflare Zaraz to collect coarse events such as the feature opened, practice mode, JLPT level, interface language, correctness, completion counts, grammar-page identifiers, or article slugs. These events help us understand whether features are being used. When analytics is enabled, selected sanitized usage events (such as promotion outbound interactions) may be routed through Cloudflare Zaraz to Google Analytics for aggregate usage analysis.",
            "Jabiko's custom analytics events do not send full question text, your submitted answer, email address, Supabase user ID, article body, query string, or free-form input. A promotion outbound interaction carries only the promotion identifier, action, placement, and interface language; it does not measure or track Airbnb booking conversion. Infrastructure providers such as Cloudflare may still process IP addresses, device details, or request information for delivery, security, and abuse prevention under their own policies."
          ]
        },
        {
          title: "4. Advertising and consent",
          paragraphs: [
            "The Google AdSense foundation is currently disabled. When it is disabled, incompletely configured, not confirmed policy-eligible, or missing a required consent signal, Jabiko does not load the AdSense script, send an ad request, or leave an empty ad slot.",
            "If an approved account and placement are enabled in the future, Google and its advertising technology partners may use advertising cookies or other local storage and process IP address, device, browser, ad-interaction, and related personal data for ad delivery, personalization, and measurement. Traffic that requires consent will be handled through a Google-certified, IAB TCF-integrated consent management platform. Advertising consent is separate from optional sign-in, learning-progress storage, and Zaraz analytics. Jabiko never requires an ad view or click to continue learning."
          ]
        },
        {
          title: "5. Feedback and question reports",
          paragraphs: [
            "General feedback stores its category, message, whether you requested a reply, and any contact detail you enter. A question report also includes its reason, question ID, question-type label, target form, level, surface form, prompt, expected answers, selected answer, interface language, and any optional detail you provide so the issue can be located; if you request a reply, the contact detail you enter is stored as well.",
            "If you are signed in, Supabase records your account ID, email, and sign-in provider on the server. Those fields remain empty for anonymous submissions. Reports are not readable through the site's public API. Do not include unnecessary sensitive information in free-form fields."
          ]
        },
        {
          title: "6. External services",
          items: [
            "Cloudflare: site delivery, security, and optional Zaraz analytics.",
            "Google Analytics: recipient of aggregate usage analysis when analytics is enabled.",
            "Google AdSense: advertising provider only if separate account, policy, configuration, and consent gates are completed and enabled.",
            "Supabase: Google sign-in, sessions, practice sync, and feedback storage.",
            "Google: authentication when you choose Google sign-in.",
            "ECPay and other external links: third-party services apply after you choose to open them; payment details are not stored by the Jabiko frontend."
          ]
        },
        {
          title: "7. Retention, deletion, and contact",
          paragraphs: [
            "Local data remains until you clear the browser's site data. Remote practice records and feedback are kept while needed for sync, maintenance, replies, or issue tracking, or until you request deletion.",
            "A self-service export screen is not yet available. To request an export, or to ask about or request deletion of other account-linked data, sign in with the same account and use the site's Feedback form with the reply option selected. Do not post personal data in a public GitHub issue. Jabiko does not sell personal data."
          ]
        },
        {
          title: "8. Deleting your synced practice history",
          paragraphs: [
            "Signed-in users can delete the practice answers synced to this account on their own from the account area. When the deletion succeeds, it also clears this device's practice records, weak points, and review progress.",
            "This does not delete your account, bookmarks, language, or appearance settings. Deletion cannot be undone; if it fails, please try again and do not treat the data as deleted."
          ]
        },
        {
          title: "9. Changes to this policy",
          paragraphs: [
            "When features or data handling change materially, this policy and its update date will be revised. Changes with a significant effect on users will be highlighted through an appropriate notice on the site."
          ]
        }
      ]
    },
    terms: {
      eyebrow: "Legal and privacy",
      title: "Terms of Use",
      intro:
        "Jabiko is a free Japanese-learning aid. These terms explain the scope of the service, responsibility for learning content, and basic limits on use.",
      updatedLabel: `Last updated: ${TERMS_UPDATED_AT}`,
      sections: [
        {
          title: "1. Nature of the service",
          paragraphs: [
            "Jabiko provides Japanese grammar, vocabulary, kanji, question-type practice, articles, and progress tools. It is not affiliated with the Japan Foundation, Japan Educational Exchanges and Services, or the official JLPT, and it does not guarantee exam results, passing, or error-free content."
          ]
        },
        {
          title: "2. Acceptable use",
          items: [
            "Do not disrupt the site or other users through automated excessive requests, attacks, attempts to bypass security controls, or similar conduct.",
            "Do not use feedback fields to send unlawful, rights-infringing, malicious, or bulk spam content.",
            "Use the report feature if a question or explanation appears wrong. Jabiko may correct, retain, or remove content at its discretion."
          ]
        },
        {
          title: "3. Source code, content, and brand",
          paragraphs: [
            "Source code being visible in a public repository does not grant permission to copy, modify, redistribute, or use it commercially. Unless a specific file carries a separate express license, rights are reserved in Jabiko's code, original articles, question bank, name, mascot, and visual assets.",
            "This does not add restrictions to the Japanese language itself, general facts, or material you may otherwise lawfully use. Third-party trademarks, work titles, and external material remain the property of their respective owners."
          ]
        },
        {
          title: "4. External services and support links",
          paragraphs: [
            "The site may link to services such as Google, ECPay, or GitHub. Each provider is responsible for its own content, transactions, privacy, and availability. Financial support is voluntary and does not purchase an exam result or guarantee permanent availability of any feature."
          ]
        },
        {
          title: "5. Changes and availability",
          paragraphs: [
            "Jabiko may add, change, suspend, or remove features and content. Maintenance, provider outages, or events outside our control may make the service temporarily unavailable. We work to keep the service and data safe, but do not guarantee uninterrupted service or permanent data retention. Keep any backup of learning records that is important to you."
          ]
        },
        {
          title: "6. Limitation of liability and contact",
          paragraphs: [
            "To the extent permitted by law, Jabiko is not responsible for indirect losses arising from use or inability to use the service, reliance on learning content, third-party services, or data loss. This does not exclude liability that cannot lawfully be excluded.",
            "Use the site's Feedback form for questions about these terms, privacy, or content."
          ]
        }
      ]
    }
  }
} as const satisfies Record<"zh-Hant" | "ja" | "en", LegalPageCopy>;

export function legalCopyFor(language: LocaleCode): LegalPageCopy {
  if (language === "zh-Hant" || language === "ja" || language === "en") {
    return LEGAL_COPY[language];
  }
  return LEGAL_COPY.en;
}

export function legalDocumentFor(language: LocaleCode, page: LegalPageKind): LegalDocument {
  return legalCopyFor(language)[page];
}
