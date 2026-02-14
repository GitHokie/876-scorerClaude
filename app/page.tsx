'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Minus, RotateCcw, Users, Trophy, CheckCircle, AlertCircle, History, UserPlus } from 'lucide-react';
import Link from 'next/link';

interface Round {
  cards: number;
  bid: number;
  tricks: number;
  score: number;
  madeIt: boolean;
}

interface Player {
  id: number;
  name: string;
  rounds: Round[];
  total: number;
  dbId?: number;
}

interface RegisteredPlayer {
  id: number;
  name: string;
  last_played: string | null;
}

export default function Game876Scorer() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [registeredPlayers, setRegisteredPlayers] = useState<RegisteredPlayer[]>([]);
  const [selectedPlayerNames, setSelectedPlayerNames] = useState<string[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [bidsSubmitted, setBidsSubmitted] = useState(false);
  const [tempBids, setTempBids] = useState<Record<number, number>>({});
  const [tempTricks, setTempTricks] = useState<Record<number, number>>({});
  const [gameStarted, setGameStarted] = useState(false);
  const [currentGameId, setCurrentGameId] = useState<number | null>(null);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  useEffect(() => {
    fetchRegisteredPlayers();
  }, []);

  const fetchRegisteredPlayers = async () => {
    try {
      const response = await fetch('/api/players');
      const data = await response.json();
      if (response.ok) {
        setRegisteredPlayers(data.players);
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const togglePlayerSelection = (playerName: string) => {
    if (selectedPlayerNames.includes(playerName)) {
      setSelectedPlayerNames(selectedPlayerNames.filter(n => n !== playerName));
    } else {
      setSelectedPlayerNames([...selectedPlayerNames, playerName]);
    }
  };

  const addNewPlayer = async () => {
    if (newPlayerName.trim()) {
      try {
        const response = await fetch('/api/players', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newPlayerName.trim() })
        });

        if (response.ok) {
          await fetchRegisteredPlayers();
          setSelectedPlayerNames([...selectedPlayerNames, newPlayerName.trim()]);
          setNewPlayerName('');
          setShowAddPlayer(false);
        } else {
          const data = await response.json();
          alert(data.error || 'Failed to add player');
        }
      } catch (error) {
        console.error('Error adding player:', error);
        alert('Failed to add player');
      }
    }
  };

  const confirmPlayerSelection = () => {
    const selectedPlayers = selectedPlayerNames.map((name, index) => ({
      id: Date.now() + index,
      name: name,
      rounds: [],
      total: 0
    }));
    setPlayers(selectedPlayers);
  };

  const getMaxCards = () => {
    if (players.length === 0) return 8;
    return Math.min(8, Math.floor(52 / players.length));
  };
  
  const getRoundSequence = () => {
    const maxCards = getMaxCards();
    const descending = [];
    for (let i = maxCards; i >= 1; i--) {
      descending.push(i);
    }
    const ascending = [];
    for (let i = 1; i <= maxCards; i++) {
      ascending.push(i);
    }
    
    let sequence = [...descending, ...ascending];
    
    if (sequence.length < 16) {
      const roundsNeeded = 16 - sequence.length;
      const roundsAtStart = Math.ceil(roundsNeeded / 2);
      const roundsAtEnd = roundsNeeded - roundsAtStart;
      
      for (let i = 0; i < roundsAtStart; i++) {
        sequence.unshift(maxCards);
      }
      
      for (let i = 0; i < roundsAtEnd; i++) {
        sequence.push(maxCards);
      }
    }
    
    return sequence;
  };
  
  const roundSequence = getRoundSequence();
  const currentCards = roundSequence[currentRoundIndex];
  const dealerIndex = currentRoundIndex % players.length;

  const getOrderedPlayers = () => {
    if (players.length === 0) return [];
    const reordered: typeof players = [];
    for (let i = 0; i < players.length; i++) {
      const index = (dealerIndex + 1 + i) % players.length;
      reordered.push(players[index]);
    }
    return reordered;
  };

  const removePlayer = (playerName: string) => {
    setSelectedPlayerNames(selectedPlayerNames.filter(n => n !== playerName));
    if (players.length > 0) {
      setPlayers(players.filter(p => p.name !== playerName));
    }
  };

  const startGame = async () => {
    if (players.length >= 4) {
      try {
        // Update last_played for all selected players
        await fetch('/api/players/update-last-played', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerNames: selectedPlayerNames })
        });

        // Create game in database
        const response = await fetch('/api/games/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            players: players.map(p => ({ name: p.name })),
            maxCards: getMaxCards(),
            totalRounds: roundSequence.length
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          setCurrentGameId(data.gameId);
          
          // Update players with database IDs
          const updatedPlayers = players.map((p, idx) => ({
            ...p,
            dbId: data.players[idx].dbId
          }));
          setPlayers(updatedPlayers);
          setGameStarted(true);
        } else {
          console.error('Failed to create game:', data.error);
          alert('Failed to save game to database, but you can continue playing.');
          setGameStarted(true);
        }
      } catch (error) {
        console.error('Error starting game:', error);
        alert('Failed to save game to database, but you can continue playing.');
        setGameStarted(true);
      }
    }
  };

  const updateBid = (playerId: number, bid: string) => {
    setTempBids({ ...tempBids, [playerId]: parseInt(bid) || 0 });
  };

  const updateTricks = (playerId: number, tricks: string) => {
    setTempTricks({ ...tempTricks, [playerId]: parseInt(tricks) || 0 });
  };

  const getTotalBids = () => {
    return Object.values(tempBids).reduce((sum, bid) => sum + bid, 0);
  };

  const getTotalTricks = () => {
    return Object.values(tempTricks).reduce((sum, tricks) => sum + tricks, 0);
  };

  const canSubmitBids = () => {
    const totalBids = getTotalBids();
    const allBidsEntered = players.every(p => tempBids[p.id] !== undefined);
    if (currentCards <= 2) {
      return allBidsEntered;
    }
    return allBidsEntered && totalBids !== currentCards;
  };

  const canSubmitRound = () => {
    const totalTricks = getTotalTricks();
    const allTricksEntered = players.every(p => tempTricks[p.id] !== undefined);
    return allTricksEntered && totalTricks === currentCards;
  };

  const submitBids = () => {
    if (canSubmitBids()) {
      const initialTricks: Record<number, number> = {};
      players.forEach(p => {
        initialTricks[p.id] = 0;
      });
      setTempTricks(initialTricks);
      setBidsSubmitted(true);
    }
  };

  const submitRound = async () => {
    if (canSubmitRound()) {
      const updatedPlayers = players.map(p => {
        const bid = tempBids[p.id] || 0;
        const tricks = tempTricks[p.id] || 0;
        const madeIt = bid === tricks;
        const roundScore = tricks + (madeIt ? 10 : 0);

        return {
          ...p,
          rounds: [...p.rounds, { cards: currentCards, bid, tricks, score: roundScore, madeIt }],
          total: p.total + roundScore
        };
      });

      // Save round to database
      if (currentGameId) {
        try {
          const playerResults = updatedPlayers.map(p => {
            const lastRound = p.rounds[p.rounds.length - 1];
            return {
              playerId: p.dbId,
              bid: lastRound.bid,
              tricks: lastRound.tricks,
              score: lastRound.score,
              madeIt: lastRound.madeIt
            };
          });

          await fetch(`/api/games/${currentGameId}/round`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roundNumber: currentRoundIndex + 1,
              cards: currentCards,
              playerResults
            })
          });
        } catch (error) {
          console.error('Error saving round:', error);
        }
      }

      setPlayers(updatedPlayers);
      const nextRound = currentRoundIndex + 1;
      setCurrentRoundIndex(nextRound);
      setTempBids({});
      setTempTricks({});
      setBidsSubmitted(false);

      // Check if game is complete
      if (nextRound >= roundSequence.length && currentGameId) {
        try {
          await fetch(`/api/games/${currentGameId}/complete`, {
            method: 'POST'
          });
        } catch (error) {
          console.error('Error completing game:', error);
        }
      }
    }
  };

  const resetGame = () => {
    setPlayers([]);
    setSelectedPlayerNames([]);
    setCurrentRoundIndex(0);
    setTempBids({});
    setTempTricks({});
    setBidsSubmitted(false);
    setGameStarted(false);
    setCurrentGameId(null);
  };

  const getLeader = () => {
    if (players.length === 0) return null;
    return players.reduce((leader, player) => 
      player.total > leader.total ? player : leader
    , players[0]);
  };

  const leader = getLeader();
  const isGameOver = currentRoundIndex >= roundSequence.length;
  const totalBids = getTotalBids();
  const totalTricks = getTotalTricks();
  const bidsValid = canSubmitBids();
  const tricksValid = canSubmitRound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">
          <div className="text-center mb-8">
            <div className="flex justify-end mb-4">
              <Link 
                href="/history"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-all flex items-center gap-2 border border-white/20"
              >
                <History size={20} />
                View History
              </Link>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 flex items-center justify-center gap-3">
              <Trophy className="text-yellow-400" size={40} />
              876 Score Tracker
            </h1>
            {gameStarted && (
              <p className="text-blue-200 text-lg">Round {currentRoundIndex + 1} of {roundSequence.length} • {currentCards} Cards</p>
            )}
          </div>

          {isGameOver ? (
            <>
              <div className="text-center mb-8">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-8 mb-6">
                  <h2 className="text-4xl font-bold text-gray-900 mb-2">🎉 Game Over! 🎉</h2>
                  <p className="text-2xl font-bold text-gray-800 mb-4">Winner: {leader?.name}</p>
                  <p className="text-xl text-gray-700">Final Score: {leader?.total} points</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-4">Final Scorecard</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white/10">
                        <th className="px-3 py-2 text-left text-white font-semibold">Round</th>
                        {players.map((player) => (
                          <th key={player.id} className="px-3 py-2 text-center text-white font-semibold">
                            {player.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {roundSequence.map((cards, roundIdx) => (
                        <tr key={roundIdx} className="border-t border-white/10">
                          <td className="px-3 py-2 text-white font-semibold">
                            {cards}
                            <span className="text-xs text-blue-200 ml-1">cards</span>
                          </td>
                          {players.map((player) => {
                            const round = player.rounds[roundIdx];
                            return (
                              <td key={player.id} className="px-3 py-2 text-center">
                                <div className={`${round.madeIt ? 'text-green-400' : 'text-white'} font-semibold text-base`}>
                                  {round.score}
                                </div>
                                <div className="text-xs text-blue-200">
                                  {round.bid}/{round.tricks}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr className="border-t-2 border-yellow-400 bg-white/5">
                        <td className="px-3 py-2 text-yellow-300 font-bold">Total</td>
                        {players.map((player) => (
                          <td key={player.id} className="px-3 py-2 text-center">
                            <span className="text-xl font-bold text-yellow-300">{player.total}</span>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 text-center text-sm text-blue-200">
                  Green scores = Made their bid (+10 bonus) • Format: Bid/Tricks Taken
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={resetGame}
                  className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg mx-auto text-lg"
                >
                  <RotateCcw size={24} />
                  Start New Game
                </button>
              </div>
            </>
          ) : !gameStarted ? (
            <>
              <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-4 text-center">Select Players</h3>
                
                {/* Player Selection Grid */}
                {registeredPlayers.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {registeredPlayers.map((player) => (
                      <button
                        key={player.id}
                        onClick={() => togglePlayerSelection(player.name)}
                        className={`
                          p-4 rounded-xl font-semibold transition-all border-2
                          ${selectedPlayerNames.includes(player.name)
                            ? 'bg-blue-500 border-blue-400 text-white'
                            : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                          }
                        `}
                      >
                        <div className="flex items-center justify-center gap-2">
                          {selectedPlayerNames.includes(player.name) && <CheckCircle size={20} />}
                          {player.name}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Add New Player Section */}
                {!showAddPlayer ? (
                  <button
                    onClick={() => setShowAddPlayer(true)}
                    className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border-2 border-dashed border-white/30 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus size={20} />
                    Add New Player
                  </button>
                ) : (
                  <div className="bg-white/10 rounded-xl p-4 border border-white/20">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addNewPlayer()}
                        placeholder="Enter new player name..."
                        className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        autoFocus
                      />
                      <button
                        onClick={addNewPlayer}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-all"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => {
                          setShowAddPlayer(false);
                          setNewPlayerName('');
                        }}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Selected Players List */}
                {selectedPlayerNames.length > 0 && players.length === 0 && (
                  <div className="mt-4">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-4">
                      <h4 className="text-white font-semibold mb-3">
                        Selected Players ({selectedPlayerNames.length})
                      </h4>
                      <div className="space-y-2">
                        {selectedPlayerNames.map((name) => (
                          <div key={name} className="flex items-center justify-between bg-white/10 rounded-lg p-2">
                            <span className="text-white font-semibold">{name}</span>
                            <button
                              onClick={() => removePlayer(name)}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <Minus size={20} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={confirmPlayerSelection}
                      disabled={selectedPlayerNames.length < 4}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <Users size={20} />
                      Confirm Players
                    </button>

                    {selectedPlayerNames.length < 4 && (
                      <p className="text-yellow-300 text-center text-sm mt-2">
                        Select at least 4 players to continue
                      </p>
                    )}
                  </div>
                )}

                {/* Start Game Button */}
                {players.length >= 4 && (
                  <div className="mt-4">
                    <button
                      onClick={startGame}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <CheckCircle size={20} />
                      Start Game
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {currentRoundIndex > 0 && (
                <div className="bg-white/5 rounded-2xl p-4 mb-6 border border-white/10">
                  <h3 className="text-xl font-bold text-white mb-3 text-center">Leaderboard</h3>
                  <div className="space-y-1">
                    {[...players]
                      .sort((a, b) => b.total - a.total)
                      .map((player, index) => {
                        const isLeader = index === 0;
                        return (
                          <div
                            key={player.id}
                            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
                              isLeader
                                ? 'bg-yellow-400/20 text-yellow-300'
                                : 'bg-white/5 text-white'
                            }`}
                          >
                            <span className="font-bold">
                              {index + 1}.
                            </span>
                            <span className="flex-1 font-semibold">
                              {player.name}
                            </span>
                            <span className="font-bold">
                              {player.total} {isLeader && '🏆'}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
      

              <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-2 text-center">
                  {!bidsSubmitted ? '📝 Enter Bids' : '🎴 Enter Tricks Taken'}
                </h3>
                <p className="text-blue-200 text-center mb-4">
                  Dealer: <span className="text-yellow-300 font-bold">{players[dealerIndex]?.name}</span>
                </p>
                
                <div className="mb-6">
                  {!bidsSubmitted ? (
                    <>
                      {/* Number Buttons for Bids */}
                      <div className="bg-white/10 rounded-xl p-4 mb-4 border border-white/20">
                        <p className="text-blue-200 text-sm text-center mb-3">
                          Tap a number to enter bid:
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {Array.from({ length: currentCards + 1 }, (_, i) => i).map((num) => (
                            <button
                              key={num}
                              onClick={() => {
                                const orderedPlayers = getOrderedPlayers();
                                const nextPlayer = orderedPlayers.find(p => tempBids[p.id] === undefined);
                                if (nextPlayer) {
                                  updateBid(nextPlayer.id, num.toString());
                                }
                              }}
                              className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-bold text-2xl shadow-lg transition-all active:scale-95"
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Players List for Bids */}
                      <div className="space-y-3">
                        {getOrderedPlayers().map((player) => {
                          const isDealer = players.indexOf(player) === dealerIndex;
                          const hasValue = tempBids[player.id] !== undefined;

                          return (
                            <button
                              key={player.id}
                              onClick={() => {
                                const newBids = { ...tempBids };
                                delete newBids[player.id];
                                setTempBids(newBids);
                              }}
                              className={`w-full rounded-xl p-4 flex items-center gap-4 transition-all ${
                                hasValue
                                  ? 'bg-green-500/20 border-2 border-green-400/50 hover:bg-green-500/30'
                                  : 'bg-white/10 border-2 border-white/20 hover:bg-white/20'
                              }`}
                            >
                              <div className="flex-1 text-left">
                                <div className="text-white font-semibold text-lg flex items-center gap-2">
                                  {player.name}
                                  {isDealer && <span className="text-yellow-400 text-sm">🃏 Dealer</span>}
                                </div>
                                {tempBids[player.id] !== undefined && (
                                  <div className="text-blue-200 text-sm">Bid: {tempBids[player.id]}</div>
                                )}
                                {hasValue && (
                                  <div className="text-green-300 text-xs mt-1 italic">
                                    Tap to edit
                                  </div>
                                )}
                              </div>

                              {hasValue ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-bold text-2xl">
                                    {tempBids[player.id]}
                                  </span>
                                  <CheckCircle className="text-green-400" size={24} />
                                </div>
                              ) : (
                                <div className="text-blue-200 text-sm">
                                  Waiting...
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Tricks Entry with +/- Buttons */}
                      <div className="space-y-3">
                        {getOrderedPlayers().map((player) => {
                          const isDealer = players.indexOf(player) === dealerIndex;
                          const trickCount = tempTricks[player.id] ?? 0;
                          const atMin = trickCount <= 0;
                          const atMax = trickCount >= currentCards;

                          return (
                            <div
                              key={player.id}
                              className="w-full rounded-xl p-4 flex items-center gap-4 bg-white/10 border-2 border-white/20"
                            >
                              <div className="flex-1 text-left">
                                <div className="text-white font-semibold text-lg flex items-center gap-2">
                                  {player.name}
                                  {isDealer && <span className="text-yellow-400 text-sm">🃏 Dealer</span>}
                                </div>
                                <div className="text-blue-200 text-sm">
                                  Bid: {tempBids[player.id] || 0}
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => {
                                    if (!atMin) {
                                      setTempTricks({ ...tempTricks, [player.id]: trickCount - 1 });
                                    }
                                  }}
                                  disabled={atMin}
                                  className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white shadow-lg transition-all active:scale-95"
                                >
                                  <Minus size={24} />
                                </button>

                                <span className="text-white font-bold text-3xl w-10 text-center">
                                  {trickCount}
                                </span>

                                <button
                                  onClick={() => {
                                    if (!atMax) {
                                      setTempTricks({ ...tempTricks, [player.id]: trickCount + 1 });
                                    }
                                  }}
                                  disabled={atMax}
                                  className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white shadow-lg transition-all active:scale-95"
                                >
                                  <Plus size={24} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                {!bidsSubmitted && (
                  <div className="mt-4">
                    <div className={`text-center mb-3 ${totalBids === currentCards && currentCards > 2 ? 'text-red-400' : 'text-blue-200'}`}>
                      Total Bids: <span className="font-bold">{totalBids}</span> / {currentCards} cards
                      {totalBids === currentCards && currentCards > 2 && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <AlertCircle size={20} />
                          <span>Total bids cannot equal {currentCards}! Dealer must adjust.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {bidsSubmitted && (
                  <div className="mt-4">
                    <div className={`text-center mb-3 ${totalTricks !== currentCards ? 'text-red-400' : 'text-green-400'}`}>
                      Total Tricks: <span className="font-bold">{totalTricks}</span> / {currentCards} cards
                      {totalTricks !== currentCards && (
                        <div className="flex items-center justify-center gap-2 mt-2">
                          <AlertCircle size={20} />
                          <span>Total tricks must equal {currentCards}!</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 text-center">
                  {!bidsSubmitted ? (
                    <button
                      onClick={submitBids}
                      disabled={!bidsValid}
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg mx-auto text-lg"
                    >
                      <CheckCircle size={24} />
                      Submit Bids
                    </button>
                  ) : (
                    <button
                      onClick={submitRound}
                      disabled={!tricksValid}
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg mx-auto text-lg"
                    >
                      <CheckCircle size={24} />
                      Complete Round
                    </button>
                  )}
                </div>
              </div>

              {currentRoundIndex > 0 && (
                <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
                  <h3 className="text-2xl font-bold text-white mb-4">Score History</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-white/10">
                          <th className="px-3 py-2 text-left text-white font-semibold">Round</th>
                          {players.map((player) => (
                            <th key={player.id} className="px-3 py-2 text-center text-white font-semibold">
                              {player.name}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {roundSequence.slice(0, currentRoundIndex).map((cards, roundIdx) => (
                          <tr key={roundIdx} className="border-t border-white/10">
                            <td className="px-3 py-2 text-white font-semibold">
                              {cards}
                              <span className="text-xs text-blue-200 ml-1">cards</span>
                            </td>
                            {players.map((player) => {
                              const round = player.rounds[roundIdx];
                              return (
                                <td key={player.id} className="px-3 py-2 text-center">
                                  <div className={`${round.madeIt ? 'text-green-400' : 'text-white'} font-semibold text-base`}>
                                    {round.score}
                                  </div>
                                  <div className="text-xs text-blue-200">
                                    {round.bid}/{round.tricks}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        <tr className="border-t-2 border-yellow-400 bg-white/5">
                          <td className="px-3 py-2 text-yellow-300 font-bold">Total</td>
                          {players.map((player) => (
                            <td key={player.id} className="px-3 py-2 text-center">
                              <span className="text-xl font-bold text-yellow-300">{player.total}</span>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 text-center text-sm text-blue-200">
                    Green scores = Made their bid (+10 bonus) • Format: Bid/Tricks Taken
                  </div>
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={resetGame}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg mx-auto"
                >
                  <RotateCcw size={20} />
                  Reset Game
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
