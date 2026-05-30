import React, { useEffect, useState } from 'react'
import { createDeck, detectMatch, applyMatch, getDisplayName } from './utils/gameLogic'
import { loadStats, saveStats, recordGame, addLeaderboardEntry, clearLeaderboardAndHistory } from './utils/storage'
import { soundPlayer } from './utils/sounds'
import { getSkinConfig } from './utils/skins'
import { Card, CardSkin, MatchType, GameMode } from './types'

function App() {
  const [stats, setStats] = useState(loadStats())
  const [deck, setDeck] = useState<Card[]>(() => createDeck())
  const [table, setTable] = useState<Card[]>([])
  const [message, setMessage] = useState('Tap Flip to begin.')
  const [finished, setFinished] = useState(false)
  const [pendingMatch, setPendingMatch] = useState<MatchType | null>(null)
  const [showFinishModal, setShowFinishModal] = useState(false)
  const [finalScore, setFinalScore] = useState<number | null>(null)
  const [nameForSave, setNameForSave] = useState('')
  const [qualifiesForBoard, setQualifiesForBoard] = useState(false)

  useEffect(() => {
    saveStats(stats)
  }, [stats])

  // Clear historical leaderboard data now as requested (preserve player name/skin)
  useEffect(() => {
    const wiped = clearLeaderboardAndHistory(stats)
    setStats(wiped)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedSkin = stats.selectedSkin
  const skinConfig = getSkinConfig(selectedSkin as CardSkin)

  function flipNextCard() {
    if (finished || deck.length === 0) return
    const next = deck[deck.length - 1]
    setDeck(d => d.slice(0, -1))
    setTable(t => {
      const newTable = [...t, next]
      soundPlayer.playFlip()
      const match = detectMatch(newTable)
      if (match) {
        setPendingMatch(match)
        // do not show a special match notification text; pendingMatch alone indicates availability
      } else {
        setPendingMatch(null)
        setMessage(`Flipped ${getDisplayName(next)}. No match yet.`)
      }
      if (deck.length - 1 === 0) {
        finishGameIfNeeded(newTable)
      }
      return newTable
    })
  }

  function resolvePendingMatch() {
    if (!pendingMatch) return
    // remove only the current pending match; if a new match appears the user must press Match again
    setTable(t => {
      const newTable = applyMatch(t, pendingMatch)
      soundPlayer.playMatch()
      // after removal, detect if a new match exists and set pendingMatch accordingly
      const nextMatch = detectMatch(newTable)
      if (nextMatch) {
        setPendingMatch(nextMatch)
      } else {
        setPendingMatch(null)
      }
      // If the deck is empty after this removal, finish the game (show modal) regardless
      if (deck.length === 0) {
        // use a microtask to ensure state updates settle
        setTimeout(() => finishGameIfNeeded(newTable), 0)
      }
      return newTable
    })
  }

  function finishGameIfNeeded(finalTable: Card[]) {
    if (finished) return
    if (deck.length > 0) return
    setFinished(true)
    setFinalScore(finalTable.length)
    setShowFinishModal(true)
    setMessage('')
    // update aggregates (games played/completed/avg) but do not add to leaderboard yet
    const updated = recordGame(stats, finalTable.length, stats.mode as GameMode)
    setStats(updated)
    setNameForSave(updated.playerName)
    // determine qualification for top-20
    const lb = updated.globalStats.leaderboard
    const qualifies = lb.length < 20 || finalTable.length < (lb[lb.length - 1]?.score ?? Infinity)
    setQualifiesForBoard(qualifies)
  }

  function getScoreMessage(score: number) {
    if (score >= 2 && score <= 10) return "Awesome — nice run!"
    if (score >= 12 && score <= 18) return "Better luck next time."
    if (score >= 20 && score <= 26) return "Oof — that was rough, but you'll get 'em next time."
    if (score > 26) return "Maybe take a break — that one hurt."
    return `Final score: ${score}`
  }

  function saveToLeaderboard() {
    if (finalScore == null) return
    const updated = addLeaderboardEntry(stats, nameForSave || 'Player', finalScore)
    setStats(updated)
    setShowFinishModal(false)
  }

  function closeFinishModal() {
    setShowFinishModal(false)
  }

  function resetGame() {
    setDeck(createDeck())
    setTable([])
    setMessage('Tap Flip to begin.')
    setFinished(false)
    setPendingMatch(null)
    soundPlayer.playShuffle()
  }

  return (
    <div>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1>Bonnie's Game</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input value={stats.playerName} onChange={e => setStats({ ...stats, playerName: e.target.value })} style={{ width: 120 }} />
        </div>
      </header>

      <div className="card-row">
        {table.length === 0 ? (
          <div style={{ width: 150, height: 213, borderRadius: 22, background: `linear-gradient(135deg, ${skinConfig.backGradient[0]}, ${skinConfig.backGradient[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <strong style={{ color: '#fff' }}>Deck</strong>
          </div>
        ) : (
          table.slice(-4).map((card, idx) => (
            <div key={card.id} className="card-wrapper" style={{ boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
              <CardView card={card} skinConfig={skinConfig} />
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        <h3 style={{ color: '#fff' }}>Game stats</h3>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <Stat title="Penalty" value={`${table.length}`} />
          <Stat title="Remaining" value={`${deck.length}`} />
          <Stat title="Best" value={`${stats.playerStats.bestScore}`} />
        </div>
      </div>

      <p style={{ color: '#fff', marginTop: 12 }}>{message}</p>

      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <button onClick={flipNextCard} disabled={deck.length === 0 || finished} style={{ flex: 1, padding: '12px 16px', background: deck.length === 0 || finished ? '#888' : '#007bff', color: '#fff' }}>
          Flip
        </button>
        <button onClick={resetGame} style={{ padding: '12px 16px', background: '#6f42c1', color: '#fff' }}>
          Restart
        </button>
        <button
          onClick={resolvePendingMatch}
          disabled={!pendingMatch}
          className={`button-match ${pendingMatch ? 'match-available' : ''}`}
          style={{ flex: 1 }}
        >
          Match
        </button>
      </div>

      <footer style={{ marginTop: 16 }}>
        <Leaderboard globalStats={stats.globalStats} />
      </footer>

      {/* Finish modal */}
      {showFinishModal && finalScore !== null && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
          <div style={{ width: 320, background: '#fff', borderRadius: 12, padding: 16 }}>
            <h2>Game Over</h2>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 20 }}>{`Score: ${finalScore}`}</div>
              <div style={{ marginTop: 8, color: '#444' }}>{getScoreMessage(finalScore)}</div>
            </div>
            {qualifiesForBoard ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 13, color: '#222' }}>Congrats — your score may enter the top 20. Edit your name:</div>
                <input value={nameForSave} onChange={e => setNameForSave(e.target.value)} style={{ marginTop: 8, width: '100%', padding: 8 }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={saveToLeaderboard} style={{ flex: 1, background: '#28a745', color: '#fff', padding: '8px 12px', borderRadius: 8 }}>Save</button>
                  <button onClick={closeFinishModal} style={{ flex: 1, background: '#ccc', padding: '8px 12px', borderRadius: 8 }}>Close</button>
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 12 }}>
                <div style={{ color: '#666' }}>Your score didn't make the top 20.</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button onClick={closeFinishModal} style={{ background: '#007bff', color: '#fff', padding: '8px 12px', borderRadius: 8 }}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div style={{ flex: 1, padding: 12, borderRadius: 12, background: '#eef2f7' }}>
      <div style={{ fontSize: 12, color: '#000' }}>{title}</div>
      <div style={{ fontWeight: 700, fontSize: 18, color: '#000' }}>{value}</div>
    </div>
  )
}

function CardView({ card, skinConfig }: { card: Card; skinConfig: any }) {
  return (
    <div style={{ width: '100%', height: '100%', borderRadius: 20, background: skinConfig.faceBackground, border: `1px solid ${skinConfig.borderColor}`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '6% 8%', minHeight: '5%' }}>
        <div style={{ fontWeight: 700, color: skinConfig.labelColor }}>{card.rank}</div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, color: skinConfig.suitColor(card.suit), textShadow: `0 0 2px ${skinConfig.textShadow}` }}>{card.suit}</div>
      <div style={{ padding: '6% 8%', minHeight: '5%', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
        <div style={{ fontWeight: 700, color: skinConfig.labelColor }}>{card.rank}</div>
      </div>
    </div>
  )
}

function Leaderboard({ globalStats }: { globalStats: any }) {
  return (
    <div style={{ marginTop: 8 }}>
      <h3 style={{ color: '#000' }}>Leaderboard</h3>
      <div style={{ background: '#eef2f7', padding: 12, borderRadius: 12 }}>
        {globalStats.leaderboard.map((entry: any) => (
          <div key={entry.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#000' }}>{entry.playerName}</div>
              <div style={{ fontSize: 12, color: '#666' }}>{new Date(entry.date).toLocaleString()}</div>
            </div>
            <div style={{ fontWeight: 700, color: '#000' }}>{entry.score}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
