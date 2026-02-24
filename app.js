// paprika-dream: minimal template
// - Click "ENTER DREAM" to start the lightweight canvas renderer.
// - "WARP" is the hook for future WebGL/video lazy-loading.

(() => {
  "use strict";

  const el = (id) => document.getElementById(id);
  const logEl = () => el("console");

  function log(msg){
    const c = logEl();
    if(!c) return;
    c.textContent += (c.textContent ? "\n" : "") + msg;
    c.scrollTop = c.scrollHeight;
  }

  // --- state ---
  const state = {
    started: false,
    paused: false,
    lowPower: false,
    flash: 0,
    driftX: 0,
    driftY: 0,
    t: 0,
    fpsCap: 0,          // 0 = uncapped
    lastFrameTime: 0,
    scale: 1,           // internal resolution scale (lower = faster)
  };

  const canvas = el("dream");
  const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });

  const buf = document.createElement("canvas");
  const bctx = buf.getContext("2d", { alpha: false, willReadFrequently: true });

  function isTouchLike(){
    return matchMedia("(pointer: coarse)").matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  function resize(){
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(window.innerWidth * dpr));
    const h = Math.max(1, Math.floor(window.innerHeight * dpr));
    canvas.width = w;
    canvas.height = h;

    // internal buffer: scaled down (big perf win)
    const scale = state.lowPower ? 0.32 : 0.48;
    state.scale = scale;
    buf.width = Math.max(64, Math.floor(w * scale));
    buf.height = Math.max(64, Math.floor(h * scale));

    log(`[resize] canvas ${w}x${h} | buffer ${buf.width}x${buf.height} | lowPower=${state.lowPower}`);
  }

  // Palette: precomputed 512 colors (psychedelic but cheap)
  const PALETTE = (() => {
    const out = new Array(512);
    for(let i=0;i<out.length;i++){
      const a = i / out.length;
      const r = 140 + 110 * Math.sin((a*6.283)*1.0 + 0.0);
      const g = 120 + 120 * Math.sin((a*6.283)*1.0 + 2.1);
      const b = 150 + 105 * Math.sin((a*6.283)*1.0 + 4.2);
      out[i] = [r|0,g|0,b|0];
    }
    return out;
  })();

  function field(x, y, t){
    const a = Math.sin(x*0.018 + t*0.8) + Math.cos(y*0.014 - t*0.7);
    const b = Math.sin((x+y)*0.010 + t*0.55) + Math.cos((x-y)*0.012 - t*0.6);
    return (a*0.55 + b*0.45);
  }

  function render(dt){
    const w = buf.width, h = buf.height;
    const img = bctx.createImageData(w, h);
    const data = img.data;

    const t = state.t;
    const dx = state.driftX;
    const dy = state.driftY;
    const flash = state.flash;

    let p = 0;
    for(let y=0;y<h;y++){
      for(let x=0;x<w;x++){
        const fx = x + dx*140;
        const fy = y + dy*140;

        const v = field(fx, fy, t);
        const u = field(fy, fx, t*0.9);
        const m = (v + u) * 0.5;

        const idx = ((m + 2.0) * 120 + (Math.sin((fx+fy)*0.02 + t*2.2)*40)) | 0;
        const c = PALETTE[(idx + (flash*90)) & 511];

        const nx = (x / w) * 2 - 1;
        const ny = (y / h) * 2 - 1;
        const vv = Math.max(0, 1 - (nx*nx + ny*ny) * 0.75);
        const k = 0.55 + 0.45*vv;

        data[p++] = (c[0] * k) | 0;
        data[p++] = (c[1] * k) | 0;
        data[p++] = (c[2] * k) | 0;
        data[p++] = 255;
      }
    }

    bctx.putImageData(img, 0, 0);

    // upscale (translucent so CSS background stays visible)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = state.lowPower ? 0.55 : 0.70;
    ctx.drawImage(buf, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;

    // decay
    state.flash = Math.max(0, state.flash - dt*1.8);
  }

  function tick(ts){
    if(!state.started) return;

    const now = ts || performance.now();
    const dt = Math.min(0.05, (now - (state.lastFrameTime || now)) / 1000);
    state.lastFrameTime = now;

    if(!state.paused){
      state.t += dt;

      if(state.fpsCap > 0){
        const step = 1 / state.fpsCap;
        if((state.t % step) < dt){
          render(dt);
        }
      }else{
        render(dt);
      }
    }

    requestAnimationFrame(tick);
  }

  function setLowPower(on){
    state.lowPower = !!on;
    state.fpsCap = state.lowPower ? 24 : 0;

    document.body.classList.toggle("lowpower", state.lowPower);

    const btn = el("btnLow");
    if(btn){
      btn.setAttribute("aria-pressed", String(state.lowPower));
      btn.textContent = `低負荷: ${state.lowPower ? "ON" : "OFF"}`;
    }
    resize();
  }

  function setPaused(on){
    state.paused = !!on;
    const btn = el("btnPause");
    if(btn){
      btn.setAttribute("aria-pressed", String(state.paused));
      btn.textContent = state.paused ? "再開" : "停止";
    }
    log(state.paused ? "[pause] paused" : "[pause] resumed");
  }

  function start(){
    if(state.started) return;
    state.started = true;

    if(isTouchLike()){
      setLowPower(true);
      log("[hint] touch device detected -> low power enabled");
    }else{
      resize();
    }

    el("btnWarp")?.removeAttribute("disabled");

    log("[start] ENTER DREAM");
    log("Tip: Arrow keys drift | Space flash | Esc pause");
    requestAnimationFrame(tick);
  }

  function flash(){
    state.flash = Math.min(1.5, state.flash + 0.8);
  }

  // Hook for the next stage (lazy-load heavy stuff)
  async function warp(){
    log("[warp] (placeholder) heavy effects should lazy-load here.");
    log("Next: dynamic import('webgl.js') or load a video overlay when needed.");
    flash();
  }

  function bind(){
    el("btnStart")?.addEventListener("click", start);
    el("btnLow")?.addEventListener("click", () => setLowPower(!state.lowPower));
    el("btnPause")?.addEventListener("click", () => setPaused(!state.paused));
    el("btnWarp")?.addEventListener("click", warp);
    el("btnCopy")?.addEventListener("click", async () => {
      const txt = logEl()?.textContent || "";
      try{
        await navigator.clipboard.writeText(txt);
        log("[copy] copied console");
      }catch{
        log("[copy] clipboard blocked");
      }
    });

    window.addEventListener("resize", () => resize(), { passive: true });

    window.addEventListener("keydown", (e) => {
      const t = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
      if(t === "input" || t === "textarea") return;

      if(e.key === "Escape"){
        e.preventDefault();
        if(!state.started) return;
        setPaused(!state.paused);
        return;
      }
      if(!state.started) return;

      const step = state.lowPower ? 0.07 : 0.05;
      switch(e.key){
        case "ArrowUp":   e.preventDefault(); state.driftY -= step; break; // ↑ = up
        case "ArrowDown": e.preventDefault(); state.driftY += step; break;
        case "ArrowLeft": e.preventDefault(); state.driftX -= step; break;
        case "ArrowRight":e.preventDefault(); state.driftX += step; break;
        case " ":         e.preventDefault(); flash(); break;
      }
      state.driftX *= 0.98;
      state.driftY *= 0.98;
    }, { passive:false });
  }

  // init
  bind();
  resize();
  log("paprika-dream template loaded.");
  log("Click ENTER DREAM to begin.");
})();
