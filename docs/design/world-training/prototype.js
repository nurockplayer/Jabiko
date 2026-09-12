const app = document.querySelector('#app');
const screenSelect = document.querySelector('#screen-select');
const stateSelect = document.querySelector('#state-select');
const params = new URLSearchParams(window.location.search);
const allowedScreens = ['entry', 'world', 'conversation', 'feedback', 'handoff', 'training'];
const allowedStates = ['returning', 'unfinished', 'completed', 'seasonless', 'loading', 'error', 'offline'];
let selectedResponse = 'care';
let trainingChoice = '誘いかけ · 文法ミニ練習';
let furiganaVisible = true;

if (allowedScreens.includes(params.get('screen'))) screenSelect.value = params.get('screen');
if (allowedStates.includes(params.get('state'))) stateSelect.value = params.get('state');
if (params.get('capture') === '1') document.body.classList.add('capture-mode');

const stateCopy = {
  returning: ['おかえりなさい', '昨日の続きから、また始められます。'],
  unfinished: ['続きがあります', '駅前の会話を、同じ場面から再開できます。'],
  completed: ['今日の会話は完了しました', '記録を振り返るか、明日の練習を選べます。'],
  seasonless: ['今日は特別な季節の話題はありません', 'いつもの暮らしに目を向けてみましょう。'],
  loading: ['読み込み中', '場面を準備しています。'],
  error: ['場面を読み込めませんでした', 'もう一度試すか、Training へ移動できます。'],
  offline: ['オフラインで閲覧中', '保存済みの練習と記録だけを表示しています。']
};
const stateBanner = () => {
  const [title, text] = stateCopy[stateSelect.value];
  return `<div class="state-banner state-${stateSelect.value}" role="status"><strong>${title}</strong><span>${text}</span></div>`;
};
const nav = (active = 'world') => `<header class="topbar"><a class="wordmark" href="#" data-screen="world"><span class="mark" aria-hidden="true"></span>Jabiko <em>${active === 'training' ? 'Training' : 'World'}</em></a><nav aria-label="Product navigation"><button data-screen="world" class="${active === 'world' ? 'active' : ''}">今日の世界</button><button data-screen="training" class="${active === 'training' ? 'active' : ''}">学習室</button></nav><button class="quiet-link" data-screen="entry">Learning / Life</button></header>`;
const cta = (label, screen, extra = '') => `<button class="button ${extra}" data-screen="${screen}">${label}</button>`;
const responseCopy = {
  care: { label: '気づかう', text: '大丈夫だよ。いっしょに行こう。', feedback: '気づかいを伝え、いっしょに行く提案を返しました。', tags: ['Answer', 'Add'], natural: 'この場面に自然に合う返しです' },
  ask: { label: '確認する', text: '何分ぐらい遅れてるの？', feedback: '状況を尋ねて、相手が答えやすい問いを返しました。', tags: ['Ask'], natural: '自然な確認のしかたです' },
  brief: { label: '短く反応する', text: 'そう。', feedback: '受け止める反応ですが、この不安な場面では次の一歩につながらない会話の行き止まりです。', tags: [], natural: '自然で、意味も距離感も合っています' }
};

