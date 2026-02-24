// paprika-dream: scroll-based background switcher + tiny UI updates
// - No EnterDream, no canvas/WebGL.
// - Background changes when sections enter the viewport center.
// - Updates header "now" label + progress bar.
// - Adds lightweight reveal animation (opacity/transform only).

(() => {
  "use strict";

  const layers = [document.getElementById("bgA"), document.getElementById("bgB")].filter(Boolean);
  const scenes = Array.from(document.querySelectorAll(".scene[data-bg]"));
  const nowName = document.getElementById("nowName");
  const bar = document.getElementById("progressBar");

  if(layers.length < 2 || scenes.length === 0) return;

  let active = 0;
  let currentUrl = "";

  function setLayerBg(layer, url){
    layer.style.backgroundImage = `url("${url}")`;
  }

  function showBg(url){
    if(!url || url === currentUrl) return;
    currentUrl = url;

    const next = 1 - active;
    setLayerBg(layers[next], url);

    layers[next].classList.add("on");
    layers[active].classList.remove("on");
    active = next;
  }

  // Minimal preloading: load current + next only
  const preloadCache = new Set();
  function preload(url){
    if(!url || preloadCache.has(url)) return;
    preloadCache.add(url);
    const img = new Image();
    img.decoding = "async";
    img.loading = "eager";
    img.src = url;
  }

  // reveal helper
  function reveal(el){
    el.classList.add("reveal");
    requestAnimationFrame(() => el.classList.add("reveal-on"));
  }
  scenes.forEach(s => reveal(s.querySelector(".panel") || s));

  // initial background = first section
  showBg(scenes[0].dataset.bg);
  layers[active].classList.add("on");
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
})();
