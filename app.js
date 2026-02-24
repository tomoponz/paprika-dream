// paprika-dream: scroll-based background switcher
// - No EnterDream, no canvas/WebGL.
// - Background changes when sections enter the viewport center.

(() => {
  "use strict";

  const layers = [document.getElementById("bgA"), document.getElementById("bgB")].filter(Boolean);
  const scenes = Array.from(document.querySelectorAll(".scene[data-bg]"));

  if(layers.length < 2 || scenes.length === 0) return;

  let active = 0;
  let currentUrl = "";

  function setLayerBg(layer, url){
    // normalize to avoid redundant sets
    layer.style.backgroundImage = `url("${url}")`;
  }

  function showBg(url){
    if(!url || url === currentUrl) return;
    currentUrl = url;

    const next = 1 - active;
    setLayerBg(layers[next], url);

    // cross-fade
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

  // initial background = first section
  showBg(scenes[0].dataset.bg);
  layers[active].classList.add("on");
  preload(scenes[0].dataset.bg);
  preload(scenes[1]?.dataset.bg);

  const io = new IntersectionObserver((entries) => {
    // pick the most visible intersecting section
    const visible = entries
      .filter(e => e.isIntersecting)
      .sort((a,b) => (b.intersectionRatio - a.intersectionRatio))[0];

    if(!visible) return;

    const url = visible.target.dataset.bg;
    showBg(url);

    // preload the next scene image (avoid flicker)
    const idx = scenes.indexOf(visible.target);
    preload(scenes[idx + 1]?.dataset.bg);
  }, {
    root: null,
    threshold: [0.25, 0.45, 0.65],
    // center-ish trigger zone
    rootMargin: "-35% 0px -35% 0px"
  });

  scenes.forEach(s => io.observe(s));
})();
