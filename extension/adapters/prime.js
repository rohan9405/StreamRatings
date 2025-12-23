const PrimeAdapter = {
  domain: 'primevideo.com',

  findCards() {
    return document.querySelectorAll('.tst-packshot, article.tst-hover-container');
  },

  extractTitle(card) {
    // Image alt tag is often best on Prime
    const img = card.querySelector('img');
    if (img && img.alt) return img.alt;

    // Aria label on links
    const link = card.querySelector('a');
    if (link && link.getAttribute('aria-label')) return link.getAttribute('aria-label');

    return null;
  },

  extractYear(card) {
    return null; // Often not visible on grid
  },

  getStableKey(card) {
    const title = this.extractTitle(card);
    return title ? title.replace(/\s+/g, '-').toLowerCase() : null;
  }
};

if (window.location.hostname.includes('primevideo.com') || window.location.hostname.includes('amazon.com')) {
  window.StreamRatingsAdapter = PrimeAdapter;
}
