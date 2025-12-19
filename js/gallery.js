/**
 * soup.pics Gallery
 * Randomized masonry photo gallery with lightbox
 */

(function() {
  'use strict';

  // Calculate and set optimal column width based on viewport
  function updateColumnWidth() {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;

    const minWidth = 250;
    // Use inner content width (clientWidth minus padding)
    const galleryStyle = getComputedStyle(gallery);
    const paddingLeft = parseFloat(galleryStyle.paddingLeft) || 0;
    const paddingRight = parseFloat(galleryStyle.paddingRight) || 0;
    const containerWidth = gallery.clientWidth - paddingLeft - paddingRight;
    const numColumns = Math.max(1, Math.floor(containerWidth / minWidth));
    const columnWidth = containerWidth / numColumns;

    // Set pixel width directly on sizer
    const sizer = gallery.querySelector('.gallery-sizer');
    if (sizer) sizer.style.width = columnWidth + 'px';

    // Set pixel width on all gallery items
    gallery.querySelectorAll('.gallery-item').forEach(item => {
      item.style.width = columnWidth + 'px';
    });

    // Trigger Masonry relayout if initialized
    if (window.msnry) {
      window.msnry.layout();
    }
  }

  // Fisher-Yates shuffle for unbiased randomization
  function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Create gallery item element
  function createGalleryItem(image) {
    const item = document.createElement('div');
    item.className = 'gallery-item';

    const link = document.createElement('a');
    link.href = `images/${image.filename}`;
    link.className = 'glightbox';

    const img = document.createElement('img');
    img.src = `images/${image.filename}`;
    img.alt = image.filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.width = image.width;
    img.height = image.height;

    // Handle successful load
    img.addEventListener('load', function() {
      this.classList.add('loaded');
    });

    // Handle failed load - hide the item
    img.addEventListener('error', function() {
      item.classList.add('hidden');
      // Trigger masonry relayout if available
      if (window.msnry) {
        window.msnry.layout();
      }
    });

    link.appendChild(img);
    item.appendChild(link);

    return item;
  }

  // Initialize the gallery
  async function initGallery() {
    const gallery = document.getElementById('gallery');

    try {
      // Fetch image manifest
      const response = await fetch('data/images.json');
      if (!response.ok) throw new Error('Failed to load images.json');

      const images = await response.json();

      // Show message if no images
      if (images.length === 0) {
        gallery.innerHTML = '<p style="color:#666;text-align:center;padding:40px;">No images yet</p>';
        return;
      }

      // Randomize order
      const shuffledImages = shuffle(images);

      // Build gallery DOM
      const fragment = document.createDocumentFragment();
      shuffledImages.forEach(image => {
        fragment.appendChild(createGalleryItem(image));
      });
      gallery.appendChild(fragment);

      // Calculate initial column width
      updateColumnWidth();

      // Initialize Masonry
      window.msnry = new Masonry(gallery, {
        itemSelector: '.gallery-item',
        columnWidth: '.gallery-sizer',
        gutter: 0,
        percentPosition: false
      });

      // Recalculate on window resize
      window.addEventListener('resize', updateColumnWidth);

      // Relayout as each image loads
      imagesLoaded(gallery).on('progress', function() {
        window.msnry.layout();
      });

      // Initialize GLightbox after images start loading
      const lightbox = GLightbox({
        selector: '.glightbox',
        touchNavigation: true,
        keyboardNavigation: true,
        loop: true,
        preload: true,
        openEffect: 'fade',
        closeEffect: 'fade',
        cssEffects: {
          fade: { in: 'fadeIn', out: 'fadeOut' }
        }
      });

      // Add custom counter element
      const counter = document.createElement('div');
      counter.className = 'glightbox-counter';
      document.body.appendChild(counter);

      // Update counter on slide change
      lightbox.on('slide_changed', function({ current }) {
        counter.textContent = `${current.index + 1} / ${shuffledImages.length}`;
      });

      // Show counter when lightbox opens
      lightbox.on('open', function() {
        counter.style.display = 'block';
        counter.textContent = `1 / ${shuffledImages.length}`;
      });

      // Hide counter when lightbox closes
      lightbox.on('close', function() {
        counter.style.display = 'none';
      });

      // Initially hide counter
      counter.style.display = 'none';

    } catch (error) {
      console.error('Gallery initialization failed:', error);
      gallery.innerHTML = '<p style="color:#c00;text-align:center;padding:40px;">Failed to load gallery</p>';
    }
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGallery);
  } else {
    initGallery();
  }

})();
