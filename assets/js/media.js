(() => {
  document.documentElement.dataset.js = 'enabled';
  const scenes = [...document.querySelectorAll('[data-scene]')];
  const pending = new WeakMap();
  const loadImage = async (image) => {
    if (image.dataset.src) {
      image.src = image.dataset.src;
      delete image.dataset.src;
    }
    try {
      await image.decode();
    } catch {
      if (image.dataset.fallback) {
        image.classList.remove('restored-art');
        image.src = image.dataset.fallback;
        delete image.dataset.fallback;
        await image.decode().catch(() => {});
      }
    }
  };

  const prepare = (scene) => {
    if (!pending.has(scene)) {
      scene.classList.add('media-loaded');
      const images = [...scene.querySelectorAll('img')].map(loadImage);
      scene.querySelectorAll('iframe[data-src]').forEach(frame => {
        frame.src = frame.dataset.src;
        delete frame.dataset.src;
      });
      pending.set(scene, Promise.allSettled(images));
    }
    return pending.get(scene);
  };

  // Never let an unavailable image hide otherwise usable text indefinitely.
  window.invitationMedia = {
    ready: scene => Promise.race([prepare(scene), new Promise(resolve => setTimeout(resolve, 5000))]),
  };

  const firstReady = window.invitationMedia.ready(scenes[0]);
  if ('IntersectionObserver' in window) {
    // Let the opening finish first, then warm artwork about half a screen ahead.
    firstReady.finally(() => {
      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            prepare(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, { rootMargin: '60% 0px', threshold: 0 });
      scenes.slice(1).forEach(scene => observer.observe(scene));
    });
  } else scenes.forEach(prepare);
})();
