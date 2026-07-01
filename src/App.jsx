import React, { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Reveal from './pages/Reveal'
import Result from './pages/Result'

function App() {
  const [currentPage, setCurrentPage] = useState('landing')
  const [gameState, setGameState] = useState({
    players: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
    category: '',
    word: '',
    imposters: [],
    currentPlayerIndex: 0,
    revealedPlayers: [],
    allWordsUsed: [],
    categoriesUsed: [],
    selectedCategory: '',
    selectedWord: '',
    imposterCount: 1
  })

  // Handle navigation between pages
  const navigateTo = (page) => {
    setCurrentPage(page)
  }

  // Update game state
  const updateGameState = (newState) => {
    setGameState(prev => ({ ...prev, ...newState }))
  }

  // Reset game for new round
  const resetGame = () => {
    setGameState({
      ...gameState,
      currentPlayerIndex: 0,
      revealedPlayers: [],
      selectedCategory: '',
      selectedWord: '',
      imposters: []
    })
  }

  // Render current page
  const renderPage = () => {
    switch(currentPage) {
      case 'landing':
        return <Landing navigateTo={navigateTo} />
      case 'home':
        return (
          <Home 
            navigateTo={navigateTo} 
            gameState={gameState} 
            updateGameState={updateGameState} 
          />
        )
      case 'reveal':
        return (
          <Reveal 
            navigateTo={navigateTo} 
            gameState={gameState} 
            updateGameState={updateGameState} 
          />
        )
      case 'result':
        return (
          <Result 
            navigateTo={navigateTo} 
            gameState={gameState} 
            updateGameState={updateGameState} 
            resetGame={resetGame}
          />
        )
      default:
        return <Landing navigateTo={navigateTo} />
    }
  }

  return (
    <AnimatePresence mode="wait">
      {renderPage()}
    </AnimatePresence>
  )
}

export default App