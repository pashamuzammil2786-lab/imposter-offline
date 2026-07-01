import React from 'react';
import { motion } from 'framer-motion';
import { playSound, vibrate } from '../utils/game';

const Landing = ({ navigateTo }) => {
  const handleEnterGame = () => {
    playSound('click');
    vibrate(50);
    navigateTo('home');
  };

  return (
    <motion.div
      className="page-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      style={{
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #2d1b69 100%)',
        justifyContent: 'center',
        gap: '20px',
        padding: '30px 20px',
      }}
    >
      {/* Background decorative elements */}
      <motion.div
        style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,92,231,0.15) 0%, transparent 70%)',
          top: '-100px',
          right: '-100px',
          pointerEvents: 'none',
        }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        style={{
          position: 'absolute',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(253,121,168,0.1) 0%, transparent 70%)',
          bottom: '-50px',
          left: '-50px',
          pointerEvents: 'none',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 1,
        }}
      />

      {/* Logo with glow - Now shows your custom logo */}
      <motion.div
        onClick={handleEnterGame}
        style={{
          cursor: 'pointer',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2,
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Glow ring behind logo */}
        <motion.div
          style={{
            position: 'absolute',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(108,92,231,0.3) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Your Custom Logo */}
        <img
          src="/logo.svg"
          alt="I AM IMPOSTER by MUZAMMIL"
          style={{
            width: '160px',
            height: '160px',
            objectFit: 'contain',
            position: 'relative',
            zIndex: 2,
            filter: 'drop-shadow(0 0 40px rgba(108,92,231,0.5))',
          }}
          onError={(e) => {
            e.target.style.display = 'none';
            // Fallback emoji with your name
            const fallback = document.createElement('div');
            fallback.style.cssText = `
              font-size: 100px;
              position: relative;
              z-index: 2;
              text-shadow: 0 0 40px rgba(108,92,231,0.5);
              display: flex;
              flex-direction: column;
              align-items: center;
            `;
            fallback.innerHTML = `
              <span style="font-size:80px;">🎭</span>
              <span style="font-size:12px;color:rgba(255,255,255,0.3);margin-top:10px;">by MUZAMMIL</span>
            `;
            e.target.parentNode.appendChild(fallback);
          }}
        />
      </motion.div>

      {/* Title */}
      <motion.h1
        style={{
          fontSize: 'clamp(2.5rem, 8vw, 4rem)',
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 900,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #6c5ce7, #fd79a8, #fdcb6e)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 0 60px rgba(108,92,231,0.3)',
          marginTop: '10px',
          letterSpacing: '2px',
          lineHeight: 1.1,
          zIndex: 2,
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6, type: 'spring' }}
      >
        I AM
        <br />
        IMPOSTER
      </motion.h1>

      {/* Subtitle with Creator Credit */}
      <motion.p
        style={{
          fontSize: 'clamp(0.9rem, 2.5vw, 1.2rem)',
          color: 'rgba(255,255,255,0.5)',
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          textAlign: 'center',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          zIndex: 2,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
      >
        Offline Party Game
        <br />
        <span style={{ 
          fontSize: 'clamp(0.7rem, 2vw, 0.9rem)',
          color: 'rgba(255,255,255,0.2)',
          letterSpacing: '2px',
        }}>
          Created by MUZAMMIL
        </span>
      </motion.p>

      {/* Tap to enter indicator */}
      <motion.div
        style={{
          marginTop: '20px',
          padding: '12px 24px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50px',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(10px)',
          zIndex: 2,
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
      >
        <motion.p
          style={{
            color: 'rgba(255,255,255,0.5)',
            fontSize: '14px',
            fontWeight: 500,
            letterSpacing: '2px',
            fontFamily: "'Inter', sans-serif",
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          Tap Logo to Enter
        </motion.p>
      </motion.div>

      {/* Your Brand at Bottom - Enhanced */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '30px',
          zIndex: 2,
          width: '100%',
          textAlign: 'center',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8 }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
        }}>
          <span style={{
            color: 'rgba(255,255,255,0.15)',
            fontSize: '12px',
            fontWeight: 300,
            letterSpacing: '1px',
          }}>
            Made with ❤️ by
          </span>
          <span style={{ 
            color: '#fdcb6e',
            fontSize: '16px',
            fontWeight: 800,
            letterSpacing: '2px',
            textShadow: '0 0 30px rgba(253,203,110,0.2)',
            background: 'linear-gradient(135deg, #fdcb6e, #fd79a8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            MUZAMMIL
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Landing;