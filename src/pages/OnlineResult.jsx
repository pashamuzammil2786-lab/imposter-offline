import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../utils/firebase';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { playSound, vibrate } from '../utils/game';

const OnlineResult = ({ navigateTo, gameState, updateGameState, resetGame }) => {
  const [roomData, setRoomData] = useState(null);
  const [localShowImposters, setLocalShowImposters] = useState(false);
  const [revealedImposters, setRevealedImposters] = useState([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const revealIntervalRef = useRef(null);

  const localName = gameState.onlinePlayerName;
  const roomId = gameState.onlineRoomId;

  // Listen to Firestore Room updates
  useEffect(() => {
    if (!roomId) return;

    const roomRef = doc(db, 'rooms', roomId);
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setRoomData(data);

        // If host reset game to lobby, return everyone to online-setup
        if (data.status === 'lobby') {
          // Reset local game state
          resetGame();
          navigateTo('online-setup');
        }

        // Sync imposter reveal state across all phones
        if (data.showImposters && !localShowImposters && !isRevealing) {
          triggerLocalReveal(data.imposters, data.players);
        } else if (!data.showImposters && localShowImposters) {
          // If host hid them, hide them locally
          setLocalShowImposters(false);
          setRevealedImposters([]);
        }
      }
    });

    return () => {
      unsubscribe();
      if (revealIntervalRef.current) clearInterval(revealIntervalRef.current);
    };
  }, [roomId, localShowImposters, isRevealing]);

  // Synchronized animation to reveal imposters one-by-one on everyone's screens
  const triggerLocalReveal = (imposterNames, allPlayers) => {
    setIsRevealing(true);
    setLocalShowImposters(true);
    playSound('reveal');
    vibrate(100);

    let currentIndex = 0;
    setRevealedImposters([]);

    revealIntervalRef.current = setInterval(() => {
      if (currentIndex < imposterNames.length) {
        const currentImposterName = imposterNames[currentIndex];
        // Find player details to get their index
        const originalIndex = allPlayers.findIndex(p => p.name === currentImposterName);
        
        setRevealedImposters(prev => [
          ...prev, 
          { name: currentImposterName, index: originalIndex !== -1 ? originalIndex : currentIndex }
        ]);
        playSound('click');
        vibrate(50);
        currentIndex++;
      } else {
        clearInterval(revealIntervalRef.current);
        setIsRevealing(false);
        playSound('success');
        vibrate(100);
      }
    }, 500);
  };

  // Host Action: Trigger Imposter Reveal in database
  const handleHostReveal = async () => {
    if (!roomData || roomData.host !== localName || isRevealing) return;

    try {
      const roomRef = doc(db, 'rooms', roomId);
      if (roomData.showImposters) {
        // Toggle hide
        await updateDoc(roomRef, { showImposters: false });
      } else {
        // Toggle reveal
        await updateDoc(roomRef, { showImposters: true });
      }
    } catch (err) {
      console.error('Failed to trigger reveal:', err);
    }
  };

  // Host Action: Restart Room for another round
  const handleHostRestart = async () => {
    if (!roomData || roomData.host !== localName) return;

    playSound('click');
    vibrate(50);

    try {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        status: 'lobby',
        category: '',
        word: '',
        imposters: [],
        revealedCount: 0,
        discussionStarter: '',
        showImposters: false,
        players: roomData.players.map(p => ({ ...p, revealed: false })) // Reset status
      });
    } catch (err) {
      console.error('Failed to restart lobby:', err);
    }
  };

  // Player Action: Leave Room and exit
  const handleLeaveRoom = async () => {
    playSound('click');
    vibrate(30);

    try {
      if (roomData) {
        const roomRef = doc(db, 'rooms', roomId);
        // If Host leaves, we can delete the room document or keep it. Let's just remove our name.
        const updatedPlayers = roomData.players.filter(p => p.name !== localName);
        
        if (updatedPlayers.length === 0) {
          // If no one is left, delete room or reset
          await updateDoc(roomRef, { players: [] });
        } else {
          // Otherwise, remove player, and if host is leaving, assign next host
          const newHost = roomData.host === localName ? updatedPlayers[0].name : roomData.host;
          await updateDoc(roomRef, {
            players: updatedPlayers,
            host: newHost
          });
        }
      }
    } catch (err) {
      console.error(err);
    }

    resetGame();
    navigateTo('mode-selection');
  };

  if (!roomData) {
    return (
      <div className="page-container" style={{ justifyContent: 'center' }}>
        <h3 style={{ color: 'rgba(255,255,255,0.6)' }}>Syncing game results...</h3>
      </div>
    );
  }

  const isHost = roomData.host === localName;
  const word = roomData.word;
  const category = roomData.category;
  const discussionStarter = roomData.discussionStarter;

  return (
    <motion.div
      className="page-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
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
        transition={{ delay: 0.1 }}
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
            {discussionStarter}
          </motion.h3>
        )}
      </motion.div>

      {/* Reveal Imposters Buttons (Control interface differs for Host vs Player) */}
      {isHost ? (
        <motion.button
          onClick={handleHostReveal}
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
          transition={{ delay: 0.2 }}
          disabled={isRevealing}
        >
          {isRevealing ? 'Revealing...' : roomData.showImposters ? '🕵️ Hide Imposters' : '🕵️ Reveal Imposters'}
        </motion.button>
      ) : (
        <div style={{
          width: '100%',
          padding: '16px',
          textAlign: 'center',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
            {roomData.showImposters 
              ? '🕵️ Imposters revealed!' 
              : '⌛ Waiting for host to reveal imposters...'}
          </p>
        </div>
      )}

      {/* Imposters & Secret Word Display Card */}
      <AnimatePresence>
        {localShowImposters && (
          <motion.div
            className="glass-card"
            initial={{ y: 20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.9 }}
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
            
            {/* Imposter Names list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {revealedImposters.length > 0 ? (
                revealedImposters.map((imposter, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
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
                    <span style={{ fontSize: '24px' }}>🎭</span>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: '#ff6b6b' }}>
                      {imposter.name}
                    </span>
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>
                      Player {imposter.index + 1}
                    </span>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  style={{ textAlign: 'center', padding: '16px', color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}
                >
                  Revealing imposters...
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
                }}>
                  Category: {category}
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Host Restart / Restart Round Control */}
      {isHost && (
        <motion.button
          onClick={handleHostRestart}
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
          transition={{ delay: 0.3 }}
        >
          🎮 Play Next Round
        </motion.button>
      )}

      {/* Leave Room Control */}
      <motion.button
        onClick={handleLeaveRoom}
        className="btn-secondary"
        style={{
          padding: '12px',
          fontSize: '14px',
          width: '100%',
          borderRadius: '12px',
          opacity: 0.7,
          marginTop: '4px',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 0.4 }}
      >
        🚪 Leave Room / Exit
      </motion.button>

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

export default OnlineResult;
