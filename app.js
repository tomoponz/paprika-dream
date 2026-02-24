// paprika-dream: scroll story
// - background changes per section (image or css:theme)
// - updates header "now" + progress bar
// - dream log (localStorage)
// - weird TV (lazy-load YouTube on click)

(() => {
  "use strict";

  const layers = [document.getElementById("bgA"), document.getElementById("bgB")].filter(Boolean);
  const scenes = Array.from(document.querySelectorAll(".scene[data-bg]"));
  const nowName = document.getElementById("nowName");
  const bar = document.getElementById("progressBar");

  if(layers.length < 2 || scenes.length === 0) return;

  let active = 0;
  let currentKey = "";

  function setTheme(layer, theme){
    layer.classList.remove("theme-clinical", "theme-radio");
    if(theme) layer.classList.add(`theme-${theme}`);
  }

  function setLayer(layer, bg){
    if(bg.startsWith("css:")){
      const theme = bg.slice(4).trim();
      layer.style.backgroundImage = "none";
      setTheme(layer, theme);
      return { kind:"css", val: theme };
    }
    // image
    setTheme(layer, "");
    layer.style.backgroundImage = `url("${bg}")`;
    return { kind:"img", val: bg };
  }

  // Preload only images
  const preloadCache = new Set();
  function preload(bg){
    if(!bg || bg.startsWith("css:") || preloadCache.has(bg)) return;
    preloadCache.add(bg);
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    img.src = bg;
  }

  function showBg(bg){
    if(!bg) return;
    if(bg === currentKey) return;
    currentKey = bg;

    const next = 1 - active;
    setLayer(layers[next], bg);

    layers[next].classList.add("on");
    layers[active].classList.remove("on");
    active = next;
  }

  // initial
  showBg(scenes[0].dataset.bg);
  layers[0].classList.add("on");
  preload(scenes[0].dataset.bg);
  preload(scenes[1]?.dataset.bg);

  const io = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a,b) => (b.intersectionRatio - a.intersectionRatio))[0];

    if(!visible) return;

    const target = visible.target;
    showBg(target.dataset.bg);

    if(nowName) nowName.textContent = target.dataset.name || "—";

    const idx = scenes.indexOf(target);
    preload(scenes[idx + 1]?.dataset.bg);
  }, {
    root: null,
    threshold: [0.25, 0.45, 0.65],
    rootMargin: "-35% 0px -35% 0px"
  });

  scenes.forEach(s => io.observe(s));

  // progress bar
  function updateProgress(){
    if(!bar) return;
    const doc = document.documentElement;
    const max = (doc.scrollHeight - doc.clientHeight) || 1;
    const p = Math.max(0, Math.min(1, window.scrollY / max));
    bar.style.width = (p * 100).toFixed(2) + "%";
  }
  window.addEventListener("scroll", updateProgress, { passive:true });
  window.addEventListener("resize", updateProgress, { passive:true });
  updateProgress();

  // --- Floating TV Dock: autoplay YouTube on load ---
  const yt = document.getElementById("ytDock");
  const unmuteBtn = document.getElementById("tvUnmute");
  const closeBtn = document.getElementById("tvClose");
  const dock = document.getElementById("tvDock");

  function setYtSrc(mute){
    if(!yt) return;
    const m = mute ? 1 : 0;
    // NOTE: Autoplay with sound is usually blocked; we autoplay muted, and unmute on user click.
    yt.src = `https://www.youtube-nocookie.com/embed/Mr86_f-kLSQ?autoplay=1&mute=${m}&playsinline=1&rel=0&modestbranding=1`;
  }

  // Autoplay (muted) as soon as the page loads
  setYtSrc(true);

  // Click to unmute (reload iframe with mute=0; user gesture allows audio)
  unmuteBtn?.addEventListener("click", () => {
    setYtSrc(false);
  });

  // Close dock (optional)
  closeBtn?.addEventListener("click", () => {
    if(dock) dock.style.display = "none";
    if(yt) yt.src = ""; // stop playback
  });

