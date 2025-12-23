const PrimeAdapter = {
  domain: 'primevideo.com',

  findCards() {
    // Multiple selector strategies for Prime Video's varying layouts
    const selectors = [
      // Current Prime Video selectors (2024+)
      '[data-testid="card"]',
      '[data-testid="packshot"]', 
      '.DVWebNode-packshot-image-wrapper',
      '.DVWebNode-detail-packshot-wrapper',
      // Legacy selectors
      '.tst-packshot',
      'article.tst-hover-container',
      // Carousel items
      '.DVWebNode-card-content-wrapper',
      '[data-card-title]',
      // Grid items with images
      '.av-hover-wrapper',
      '.av-packshot'
    ];
    
    const cards = document.querySelectorAll(selectors.join(', '));
    console.log('[SR Prime] Found', cards.length, 'cards');
    return cards;
  },

  extractTitle(card) {
    let title = null;
    
    // Data attributes first (most reliable)
    if (card.getAttribute('data-card-title')) {
      title = card.getAttribute('data-card-title');
    }
    // Aria-label on the card itself
    else if (card.getAttribute('aria-label')) {
      title = card.getAttribute('aria-label');
    }
    // Image alt tag
    else {
      const img = card.querySelector('img');
      if (img && img.alt && img.alt.length > 1) {
        title = img.alt;
      }
    }
    // Aria label on links
    if (!title) {
      const link = card.querySelector('a[aria-label]');
      if (link) {
        title = link.getAttribute('aria-label');
      }
    }
    // Title text elements
    if (!title) {
      const titleEl = card.querySelector('[data-testid="title"], .av-packshot-title, .DVWebNode-card-title');
      if (titleEl && titleEl.textContent) {
        title = titleEl.textContent.trim();
      }
    }

    if (!title) return null;
    
    // Clean up title - remove "- Season X" suffix for better OMDb matching
    title = title.replace(/\s*[-–]\s*Season\s*\d+/i, '').trim();
    // Also remove "Season X" without dash
    title = title.replace(/\s+Season\s*\d+$/i, '').trim();
    
    return title;
  },

  extractYear(card) {
    // Look for year in metadata
    const metaEl = card.querySelector('[data-testid="metadata"], .av-packshot-metadata');
    if (metaEl) {
      const yearMatch = metaEl.textContent.match(/\b(19|20)\d{2}\b/);
      if (yearMatch) return yearMatch[0];
    }
    return null;
  },

  getStableKey(card) {
    const title = this.extractTitle(card);
    return title ? title.replace(/\s+/g, '-').toLowerCase() : null;
  }
};

if (window.location.hostname.includes('primevideo.com') || window.location.hostname.includes('amazon.com')) {
  window.StreamRatingsAdapter = PrimeAdapter;
}
