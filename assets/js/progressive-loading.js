document.addEventListener('DOMContentLoaded', () => {
    const LOW_SELECTOR = '.progressive-image';
    const BATCH_SIZE = 4;     // how many image *sets* per batch
    const BATCH_DELAY = 150;  // ms between batches (tweak or set to 0)
  
    const imgs = Array.from(document.querySelectorAll(LOW_SELECTOR));
    if (!imgs.length) return;
  
    console.log(`[Init] Found ${imgs.length} low-res images`);
  
    // Promise other scripts can await (e.g., grid)
    let resolveProgressiveReady;
    window.progressiveReady = new Promise(resolve => { resolveProgressiveReady = resolve; });
  
    /* -------------------- Helpers: grouping & upgrade -------------------- */
    function getArtworkKey(img) {
      const dk = img.getAttribute && img.getAttribute('data-key');
      if (dk) return dk.toLowerCase();
      for (const cls of img.classList) {
        if (/^artwork-[a-z0-9-]+-\d+$/i.test(cls)) return cls.toLowerCase();
      }
      return null;
    }
  
    function upgradeToHighRes(img) {
      const srcset = img.getAttribute('data-srcset');
      const sizes  = img.getAttribute('data-sizes');
      const direct = img.getAttribute('data-high-res'); // fallback if provided
  
      console.log(`    [Upgrade]`, img.alt || img.className);
      img.setAttribute('fetchpriority', 'high');
      img.setAttribute('decoding', 'sync');
  
      if (sizes)  img.setAttribute('sizes', sizes);
      if (srcset) img.setAttribute('srcset', srcset);
      else if (direct) img.setAttribute('src', direct);
    }
  
    // Build key -> nodes map up front so priority can work immediately
    const map = new Map();
    const order = [];
    imgs.forEach(img => {
      const key = getArtworkKey(img);
      if (!key) {
        console.warn(`[Skip] Could not derive key for`, img);
        return;
      }
      if (!map.has(key)) { map.set(key, []); order.push(key); }
      map.get(key).push(img);
    });
    console.log(`[Map] Built ${order.length} image sets`);
  
    const upgradedKeys = new Set();  // sets upgraded either by priority or batch
    let allDone = false;
  
    /* -------------------- Priority path (works immediately) -------------------- */
    // Track which sets are currently visible
    const inViewKeys = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const img = entry.target;
        const key = getArtworkKey(img);
        if (!key || upgradedKeys.has(key)) return;
        if (entry.isIntersecting && entry.intersectionRatio > 0) inViewKeys.add(key);
        else inViewKeys.delete(key);
      });
    }, { root: null, rootMargin: '0px', threshold: [0, 0.05, 0.1, 0.25] });
    imgs.forEach(img => io.observe(img));
  
    // Watch for body.detail-view to enable priority upgrades
    let detailPriorityActive = false;
    const mo = new MutationObserver(() => {
      if (document.body.classList.contains('detail-view')) {
        if (!detailPriorityActive) {
          detailPriorityActive = true;
          console.log('[Detail Priority] detail-view detected → prioritizing in-view images (even before all low-res)');
          prioritizeInViewNow();
        }
      }
    });
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  
    // If the class is already present on load, activate immediately
    if (document.body.classList.contains('detail-view')) {
      detailPriorityActive = true;
      prioritizeInViewNow();
    }
  
    // Re-check while active
    const recheck = () => {
      if (!detailPriorityActive || allDone) return;
      prioritizeInViewNow();
    };
    window.addEventListener('scroll', recheck, { passive: true });
    window.addEventListener('resize', recheck);
  
    function prioritizeInViewNow() {
      if (!detailPriorityActive || allDone) return;
      const keys = Array.from(inViewKeys).filter(k => !upgradedKeys.has(k) && map.has(k));
      if (!keys.length) return;
      console.log(`[Detail Priority] Upgrading ${keys.length} in-view sets now`, keys);
      upgradeKeysNow(keys);
    }
  
    function upgradeKeysNow(keys) {
      keys.forEach(key => {
        const group = map.get(key) || [];
        if (upgradedKeys.has(key)) return;
        group.forEach(img => upgradeToHighRes(img));
        upgradedKeys.add(key);
      });
      checkAllDone();
    }
  
    function checkAllDone() {
      if (upgradedKeys.size >= order.length && !allDone) {
        allDone = true;
        console.log(`[Done] All images upgraded`);
        window.dispatchEvent(new Event('progressive:upgrade-done'));
        // Cleanup
        io.disconnect();
        mo.disconnect();
        window.removeEventListener('scroll', recheck);
        window.removeEventListener('resize', recheck);
      }
    }
  
    /* -------------------- Low-res wait (for normal batching) -------------------- */
    let lowDone = 0;
    const markLowRes = (img) => {
      lowDone++;
      console.log(`[LowRes] ${lowDone}/${imgs.length} finished →`, img.alt || img.className);

      if (lowDone === 60) {
      }

      if (lowDone === imgs.length) {
        console.log(`[All LowRes Loaded] Starting batched upgrade for remaining sets…`);
        window.dispatchEvent(new Event('progressive:lowres-ready'));
        resolveProgressiveReady();
        startBatchedUpgrade();  // batch only those not upgraded yet
      }
    };
  
    imgs.forEach(img => {
      if (img.complete) {
        markLowRes(img);
      } else {
        img.addEventListener('load',  () => markLowRes(img), { once: true });
        img.addEventListener('error', () => markLowRes(img), { once: true });
      }
    });
  
    /* -------------------- Batch loop (runs after all low-res) -------------------- */
    function startBatchedUpgrade() {
      let cursor = 0;
  
      function upgradeBatch() {
        if (allDone) return;
  
        // Collect next un-upgraded keys
        const pending = [];
        while (cursor < order.length && pending.length < BATCH_SIZE) {
          const k = order[cursor++];
          if (!upgradedKeys.has(k)) pending.push(k);
        }
  
        if (!pending.length) {
          // Sweep any remaining out-of-order keys (if priority upgraded some ahead)
          const remaining = order.filter(k => !upgradedKeys.has(k));
          if (!remaining.length) return checkAllDone();
          const slice = remaining.slice(0, Math.min(BATCH_SIZE, remaining.length));
          console.log(`[Batch - Sweep] Upgrading sets`, slice);
          upgradeKeysNow(slice);
        } else {
          console.log(`[Batch] Upgrading sets`, pending);
          pending.forEach(k => {
            (map.get(k) || []).forEach(img => upgradeToHighRes(img));
            upgradedKeys.add(k);
          });
          checkAllDone();
        }
  
        if (!allDone) {
          // If detail priority is active, immediately handle any newly-visible sets
          if (detailPriorityActive) prioritizeInViewNow();
          console.log(`[Next Batch Scheduled] in ${BATCH_DELAY}ms`);
          setTimeout(upgradeBatch, BATCH_DELAY);
        }
      }
  
      upgradeBatch();
    }
  
    // (Optional) Expose a manual trigger if you ever want to force priority upgrades
    window.progressivePrioritizeVisible = () => prioritizeInViewNow();
  
    window.addEventListener('progressive:upgrade-done', () => {
      console.log('[Event] progressive:upgrade-done - All images have been upgraded to high-resolution!');
    });
  });
  