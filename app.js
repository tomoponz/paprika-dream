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
