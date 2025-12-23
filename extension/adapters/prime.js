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
    // Data attributes first (most reliable)
    if (card.getAttribute('data-card-title')) {
      return card.getAttribute('data-card-title');
    }
    
    // Aria-label on the card itself
    if (card.getAttribute('aria-label')) {
      return card.getAttribute('aria-label');
    }
    
    // Image alt tag
    const img = card.querySelector('img');
    if (img && img.alt && img.alt.length > 1) {
      return img.alt;
    }
    
    // Aria label on links
    const link = card.querySelector('a[aria-label]');
    if (link) {
      return link.getAttribute('aria-label');
    }
    
    // Title text elements
    const titleEl = card.querySelector('[data-testid="title"], .av-packshot-title, .DVWebNode-card-title');
    if (titleEl && titleEl.textContent) {
      return titleEl.textContent.trim();
    }

    return null;
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
