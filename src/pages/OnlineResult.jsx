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
  
  // Chat States
  const [messageText, setMessageText] = useState('');
  const revealIntervalRef = useRef(null);
  const chatEndRef = useRef(null);

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
          resetGame();
          navigateTo('online-setup');
        }

        // Sync imposter reveal state across all phones
        if (data.showImposters && !localShowImposters && !isRevealing) {
          triggerLocalReveal(data.imposters, data.players);
        } else if (!data.showImposters && localShowImposters) {
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

  // Autoscroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [roomData?.messages, localShowImposters]);

  // Synchronized animation to reveal imposters one-by-one (Safe and robust)
  const triggerLocalReveal = (imposterNames = [], allPlayers = []) => {
    setIsRevealing(true);
    setLocalShowImposters(true);
    playSound('reveal');
    vibrate(100);

    const safeImposters = Array.isArray(imposterNames) ? imposterNames : [];
    const safePlayers = Array.isArray(allPlayers) ? allPlayers : [];

    let currentIndex = 0;
    setRevealedImposters([]);

    if (safeImposters.length === 0) {
      setIsRevealing(false);
      return;
    }

    revealIntervalRef.current = setInterval(() => {
      try {
        if (currentIndex < safeImposters.length) {
          const currentImposterName = safeImposters[currentIndex];
          if (!currentImposterName) {
            currentIndex++;
            return;
          }
          const originalIndex = safePlayers.findIndex(p => p && p.name === currentImposterName);
          
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
      } catch (err) {
        console.error("Error in local reveal interval:", err);
        clearInterval(revealIntervalRef.current);
        setIsRevealing(false);
      }
    }, 500);
  };

  // Chat Actions: Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !roomData) return;

    const message = {
      sender: localName,
      text: messageText.trim(),
      timestamp: Date.now()
    };

    const roomRef = doc(db, 'rooms', roomId);
    
    try {
      const updatedMessages = [...(roomData.messages || []), message];
      
      if (roomData.chatRound === 1) {
        // Round 1 turn-based logic
        const nextSpeakerIndex = roomData.currentSpeakerIndex + 1;
        const isRound1Finished = nextSpeakerIndex >= roomData.players.length;
        
        await updateDoc(roomRef, {
          messages: updatedMessages,
          currentSpeakerIndex: isRound1Finished ? 0 : nextSpeakerIndex,
          chatRound: isRound1Finished ? 2 : 1
        });
      } else {
        // Round 2 turn-based logic
        const nextSpeakerIndex = roomData.currentSpeakerIndex + 1;
        
        await updateDoc(roomRef, {
          messages: updatedMessages,
          currentSpeakerIndex: nextSpeakerIndex
        });
      }
      setMessageText('');
      playSound('click');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // Host Action: Start Voting Stage
  const handleStartVoting = async () => {
    if (!roomData || roomData.host !== localName) return;

    playSound('click');
    vibrate(50);

    try {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        votingStarted: true,
        votes: {}
      });
    } catch (err) {
      console.error('Failed to start voting:', err);
    }
  };

  // Player Action: Cast Vote
  const handleCastVote = async (votedForName) => {
    if (!roomData || !roomId) return;

    playSound('click');
    vibrate(30);

    try {
      const roomRef = doc(db, 'rooms', roomId);
      const currentVotes = roomData.votes || {};
      
      await updateDoc(roomRef, {
        votes: {
          ...currentVotes,
          [localName]: votedForName
        }
      });
    } catch (err) {
      console.error('Failed to cast vote:', err);
    }
  };

  // Host Action: Trigger Imposter Reveal in database
  const handleHostReveal = async () => {
    if (!roomData || roomData.host !== localName || isRevealing) return;

    try {
      const roomRef = doc(db, 'rooms', roomId);
      if (roomData.showImposters) {
        await updateDoc(roomRef, { showImposters: false });
      } else {
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
        chatRound: 1,
        currentSpeakerIndex: 0,
        messages: [],
        votingStarted: false,
        votes: {},
        players: roomData.players.map(p => ({ ...p, revealed: false }))
      });
    } catch (err) {
      console.error('Failed to restart lobby:', err);
    }
  };

  // Player Action: Leave Room
  const handleLeaveRoom = async () => {
    playSound('click');
    vibrate(30);

    try {
      if (roomData) {
        const roomRef = doc(db, 'rooms', roomId);
        const updatedPlayers = roomData.players.filter(p => p.name !== localName);
        
        if (updatedPlayers.length === 0) {
          await updateDoc(roomRef, { players: [] });
        } else {
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

  // Turn calculation
  const currentSpeaker = roomData.players && roomData.players[roomData.currentSpeakerIndex]?.name;
  const isMyTurn = currentSpeaker === localName;
  const isRoundFinished = roomData.players && roomData.currentSpeakerIndex >= roomData.players.length;

  // Voting stats
  const votes = roomData.votes || {};
  const totalVotesCast = Object.keys(votes).length;
  const allVoted = roomData.players && totalVotesCast === roomData.players.length;

  // Vote tabulation
  const voteCounts = {};
  if (roomData.players) {
    roomData.players.forEach(p => { voteCounts[p.name] = 0; });
    Object.values(votes).forEach(votedFor => {
      if (voteCounts[votedFor] !== undefined) {
        voteCounts[votedFor]++;
      }
    });
  }

  return (
    <motion.div
      className="page-container"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4 }}
      style={{
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #2d1b69 100%)',
        justifyContent: 'flex-start',
        padding: '16px',
        gap: '12px',
        overflowY: 'auto',
      }}
    >
      {/* Title */}
      <motion.h1
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          fontSize: 'clamp(1.6rem, 5vw, 2.2rem)',
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 700,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #fdcb6e, #fd79a8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '4px',
        }}
      >
        {roomData.votingStarted ? "Voting Room" : "Discussion Room"}
      </motion.h1>

      {/* Discussion Starter Card */}
      <motion.div
        className="glass-card-light"
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          width: '100%',
          textAlign: 'center',
          padding: '12px 16px',
          borderColor: 'rgba(253,203,110,0.2)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          🗣 Discussion Starter:
        </span>
        <span style={{ fontSize: '16px', fontWeight: 800, color: '#fdcb6e' }}>
          {discussionStarter}
        </span>
      </motion.div>

      {/* 1. CHAT MODE (Show before voting is started) */}
      {!localShowImposters && !roomData.votingStarted && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Chat Turn / Round Status Indicator */}
          <div style={{
            background: roomData.chatRound === 1 ? 'rgba(108, 92, 231, 0.12)' : 'rgba(0, 184, 148, 0.12)',
            border: roomData.chatRound === 1 ? '1px solid rgba(108, 92, 231, 0.2)' : '1px solid rgba(0, 184, 148, 0.2)',
            borderRadius: '12px',
            padding: '10px 12px',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: 600,
            color: roomData.chatRound === 1 ? '#a29bfe' : '#55efc4'
          }}>
            {!isRoundFinished ? (
              <span>
                💬 <strong>Round {roomData.chatRound}</strong>: {isMyTurn ? "Your turn! Type your description/comment." : `Waiting for ${currentSpeaker}...`}
              </span>
            ) : (
              <span>
                ⌛ <strong>Discussion rounds complete!</strong> Waiting for host to start voting...
              </span>
            )}
          </div>

          {/* Messages list */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '220px',
            background: 'rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '12px',
            overflowY: 'auto',
            gap: '8px',
          }}>
            {roomData.messages && roomData.messages.length > 0 ? (
              roomData.messages.map((msg, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: msg.sender === localName ? 'flex-end' : 'flex-start',
                    maxWidth: '75%',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    background: msg.sender === localName ? 'rgba(108,92,231,0.25)' : 'rgba(255,255,255,0.06)',
                    border: msg.sender === localName ? '1px solid rgba(108,92,231,0.3)' : '1px solid transparent',
                  }}
                >
                  <span style={{ fontSize: '10px', color: msg.sender === localName ? '#fd79a8' : 'rgba(255,255,255,0.4)', fontWeight: 700, marginBottom: '2px' }}>
                    {msg.sender}
                  </span>
                  <span style={{ fontSize: '13px', color: '#fff', wordBreak: 'break-word' }}>
                    {msg.text}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '13px' }}>
                Chat is empty. Start describing!
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Form Input */}
          {!isRoundFinished && (
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={isMyTurn ? "Type your message..." : `Waiting for ${currentSpeaker}...`}
                className="input-modern"
                disabled={!isMyTurn}
                style={{ flex: 1 }}
                maxLength={100}
              />
              <button
                type="submit"
                className="btn-success"
                disabled={!messageText.trim() || !isMyTurn}
                style={{ width: 'auto', padding: '0 20px', borderRadius: '12px', fontSize: '14px', minHeight: '48px' }}
              >
                Send
              </button>
            </form>
          )}

          {/* Host Start Voting Action */}
          {isRoundFinished && isHost && (
            <motion.button
              onClick={handleStartVoting}
              className="btn-success"
              style={{
                padding: '14px',
                fontSize: '16px',
                fontWeight: 700,
                width: '100%',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #00b894, #00cec9)',
                boxShadow: '0 4px 20px rgba(0,206,201,0.4)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              🗳️ Start Voting Stage
            </motion.button>
          )}
        </div>
      )}

      {/* 2. VOTING MODE (Show when voting has started, but results are not yet revealed) */}
      {!localShowImposters && roomData.votingStarted && (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div style={{
            background: 'rgba(108, 92, 231, 0.12)',
            border: '1px solid rgba(108, 92, 231, 0.2)',
            borderRadius: '12px',
            padding: '10px 12px',
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 600,
            color: '#a29bfe'
          }}>
            {!allVoted ? "🗳️ Select who you think is the Imposter!" : "🎉 All votes cast! Host can reveal results."}
          </div>

          {/* Player Vote Options */}
          {!allVoted && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
              {roomData.players.map((p, idx) => {
                if (p.name === localName) return null; // Can't vote for yourself
                const hasVoted = votes[localName];
                const isSelected = votes[localName] === p.name;
                
                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleCastVote(p.name)}
                    disabled={!!hasVoted}
                    style={{
                      padding: '14px',
                      fontSize: '16px',
                      borderRadius: '12px',
                      background: isSelected ? 'linear-gradient(135deg, #6c5ce7, #a29bfe)' : 'rgba(255, 255, 255, 0.05)',
                      border: isSelected ? '1px solid #6c5ce7' : '1px solid rgba(255, 255, 255, 0.1)',
                      color: '#fff',
                      fontWeight: 600,
                      opacity: hasVoted && !isSelected ? 0.5 : 1
                    }}
                    whileHover={{ scale: hasVoted ? 1 : 1.02 }}
                    whileTap={{ scale: hasVoted ? 1 : 0.98 }}
                  >
                    {p.name} {isSelected && ' ✅'}
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Voting Tracker */}
          <div style={{
            background: 'rgba(0,0,0,0.2)',
            padding: '14px',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <p style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              textAlign: 'center',
              marginBottom: '10px'
            }}>
              Voted Status ({totalVotesCast} / {roomData.players.length})
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '6px' }}>
              {roomData.players.map((p, idx) => {
                const voted = votes[p.name];
                return (
                  <span 
                    key={idx} 
                    style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      background: voted ? 'rgba(0, 184, 148, 0.15)' : 'rgba(214, 48, 49, 0.12)',
                      color: voted ? '#00b894' : '#ff7675',
                      border: voted ? '1px solid rgba(0, 184, 148, 0.2)' : '1px solid rgba(214, 48, 49, 0.2)'
                    }}
                  >
                    {p.name}: {voted ? 'Voted' : 'Voting...'}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Tally results once everyone has voted */}
          {allVoted && (
            <motion.div 
              className="glass-card" 
              style={{ width: '100%', borderColor: 'rgba(108, 92, 231, 0.3)', padding: '16px' }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <h4 style={{ textAlign: 'center', color: '#fdcb6e', marginBottom: '10px' }}>Voting Results</h4>
              {Object.entries(voteCounts).sort((a,b) => b[1] - a[1]).map(([name, count], idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '8px 12px', 
                    background: idx === 0 && count > 0 ? 'rgba(214, 48, 49, 0.15)' : 'rgba(255,255,255,0.03)',
                    borderRadius: '8px',
                    marginBottom: '6px',
                    border: idx === 0 && count > 0 ? '1px solid rgba(214, 48, 49, 0.3)' : '1px solid transparent'
                  }}
                >
                  <span style={{ fontWeight: idx === 0 && count > 0 ? 700 : 500, color: idx === 0 && count > 0 ? '#ff7675' : '#fff' }}>
                    {name} {idx === 0 && count > 0 ? '👑 (Suspected)' : ''}
                  </span>
                  <span style={{ fontWeight: 700 }}>{count} {count === 1 ? 'vote' : 'votes'}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Host Action: Reveal Imposters Button (Only enabled once all players have voted) */}
          {isHost && (
            <motion.button
              onClick={handleHostReveal}
              className="btn-danger"
              disabled={!allVoted || isRevealing}
              style={{
                padding: '16px',
                fontSize: '16px',
                fontWeight: 700,
                width: '100%',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #e17055, #d63031)',
                boxShadow: '0 4px 20px rgba(214,48,49,0.4)',
                opacity: !allVoted || isRevealing ? 0.5 : 1,
                marginTop: '6px'
              }}
              whileHover={{ scale: !allVoted ? 1 : 1.02 }}
              whileTap={{ scale: !allVoted ? 1 : 0.98 }}
            >
              🕵️ Reveal Imposters
            </motion.button>
          )}
        </div>
      )}

      {/* 3. REVEALED DISPLAY MODE (Triggered after Host clicks Reveal Imposters) */}
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
              marginTop: '8px',
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
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {revealedImposters.map((imposter, idx) => (
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
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                    Player {imposter.index + 1}
                  </span>
                </motion.div>
              ))}
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

      {/* Host Restart Control */}
      {isHost && (localShowImposters || (roomData.votingStarted && allVoted)) && (
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
