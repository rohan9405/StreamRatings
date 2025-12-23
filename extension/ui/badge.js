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
      return;
    }

    badge.textContent = data.imdbRating || "N/A";
    badge.classList.remove('sr-loading');
    badge.classList.add('sr-rated');
    
    // Create detailed tooltip
    const imdbLink = data.imdbID ? `https://www.imdb.com/title/${data.imdbID}/` : null;
    badge.title = `${data.title} (${data.year})`;
    
    // Add hover tooltip with more details
    badge.setAttribute('data-title', data.title);
    badge.setAttribute('data-year', data.year);
    badge.setAttribute('data-genre', data.genre || 'N/A');
    badge.setAttribute('data-rating', data.imdbRating);
    badge.setAttribute('data-votes', data.imdbVotes || 'N/A');
    if (imdbLink) {
      badge.setAttribute('data-imdb-link', imdbLink);
    }
    
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
