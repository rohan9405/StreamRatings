const UI = {
  tooltipEl: null,

  createTooltip() {
    if (this.tooltipEl) return;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'sr-custom-tooltip';
    tooltip.style.cssText = `
      position: fixed;
      background: #1a1a1a;
      color: #fff;
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      z-index: 99999;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.15s ease;
      border: 1px solid #f5c518;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      max-width: 280px;
      line-height: 1.5;
    `;
    document.body.appendChild(tooltip);
    this.tooltipEl = tooltip;
  },

  showTooltip(badge, html) {
    if (!this.tooltipEl) this.createTooltip();
    
    const rect = badge.getBoundingClientRect();
    this.tooltipEl.innerHTML = html;
    this.tooltipEl.style.opacity = '1';
    this.tooltipEl.style.left = `${rect.left + rect.width / 2}px`;
    this.tooltipEl.style.top = `${rect.top - 10}px`;
    this.tooltipEl.style.transform = 'translate(-50%, -100%)';
  },

  hideTooltip() {
    if (this.tooltipEl) {
      this.tooltipEl.style.opacity = '0';
    }
  },

  createBadge(card, initialState = "…") {
    // Check if badge already exists
    if (card.querySelector('.sr-badge')) return null;

    const badge = document.createElement('div');
    badge.className = 'sr-badge sr-loading';
    badge.textContent = initialState;
    
    // Prevent badge clicks from triggering card navigation immediately
    badge.addEventListener('click', (e) => {
      e.stopPropagation(); // Stop event bubbling to the card
    });

    // Simple positioning - adapter usually handles appending, 
    // but we can append here if the card is relative
    card.style.position = 'relative'; 
    card.appendChild(badge);

    return badge;
  },

  updateBadge(badge, data) {
    if (!data.found) {
      badge.textContent = "—";
      badge.classList.remove('sr-loading');
      badge.classList.add('sr-not-found');
      
      // Custom tooltip for not found
      badge.addEventListener('mouseenter', () => {
        this.showTooltip(badge, '<span style="color:#888">Rating not found in IMDb</span>');
      });
      badge.addEventListener('mouseleave', () => this.hideTooltip());
      return;
    }

    badge.textContent = data.imdbRating || "N/A";
    badge.classList.remove('sr-loading');
    badge.classList.add('sr-rated');
    
    // Create detailed tooltip with escaped content (XSS prevention)
    const imdbLink = data.imdbID ? `https://www.imdb.com/title/${data.imdbID}/` : null;
    const escapeHtml = (str) => {
      if (!str) return '';
      return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[m]));
    };
    const tooltipHtml = `
      <div style="font-weight:bold;color:#f5c518;margin-bottom:4px">${escapeHtml(data.title)} (${escapeHtml(data.year)})</div>
      ${data.genre ? `<div style="color:#ccc;font-size:11px">${escapeHtml(data.genre)}</div>` : ''}
      <div style="margin-top:6px;color:#fff">Rating: <strong style="color:#f5c518">${escapeHtml(data.imdbRating)}</strong> <span style="color:#888">(${escapeHtml(data.imdbVotes) || 'N/A'} votes)</span></div>
      ${imdbLink ? '<div style="margin-top:6px;color:#f5c518;font-size:11px">Click to open IMDb</div>' : ''}
    `;
    
    // Custom tooltip events
    badge.addEventListener('mouseenter', () => this.showTooltip(badge, tooltipHtml));
    badge.addEventListener('mouseleave', () => this.hideTooltip());
    
    // Click to open IMDb
    if (imdbLink) {
      badge.style.cursor = 'pointer';
      badge.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        window.open(imdbLink, '_blank');
      };
    }
  }
};

window.StreamRatingsUI = UI;
