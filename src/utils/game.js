// ============================================
// GAME UTILITY FUNCTIONS
// ============================================

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - The array to shuffle
 * @returns {Array} - A new shuffled array
 */
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Select random imposters from players
 * @param {Array} players - List of player names
 * @param {Number} count - Number of imposters to select
 * @returns {Array} - Array of selected imposter indices
 */
export const selectImposters = (players, count) => {
  if (count >= players.length) {
    // If imposters count >= players, just select all but one as imposters
    count = Math.max(1, players.length - 1);
  }
  
  const indices = Array.from({ length: players.length }, (_, i) => i);
  const shuffled = shuffleArray(indices);
  return shuffled.slice(0, count).sort((a, b) => a - b);
};

/**
 * Check if a player is an imposter
 * @param {Number} playerIndex - Index of the player
 * @param {Array} imposters - Array of imposter indices
 * @returns {Boolean} - True if player is imposter
 */
export const isImposter = (playerIndex, imposters) => {
  return imposters.includes(playerIndex);
};

/**
 * Get the next player index
 * @param {Number} currentIndex - Current player index
 * @param {Number} totalPlayers - Total number of players
 * @returns {Number} - Next player index
 */
export const getNextPlayer = (currentIndex, totalPlayers) => {
  return (currentIndex + 1) % totalPlayers;
};

/**
 * Check if all players have revealed
 * @param {Array} revealedPlayers - Array of revealed player indices
 * @param {Number} totalPlayers - Total number of players
 * @returns {Boolean} - True if all players have revealed
 */
export const allPlayersRevealed = (revealedPlayers, totalPlayers) => {
  return revealedPlayers.length >= totalPlayers;
};

/**
 * Get a random player as the discussion starter
 * @param {Array} players - List of player names
 * @returns {Object} - Random player object with index and name
 */
export const getRandomDiscussionStarter = (players) => {
  const index = Math.floor(Math.random() * players.length);
  return {
    index,
    name: players[index]
  };
};

/**
 * Get the actual word for a player
 * @param {Boolean} isImposter - Whether player is imposter
 * @param {String} word - The secret word
 * @param {String} category - The category of the word
 * @returns {Object} - Word info for display
 */
export const getPlayerWordInfo = (isImposter, word, category) => {
  if (isImposter) {
    return {
      display: 'YOU ARE THE IMPOSTER',
      hint: category,
      isImposter: true
    };
  }
  return {
    display: word,
    hint: null,
    isImposter: false
  };
};

/**
 * Generate a random game ID (for future use)
 * @returns {String} - Random game ID
 */
export const generateGameId = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

/**
 * Validate player count
 * @param {Number} count - Number of players
 * @returns {Boolean} - True if valid
 */
export const isValidPlayerCount = (count) => {
  return count >= 4 && count <= 15;
};

/**
 * Get default players list
 * @param {Number} count - Number of default players
 * @returns {Array} - Array of default player names
 */
export const getDefaultPlayers = (count = 4) => {
  return Array.from({ length: count }, (_, i) => `Player ${i + 1}`);
};

/**
 * Format time for display
 * @param {Number} seconds - Time in seconds
 * @returns {String} - Formatted time
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Debounce function for performance
 * @param {Function} func - Function to debounce
 * @param {Number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Get random emoji for category
 * @param {String} category - Category name
 * @returns {String} - Emoji for category
 */
export const getCategoryEmoji = (category) => {
  const emojiMap = {
    'Foods': '🍕',
    'Movies': '🎬',
    'Animals': '🐾',
    'Countries': '🌍',
    'Sports': '⚽',
    'Technology': '💻',
    'Science': '🔬',
    'Cars': '🚗',
    'Bikes': '🚲',
    'Games': '🎮',
    'Mobile Phones': '📱',
    'Brands': '🏷️',
    'Objects': '📦',
    'Jobs': '💼',
    'Places': '📍',
    'Fruits': '🍎',
    'Vegetables': '🥕',
    'Space': '🚀',
    'Cartoons': '🎨',
    'Famous People': '⭐',
    'Random': '🎲'
  };
  return emojiMap[category] || '🎯';
};

/**
 * Get random color for player
 * @param {Number} index - Player index
 * @returns {String} - Color hex code
 */
export const getPlayerColor = (index) => {
  const colors = [
    '#6c5ce7', '#00b894', '#fdcb6e', '#e17055',
    '#0984e3', '#00cec9', '#fd79a8', '#fdcb6e',
    '#a29bfe', '#55efc4', '#ffeaa7', '#fab1a0'
  ];
  return colors[index % colors.length];
};

/**
 * Simple vibration feedback
 * @param {Number} duration - Duration in ms
 */
export const vibrate = (duration = 100) => {
  if (navigator.vibrate) {
    navigator.vibrate(duration);
  }
};

/**
 * Play sound effect using Web Audio API
 * @param {String} type - Type of sound ('click', 'reveal', 'success')
 */
export const playSound = (type) => {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    switch(type) {
      case 'click':
        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;
        oscillator.start();
        setTimeout(() => oscillator.stop(), 50);
        break;
        
      case 'reveal':
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
        gainNode.gain.value = 0.15;
        oscillator.start();
        setTimeout(() => oscillator.stop(), 300);
        break;
        
      case 'success':
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.15);
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.3);
        gainNode.gain.value = 0.15;
        oscillator.start();
        setTimeout(() => oscillator.stop(), 500);
        break;
        
      default:
        oscillator.frequency.value = 500;
        gainNode.gain.value = 0.1;
        oscillator.start();
        setTimeout(() => oscillator.stop(), 100);
    }
  } catch (error) {
    // Silently fail if audio not supported
    console.log('Audio not supported');
  }
};

/**
 * Shuffle and pick random items without replacement
 * @param {Array} array - Source array
 * @param {Number} count - Number of items to pick
 * @returns {Array} - Picked items
 */
export const pickRandomItems = (array, count) => {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, Math.min(count, array.length));
};

/**
 * Get used words tracking for a category
 * @param {String} category - Category name
 * @param {Array} usedWords - List of already used words
 * @param {Array} allWords - All words in category
 * @returns {Object} - { word, remainingWords }
 */
export const getNextWord = (category, usedWords = [], allWords) => {
  if (!allWords || allWords.length === 0) {
    return { word: null, remainingWords: [] };
  }
  
  const available = allWords.filter(w => !usedWords.includes(w));
  
  if (available.length === 0) {
    // Reset if all words used
    return { 
      word: allWords[Math.floor(Math.random() * allWords.length)],
      remainingWords: allWords
    };
  }
  
  const word = available[Math.floor(Math.random() * available.length)];
  return { word, remainingWords: available };
};