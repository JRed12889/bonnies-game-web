import React, { useEffect, useState } from 'react'
import { createDeck, detectMatch, applyMatch, getDisplayName } from './utils/gameLogic'
import { loadStats, saveStats, recordGame, addLeaderboardEntry } from './utils/storage'
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
  const [showLanding, setShowLanding] = useState(true)
  const [showRules, setShowRules] = useState(false)

  useEffect(() => {
    saveStats(stats)
  }, [stats])

  // Ensure the finish modal triggers whenever the deck reaches zero.
  useEffect(() => {
    if (!finished && deck.length === 0) {
      // pass the current table as the final state
      finishGameIfNeeded(table)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deck.length, table.length, finished])

  // NOTE: historical leaderboard wipe was previously applied here accidentally on every load.
  // Removed automatic wipe so leaderboard persists across page reloads.

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

  function closeFinishModal() {
    setShowFinishModal(false)
  }

  function saveToLeaderboard() {
    if (finalScore == null) return
    const updated = addLeaderboardEntry(stats, nameForSave || 'Player', finalScore)
    setStats(updated)
    setQualifiesForBoard(false)
  }

  // removed admin wipe UI as leaderboard is dropped

  function resetGame() {
    setDeck(createDeck())
    setTable([])
    setMessage('Tap Flip to begin.')
    setFinished(false)
    setPendingMatch(null)
    soundPlayer.playShuffle()
  }

  function startGame() {
    setShowLanding(false)
    setMessage('Tap Flip to begin.')
    soundPlayer.playShuffle()
  }

  function openRules() {
    setShowRules(true)
  }

  function closeRules() {
    setShowRules(false)
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
          <Stat title="Score" value={`${table.length}`} />
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
        {/* Leaderboard removed */}
      </footer>

      {/* Finish modal */}
      {showFinishModal && finalScore !== null && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', zIndex: 60 }}>
          <div style={{ width: 360, background: '#fff', borderRadius: 12, padding: 20 }}>
            <h2>Game Over</h2>
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 20 }}>{`Score: ${finalScore}`}</div>
              <div style={{ marginTop: 8, color: '#444' }}>{getScoreMessage(finalScore)}</div>
            </div>
            <div style={{ marginTop: 12 }}>
              {qualifiesForBoard ? (
                <div>
                  <div style={{ fontSize: 13, color: '#222' }}>Congrats — your score may enter the top 20. Edit your name:</div>
                  <input value={nameForSave} onChange={e => setNameForSave(e.target.value)} style={{ marginTop: 8, width: '100%', padding: 8 }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button onClick={saveToLeaderboard} style={{ flex: 1, background: '#28a745', color: '#fff', padding: '8px 12px', borderRadius: 8 }}>Save</button>
                    <button onClick={closeFinishModal} style={{ flex: 1, background: '#ccc', padding: '8px 12px', borderRadius: 8 }}>Close</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={closeFinishModal} style={{ background: '#007bff', color: '#fff', padding: '10px 16px', borderRadius: 8 }}>Close</button>
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                <h3 style={{ marginBottom: 8 }}>Leaderboard</h3>
                <Leaderboard globalStats={stats.globalStats} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Landing screen before the first game */}
      {showLanding && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(102,126,234,0.95), rgba(118,75,162,0.95))', zIndex: 60 }}>
          <div style={{ width: 340, background: '#fff', borderRadius: 12, padding: 20, textAlign: 'center' }}>
            <h1>Bonnie's Game</h1>
            <p style={{ color: '#444' }}>A simple Flip-4 style card game. Flip cards and remove matches.</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button onClick={startGame} style={{ flex: 1, padding: '10px 12px', background: '#28a745', color: '#fff', borderRadius: 8 }}>Start Game</button>
              <button onClick={openRules} style={{ flex: 1, padding: '10px 12px', background: '#6c757d', color: '#fff', borderRadius: 8 }}>Rules</button>
            </div>
          </div>
        </div>
      )}

      {/* Rules modal */}
      {showRules && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', zIndex: 70 }}>
          <div style={{ width: 'min(92vw, 560px)', background: '#fff', borderRadius: 12, padding: 20 }}>
            <h2>Rules</h2>
            <ol style={{ marginTop: 8, color: '#333', paddingLeft: 18, listStylePosition: 'inside', lineHeight: 1.5 }}>
              <li style={{ marginBottom: 8 }}>Press <strong>Flip</strong> to reveal the next card onto the table.</li>
              <li style={{ marginBottom: 8 }}>If the newly flipped card matches the <em>rank</em> of the card 4 places back, it's a Rank match — press <strong>Match</strong> to remove those 4 cards.</li>
              <li style={{ marginBottom: 8 }}>If the newly flipped card matches the <em>suit</em> of the card 4 places back, it's a Suit match — press <strong>Match</strong> to remove the two middle cards of that 4-card block.</li>
              <li style={{ marginBottom: 8 }}>When the deck is exhausted, your final score equals the number of cards remaining on the table (lower is better).</li>
              <li style={{ marginBottom: 8 }}>If your score qualifies for the top 20, you can edit your name and save it to the leaderboard.</li>
            </ol>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button onClick={closeRules} style={{ padding: '8px 12px', borderRadius: 8, background: '#007bff', color: '#fff' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Wipe leaderboard modal (password protected) */}
      {showWipeModal && (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', zIndex: 80 }}>
          <div style={{ width: 360, background: '#fff', borderRadius: 12, padding: 16 }}>
            <h3>Wipe Leaderboard</h3>
            <div style={{ marginTop: 8, color: '#333' }}>Enter admin password to permanently clear leaderboard data.</div>
            <input type="password" value={wipePassword} onChange={e => setWipePassword(e.target.value)} style={{ marginTop: 12, width: '100%', padding: 8 }} />
            {wipeError && <div style={{ color: 'red', marginTop: 8 }}>{wipeError}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={confirmWipe} style={{ flex: 1, background: '#d9534f', color: '#fff', padding: '8px 12px', borderRadius: 8 }}>Confirm</button>
              <button onClick={() => setShowWipeModal(false)} style={{ flex: 1, background: '#ccc', padding: '8px 12px', borderRadius: 8 }}>Cancel</button>
            </div>
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
