import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getRandomCategoryAndWord, 
  getCategoryNames,
  getRandomWord,
  getCategoryByWord
} from '../data/categories';
import { 
  selectImposters, 
  isValidPlayerCount, 
  getDefaultPlayers,
  playSound,
  vibrate,
  shuffleArray
} from '../utils/game';

const Home = ({ navigateTo, gameState, updateGameState }) => {
  const [players, setPlayers] = useState(gameState.players || getDefaultPlayers(4));
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedWord, setSelectedWord] = useState('');
  const [imposterCount, setImposterCount] = useState(1);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [error, setError] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const categories = getCategoryNames();
  const allCategories = ['Random', ...categories];

  // Handle player name change - FIXED: properly handle backspace
  const handlePlayerChange = (index, value) => {
    const newPlayers = [...players];
    // Allow empty string to enable full backspace
    if (value === '') {
      newPlayers[index] = '';
    } else {
      newPlayers[index] = value;
    }
    setPlayers(newPlayers);
  };

  // Handle player blur - if empty, set default name
  const handlePlayerBlur = (index) => {
    const newPlayers = [...players];
    if (!newPlayers[index] || newPlayers[index].trim() === '') {
      newPlayers[index] = `Player ${index + 1}`;
      setPlayers(newPlayers);
    }
  };

  // Add new player
  const addPlayer = () => {
    if (players.length >= 15) {
      setError('Maximum 15 players allowed');
      setTimeout(() => setError(''), 2000);
      return;
    }
    const newPlayers = [...players, `Player ${players.length + 1}`];
    setPlayers(newPlayers);
    playSound('click');
    vibrate(50);
  };

  // Remove last player
  const removePlayer = () => {
    if (players.length <= 3) {
      setError('Minimum 3 players required');
      setTimeout(() => setError(''), 2000);
      return;
    }
    const newPlayers = players.slice(0, -1);
    setPlayers(newPlayers);
    playSound('click');
    vibrate(50);
  };

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowCustomInput(false);
    setCustomCategory('');
    
    if (category === 'Random') {
      const { category: randomCat, word: randomWord } = getRandomCategoryAndWord();
      // Store both the actual category and the word
      setSelectedCategory(randomCat);
      setSelectedWord(randomWord);
    } else {
      const word = getRandomWord(category);
      setSelectedWord(word);
    }
    playSound('click');
    vibrate(30);
  };

  // Handle custom category
  const handleCustomCategory = () => {
    if (customCategory.trim()) {
      const word = getRandomWord(customCategory.trim());
      if (word) {
        setSelectedCategory(customCategory.trim());
        setSelectedWord(word);
        setShowCustomInput(false);
        playSound('click');
      } else {
        setError('Category not found!');
        setTimeout(() => setError(''), 2000);
      }
    }
  };

  // Handle imposter count selection
  const handleImposterSelect = (count) => {
    setImposterCount(count);
    playSound('click');
    vibrate(30);
  };

  // Start the game
  const startGame = () => {
    // Validate players - Changed to 3
    if (players.length < 3) {
      setError('Please add at least 3 players');
      setTimeout(() => setError(''), 2000);
      return;
    }

    // Validate category
    if (!selectedCategory) {
      setError('Please select a category');
      setTimeout(() => setError(''), 2000);
      return;
    }

    // Validate word
    if (!selectedWord) {
      setError('Please select a valid word');
      setTimeout(() => setError(''), 2000);
      return;
    }

    // Validate imposters
    if (imposterCount >= players.length) {
      setError('Imposters must be less than total players');
      setTimeout(() => setError(''), 2000);
      return;
    }

    setIsStarting(true);
    playSound('success');
    vibrate(100);

    // Select random imposters
    const imposterIndices = selectImposters(players, imposterCount);
    
    // Prepare game state
    const newGameState = {
      players: players,
      selectedCategory: selectedCategory,
      selectedWord: selectedWord,
      imposterCount: imposterCount,
      imposters: imposterIndices,
      currentPlayerIndex: 0,
      revealedPlayers: [],
      allWordsUsed: gameState.allWordsUsed || [],
      categoriesUsed: gameState.categoriesUsed || [],
    };

    updateGameState(newGameState);

    // Navigate to reveal page
    setTimeout(() => {
      navigateTo('reveal');
      setIsStarting(false);
    }, 500);
  };

  // Randomize category and word
  const randomizeSelection = () => {
    const { category, word } = getRandomCategoryAndWord();
    setSelectedCategory(category);
    setSelectedWord(word);
    playSound('click');
    vibrate(30);
  };

  // Reset on unmount
  useEffect(() => {
    return () => {
      setError('');
      setIsStarting(false);
    };
  }, []);

  return (
    <motion.div
      className="page-container"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.4 }}
      style={{
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #2d1b69 100%)',
        justifyContent: 'flex-start',
        padding: '20px 16px',
        overflowY: 'auto',
        gap: '16px',
      }}
    >
      {/* Header */}
      <motion.h1
        style={{
          fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 700,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #6c5ce7, #fd79a8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '4px',
        }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        Game Setup
      </motion.h1>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              background: 'rgba(214, 48, 49, 0.2)',
              border: '1px solid rgba(214, 48, 49, 0.3)',
              borderRadius: '12px',
              padding: '10px 16px',
              textAlign: 'center',
              width: '100%',
            }}
          >
            <p style={{ color: '#ff6b6b', fontSize: '14px', fontWeight: 500 }}>
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Card 1: Players */}
      <motion.div
        className="glass-card"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{ width: '100%' }}
      >
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: 700, 
          marginBottom: '12px',
          color: 'rgba(255,255,255,0.9)'
        }}>
          👥 Players
          <span style={{ 
            fontSize: '12px', 
            fontWeight: 400, 
            color: 'rgba(255,255,255,0.4)',
            marginLeft: '8px'
          }}>
            ({players.length}/15)
          </span>
        </h2>

        <div style={{ maxHeight: '180px', overflowY: 'auto', marginBottom: '12px' }}>
          {players.map((player, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '6px',
              }}
            >
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.3)',
                minWidth: '24px',
              }}>
                {index + 1}
              </span>
              <input
                type="text"
                value={player}
                onChange={(e) => handlePlayerChange(index, e.target.value)}
                onBlur={() => handlePlayerBlur(index)}
                className="input-modern"
                style={{ flex: 1 }}
                placeholder={`Player ${index + 1}`}
              />
            </motion.div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={addPlayer}
            className="btn-secondary"
            style={{ flex: 1, padding: '10px', fontSize: '14px' }}
          >
            + Add Player
          </button>
          <button
            onClick={removePlayer}
            className="btn-danger"
            style={{ flex: 1, padding: '10px', fontSize: '14px' }}
          >
            - Remove
          </button>
        </div>
      </motion.div>

      {/* Card 2: Categories - REMOVED the selected display */}
      <motion.div
        className="glass-card"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ width: '100%' }}
      >
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: 700, 
          marginBottom: '12px',
          color: 'rgba(255,255,255,0.9)'
        }}>
          📂 Categories
        </h2>

        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '6px',
          marginBottom: '10px',
          maxHeight: '120px',
          overflowY: 'auto'
        }}>
          {allCategories.map((category) => (
            <motion.button
              key={category}
              onClick={() => handleCategorySelect(category)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: selectedCategory === category || 
                        (category === 'Random' && selectedCategory !== '') ? 
                        '2px solid #6c5ce7' : '1px solid rgba(255,255,255,0.1)',
                background: selectedCategory === category || 
                           (category === 'Random' && selectedCategory !== '') ? 
                           'rgba(108,92,231,0.2)' : 'rgba(255,255,255,0.05)',
                color: 'white',
                fontSize: '13px',
                fontWeight: selectedCategory === category || 
                           (category === 'Random' && selectedCategory !== '') ? 
                           600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {category}
            </motion.button>
          ))}
        </div>

        {showCustomInput ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              className="input-modern"
              placeholder="Enter category name..."
              onKeyPress={(e) => e.key === 'Enter' && handleCustomCategory()}
            />
            <button
              onClick={handleCustomCategory}
              className="btn-secondary"
              style={{ padding: '10px 16px', width: 'auto', fontSize: '14px' }}
            >
              Add
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCustomInput(true)}
            className="btn-outline"
            style={{ padding: '8px', fontSize: '13px' }}
          >
            + Custom Category
          </button>
        )}

        {/* REMOVED: The display that shows "Selected: Animals" and "Word: Leopard" */}
        {/* The selected info is now hidden from users */}
      </motion.div>

      {/* Card 3: Imposters */}
      <motion.div
        className="glass-card"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{ width: '100%' }}
      >
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: 700, 
          marginBottom: '12px',
          color: 'rgba(255,255,255,0.9)'
        }}>
          🕵️ Imposters
        </h2>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {[1, 2, 3].map((count) => (
            <motion.button
              key={count}
              onClick={() => handleImposterSelect(count)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                border: imposterCount === count ? 
                  '3px solid #6c5ce7' : '2px solid rgba(255,255,255,0.1)',
                background: imposterCount === count ? 
                  'rgba(108,92,231,0.3)' : 'rgba(255,255,255,0.05)',
                color: imposterCount === count ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: '20px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {count}
              <span style={{ fontSize: '10px', fontWeight: 400, opacity: 0.6 }}>
                imposter{count > 1 ? 's' : ''}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Start Game Button */}
      <motion.button
        onClick={startGame}
        disabled={isStarting}
        className="btn-success"
        style={{
          marginTop: '8px',
          position: 'relative',
          opacity: isStarting ? 0.7 : 1,
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {isStarting ? 'Starting...' : '🎯 START GAME'}
      </motion.button>

      {/* Player count indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          textAlign: 'center',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.2)',
          marginTop: '4px',
        }}
      >
        {players.length} players • {imposterCount} imposter{imposterCount > 1 ? 's' : ''}
        {selectedCategory && ` • ${selectedCategory}`}
      </motion.div>
    </motion.div>
  );
};

export default Home;