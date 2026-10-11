const HotstarAdapter = {
  domain: 'hotstar.com',

  findCards() {
    // Poster tiles: <div data-testid="action" aria-label="Kanguva,Movie">.
    // Only movies and shows - episode clips and editorial banners have no IMDb entry.
    return document.querySelectorAll(
      '[data-testid="action"][aria-label$=",Movie"], [data-testid="action"][aria-label$=",Show"]'
    );
  },

  extractTitle(card) {
    // "I, Nobody,Movie" -> "I, Nobody" (strip only the trailing type)
    const aria = card.getAttribute('aria-label');
    if (aria) {
      const title = aria.replace(/,\s*(Movie|Show)$/i, '').trim();
      if (title) return title;
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
