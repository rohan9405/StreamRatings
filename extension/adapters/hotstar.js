const HotstarAdapter = {
  domain: 'hotstar.com',

  findCards() {
    // Hotstar selectors - often change, best effort
    return document.querySelectorAll('.tray-container a, .shimmer-container a, .LDS-Card');
  },

  extractTitle(card) {
    // Aria label usually has "Watch <Title>"
    const aria = card.getAttribute('aria-label');
    if (aria) {
      return aria.replace(/^Watch\s+/i, '');
    }

    // Image alt
    const img = card.querySelector('img');
    if (img && img.alt) return img.alt;

    return null;
  },

  extractYear(card) {
    return null;
  },

  getStableKey(card) {
    const title = this.extractTitle(card);
    return title ? title.replace(/\s+/g, '-').toLowerCase() : null;
  }
};

if (window.location.hostname.includes('hotstar.com')) {
  window.StreamRatingsAdapter = HotstarAdapter;
}