function render() {
  const screen = screenSelect.value; app.dataset.screen = screen; app.dataset.state = stateSelect.value;
  const screens = { entry: entry, world: world, conversation: conversation, feedback: feedback, handoff: handoff, training: training };
  app.innerHTML = screens[screen]();
  app.querySelectorAll('[data-screen]').forEach((el) => el.addEventListener('click', (event) => { event.preventDefault(); screenSelect.value = el.dataset.screen; render(); }));
  app.querySelectorAll('[data-response]').forEach((el) => el.addEventListener('click', () => { selectedResponse = el.dataset.response; screenSelect.value = 'feedback'; render(); }));
  app.querySelectorAll('[data-training]').forEach((el) => el.addEventListener('click', () => { trainingChoice = el.dataset.training; render(); }));
  app.querySelectorAll('[data-furigana]').forEach((el) => el.addEventListener('click', () => {
    furiganaVisible = !furiganaVisible;
    app.querySelectorAll('rt').forEach((ruby) => { ruby.hidden = !furiganaVisible; });
    el.setAttribute('aria-expanded', String(furiganaVisible));
  }));
  app.querySelectorAll('[data-support]').forEach((el) => el.addEventListener('click', () => {
    const support = app.querySelector('#support-note');
    if (support) { support.hidden = !support.hidden; el.setAttribute('aria-expanded', String(!support.hidden)); }
  }));
}
function entry() { return `<section class="entry page"><div class="entry-intro"><p class="eyebrow">ふたつの入口 · TWO WAYS TO LEARN</p><h1>ことばから、<br><i>暮らしの中へ。</i></h1><p class="lede">日本語を練習する時間も、誰かと話す時間も。今日の自分に合う場所から始めましょう。</p></div><div class="product-choice"><article class="product-card learning"><span class="card-label">LEARNING</span><h2>Jabiko Learning</h2><p>JLPT・文法・語彙・読解・活用を、目的からまっすぐ練習。</p>${cta('Learning を開く', 'training', 'secondary')}</article><article class="product-card life"><span class="card-label">WORLD</span><h2>Jabiko Life</h2><p>場所と人との会話から、毎日の日本語を使ってみる。</p>${cta('Life を開く', 'world')}</article></div><p class="entry-foot">入口はいつでも切り替えられます。どちらも同じ学びの記録を尊重します。</p></section>`; }
function world() { return `${nav('world')}<section class="page world-page">${stateBanner()}<div class="world-heading"><div><p class="eyebrow">月曜日 · 09:10 · くもり</p><h1>今日、どこへ行く？</h1><p class="lede">駅前に、話せそうな気配があります。</p></div><div class="day-mark" aria-label="Monday morning">MON<br><strong>14</strong></div></div><div class="world-grid"><div class="scene-card station"><div class="scene-art" aria-hidden="true"><span class="sun"></span><span class="building"></span><span class="person"></span></div><div class="scene-copy"><span class="card-label">NEARBY · 駅前</span><h2>美咲さんが待っている</h2><p>電車が少し遅れている。ひとことから始められそう。</p>${cta('この場面へ', 'conversation')}</div></div><aside class="people-panel"><p class="eyebrow">RELATIONSHIPS</p><h2>つながり</h2><div class="person-row"><span class="avatar a-misaki">美</span><span><strong>美咲</strong><small>同級生 · 2つの話題</small></span><span class="dot" aria-label="new opportunity"></span></div><div class="person-row muted"><span class="avatar a-kenta">健</span><span><strong>健太</strong><small>本屋 · また今度</small></span></div><button class="text-button" data-screen="handoff">困ったら学習室へ →</button></aside></div><div class="world-bottom"><span>季節の話題：今日はありません</span><span>場所 3 · 話題 5 · 関係 2</span></div></section>`; }
function conversation() { return `${nav('world')}<section class="page conversation-page">${stateBanner()}<div class="conversation-meta"><button class="back-link text-button" data-screen="world">← 今日の世界</button><span>駅前 · 同級生 · <b>短い会話</b></span></div><div class="conversation-layout"><div class="conversation-art" role="img" aria-label="A quiet station entrance on a cloudy morning"><span class="station-sign">駅</span><span class="awning"></span><span class="c-person"></span><span class="c-bike"></span></div><article class="dialogue"><div class="partner-line"><span class="avatar a-misaki">美</span><div><span class="speaker">美咲 · 同級生</span><p class="jp-line"><ruby>電車<rt>でんしゃ</rt></ruby>、<ruby>遅<rt>おく</rt></ruby>れてるみたい。<br><ruby>今日<rt>きょう</rt></ruby>の<ruby>発表<rt>はっぴょう</rt></ruby>、<ruby>間<rt>ま</rt></ruby>に<ruby>合<rt>あ</rt></ruby>うかな。</p><p class="translation">It looks like the train is late. Will we make the presentation?</p></div></div><div class="intent"><span class="eyebrow">YOUR MOVE · REACT + SUPPORT</span><p>相手の不安を受け止めて、次の一歩を返してみましょう。</p><div class="response-actions"><button class="response" data-response="care"><span>気づかう</span><b>大丈夫だよ。いっしょに行こう。</b></button><button class="response" data-response="ask"><span>確認する</span><b>何分ぐらい遅れてるの？</b></button><button class="response" data-response="brief"><span>短く反応する</span><b>そう。</b></button></div><div class="support-row"><button class="text-button unavailable" disabled aria-disabled="true" title="Audio unavailable in this prototype">◉ 音声（準備中）</button><button class="text-button" data-furigana aria-expanded="true">ふりがな</button><button class="text-button" data-support aria-expanded="false">言い換えのヒント</button></div><p id="support-note" class="support-note" hidden>「大丈夫？」で気づかいを示し、「いっしょに行こう」で提案できます。</p></div></article></div></section>`; }
function feedback() { const response = responseCopy[selectedResponse]; const continuationNeedsWork = selectedResponse === 'brief'; return `${nav('world')}<section class="page feedback-page">${stateBanner()}<div class="conversation-meta"><button class="back-link text-button" data-screen="conversation">← 会話に戻る</button><span>今回の返答 · 美咲さんとの場面</span></div><div class="feedback-head"><div><p class="eyebrow">CONVERSATION RECORD</p><h1>伝わった。次は、続けてみよう。</h1><p class="lede">この場面の返答を、ひとつの点数にせず振り返ります。</p></div><div class="retry-ring" role="img" aria-label="Replay available">↻<small>REPLAY</small></div></div><div class="feedback-grid"><div class="dimension-list" aria-label="Five independent feedback dimensions"><div class="dimension"><span class="status good">✓</span><div><strong>Understandable</strong><small>意味は自然に伝わります</small></div></div><div class="dimension"><span class="status good">✓</span><div><strong>Correct</strong><small>文法と語順は適切です</small></div></div><div class="dimension"><span class="status good">✓</span><div><strong>Natural</strong><small>${response.natural}</small></div></div><div class="dimension"><span class="status ${continuationNeedsWork ? 'next' : 'good'}">${continuationNeedsWork ? '→' : '✓'}</span><div><strong>Continuation</strong><small>${continuationNeedsWork ? 'この場面では会話が続きにくい一言です' : '相手が返しやすい一言です'}</small></div></div><div class="dimension"><span class="status good">✓</span><div><strong>Register</strong><small>同級生に合う距離感です</small></div></div></div><aside class="record-card"><p class="eyebrow">SELECTED RESPONSE · ${response.label}</p><p class="quote">「${response.text}」</p><div class="shape-tags">${response.tags.map((tag) => `<span>${tag}</span>`).join('')}</div><p>${response.feedback}</p></aside></div><div class="feedback-actions">${cta('もう一度、この場面で言う', 'conversation')} ${cta('学習室で表現を練習', 'handoff', 'secondary')}</div></section>`; }
function handoff() { return `${nav('world')}<section class="page handoff-page">${stateBanner()}<div class="handoff-card"><div class="handoff-icon" aria-hidden="true">文</div><p class="eyebrow">OPTIONAL TRAINING · 駅前の場面</p><h1>「いっしょに行こう」を使う。</h1><p class="lede">この会話の <b>誘いかけ</b> に関係する文型を、短く練習できます。終わったら同じ駅前の瞬間へ戻れます。</p><div class="handoff-info"><span>戻り先</span><strong>駅前 · 美咲さんの不安への返答</strong></div>${cta('文法ミニ練習へ', 'training')}<button class="text-button" data-screen="conversation">今は練習せず会話へ戻る</button></div></section>`; }
function training() { return `${nav('training')}<section class="page training-page">${stateBanner()}<div class="training-heading"><div><p class="eyebrow">TRAINING ROOM · 目的から選ぶ</p><h1>今日の学習室</h1><p class="lede">必要な練習へ、すぐ入れます。世界の場面に戻ることもできます。</p></div>${cta('世界の場面へ戻る', 'conversation', 'secondary')}</div><div class="training-grid"><article class="training-tile featured"><span class="tile-symbol">会</span><div><span class="card-label">FROM THIS MOMENT</span><h2>誘いかけを練習</h2><p>駅前の返答に使える表現 · 5分</p></div><button class="button" data-training="誘いかけ · 文法ミニ練習">この練習を選ぶ</button></article>${[['JL','JLPT','レベルと問題タイプから'],['文','文法','使いたい形を練習'],['語','語彙','場面に合うことば'],['読','読解','短い文章を読む'],['活','活用','動詞をすばやく言う']].map(([icon, title, desc]) => `<article class="training-tile"><span class="tile-symbol">${icon}</span><h2>${title}</h2><p>${desc}</p><button class="text-button" data-training="${title} · 入口を選択">この入口を選ぶ →</button></article>`).join('')}</div><p class="training-selection" role="status">選択中：<strong>${trainingChoice}</strong>。これは施設入口の設計プレビューで、実際の練習はまだ開始しません。</p></section>`; }
screenSelect.addEventListener('change', render); stateSelect.addEventListener('change', render); render();
