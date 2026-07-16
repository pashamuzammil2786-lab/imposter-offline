// ============================================
// CATEGORIES DATA - SIMPLIFIED INDIAN EDITION
// Easy to Medium level words that are familiar to all players
// ============================================

export const categories = {
  Foods: [
    'Biryani', 'Dosa', 'Samosa', 'Paneer Tikka', 'Butter Chicken', 'Golgappa',
    'Chai', 'Jalebi', 'Gulab Jamun', 'Pav Bhaji', 'Chole Bhature', 'Idli',
    'Maggi', 'Pizza', 'Burger', 'Momos', 'Kulfi', 'Naan', 'Lassi', 'Kebab'
  ],

  Movies: [
    '3 Idiots', 'Sholay', 'Dangal', 'Baahubali', 'RRR', 'Pushpa', 'KGF',
    'Hera Pheri', 'Welcome', 'Chennai Express', 'Koi Mil Gaya', 'Dhoom',
    'Krrish', 'Jab We Met', 'Gangs of Wasseypur', 'Munna Bhai M.B.B.S.'
  ],

  Animals: [
    'Tiger', 'Elephant', 'Peacock', 'Cobra', 'Lion', 'Leopard', 'Cow',
    'Monkey', 'Camel', 'Dog', 'Cat', 'Horse', 'Goat', 'Buffalo',
    'Crocodile', 'Deer', 'Crow', 'Sparrow'
  ],

  Countries: [
    'India', 'Pakistan', 'Sri Lanka', 'Bangladesh', 'Nepal', 'USA',
    'UK', 'Canada', 'Australia', 'Japan', 'China', 'Russia',
    'Saudi Arabia', 'UAE', 'Singapore', 'France', 'Germany'
  ],

  Sports: [
    'Cricket', 'Football', 'Badminton', 'Hockey', 'Kabaddi', 'Kho Kho',
    'Chess', 'Carrom', 'Ludo', 'Gilli Danda', 'Wrestling', 'Boxing',
    'Tennis', 'Table Tennis'
  ],

  Technology: [
    'Mobile Phone', 'Computer', 'Internet', 'WiFi', 'YouTube', 'WhatsApp',
    'Instagram', 'Google', 'AI', 'Robot', 'Television', 'Smart Watch'
  ],

  Science: [
    'Gravity', 'Oxygen', 'Water', 'Sun', 'Moon', 'Earth', 'Stars',
    'Electricity', 'Magnet', 'Virus', 'DNA', 'ISRO'
  ],

  Cars: [
    'Thar', 'Fortuner', 'Swift', 'Scorpio', 'Creta', 'BMW', 'Audi',
    'Mercedes', 'Tesla', 'Alto', 'Innova', 'Safari'
  ],

  Bikes: [
    'Splendor', 'Bullet', 'Pulsar', 'Apache', 'Activa', 'KTM Duke',
    'Royal Enfield', 'Yamaha R15', 'Access 125', 'Platina'
  ],

  Games: [
    'PUBG', 'Free Fire', 'Subway Surfers', 'Temple Run', 'GTA V', 'Minecraft',
    'Ludo King', 'Candy Crush', 'Clash of Clans', 'Among Us'
  ],

  'Famous Things in India': [
    'Taj Mahal', 'Red Fort', 'India Gate', 'Gateway of India', 'Qutub Minar',
    'Himalayas', 'Ganges River', 'Goa Beaches', 'Mumbai Local', 'Delhi Metro',
    'Golden Temple', 'Charminar'
  ],

  'Indian Celebrities': [
    'Sachin Tendulkar', 'MS Dhoni', 'Virat Kohli', 'Narendra Modi',
    'Shah Rukh Khan', 'Salman Khan', 'Amitabh Bachchan', 'A.P.J. Abdul Kalam',
    'Ranbir Kapoor', 'Alia Bhatt', 'Deepika Padukone', 'Katrina Kaif'
  ]
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get all category names
export const getCategoryNames = () => {
  return Object.keys(categories);
};

// Get random category name
export const getRandomCategory = () => {
  const names = getCategoryNames();
  return names[Math.floor(Math.random() * names.length)];
};

// Get random word from a category
export const getRandomWord = (category) => {
  if (!categories[category]) return null;
  const words = categories[category];
  return words[Math.floor(Math.random() * words.length)];
};

// Get random category and word
export const getRandomCategoryAndWord = () => {
  const category = getRandomCategory();
  const word = getRandomWord(category);
  return { category, word };
};

// Get words from a category with no repeats
export const getUniqueWords = (category, usedWords = []) => {
  if (!categories[category]) return [];
  const available = categories[category].filter(w => !usedWords.includes(w));
  if (available.length === 0) return categories[category]; // Reset if all used
  return available;
};

// Get all words from random category
export const getRandomWordsFromAll = (count = 1) => {
  const allWords = [];
  Object.values(categories).forEach(words => {
    allWords.push(...words);
  });
  const shuffled = allWords.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

// Get category by word
export const getCategoryByWord = (word) => {
  for (const [category, words] of Object.entries(categories)) {
    if (words.includes(word)) return category;
  }
  return null;
};