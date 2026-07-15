import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../utils/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { playSound, vibrate, getRandomDiscussionStarter } from '../utils/game';

const OnlineReveal = ({ navigateTo, gameState, updateGameState }) => {
  const [roomData, setRoomData] = useState(null);
  const [isHolding, setIsHolding] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [hasConfirmedDone, setHasConfirmedDone] = useState(false);
  
  const holdTimerRef = useRef(null);
  const startTimeRef = useRef(0);
  const animationFrameRef = useRef(null);

  const localName = gameState.onlinePlayerName;
  const roomId = gameState.onlineRoomId;

  // Listen to Firestore Room updates
  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(db, 'rooms', roomId);
    const unsubscribe = onSnapshot(roomRef, async (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setRoomData(data);

        // Check if everyone is revealed
        const allRevealed = data.players.every(p => p.revealed);
        
        // If Host: update status to 'result' once all players confirm they are done
        const isHost = data.host === localName;
        if (isHost && allRevealed && data.status === 'reveal') {
          try {
            const playerNames = data.players.map(p => p.name);
            const starter = getRandomDiscussionStarter(playerNames);
            
            await updateDoc(roomRef, {
              status: 'result',
              discussionStarter: starter.name
            });
          } catch (err) {
            console.error('Failed to transition to results:', err);
          }
        }

        // Navigate everyone to result screen when database status changes
        if (data.status === 'result') {
          updateGameState({
            players: data.players.map(p => p.name),
            selectedCategory: data.category,
            selectedWord: data.word,
            imposterCount: data.imposterCount,
            imposters: data.imposters, // array of names
            discussionStarterName: data.discussionStarter
          });
          navigateTo('online-result');
        }
      }
    });

    return () => {
      unsubscribe();
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [roomId, localName]);

  if (!roomData) {
    return (
      <div className="page-container" style={{ justifyContent: 'center' }}>
        <h3 style={{ color: 'rgba(255,255,255,0.6)' }}>Loading role assignment...</h3>
      </div>
    );
  }

  // Determine local player role
  const isImposterLocal = roomData.imposters.includes(localName);
  const word = roomData.word;
  const category = roomData.category;

  // Start holding to reveal
  const startHold = () => {
    if (isRevealed || hasConfirmedDone) return;
    
    setIsHolding(true);
    setHoldProgress(0);
    startTimeRef.current = Date.now();
    vibrate(20);
    
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

  const endHold = () => {
    if (isRevealed || hasConfirmedDone) return;
    
    setIsHolding(false);
    setHoldProgress(0);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
  };

  const revealCard = () => {
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

  // Confirm viewing and update Firestore status
  const handleDone = async () => {
    if (hasConfirmedDone) return;
    
    playSound('click');
    vibrate(30);
    setHasConfirmedDone(true);

    try {
      const roomRef = doc(db, 'rooms', roomId);
      const updatedPlayers = roomData.players.map(p => 
        p.name === localName ? { ...p, revealed: true } : p
      );
      
      await updateDoc(roomRef, {
        players: updatedPlayers,
        revealedCount: roomData.revealedCount + 1
      });
    } catch (err) {
      console.error(err);
      setHasConfirmedDone(false);
    }
  };

  // Formatting utility
  const formatWord = (text) => {
    if (!text) return '';
    if (text.length > 15) {
      return text.split('').join('\u200B');
    }
    return text;
  };

  // Count ready players
  const readyCount = roomData.players.filter(p => p.revealed).length;

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
        gap: '16px',
      }}
    >
      {/* Player name header */}
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.2rem)', fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>
          {localName}
        </h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Room Code: {roomId}
        </p>
      </div>

      {/* Instructions */}
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
        {hasConfirmedDone 
          ? 'Waiting for other players...' 
          : isRevealed 
            ? 'Memorize your role' 
            : 'Make sure no one is looking at your screen!'}
      </p>

      {/* Card display */}
      <div style={{ width: '100%', maxWidth: '340px', aspectRatio: '0.85', perspective: '1000px', margin: '0 auto', position: 'relative' }}>
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
          {/* Card Front: Hold to Reveal */}
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
                borderRadius: '28px',
                border: '1px solid rgba(253,203,110,0.2)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                cursor: hasConfirmedDone ? 'default' : 'pointer',
              }}
              onMouseDown={startHold}
              onMouseUp={endHold}
              onMouseLeave={endHold}
              onTouchStart={startHold}
              onTouchEnd={endHold}
              onTouchCancel={endHold}
            >
              {hasConfirmedDone ? (
                <>
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>⌛</div>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'rgba(255,255,255,0.7)', textAlign: 'center' }}>
                    Role Confirmed
                  </h2>
                </>
              ) : (
                <>
                  <div style={{ position: 'absolute', top: '16px', right: '16px', width: '36px', height: '36px' }}>
                    <svg width="36" height="36" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
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
                        style={{ transformOrigin: 'center', transition: 'stroke-dashoffset 0.1s ease' }}
                      />
                    </svg>
                  </div>

                  <motion.div
                    animate={{ scale: isHolding ? [1, 1.1, 1] : 1 }}
                    transition={{ duration: 0.5, repeat: isHolding ? Infinity : 0 }}
                    style={{ fontSize: '70px', marginBottom: '12px' }}
                  >
                    {isHolding ? '👁️' : '🤫'}
                  </motion.div>

                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#fdcb6e', textAlign: 'center', fontFamily: "'Orbitron', sans-serif" }}>
                    HOLD TO
                    <br />
                    REVEAL
                  </h2>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '12px' }}>
                    {isHolding ? 'Keep holding...' : 'Hold down for 1 second'}
                  </p>
                </>
              )}
            </motion.div>
          )}

          {/* Card Back: Revealed Role */}
          {isRevealed && (
            <motion.div
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                backfaceVisibility: 'hidden',
                background: isImposterLocal 
                  ? 'linear-gradient(145deg, rgba(214,48,49,0.2), rgba(225,112,85,0.1))'
                  : 'linear-gradient(145deg, rgba(0,206,201,0.15), rgba(0,184,148,0.1))',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: '28px',
                border: isImposterLocal ? '1px solid rgba(214,48,49,0.3)' : '1px solid rgba(0,206,201,0.3)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                transform: 'rotateY(180deg)',
              }}
            >
              {isImposterLocal ? (
                <>
                  <div style={{ fontSize: '64px', marginBottom: '12px' }}>🕵️</div>
                  <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#ff6b6b', textAlign: 'center' }}>
                    YOU ARE THE
                    <br />
                    IMPOSTER
                  </h2>
                  <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', marginTop: '16px', fontWeight: 500 }}>
                    💡 Hint Category: {category}
                  </p>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '64px', marginBottom: '12px' }}>📝</div>
                  <h3 style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: 500, letterSpacing: '2px', marginBottom: '6px' }}>
                    YOUR SECRET WORD
                  </h3>
                  <h2 style={{
                    fontSize: 'clamp(2rem, 6vw, 3rem)',
                    fontWeight: 900,
                    color: '#00cec9',
                    textAlign: 'center',
                    wordBreak: 'break-word',
                    lineHeight: 1.2,
                    padding: '0 8px'
                  }}>
                    {formatWord(word)}
                  </h2>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginTop: '12px' }}>
                    Category: {category}
                  </p>
                </>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Done / Confirm Button */}
      <AnimatePresence>
        {isRevealed && !hasConfirmedDone && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            style={{ width: '100%', maxWidth: '340px', marginTop: '10px' }}
          >
            <button
              onClick={handleDone}
              className="btn-primary"
              style={{ padding: '14px', fontSize: '16px' }}
            >
              🤝 I've Memorized My Role
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sync Status Display */}
      <div className="glass-card" style={{ width: '100%', maxWidth: '340px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)' }}>
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Synced Players:</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#6c5ce7' }}>
          {readyCount} / {roomData.players.length} ready
        </span>
      </div>

      {/* Founder Credit */}
      <div style={{ textAlign: 'center', width: '100%', marginTop: '10px' }}>
        <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '9px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Designed & Founded by
        </span>
        <br />
        <span style={{ color: '#fdcb6e', fontSize: '11px', fontWeight: 800, letterSpacing: '2px', background: 'linear-gradient(135deg, #fdcb6e, #fd79a8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          MUZAMMIL
        </span>
      </div>
    </motion.div>
  );
};

export default OnlineReveal;
