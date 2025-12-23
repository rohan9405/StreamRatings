const UI = {
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
      badge.title = "Rating not found in IMDb database";
      return;
    }

    badge.textContent = data.imdbRating || "N/A";
    badge.classList.remove('sr-loading');
    badge.classList.add('sr-rated');
    
    // Create detailed tooltip with year, genre, and link info
    const imdbLink = data.imdbID ? `https://www.imdb.com/title/${data.imdbID}/` : null;
    const tooltipParts = [
      `${data.title} (${data.year})`,
      data.genre ? `Genre: ${data.genre}` : null,
      `Rating: ${data.imdbRating} (${data.imdbVotes || 'N/A'} votes)`,
      imdbLink ? `Click to open IMDb` : null
    ].filter(Boolean);
    
    badge.title = tooltipParts.join('\n');
    
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
