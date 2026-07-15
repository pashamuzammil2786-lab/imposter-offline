import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  isImposter, 
  getPlayerWordInfo, 
  getNextPlayer,
  allPlayersRevealed,
  playSound,
  vibrate
} from '../utils/game';

const Reveal = ({ navigateTo, gameState, updateGameState }) => {
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(gameState.currentPlayerIndex || 0);
  const [isHolding, setIsHolding] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [showCard, setShowCard] = useState(true);
  const [revealedPlayers, setRevealedPlayers] = useState(gameState.revealedPlayers || []);
  const [isFlipping, setIsFlipping] = useState(false);
  
  const holdTimerRef = useRef(null);
  const startTimeRef = useRef(0);
  const animationFrameRef = useRef(null);

  const players = gameState.players || [];
  const imposters = gameState.imposters || [];
  const word = gameState.selectedWord || '';
  const category = gameState.selectedCategory || '';
  
  const currentPlayer = players[currentPlayerIndex] || 'Player';
  const isCurrentImposter = isImposter(currentPlayerIndex, imposters);
  const isLastPlayer = currentPlayerIndex === players.length - 1;

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Start holding
  const startHold = () => {
    if (isRevealed) return;
    
    setIsHolding(true);
    setHoldProgress(0);
    startTimeRef.current = Date.now();
    vibrate(20);
    
    // Start progress animation
    const updateProgress = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const progress = Math.min(elapsed / 1, 1);
      setHoldProgress(progress);
      
      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        revealCard();
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  // End holding
  const endHold = () => {
    if (isRevealed) return;
    
    setIsHolding(false);
    setHoldProgress(0);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }
  };

  // Reveal the card
  const revealCard = () => {
    if (isRevealed) return;
    
    setIsRevealed(true);
    setIsHolding(false);
    setIsFlipping(true);
    setHoldProgress(1);
    
    playSound('reveal');
    vibrate(100);
    
    setTimeout(() => {
      setIsFlipping(false);
    }, 400);
  };

  // Hide card and go to next player
  const hideCard = () => {
    if (!isRevealed) return;
    
    playSound('click');
    vibrate(30);
    setShowCard(false);
    
    // Update revealed players
    const updatedRevealed = [...revealedPlayers, currentPlayerIndex];
    setRevealedPlayers(updatedRevealed);
    
    // Check if all players including current have been revealed
    if (updatedRevealed.length === players.length) {
      // All players revealed - go to result
      updateGameState({
        revealedPlayers: updatedRevealed,
        currentPlayerIndex: currentPlayerIndex
      });
      
      setTimeout(() => {
        navigateTo('result');
      }, 300);
    } else {
      // Move to next player
      let nextIndex = currentPlayerIndex + 1;
      if (nextIndex >= players.length) {
        // If we're at the end, go to result
        updateGameState({
          revealedPlayers: updatedRevealed,
          currentPlayerIndex: currentPlayerIndex
        });
        setTimeout(() => {
          navigateTo('result');
        }, 300);
        return;
      }
      
      // Update game state with next player
      updateGameState({
        revealedPlayers: updatedRevealed,
        currentPlayerIndex: nextIndex
      });
      
      // Reset for next player
      setTimeout(() => {
        setCurrentPlayerIndex(nextIndex);
        setShowCard(true);
        setIsRevealed(false);
        setHoldProgress(0);
        setIsHolding(false);
        setIsFlipping(false);
      }, 400);
    }
  };

  // Split long words for better display
  const formatWord = (text) => {
    if (!text) return '';
    // For very long words, add zero-width spaces for better wrapping
    if (text.length > 15) {
      return text.split('').join('\u200B');
    }
    return text;
  };

  return (
    <motion.div
      className="page-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #2d1b69 100%)',
        justifyContent: 'center',
        padding: '16px',
        gap: '20px',
      }}
    >
      {/* Player Name */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300 }}
        style={{ textAlign: 'center' }}
      >
        <h2 style={{
          fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
          fontWeight: 800,
          color: 'rgba(255,255,255,0.9)',
          fontFamily: "'Inter', sans-serif",
          letterSpacing: '1px',
        }}>
          {currentPlayer}
        </h2>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.3)',
          marginTop: '4px',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}>
          Player {currentPlayerIndex + 1} of {players.length}
        </p>
      </motion.div>

      {/* Instruction */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.4)',
          textAlign: 'center',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 400,
          letterSpacing: '0.5px',
        }}
      >
        {isRevealed ? 'Show this to others' : "Don't show anyone your role"}
      </motion.p>

      {/* Card */}
      <motion.div
        style={{
          width: '100%',
          maxWidth: '360px',
          aspectRatio: '0.85',
          perspective: '1000px',
          margin: '0 auto',
          position: 'relative',
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring' }}
      >
        <motion.div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transform: isFlipping ? 'rotateY(180deg)' : isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Front of card - HOLD TO REVEAL */}
          {!isRevealed && (
            <motion.div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                background: 'linear-gradient(145deg, rgba(253,203,110,0.15), rgba(253,121,168,0.1))',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '32px',
                border: '1px solid rgba(253,203,110,0.2)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(253,203,110,0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '30px',
                cursor: 'pointer',
              }}
              onMouseDown={startHold}
              onMouseUp={endHold}
              onMouseLeave={endHold}
              onTouchStart={startHold}
              onTouchEnd={endHold}
              onTouchCancel={endHold}
            >
              {/* Progress ring */}
              <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '40px',
                height: '40px',
              }}>
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="3"
                  />
                  <motion.circle
                    cx="20"
                    cy="20"
                    r="16"
                    fill="none"
                    stroke="#fdcb6e"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="100.53"
                    strokeDashoffset={100.53 - (100.53 * holdProgress)}
                    animate={{ rotate: -90 }}
                    style={{
                      transformOrigin: 'center',
                      transition: 'stroke-dashoffset 0.1s ease',
                    }}
                  />
                </svg>
              </div>

              <motion.div
                animate={{
                  scale: isHolding ? [1, 1.1, 1] : 1,
                }}
                transition={{
                  duration: 0.5,
                  repeat: isHolding ? Infinity : 0,
                }}
                style={{
                  fontSize: 'clamp(3rem, 10vw, 4.5rem)',
                  marginBottom: '16px',
                }}
              >
                {isHolding ? '👁️' : '🤫'}
              </motion.div>

              <h2 style={{
                fontSize: 'clamp(1.8rem, 6vw, 2.8rem)',
                fontWeight: 800,
                color: '#fdcb6e',
                fontFamily: "'Inter', sans-serif",
                textAlign: 'center',
                letterSpacing: '1px',
              }}>
                HOLD TO
                <br />
                REVEAL
              </h2>

              <p style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.3)',
                marginTop: '16px',
                fontWeight: 400,
                letterSpacing: '2px',
              }}>
                {isHolding ? 'Keep holding...' : 'Press and hold for 1 second'}
              </p>

              <div style={{
                position: 'absolute',
                bottom: '30px',
                left: '30px',
                right: '30px',
                height: '4px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '2px',
                overflow: 'hidden',
              }}>
                <motion.div
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #fdcb6e, #fd79a8)',
                    borderRadius: '2px',
                    width: `${holdProgress * 100}%`,
                  }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </motion.div>
          )}

          {/* Back of card - REVEALED */}
          {isRevealed && (
            <motion.div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                background: isCurrentImposter 
                  ? 'linear-gradient(145deg, rgba(214,48,49,0.2), rgba(225,112,85,0.1))'
                  : 'linear-gradient(145deg, rgba(0,206,201,0.15), rgba(0,184,148,0.1))',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '32px',
                border: isCurrentImposter
                  ? '1px solid rgba(214,48,49,0.3)'
                  : '1px solid rgba(0,206,201,0.3)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '30px',
                transform: 'rotateY(180deg)',
              }}
            >
              {isCurrentImposter ? (
                <>
                  <div style={{
                    fontSize: 'clamp(3rem, 10vw, 4rem)',
                    marginBottom: '12px',
                  }}>
                    🕵️
                  </div>
                  <h2 style={{
                    fontSize: 'clamp(1.8rem, 6vw, 2.5rem)',
                    fontWeight: 800,
                    color: '#ff6b6b',
                    fontFamily: "'Inter', sans-serif",
                    textAlign: 'center',
                  }}>
                    YOU ARE THE
                    <br />
                    IMPOSTER
                  </h2>
                  <p style={{
                    fontSize: '18px',
                    color: 'rgba(255,255,255,0.5)',
                    marginTop: '16px',
                    fontWeight: 500,
                  }}>
                    💡 Hint: {category}
                  </p>
                </>
              ) : (
                <>
                  <div style={{
                    fontSize: 'clamp(3rem, 10vw, 4rem)',
                    marginBottom: '12px',
                  }}>
                    📝
                  </div>
                  <h3 style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.4)',
                    fontWeight: 400,
                    marginBottom: '8px',
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                  }}>
                    YOUR WORD
                  </h3>
                  {/* FIXED: Better word wrapping */}
                  <h2 style={{
                    fontSize: 'clamp(2.2rem, 7vw, 3.5rem)',
                    fontWeight: 900,
                    color: '#00cec9',
                    fontFamily: "'Inter', sans-serif",
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    wordWrap: 'break-word',
                    maxWidth: '100%',
                    lineHeight: 1.2,
                    padding: '0 10px',
                  }}>
                    {formatWord(word)}
                  </h2>
                </>
              )}
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Buttons */}
      <AnimatePresence>
        {isRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              width: '100%',
              maxWidth: '360px',
            }}
          >
            <button
              onClick={hideCard}
              className="btn-primary"
              style={{
                padding: '14px',
                fontSize: '16px',
              }}
            >
              {isLastPlayer ? '📊 View Results' : '➡️ Next Player'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Reveal;