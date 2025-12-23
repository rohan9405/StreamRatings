const NetflixAdapter = {
  domain: 'netflix.com',
  
  findCards() {
    // Netflix structure varies, trying common selectors
    return document.querySelectorAll('.title-card-container, .slider-refocus');
  },

  extractTitle(card) {
    // 1. Aria label on link
    const link = card.querySelector('a');
    if (link && link.getAttribute('aria-label')) {
      return link.getAttribute('aria-label');
    }
    
    // 2. Fallback text content (usually hidden but present)
    const fallback = card.querySelector('.fallback-text');
    if (fallback) return fallback.textContent;

    return null;
  },

  extractYear(card) {
    // Hard to find on browse pages, usually null
    return null; 
  },

  getStableKey(card) {
    const title = this.extractTitle(card);
    return title ? title.replace(/\s+/g, '-').toLowerCase() : null;
  }
};

if (window.location.hostname.includes('netflix.com')) {
  window.StreamRatingsAdapter = NetflixAdapter;
}
