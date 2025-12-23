const NetflixAdapter = {
  domain: 'netflix.com',
  
  findCards() {
    // Netflix structure varies, trying common selectors
    return document.querySelectorAll('.title-card-container, .slider-refocus');
  },

  extractTitle(card) {
    let title = null;
    
    // 1. Aria label on link
    const link = card.querySelector('a');
    if (link && link.getAttribute('aria-label')) {
      title = link.getAttribute('aria-label');
    }
    
    // 2. Fallback text content (usually hidden but present)
    if (!title) {
      const fallback = card.querySelector('.fallback-text');
      if (fallback) title = fallback.textContent;
    }

    if (!title) return null;
    
    // Clean up title: remove (Hindi), (Year), etc.
    title = title
      .replace(/\s*\([^)]*\)\s*/g, ' ')  // Remove (anything) patterns
      .replace(/\s*:\s*/g, ': ')          // Normalize colons
      .trim();
    
    return title;
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
