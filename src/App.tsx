import React, { useEffect, useState } from 'react'
import { createDeck, detectMatch, cascadeRemove, getDisplayName } from './utils/gameLogic'
import { loadStats, saveStats, recordGame } from './utils/storage'
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

  useEffect(() => {
    saveStats(stats)
  }, [stats])

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
    setPendingMatch(null)
    setTable(t => {
      const { table: newTable } = cascadeRemove(t)
      soundPlayer.playMatch()
      // do not set a match-specific message
      if (deck.length === 0) finishGameIfNeeded(newTable)
      return newTable
    })
  }

  function finishGameIfNeeded(finalTable: Card[]) {
    if (finished) return
    if (pendingMatch) return
    if (deck.length > 0) return
    setFinished(true)
    setMessage(`Game finished! Penalty score: ${finalTable.length}.`)
    const updated = recordGame(stats, finalTable.length, stats.mode as GameMode)
    setStats(updated)
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
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={stats.playerName} onChange={e => setStats({ ...stats, playerName: e.target.value })} />
          <button onClick={() => setStats({ ...stats, mode: stats.mode === GameMode.Casual ? GameMode.Ranked : GameMode.Casual })}>{stats.mode === GameMode.Casual ? 'Casual' : 'Ranked'}</button>
        </div>
      </header>

      <div className="card-row">
        {table.length === 0 ? (
          <div style={{ width: 150, height: 213, borderRadius: 22, background: `linear-gradient(135deg, ${skinConfig.backGradient[0]}, ${skinConfig.backGradient[1]})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <strong style={{ color: '#fff' }}>Deck</strong>
          </div>
        ) : (
          table.slice(-14).map((card, idx) => (
            <div key={card.id} className="card-wrapper" style={{ marginLeft: idx === 0 ? 0 : -28, boxShadow: '0 4px 8px rgba(0,0,0,0.08)' }}>
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
