import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getRandomDiscussionStarter,
  getCategoryEmoji,
  playSound,
  vibrate,
  shuffleArray
} from '../utils/game';

const Result = ({ navigateTo, gameState, updateGameState, resetGame }) => {
  const [discussionStarter, setDiscussionStarter] = useState(null);
  const [showImposters, setShowImposters] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealedImposters, setRevealedImposters] = useState([]);

  const players = gameState.players || [];
  const imposters = gameState.imposters || [];
  const word = gameState.selectedWord || '';
  const category = gameState.selectedCategory || '';
  const imposterCount = gameState.imposterCount || 1;

  // Initialize discussion starter on mount
  useEffect(() => {
    if (players.length > 0 && !discussionStarter) {
      const starter = getRandomDiscussionStarter(players);
      setDiscussionStarter(starter);
      playSound('click');
    }
  }, [players, discussionStarter]);

  const intervalRef = useRef(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Handle revealing imposters - FIXED
  const revealImposters = () => {
    if (isRevealing) return;
    
    // If already shown, hide them
    if (showImposters) {
      setShowImposters(false);
      setRevealedImposters([]);
      playSound('click');
      return;
    }
    
    // Get imposter names
    const imposterNames = imposters.map(index => ({
      index,
      name: players[index] || `Player ${index + 1}`
    }));
    
    // If no imposters, show message
    if (imposterNames.length === 0) {
      alert('No imposters selected!');
      return;
    }
    
    setIsRevealing(true);
    setShowImposters(true);
    playSound('reveal');
    vibrate(100);
    
    let currentIndex = 0;
    setRevealedImposters([]);
    
    // Reveal one by one
    intervalRef.current = setInterval(() => {
      if (currentIndex < imposterNames.length) {
        const nextImposter = imposterNames[currentIndex];
        setRevealedImposters(prev => [...prev, nextImposter]);
        playSound('click');
        vibrate(50);
        currentIndex++;
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsRevealing(false);
        playSound('success');
        vibrate(100);
      }
    }, 500);
  };

  // Start new game
  const handleNewGame = () => {
    playSound('click');
    vibrate(50);
    resetGame();
    navigateTo('home');
  };

  // Go back to home
  const handleGoHome = () => {
    playSound('click');
    vibrate(30);
    navigateTo('home');
  };

  return (
    <motion.div
      className="page-container"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5 }}
      style={{
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #2d1b69 100%)',
        justifyContent: 'center',
        padding: '16px',
        gap: '16px',
        overflowY: 'auto',
      }}
    >
      {/* Title */}
      <motion.h1
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          fontSize: 'clamp(2rem, 6vw, 3rem)',
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 700,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #fdcb6e, #fd79a8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Game Over
      </motion.h1>

      {/* Discussion Starter */}
      <motion.div
        className="glass-card-light"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        style={{
          width: '100%',
          textAlign: 'center',
          padding: '24px',
          borderColor: 'rgba(253,203,110,0.2)',
          minHeight: '120px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.3)',
          letterSpacing: '2px',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}>
          🗣️ Discussion starts with
        </p>
        {discussionStarter && (
          <motion.h3
            key={discussionStarter.index}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400 }}
            style={{
              fontSize: 'clamp(2rem, 6vw, 3rem)',
              fontWeight: 800,
              color: '#fdcb6e',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {discussionStarter.name}
          </motion.h3>
        )}
      </motion.div>

      {/* Reveal Imposters Button - FIXED */}
      <motion.button
        onClick={revealImposters}
        className="btn-danger"
        style={{
          padding: '16px',
          fontSize: '18px',
          fontWeight: 700,
          width: '100%',
          borderRadius: '16px',
          background: 'linear-gradient(135deg, #e17055, #d63031)',
          boxShadow: '0 4px 20px rgba(214,48,49,0.4)',
          opacity: isRevealing ? 0.7 : 1,
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        disabled={isRevealing}
      >
        {isRevealing ? 'Revealing...' : showImposters ? '🕵️ Hide Imposters' : '🕵️ Reveal Imposters'}
      </motion.button>

      {/* Imposters List - FIXED display */}
      <AnimatePresence>
        {showImposters && (
          <motion.div
            className="glass-card"
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.9 }}
            transition={{ delay: 0.2 }}
            style={{
              width: '100%',
              padding: '20px',
              borderColor: 'rgba(214,48,49,0.2)',
            }}
          >
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              textAlign: 'center',
              marginBottom: '12px',
            }}>
              🕵️ Imposters
            </p>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {revealedImposters.length > 0 ? (
                revealedImposters.map((imposter, index) => (
                  <motion.div
                    key={imposter.index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: 'rgba(214,48,49,0.1)',
                      borderRadius: '12px',
                      border: '1px solid rgba(214,48,49,0.2)',
                    }}
                  >
                    <span style={{
                      fontSize: '24px',
                    }}>🎭</span>
                    <span style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#ff6b6b',
                    }}>
                      {imposter.name}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.3)',
                      fontWeight: 400,
                    }}>
                      Player {imposter.index + 1}
                    </span>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '14px',
                  }}
                >
                  {isRevealing ? 'Revealing imposters...' : 'No imposters revealed yet'}
                </motion.div>
              )}
            </div>

            {/* Secret Word Display */}
            {!isRevealing && revealedImposters.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  marginTop: '20px',
                  paddingTop: '20px',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <p style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.3)',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  fontWeight: 500,
                }}>
                  🔑 Secret Word
                </p>
                <h2 style={{
                  fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
                  fontWeight: 900,
                  color: '#00cec9',
                  fontFamily: "'Inter', sans-serif",
                  textAlign: 'center',
                  wordBreak: 'break-word',
                  textShadow: '0 0 20px rgba(0,206,201,0.2)',
                  lineHeight: 1.2,
                }}>
                  {word}
                </h2>
                <p style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.4)',
                  fontWeight: 400,
                }}>
                  Category: {category}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Game Button */}
      <motion.button
        onClick={handleNewGame}
        className="btn-success"
        style={{
          padding: '16px',
          fontSize: '18px',
          fontWeight: 700,
          width: '100%',
          borderRadius: '16px',
          marginTop: '8px',
          background: 'linear-gradient(135deg, #00b894, #00cec9)',
          boxShadow: '0 4px 20px rgba(0,206,201,0.4)',
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        🎮 New Game
      </motion.button>

      {/* Back to Home */}
      <motion.button
        onClick={handleGoHome}
        className="btn-secondary"
        style={{
          padding: '12px',
          fontSize: '14px',
          width: '100%',
          borderRadius: '12px',
          opacity: 0.5,
          marginTop: '4px',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 0.6 }}
      >
        ← Back to Setup
      </motion.button>

      {/* Game Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        style={{
          textAlign: 'center',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.15)',
          marginTop: '8px',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {players.length} players • {imposters.length} imposters • {category} category
      </motion.div>
    </motion.div>
  );
};

export default Result;