/**
 * Soup of the Day
 * Displays a daily random photo, seeded by today's date
 */

(function() {
  'use strict';

  // Simple hash function for date string
  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Get today's date as YYYY-MM-DD string
  function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  async function loadSoupOfTheDay() {
    const container = document.getElementById('photo-container');

    try {
      const response = await fetch('../data/images.json');
      if (!response.ok) throw new Error('Failed to load images');

      const images = await response.json();
      if (images.length === 0) {
        container.innerHTML = '<p class="loading">No soup today...</p>';
        return;
      }

      // Select image based on today's date
      const todayHash = hashCode(getTodayString());
      const index = todayHash % images.length;
      const selectedImage = images[index];

      // Create and display image
      const img = document.createElement('img');
      img.src = `../images/${selectedImage.filename}`;
      img.alt = 'Soup of the Day';
      container.appendChild(img);

    } catch (error) {
      console.error('Failed to load soup:', error);
      container.innerHTML = '<p class="loading">Failed to load today\'s soup</p>';
    }
  }

  // Load on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSoupOfTheDay);
  } else {
    loadSoupOfTheDay();
  }
})();
