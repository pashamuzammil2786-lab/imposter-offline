import React from 'react';
import { motion } from 'framer-motion';
import { playSound, vibrate } from '../utils/game';

const ModeSelection = ({ navigateTo }) => {
  const handleSelectMode = (mode) => {
    playSound('click');
    vibrate(40);
    if (mode === 'offline') {
      navigateTo('home');
    } else {
      navigateTo('online-setup');
    }
  };

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
        gap: '24px',
        padding: '24px 16px',
      }}
    >
      {/* Title */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        style={{ textAlign: 'center', marginBottom: '10px' }}
      >
        <h1 style={{
          fontSize: 'clamp(2rem, 6vw, 2.8rem)',
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 900,
          background: 'linear-gradient(135deg, #6c5ce7, #fd79a8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 0 40px rgba(108,92,231,0.2)',
          letterSpacing: '1px',
        }}>
          SELECT MODE
        </h1>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.4)',
          fontFamily: "'Inter', sans-serif",
          marginTop: '6px',
          letterSpacing: '1px',
        }}>
          How do you want to play?
        </p>
      </motion.div>

      {/* Cards Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '360px',
      }}>
        {/* Offline Card */}
        <motion.div
          className="glass-card"
          onClick={() => handleSelectMode('offline')}
          whileHover={{ scale: 1.03, borderColor: 'rgba(108,92,231,0.4)' }}
          whileTap={{ scale: 0.97 }}
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          style={{
            cursor: 'pointer',
            padding: '28px 20px',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'linear-gradient(135deg, rgba(108,92,231,0.1) 0%, rgba(255,255,255,0.03) 100%)',
          }}
        >
          <span style={{ fontSize: '40px' }}>📱</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#a29bfe',
              fontFamily: "'Inter', sans-serif",
            }}>
              Offline Mode
            </h3>
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: '1.4',
            }}>
              Pass the Phone. Play together in the same room using a single device.
            </p>
          </div>
        </motion.div>

        {/* Online Card */}
        <motion.div
          className="glass-card"
          onClick={() => handleSelectMode('online')}
          whileHover={{ scale: 1.03, borderColor: 'rgba(253,121,168,0.4)' }}
          whileTap={{ scale: 0.97 }}
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          style={{
            cursor: 'pointer',
            padding: '28px 20px',
            border: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'linear-gradient(135deg, rgba(253,121,168,0.1) 0%, rgba(255,255,255,0.03) 100%)',
          }}
        >
          <span style={{ fontSize: '40px' }}>🌐</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#fd79a8',
              fontFamily: "'Inter', sans-serif",
            }}>
              Online Multiplayer
            </h3>
            <p style={{
              fontSize: '13px',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: '1.4',
            }}>
              Play across classes. Connect with friends anywhere using their own phones.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Back Button */}
      <motion.button
        onClick={() => {
          playSound('click');
          vibrate(20);
          navigateTo('landing');
        }}
        className="btn-secondary"
        style={{
          maxWidth: '360px',
          padding: '12px',
          fontSize: '14px',
          borderRadius: '12px',
          opacity: 0.7,
          marginTop: '10px',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={{ delay: 0.4 }}
      >
        ← Back to Title
      </motion.button>

      {/* Founder Credit at Bottom */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '24px',
          width: '100%',
          textAlign: 'center',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <span style={{
          color: 'rgba(255,255,255,0.15)',
          fontSize: '11px',
          letterSpacing: '1.5px',
          textTransform: 'uppercase',
          fontWeight: 500,
        }}>
          Designed & Founded by
        </span>
        <br />
        <span style={{
          color: '#fdcb6e',
          fontSize: '13px',
          fontWeight: 800,
          letterSpacing: '3px',
          background: 'linear-gradient(135deg, #fdcb6e, #fd79a8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 0 20px rgba(253,203,110,0.2)',
          display: 'inline-block',
          marginTop: '4px',
        }}>
          MUZAMMIL
        </span>
      </motion.div>
    </motion.div>
  );
};

export default ModeSelection;
