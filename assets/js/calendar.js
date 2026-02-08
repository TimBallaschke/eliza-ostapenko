/* ===== Calendar.js ===== */

function isMobileDevice() {
  return window.innerWidth < 768;
}

/* ---------- Layout helpers ---------- */

// Set .event-content height to match visible child (preview or full)
function setEventContentHeight() {
  const eventContentElements = document.querySelectorAll('.event-content');
  eventContentElements.forEach(eventContent => {
    const previewContainer = eventContent.querySelector('.event-preview-container');
    const fullContainer = eventContent.querySelector('.event-full-container');

    if (!previewContainer || !fullContainer) return;

    if (eventContent.classList.contains('preview-visible')) {
      eventContent.style.height = previewContainer.scrollHeight + 'px';
    } else {
      eventContent.style.height = fullContainer.scrollHeight + 'px';
    }
  });
}

/**
 * Wait for all current .event-image <img> elements to finish loading their *low-res* src.
 * (Your markup already sets a tiny low-res src directly on <img>.)
 */
function waitForInitialEventImages() {
  const imgs = Array.from(document.querySelectorAll('.event-image'));
  if (!imgs.length) return Promise.resolve();

  let done = 0;
  return new Promise(resolve => {
    const mark = () => { 
      if (++done === imgs.length) {
        document.dispatchEvent(new CustomEvent('calendarImagesLoaded'));
        resolve();
      }
    };
    imgs.forEach(img => {
      if (img.complete && img.naturalWidth > 0) {
        mark();
      } else {
        img.addEventListener('load', mark, { once: true });
        img.addEventListener('error', mark, { once: true });
      }
    });
  });
}

/* ---------- URL helpers (optional) ---------- */