// --- Dream Log (localStorage) ---
  const KEY = "paprikaDreamLog_v1";
  const SEED_KEY = "paprikaDreamLog_seeded_v1";

  // Seed entries (user-provided dream logs). We store the text EXACTLY as given.
  const SEED_ENTRIES = [
    {
      ts: new Date("2024-03-17T00:00:00").getTime(),
      title: "2024年3月17日",
      text: `2024年3月17日
高校生活が終わり、俺はクラスメイトと自由に国内を旅行していた。いわば修学旅行のようなものだ。俺は友人とともに大阪周辺を観光したあと、最終日にクラスの飲み会にLINEで誘われた。場所は地元の飲み屋。ちょうど俺は新幹線で駅に向かってから自宅について一息ついていた。飲み会にどうしても行きたかった俺は車でそこに向かっていた。道中、俺が通っていた中学校が見え、せっかくだから先生にも挨拶をしようと思い、学校に入った。誰もいない2年1組の教室に入り、椅子に座っていた。同じ中学校だったH氏にも飲み会の前に一緒に先生に会おうとLINEで誘った。しばらくして、体操服を着た子どもたちが教室に入ってきた。彼らと談笑をしていると、真っ赤な光が入り込み、急にサイレンが鳴り響いた。放送が入った。
「私達はこれから何人かの生徒を殺します。そのため逃げてください」
あまりの出来事に俺は唖然としていたが、教室に座っていた生徒は一斉に立ち上がり押しかけるように廊下に出ていった。他の教室からも、人が波のように押しかけている。逃げている生徒の一人に何が起きたかを尋ねた。彼は言った。
「鬼ごっこが始まった」と。
右往左往していた俺は、結局2年1組の教室に入ると、50人ほどの大人子どもがいた。その教室のドアの横にある移動式モニターの後ろに生徒と一緒に隠れた。しばらくしてサイレンが止み、安心した瞬間、柄が1m以上ある大きな木槌を持った3人の先生が廊下を歩いているのが見えた。そのうちの一人の女の先生が教室に入り、こう告げた。
「2年1組田中武雄、2年1組〜…あと、H。呼ばれた人は起立しろ。」
なぜH氏が？と思ったのも束の間、生徒が先生の前に並んだ。先生は続けて言う。
「田中武雄。罪状漫画の海賊版サイトを親のクレジットカードを使って読んだ罪。一体何話読んだ」
「ちょうど3560話です。」
そう言うと、女教師は悪魔の微笑みを浮かべてこういった。
「ならば3560回だな」
彼女は狂ったように生徒の背中に加減なく杖を叩きつけた。思わず目を背けた。見るに耐えない光景だった。肉塊の上に罪状を置くと次の生徒も同様に処分されていった。そして、最後のH氏が呼ばれた。
「H。罪状マリオカートを1日8時間以上した罪」しかしH氏はまだ学校に来ていなかった。そのため女は仕方ないと言って罪状を捨てると教室から出ていった。
教室は静寂に包まれた。するとH氏が教室に入ってきた。
「ごめん、ちょっと渋滞にあってさ」
「H、お前生きてたのか」`
    },
    {
      ts: new Date("2024-05-19T00:00:00").getTime(),
      title: "2024年5月19日",
      text: `2024年5月19日
フェリーで田舎のグラウンドに行って砂嵐の中で300人とラジオ体操第二をした。フェリーに戻るとMrBeastが和室の大広間の中で花火を打ち上げていた。地上に降りて別のグラウンドで、MrBeastとワイの二人ＶＳ300人でサッカーをし、ワイのチームがボコボコにされて、MrBeastがピキッていた
という夢を見た。`
    },
    {
      ts: new Date("2024-08-13T00:00:00").getTime(),
      title: "2024年8月13日",
      text: `2024年8月13日
失敗したら殺される告白の機会を設けられて、「そこをなんとか」と土下座までして告白したものの「ごめんなさい」と振られてしまったが、必死な姿に同情したのか、デートに行くことになり、死を逃れたことよりも告白が成功した嬉しさから涙を流した
という夢を見た。`
    },
    {
      ts: new Date("2024-11-24T00:00:00").getTime(),
      title: "2024年11月24日",
      text: `2024年11月24日
ホモビに出演させられそうになるのをギリギリで回避する夢しか見ない。これで3回目。`
    },
    {
      ts: new Date("2024-12-25T00:00:00").getTime(),
      title: "2024年12月25日",
      text: `2024年12月25日
この歳で保育園に入園したら、楽しんご似の園長に連れられてエレベーターのある待合室に待たされたけど、いかつかったり、クスリやってそうでやせこけてたり、頬がえぐれて中の歯が見えたりする外人３人がいて、マフィアだョ！全員集合状態だったという夢を見た。`
    },
    {
      ts: new Date("2025-03-02T00:00:00").getTime(),
      title: "2025年3月2日",
      text: `2025年3月2日
友達から、るしあの変態画像が送られてきて、それにツッコミを入れたら 変態画像を収集して共有する 秘密結社の "リアル変態紳士クラブ" に招待されて唖然とした夢を見た。`
    },
    {
      ts: new Date("2025-03-14T00:00:00").getTime(),
      title: "2025年3月14日",
      text: `2025年3月14日
TV新人Dになって、電王となった秋山竜次の撮影時、色々怒られて「どこまで？」と聞かれ、秋山の知識を聞かれてると思い、秋山竜次さんですよねと答えたら「違えよ」と言われて意味不だから出身地を答えたら、「馬鹿野郎、それ塾の場所聞かれる時のやつじゃねえか」と意味わかんないツッコミをされた夢を見た。`
    },
    {
      ts: new Date("2025-03-15T00:00:00").getTime(),
      title: "2025年3月15日",
      text: `2025年3月15日
ホテルで、何者かがワイのベッドに潜り込んで犯されそうになったが、全力で回避し、翌日隣室の友達のぐんぴぃに笑い話として話したら、「実は男がすきなんだよね」とホモCOされて、ぐんぴぃがバッキバキの童貞である所以を理解するとともに不適な笑みを浮かべたぐんぴぃに恐怖を感じ、起床。`
    },
    {
      ts: new Date("2025-03-17T00:00:00").getTime(),
      title: "2025年3月17日",
      text: `2025年3月17日
学校が火事で、生徒は消防車で逃げることになり、そのおかしさに気づいたワイはいち早く学校を抜け出してフェンスを飛び越えようとしたが女の先生に捕獲されたが、振りほどいて脱走し、追いかけてくるヤクザから逃げ、途中服に着けられた追跡装置に気づいて捨て、母と合流した。しかし、母の記憶では父と喧嘩別れしてワイが生まれていなかったことになっていたが、抱擁して愛の力で記憶を呼び覚まして車で逃げ、スマホでそれがヤクザによる大規模誘拐事件であったことが判明して起床。`
    },
    {
      ts: new Date("2025-03-25T00:00:00").getTime(),
      title: "2025年3月25日",
      text: `2025年3月25日
校庭でクラスの皆と野球することになったのはいいものの、ぼっちすぎて色とりどりの3DSを持っていく夢。`
    },
    {
      ts: new Date("2025-08-20T00:00:00").getTime(),
      title: "2025年8月20日",
      text: `2025年8月20日
男女友達４人とシーサイドホテルで雑魚寝したら、深夜わし以外異様に盛ってて怖くなったので逃げようとしたら、エンヤ婆みたいな「そういう風習がある村の村長」が「追うのじゃ」と言って美女の刺客を追わせたが、お猿の情事状態の町からなんとか逃げ出す夢。`
    },
    {
      ts: new Date("2025-09-19T00:00:00").getTime(),
      title: "2025年9月19日",
      text: `2025年9月19日
瓜田純士さんと家族でスシローに行ったら、下っ端のワイが注文していたら注文方法がクソ難しすぎて、瓜田純士さんが店員にガチギレしてクレーマーになった夢。`
    },
    {
      ts: new Date("2025-11-24T00:00:00").getTime(),
      title: "2025年11月24日",
      text: `2025年11月24日
テンプシーロールをする夢をみた気がする。`
    },
    {
      ts: new Date("2026-02-07T00:00:00").getTime(),
      title: "2026年2月7日",
      text: `2026年2月7日
カズマとアクアが、黒ニンニク系サプリを作る会社のチラシ配りをしてて、アクシズ教入信書も一緒にもらって、これは現実かと思い、頬を叩いたらちゃんと痛く感じたが、夢だった。`
    },
    {
      ts: new Date("2026-02-08T00:00:00").getTime(),
      title: "2026年2月8日",
      text: `2026年2月8日
私は「悪霊退治」というアトラクションに参加する夢を見た。舞台は、ホテルの大ホールみたいな広い廃墟で、そこにいる“人の目には見えない幽霊（ゴースト）”を倒すゲームだった。

ホールのテーブルには金属バットや竹刀、デジカメが置かれている。参加者は生きている人も混ざったまま、ホールの中をパレードのように決められた道順で行進する。すると、その道順に引き寄せられるように霊も同じパレードに“同行”してくるらしい。

ただし霊は肉眼では見えない。そこで、パレード中にデジカメで周囲を撮影し、撮った画像を確認して「霊がどこにいるか」「誰に関係する霊か」を把握してから攻撃する仕組みになっていた。実在する人を攻撃しないように、倒していいのはゴーストだけ、というルールもある。こちらは竹刀や金属バットで空気を振り回し、見えない霊にダメージを与えられる。一方でゴースト側も霊的なバットのような武器を持っていて、生きている人が攻撃されるとHPゲージが減っていく。

パレードをした参加者の中には、なぜかアイリス様がいた。カメラで撮影した画像を確認すると、彼女の隣に「クレア」の霊が写っていて、「霊ってこうやって見つけるんだ」とはっきり分かった。

その後、私の前に大ボスが現れた。相手は小中学校の同級生で、現実ではそこまで親しくなかったのに、夢の中ではなぜかライバルという設定になっていた。そいつは「“あの日”の決着をつけようか」と言ってきて、私は竹刀で戦うことになった。必死に戦ってなんとか倒すと、そいつは消える直前に「やっぱ強いな」と言い残した。

戦いが終わって外に出ると、なぜか場所は自分の学校の校庭のグラウンドに変わっていた。そこで亡くなったおじいちゃんの気配を感じて急いで向かったのに、座っていたのはおじいちゃんではなく、金髪でサングラスのヤンキー風の、まったく知らない霊だった。`
    },
  ];

  function seedDreamLogIfNeeded(){
    try{
      if(localStorage.getItem(SEED_KEY) === "1") return;

      const items = loadLog();
      const existing = new Set(items.map(it => String(it.text || "").slice(0, 80)));

      const toAdd = [];
      for(const it of SEED_ENTRIES){
        const k = String(it.text || "").slice(0, 80);
        if(!existing.has(k)) toAdd.push(it);
      }

      if(toAdd.length){
        saveLog([...toAdd, ...items]);
      }
      localStorage.setItem(SEED_KEY, "1");
    }catch{
      // ignore
    }
  }

  const titleEl = document.getElementById("dlTitle");
  const textEl = document.getElementById("dlText");
  const addBtn = document.getElementById("dlAdd");
  const clearBtn = document.getElementById("dlClear");
  const copyBtn = document.getElementById("dlCopy");
  const listEl = document.getElementById("dlList");

  function loadLog(){
    try{
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    }catch{
      return [];
    }
  }
  function saveLog(items){
    localStorage.setItem(KEY, JSON.stringify(items));
  }
  function fmtDate(ts){
    const d = new Date(ts);
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,"0");
    const da = String(d.getDate()).padStart(2,"0");
    const hh = String(d.getHours()).padStart(2,"0");
    const mm = String(d.getMinutes()).padStart(2,"0");
    return `${y}-${m}-${da} ${hh}:${mm}`;
  }

  function renderLog(){
    if(!listEl) return;
    const items = loadLog();
    if(items.length === 0){
      listEl.innerHTML = '<div class="dim">no entries yet.</div>';
      return;
    }
    listEl.innerHTML = items.map((it, idx) => {
      const safeTitle = (it.title || "untitled").replace(/[<>]/g,"");
      const safeText = (it.text || "").replace(/[<>]/g,"");
      return `
        <div class="entry">
          <div class="entryTitle">${safeTitle}</div>
          <div class="entryMeta">${fmtDate(it.ts)} · #${idx+1}</div>
          <div class="entryText">${safeText}</div>
        </div>
      `;
    }).join("");
  }

  function addEntry(){
    if(!titleEl || !textEl) return;
    const title = (titleEl.value || "").trim();
    const text = (textEl.value || "").trim();
    if(!title && !text) return;

    const items = loadLog();
    items.unshift({ ts: Date.now(), title: title || "untitled", text });
    saveLog(items);

    titleEl.value = "";
    textEl.value = "";
    seedDreamLogIfNeeded();
  renderLog();
  }

  function clearAll(){
    if(!confirm("Dream Log を全消去しますか？")) return;
    saveLog([]);
    renderLog();
  }

  async function copyAll(){
    const items = loadLog();
    const lines = items.map((it, i) => {
      return `#${items.length - i} ${fmtDate(it.ts)}\n${it.title}\n${it.text}\n`;
    }).join("\n");
    try{
      await navigator.clipboard.writeText(lines);
      alert("コピーしました");
    }catch{
      alert("コピーできませんでした（ブラウザ制限）");
    }
  }

  addBtn?.addEventListener("click", addEntry);
  clearBtn?.addEventListener("click", clearAll);
  copyBtn?.addEventListener("click", copyAll);
  renderLog();
})();
