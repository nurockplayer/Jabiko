import type { Language } from "../i18n";

export interface GameWorldCopy {
  title: string;
  intro: string;
  progress: (completed: number, total: number) => string;
  available: string;
  startConversation: string;
  returnToWorld: string;
  optional: string;
  arcComplete: string;
  saveFailed: string;
  retrySave: string;
  invalidSaveTitle: string;
  invalidSaveBody: string;
  storageUnavailable: string;
  privacyLabel: string;
  privacy: string;
  smallTalk: string;
  confirmedCheckpoint: string;
  unlockedMoments: string;
  relationshipContext: string;
  unfinishedNote: string;
  pendingLossNote: string;
  worldUnavailableTitle: string;
  worldUnavailableBody: string;
  stateUnavailableTitle: string;
  stateUnavailableBody: string;
  attemptComparisonLabel: string;
  previousChoice: string;
  revisedChoice: string;
  pendingLeaveConfirm: string;
  currentMoment: string;
}

const COPY: Record<"zh-Hant" | "ja" | "en", GameWorldCopy> = {
  "zh-Hant": {
    title: "雨天星期一",
    intro: "在社區辦公室度過一個下雨的星期一。和熟悉的同事聊天，從早上的通勤一路聊到下班前。",
    progress: (completed, total) => `主要故事 ${completed}／${total} 個場景已完成`,
    available: "可開始的場景",
    startConversation: "開始對話",
    returnToWorld: "返回日常",
    optional: "可選場景",
    arcComplete: "主要故事已完成。你仍可看看已解鎖的可選場景。",
    saveFailed: "這個完成的場景尚未保存到本機。你的進度仍停在上一次已確認的檢查點。",
    retrySave: "重試保存場景",
    invalidSaveTitle: "無法讀取這台裝置上的故事進度",
    invalidSaveBody: "原有的保存內容未被更改。為了保護它，這個故事暫時不會開始。",
    storageUnavailable: "瀏覽器目前無法讀取或確認本機保存，因此不能開始故事。",
    privacyLabel: "本機保存說明",
    privacy: "完成的故事檢查點只保存在這台裝置的瀏覽器中，不會同步到帳號或其他裝置。你輸入的對話回覆不會保存；重新載入時，未完成的對話會重新開始。",
    smallTalk: "前往日常會話練習",
    confirmedCheckpoint: "已確認保存：",
    unlockedMoments: "新場景已開放：",
    relationshipContext: "目前的人際關係：",
    unfinishedNote: "未完成的對話只保留在目前頁面；離開或重新載入後，這段對話會重新開始。",
    pendingLossNote: "這個場景已完成，但保存尚未確認。請先重試保存；離開頁面會失去尚未確認的完成結果。",
    worldUnavailableTitle: "故事內容目前無法使用",
    worldUnavailableBody: "故事內容檢查未通過，因此進度不會開始或更改。",
    stateUnavailableTitle: "初始故事狀態無效",
    stateUnavailableBody: "故事狀態檢查未通過，因此進度不會開始或更改。",
    attemptComparisonLabel: "上一次與這次的回答比較",
    previousChoice: "上次選擇",
    revisedChoice: "這次選擇",
    pendingLeaveConfirm: "這個場景的完成結果尚未保存確認。現在離開會失去這項未確認結果。仍要離開嗎？",
    currentMoment: "目前場景"
  },
  ja: {
    title: "雨の月曜日",
    intro: "地域のオフィスで過ごす雨の月曜日です。親しい同僚と、朝の通勤から退勤前まで話します。",
    progress: (completed, total) => `本編 ${completed}/${total} 場面完了`,
    available: "始められる場面",
    startConversation: "会話を始める",
    returnToWorld: "日常に戻る",
    optional: "任意の場面",
    arcComplete: "本編が完了しました。解放済みの任意の場面も利用できます。",
    saveFailed: "完了した場面をこの端末に保存できませんでした。進行状況は最後に確認できたチェックポイントのままです。",
    retrySave: "保存を再試行",
    invalidSaveTitle: "この端末の物語データを読み込めません",
    invalidSaveBody: "保存データは変更していません。保護のため、この物語を開始しません。",
    storageUnavailable: "このブラウザでは保存内容を読み取り、確認できないため、物語を開始できません。",
    privacyLabel: "端末への保存について",
    privacy: "完了した物語のチェックポイントだけをこの端末のブラウザに保存し、アカウントや他の端末とは同期しません。入力した会話の返答は保存されません。再読み込みすると、未完了の会話は最初からになります。",
    smallTalk: "日常会話の練習へ",
    confirmedCheckpoint: "保存を確認した場面：",
    unlockedMoments: "新しい場面が解放されました：",
    relationshipContext: "現在の関係：",
    unfinishedNote: "未完了の会話はこのページにだけ保持されます。ページを離れるか再読み込みすると、最初からになります。",
    pendingLossNote: "場面は完了しましたが、保存はまだ確認されていません。先に保存を再試行してください。ページを離れると未確認の完了結果は失われます。",
    worldUnavailableTitle: "物語コンテンツを利用できません",
    worldUnavailableBody: "物語コンテンツの検証に失敗したため、進行を開始・変更しません。",
    stateUnavailableTitle: "初期の物語状態が無効です",
    stateUnavailableBody: "物語状態の検証に失敗したため、進行を開始・変更しません。",
    attemptComparisonLabel: "前回と今回の返答の比較",
    previousChoice: "前回の選択",
    revisedChoice: "今回の選択",
    pendingLeaveConfirm: "この場面の完了結果はまだ保存確認されていません。今離れると未確認の結果は失われます。離れますか？",
    currentMoment: "現在の場面"
  },
  en: {
    title: "Rainy Monday",
    intro: "Spend a rainy Monday at a neighborhood office. Chat with familiar coworkers from the morning commute through the end of the workday.",
    progress: (completed, total) => `Main story: ${completed} of ${total} scenes complete`,
    available: "Available scenes",
    startConversation: "Start conversation",
    returnToWorld: "Return to Everyday",
    optional: "Optional scene",
    arcComplete: "The main story is complete. Any unlocked optional scene is still available.",
    saveFailed: "This completed scene is not saved on this device yet. Your progress remains at the last confirmed checkpoint.",
    retrySave: "Retry saving scene",
    invalidSaveTitle: "This device's story progress could not be read",
    invalidSaveBody: "The existing save was left unchanged. This story will not start so that it remains protected.",
    storageUnavailable: "This browser could not read or confirm local storage, so the story cannot start.",
    privacyLabel: "About local saves",
    privacy: "Completed story checkpoints stay in this device's browser and are not synced to an account or other devices. Your typed conversation replies are not saved; an unfinished conversation starts over after a reload.",
    smallTalk: "Go to Small Talk practice",
    confirmedCheckpoint: "Confirmed checkpoint:",
    unlockedMoments: "New scene unlocked:",
    relationshipContext: "Current connection:",
    unfinishedNote: "An unfinished conversation stays only on this page. Leaving or reloading starts that conversation over.",
    pendingLossNote: "This scene is complete, but its save is not confirmed. Retry saving before leaving; leaving this page loses the unconfirmed result.",
    worldUnavailableTitle: "Story content is unavailable",
    worldUnavailableBody: "The story content did not pass validation, so progress will not start or change.",
    stateUnavailableTitle: "The initial story state is invalid",
    stateUnavailableBody: "The story state did not pass validation, so progress will not start or change.",
    attemptComparisonLabel: "Compare your previous and revised response",
    previousChoice: "Previous choice",
    revisedChoice: "Revised choice",
    pendingLeaveConfirm: "This completed scene has not been confirmed as saved. Leaving now loses that unconfirmed result. Leave anyway?",
    currentMoment: "Current scene"
  }
};

export function gameWorldCopyFor(language: Language): GameWorldCopy {
  return COPY[language as keyof typeof COPY] ?? COPY.ja;
}