function createEventSlug(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function updateCalendarEventURL(eventTitle) {
  if (!eventTitle) {
    if (window.history && window.history.pushState) window.history.pushState({}, '', '/');
    else window.location.hash = '';
    return;
  }
  const slug = createEventSlug(eventTitle);
  const newURL = `/${slug}-calendar`;
  if (window.history && window.history.pushState) {
    window.history.pushState({ calendarEvent: eventTitle }, eventTitle, newURL);
  } else {
    window.location.hash = slug + '-calendar';
  }
}

/* ---------- Toggle preview/full info ---------- */

async function toggleFullInformation(e) {
  const eventContent = e.target.closest('.event-content');
  if (!eventContent) return;

  const previewContainer = eventContent.querySelector('.event-preview-container');
  const fullContainer = eventContent.querySelector('.event-full-container');
  if (!previewContainer || !fullContainer) return;

  const scrollContainer = document.querySelector('.calendar-scroll-container') || window;
  const currentScrollTop = scrollContainer.scrollTop || window.pageYOffset;
  const elementTop = eventContent.getBoundingClientRect().top + currentScrollTop;

  if (eventContent.classList.contains('preview-visible')) {
    // Expanding to full view
    previewContainer.classList.add('no-opacity');
    fullContainer.classList.remove('display-none');

    // Update URL with calendar event name (kept as in your code)
    const eventContainer = eventContent.closest('.event-container');
    const eventTitle = eventContainer?.querySelector('.event-title')?.textContent || 'calendar-event';
    const urlSlug = eventTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    window.history.pushState({}, '', `/calendar/${urlSlug}`);

    eventContent.style.transition = 'height 0.5s ease-in-out';

    setTimeout(() => {
      const newHeight = fullContainer.scrollHeight;
      const heightDifference = newHeight - eventContent.offsetHeight;

      eventContent.style.height = newHeight + 'px';

      if (elementTop < currentScrollTop) {
        const newScrollTop = currentScrollTop + heightDifference;
        scrollContainer.scrollTo({ top: newScrollTop, behavior: 'smooth' });
      }
    }, 250);

    setTimeout(async () => {
      previewContainer.classList.add('display-none');
      fullContainer.classList.remove('no-opacity');
      eventContent.classList.remove('preview-visible');
      eventContent.style.transition = '';

      // Load high-res images for THIS event, then re-measure height
      await loadHighResEventImagesForEvent(eventContent);
      setEventContentHeight();

    }, 750);

  } else {
    // Collapsing to preview view
    previewContainer.classList.remove('display-none');
    fullContainer.classList.add('no-opacity');

    eventContent.style.transition = 'height 0.5s ease-in-out';

    setTimeout(() => {
      const newHeight = previewContainer.scrollHeight;
      const heightDifference = eventContent.offsetHeight - newHeight;

      if (elementTop < currentScrollTop) {
        const newScrollTop = Math.max(0, currentScrollTop - heightDifference);
        scrollContainer.scrollTo({ top: newScrollTop, behavior: 'smooth' });
      }

      setTimeout(() => {
        eventContent.style.height = newHeight + 'px';
      }, 250);
    }, 250);

    setTimeout(() => {
      previewContainer.classList.remove('no-opacity');
      fullContainer.classList.add('display-none');
      eventContent.classList.add('preview-visible');

      // Reset URL when collapsing event
      window.history.pushState({}, '', '/calendar');

      eventContent.style.transition = '';
      // No high-res loading on collapse
    }, 1000);
  }
}

/* ---------- Image overlay (unchanged core, minor tidy) ---------- */

function openCalendarImage(image) {
  // if (isMobileDevice()) return;

  const overlay = document.createElement('div');
  overlay.className = 'calendar-image-overlay';

  const clonedImage = image.cloneNode(true);
  clonedImage.classList.add('calendar-image-clone');
  clonedImage.style.position = 'fixed';

  const captionDiv = document.createElement('div');
  captionDiv.className = 'event-image-credits';

  const eventImageContainer = image.closest('.event-image-container');
  const hiddenCredits = eventImageContainer?.querySelector('.event-image-credits-hidden');
  captionDiv.textContent = hiddenCredits ? hiddenCredits.textContent : '';

  const rect = image.getBoundingClientRect();
  clonedImage.style.top = rect.top + 'px';
  clonedImage.style.left = rect.left + 'px';
  clonedImage.style.width = rect.width + 'px';
  clonedImage.style.height = rect.height + 'px';

  captionDiv.style.opacity = '0';
  clonedImage.style.transition = 'all 0.5s ease-in-out';

  document.body.appendChild(overlay);

  setTimeout(() => {
    overlay.classList.add('visible');
    document.body.appendChild(clonedImage);
    document.body.appendChild(captionDiv);
  }, 10);

  setTimeout(() => {
    image.style.opacity = '0';

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const maxWidth = viewportWidth * 0.9;
    const maxHeight = viewportHeight * 0.9;

    const aspectRatio = rect.width / rect.height;
    let newWidth, newHeight;

    if (rect.width / maxWidth > rect.height / maxHeight) {
      newWidth = maxWidth;
      newHeight = maxWidth / aspectRatio;
    } else {
      newHeight = maxHeight;
      newWidth = maxHeight * aspectRatio;
    }

    const centerX = (viewportWidth - newWidth) / 2;
    const centerY = (viewportHeight - newHeight) / 2;

    clonedImage.style.transition = 'all 0.5s ease-in-out';
    clonedImage.style.top = centerY + 'px';
    clonedImage.style.left = centerX + 'px';
    clonedImage.style.width = newWidth + 'px';
    clonedImage.style.height = newHeight + 'px';

    captionDiv.style.top = (centerY + newHeight) + 'px';
    captionDiv.style.left = centerX + 'px';
    captionDiv.style.width = newWidth + 'px';

    setTimeout(() => { captionDiv.style.opacity = '1'; }, 500);

    const updateImageOnResize = () => {
      const newViewportWidth = window.innerWidth;
      const newViewportHeight = window.innerHeight;

      const updatedRect = image.getBoundingClientRect();
      rect.top = updatedRect.top;
      rect.left = updatedRect.left;
      rect.width = updatedRect.width;
      rect.height = updatedRect.height;

      const newMaxWidth = newViewportWidth * 0.9;
      const newMaxHeight = newViewportHeight * 0.9;

      let updatedWidth, updatedHeight;
      if (rect.width / newMaxWidth > rect.height / newMaxHeight) {
        updatedWidth = newMaxWidth;
        updatedHeight = newMaxWidth / aspectRatio;
      } else {
        updatedHeight = newMaxHeight;
        updatedWidth = newMaxHeight * aspectRatio;
      }

      const updatedCenterX = (newViewportWidth - updatedWidth) / 2;
      const updatedCenterY = (newViewportHeight - updatedHeight) / 2;

      clonedImage.style.top = updatedCenterY + 'px';
      clonedImage.style.left = updatedCenterX + 'px';
      clonedImage.style.width = updatedWidth + 'px';
      clonedImage.style.height = updatedHeight + 'px';

      captionDiv.style.top = (updatedCenterY + updatedHeight) + 'px';
      captionDiv.style.left = updatedCenterX + 'px';
      captionDiv.style.width = updatedWidth + 'px';
    };

    window.addEventListener('resize', updateImageOnResize);
    overlay.updateImageOnResize = updateImageOnResize;

    function closeImageOverlay() {
      clonedImage.style.transition = 'all 0.5s ease-in-out';
      overlay.classList.remove('visible');

      clonedImage.style.top = rect.top + 'px';
      clonedImage.style.left = rect.left + 'px';
      clonedImage.style.width = rect.width + 'px';
      clonedImage.style.height = rect.height + 'px';

      captionDiv.style.opacity = '0';

      setTimeout(() => {
        overlay.parentNode && overlay.parentNode.removeChild(overlay);
        clonedImage.parentNode && clonedImage.parentNode.removeChild(clonedImage);
        captionDiv.parentNode && captionDiv.parentNode.removeChild(captionDiv);
        image.style.opacity = '';
      }, 500);
    }

    overlay.addEventListener('click', closeImageOverlay);
    clonedImage.addEventListener('click', closeImageOverlay);
  }, 100);
}

/* ---------- High-res loading on expand ---------- */

/**
 * Load high-res images for a specific expanded event with retry mechanism.
 * Swaps `img.src` from tiny low-res to `data-high-res`, then resolves.
 * Includes exponential backoff retry logic for failed loads.
 */
function loadHighResEventImagesForEvent(eventContent) {
  const eventImages = eventContent.querySelectorAll('.event-image[data-high-res]');
  if (!eventImages.length) return Promise.resolve();

  let done = 0;
  return new Promise(resolve => {
    eventImages.forEach((img, index) => {
      const highResUrl = img.dataset.highRes;
      if (!highResUrl || img.classList.contains('high-res-loaded')) {
        if (++done === eventImages.length) resolve();
        return;
      }

      // Retry configuration
      const maxRetries = 3;
      const baseDelay = 1000; // 1 second base delay
      let retryCount = 0;

      const attemptLoad = () => {
        const hi = new Image();
        
        hi.onload = () => {
          img.src = highResUrl;
          img.classList.add('high-res-loaded');
          img.classList.remove('blur');
          img.removeAttribute('data-high-res');
          if (++done === eventImages.length) resolve();
        };
        
        hi.onerror = () => {
          retryCount++;
          
          if (retryCount <= maxRetries) {
            // Exponential backoff: baseDelay * 2^(retryCount-1)
            const delay = baseDelay * Math.pow(2, retryCount - 1);
            console.warn(`⚠️ Failed to load high-res event image ${index + 1}, retrying in ${delay}ms (attempt ${retryCount}/${maxRetries}):`, highResUrl);
            
            setTimeout(() => {
              attemptLoad();
            }, delay);
          } else {
            console.error(`❌ Failed to load high-res event image ${index + 1} after ${maxRetries} attempts:`, highResUrl);
            // Keep the low-res image and mark as failed
            img.classList.add('high-res-failed');
            if (++done === eventImages.length) resolve();
          }
        };
        
        hi.src = highResUrl;
      };

      // Start the first attempt
      attemptLoad();
    });
  });
}

/* ---------- Bootstrapping ---------- */
document.addEventListener('progressive:lowres-ready', () => {
  setTimeout(() => {
    setEventContentHeight();
  }, 2000);
});

document.addEventListener('DOMContentLoaded', () => {
  setEventContentHeight();

  setTimeout(() => {
    setEventContentHeight();
  }, 2000);
});


document.addEventListener('DOMContentLoaded', async () => {
  // Wait for all tiny low-res images in the calendar to be ready
  await waitForInitialEventImages();
  setEventContentHeight();

  // Wire up buttons (pass the event parameter!)
  document.querySelectorAll('.event-more-information-button')
    .forEach(btn => btn.addEventListener('click', (e) => toggleFullInformation(e)));
  document.querySelectorAll('.event-less-information-button')
    .forEach(btn => btn.addEventListener('click', (e) => toggleFullInformation(e)));

  // Click-to-open overlay
  document.querySelectorAll('.event-image')
    .forEach(image => image.addEventListener('click', () => openCalendarImage(image)));
});


// Recompute heights on resize (after images are known)
window.addEventListener('resize', async () => {
  await waitForInitialEventImages();
  setEventContentHeight();
});
