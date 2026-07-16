import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, isConfigured } from '../utils/firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  arrayUnion,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  getCategoryNames, 
  getRandomCategoryAndWord, 
  getRandomWord 
} from '../data/categories';
import { playSound, vibrate, selectImposters } from '../utils/game';

const OnlineSetup = ({ navigateTo, gameState, updateGameState }) => {
  const [view, setView] = useState('menu'); // 'menu', 'create', 'join', 'lobby'
  const [nickname, setNickname] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [roomData, setRoomData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Lobby config states (Host only)
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedWord, setSelectedWord] = useState('');
  const [imposterCount, setImposterCount] = useState(1);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const categories = getCategoryNames();
  const allCategories = ['Random', ...categories];

  // Room Listener
  useEffect(() => {
    if (view !== 'lobby' || !gameState.onlineRoomId) return;

    const roomRef = doc(db, 'rooms', gameState.onlineRoomId);
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setRoomData(data);

        // Update local game state with database status
        updateGameState({
          players: data.players.map(p => p.name),
          selectedCategory: data.category,
          selectedWord: data.word,
          imposterCount: data.imposterCount,
          imposters: data.imposters,
          revealedPlayers: data.players.filter(p => p.revealed).map((p, idx) => idx) // mock revealed indices
        });

        // Trigger navigation for all players when host starts game
        if (data.status === 'reveal') {
          navigateTo('online-reveal');
        }
      } else {
        setError('Room was closed by the host.');
        setView('menu');
      }
    });

    return () => unsubscribe();
  }, [view, gameState.onlineRoomId]);

  // Generate 4-letter uppercase code
  const generateRoomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Create Room
  const handleCreateRoom = async () => {
    if (!nickname.trim()) {
      showError('Please enter a nickname');
      return;
    }

    if (!isConfigured) {
      showError('Firebase is not configured. Setup environment variables first!');
      return;
    }

    setLoading(true);
    playSound('click');
    vibrate(40);

    try {
      const code = generateRoomCode();
      const roomRef = doc(db, 'rooms', code);

      await setDoc(roomRef, {
        code,
        status: 'lobby',
        host: nickname.trim(),
        players: [{ name: nickname.trim(), revealed: false }],
        category: '',
        word: '',
        imposterCount: 1,
        imposters: [],
        revealedCount: 0,
        chatRound: 1,
        currentSpeakerIndex: 0,
        messages: [],
        createdAt: serverTimestamp()
      });

      updateGameState({
        onlineRoomId: code,
        onlinePlayerName: nickname.trim()
      });
      setView('lobby');
      setLoading(false);
    } catch (err) {
      console.error(err);
      showError('Failed to create room. Try again.');
      setLoading(false);
    }
  };

  // Join Room
  const handleJoinRoom = async () => {
    const code = roomCodeInput.trim().toUpperCase();
    if (!code || code.length !== 4) {
      showError('Please enter a valid 4-digit code');
      return;
    }
    if (!nickname.trim()) {
      showError('Please enter a nickname');
      return;
    }
    if (!isConfigured) {
      showError('Firebase configuration is missing!');
      return;
    }

    setLoading(true);
    playSound('click');
    vibrate(40);

    try {
      const roomRef = doc(db, 'rooms', code);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        showError('Room not found! Check code.');
        setLoading(false);
        return;
      }

      const data = roomSnap.data();

      if (data.status !== 'lobby') {
        showError('Game is already in progress!');
        setLoading(false);
        return;
      }

      // Check duplicate name
      const nameExists = data.players.some(
        p => p.name.toLowerCase() === nickname.trim().toLowerCase()
      );
      if (nameExists) {
        showError('Nickname already taken in this room.');
        setLoading(false);
        return;
      }

      // Join
      await updateDoc(roomRef, {
        players: arrayUnion({ name: nickname.trim(), revealed: false })
      });

      updateGameState({
        onlineRoomId: code,
        onlinePlayerName: nickname.trim()
      });
      setView('lobby');
      setLoading(false);
    } catch (err) {
      console.error(err);
      showError('Failed to join room.');
      setLoading(false);
    }
  };

  // Start Online Game (Host Only)
  const handleStartGame = async () => {
    if (!roomData || roomData.host !== gameState.onlinePlayerName) return;

    if (roomData.players.length < 3) {
      showError('At least 3 players are required to start!');
      return;
    }

    if (!selectedCategory) {
      showError('Please select a category');
      return;
    }

    if (imposterCount >= roomData.players.length) {
      showError('Imposters must be less than total players');
      return;
    }

    setLoading(true);
    playSound('success');
    vibrate(100);

    try {
      const roomRef = doc(db, 'rooms', roomData.code);

      // Select Imposters
      const playerNames = roomData.players.map(p => p.name);
      // Pick random imposter indices
      const imposterIndices = selectImposters(playerNames, imposterCount);
      // Map indices to actual names
      const imposterNames = imposterIndices.map(idx => playerNames[idx]);

      await updateDoc(roomRef, {
        status: 'reveal',
        category: selectedCategory,
        word: selectedWord,
        imposterCount: imposterCount,
        imposters: imposterNames,
        revealedCount: 0,
        chatRound: 1,
        currentSpeakerIndex: 0,
        messages: [],
        players: roomData.players.map(p => ({ ...p, revealed: false })) // Reset statuses
      });
    } catch (err) {
      console.error(err);
      showError('Failed to start the game.');
      setLoading(false);
    }
  };

  // Helper selectors
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    setShowCustomInput(false);
    setCustomCategory('');
    
    if (category === 'Random') {
      const { category: randomCat, word: randomWord } = getRandomCategoryAndWord();
      setSelectedCategory(randomCat);
      setSelectedWord(randomWord);
    } else {
      const word = getRandomWord(category);
      setSelectedWord(word);
    }
    playSound('click');
    vibrate(30);
  };

  const handleCustomCategory = () => {
    if (customCategory.trim()) {
      const word = getRandomWord(customCategory.trim());
      if (word) {
        setSelectedCategory(customCategory.trim());
        setSelectedWord(word);
        setShowCustomInput(false);
        playSound('click');
      } else {
        showError('Category not found!');
      }
    }
  };

  const showError = (msg) => {
    setError(msg);
    setTimeout(() => setError(''), 3000);
  };

  const isHost = roomData && roomData.host === gameState.onlinePlayerName;

  return (
    <motion.div
      className="page-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #2d1b69 100%)',
        justifyContent: 'flex-start',
        padding: '24px 16px',
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <motion.h1
        style={{
          fontSize: 'clamp(1.6rem, 5vw, 2.2rem)',
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 700,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #fd79a8, #6c5ce7)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '16px',
        }}
      >
        Online Multiplayer
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
              marginBottom: '16px',
            }}
          >
            <p style={{ color: '#ff6b6b', fontSize: '13px', fontWeight: 500 }}>
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Firebase configuration warning */}
      {!isConfigured && (view === 'menu' || view === 'create' || view === 'join') && (
        <div style={{
          background: 'rgba(253, 203, 110, 0.1)',
          border: '1px solid rgba(253, 203, 110, 0.2)',
          borderRadius: '16px',
          padding: '16px',
          color: '#fdcb6e',
          fontSize: '13px',
          lineHeight: '1.5',
          textAlign: 'center',
          marginBottom: '20px',
          width: '100%',
          maxWidth: '360px',
        }}>
          ⚠️ <strong>Firebase Config Missing</strong>
          <br />
          To play online, create a free Firebase project and add credentials to your environment variables.
        </div>
      )}

      {/* VIEW: Menu */}
      {view === 'menu' && (
        <motion.div 
          style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '14px' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => { playSound('click'); setView('create'); }}
            className="btn-primary"
            style={{ padding: '16px', fontSize: '16px' }}
            disabled={!isConfigured}
          >
            🏠 Create Room
          </button>
          <button
            onClick={() => { playSound('click'); setView('join'); }}
            className="btn-secondary"
            style={{ padding: '16px', fontSize: '16px' }}
            disabled={!isConfigured}
          >
            🔑 Join Room
          </button>
          <button
            onClick={() => { playSound('click'); navigateTo('mode-selection'); }}
            className="btn-outline"
            style={{ padding: '12px', fontSize: '14px', marginTop: '10px' }}
          >
            ← Back to Modes
          </button>
        </motion.div>
      )}

      {/* VIEW: Create Room Setup */}
      {view === 'create' && (
        <motion.div 
          className="glass-card"
          style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '14px' }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Create a New Room</h2>
          <div>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>
              Your Host Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="input-modern"
              placeholder="e.g. Muzammil"
              maxLength={15}
            />
          </div>
          <button
            onClick={handleCreateRoom}
            className="btn-success"
            style={{ fontSize: '16px', padding: '14px' }}
            disabled={loading}
          >
            {loading ? 'Creating...' : '🚀 Create & Enter Lobby'}
          </button>
          <button
            onClick={() => setView('menu')}
            className="btn-secondary"
            style={{ padding: '10px', fontSize: '13px' }}
          >
            Cancel
          </button>
        </motion.div>
      )}

      {/* VIEW: Join Room Setup */}
      {view === 'join' && (
        <motion.div 
          className="glass-card"
          style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '14px' }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>Join a Room</h2>
          <div>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>
              Room Code (4 Letters)
            </label>
            <input
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              className="input-modern"
              placeholder="e.g. ABCD"
              maxLength={4}
              style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '20px', fontWeight: 800 }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>
              Your Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="input-modern"
              placeholder="e.g. Ahmad"
              maxLength={15}
            />
          </div>
          <button
            onClick={handleJoinRoom}
            className="btn-success"
            style={{ fontSize: '16px', padding: '14px' }}
            disabled={loading}
          >
            {loading ? 'Joining...' : '⚡ Join Game'}
          </button>
          <button
            onClick={() => setView('menu')}
            className="btn-secondary"
            style={{ padding: '10px', fontSize: '13px' }}
          >
            Cancel
          </button>
        </motion.div>
      )}

      {/* VIEW: Room Lobby (Synced) */}
      {view === 'lobby' && roomData && (
        <motion.div 
          style={{ width: '100%', maxWidth: '380px', display: 'flex', flexDirection: 'column', gap: '16px' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* Room Code Display */}
          <div className="glass-card" style={{ textAlign: 'center', padding: '16px' }}>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Room Code
            </span>
            <h2 style={{ fontSize: '36px', fontFamily: "'Orbitron', sans-serif", fontWeight: 900, color: '#fdcb6e', letterSpacing: '4px', marginTop: '4px' }}>
              {roomData.code}
            </h2>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
              Tell your friends to join using this code!
            </p>
          </div>

          {/* Player List */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <h3 style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
              <span>👥 Players in Room</span>
              <span style={{ color: '#6c5ce7', fontWeight: 700 }}>{roomData.players.length}</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '150px', overflowY: 'auto' }}>
              {roomData.players.map((p, idx) => (
                <div 
                  key={idx} 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: p.name === roomData.host ? 'rgba(108,92,231,0.15)' : 'rgba(255,255,255,0.04)',
                    border: p.name === roomData.host ? '1px solid rgba(108,92,231,0.3)' : '1px solid transparent',
                  }}
                >
                  <span style={{ fontWeight: 600, color: p.name === nickname ? '#fd79a8' : '#fff' }}>
                    {p.name} {p.name === nickname ? '(You)' : ''}
                  </span>
                  {p.name === roomData.host && (
                    <span style={{ fontSize: '11px', color: '#6c5ce7', fontWeight: 700, textTransform: 'uppercase' }}>
                      👑 Host
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Config (Host Only) */}
          {isHost ? (
            <>
              {/* Category Selector */}
              <div className="glass-card" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', marginBottom: '10px' }}>
                  📂 Choose Category
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '100px', overflowY: 'auto', marginBottom: '8px' }}>
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        border: selectedCategory === cat ? '2px solid #6c5ce7' : '1px solid rgba(255,255,255,0.1)',
                        background: selectedCategory === cat ? 'rgba(108,92,231,0.2)' : 'rgba(255,255,255,0.05)',
                        color: 'white',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {showCustomInput ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="input-modern"
                      placeholder="Custom category name..."
                    />
                    <button onClick={handleCustomCategory} className="btn-secondary" style={{ width: 'auto', padding: '10px' }}>
                      Add
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowCustomInput(true)} className="btn-outline" style={{ padding: '8px', fontSize: '12px' }}>
                    + Custom Category
                  </button>
                )}
              </div>

              {/* Imposter Selector */}
              <div className="glass-card" style={{ padding: '16px' }}>
                <h3 style={{ fontSize: '15px', color: 'rgba(255,255,255,0.8)', marginBottom: '10px' }}>
                  🕵️ Imposters Count
                </h3>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  {[1, 2, 3].map((count) => (
                    <button
                      key={count}
                      onClick={() => { playSound('click'); setImposterCount(count); }}
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '50%',
                        border: imposterCount === count ? '3px solid #6c5ce7' : '2px solid rgba(255,255,255,0.1)',
                        background: imposterCount === count ? 'rgba(108,92,231,0.2)' : 'rgba(255,255,255,0.04)',
                        color: '#fff',
                        fontSize: '16px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartGame}
                className="btn-success"
                style={{ padding: '16px', fontSize: '18px', fontWeight: 800 }}
                disabled={loading}
              >
                {loading ? 'Starting...' : '🎯 START ONLINE GAME'}
              </button>
            </>
          ) : (
            <div className="glass-card" style={{ textAlign: 'center', padding: '24px', background: 'rgba(255,255,255,0.02)' }}>
              <motion.div
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ fontSize: '20px', marginBottom: '8px' }}
              >
                ⌛
              </motion.div>
              <h3 style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)' }}>Waiting for Host to start...</h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                Host: {roomData.host}
              </p>
            </div>
          )}
        </motion.div>
      )}

      {/* Founder Credit at Bottom */}
      <div style={{ marginTop: '24px', textAlign: 'center', width: '100%' }}>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Designed & Founded by
        </span>
        <br />
        <span style={{ color: '#fdcb6e', fontSize: '12px', fontWeight: 800, letterSpacing: '2px', background: 'linear-gradient(135deg, #fdcb6e, #fd79a8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          MUZAMMIL
        </span>
      </div>
    </motion.div>
  );
};

export default OnlineSetup;
