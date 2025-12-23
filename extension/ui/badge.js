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
    
    // Add tooltip behavior
    badge.title = `${data.title} (${data.year})\nRating: ${data.imdbRating}\nVotes: ${data.imdbVotes}`;
    
    // Click to open IMDb
    if (data.imdbID) {
      badge.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        window.open(`https://www.imdb.com/title/${data.imdbID}/`, '_blank');
      };
    }
    
    // Dimming logic if implemented
    // if (parseFloat(data.imdbRating) < 6.5) { badge.style.opacity = '0.6'; }
  }
};

window.StreamRatingsUI = UI;
