'use client';

import React, { useState } from 'react';
import { Plus, Minus, RotateCcw, Users, Trophy, CheckCircle, AlertCircle } from 'lucide-react';

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
}

export default function Game876Scorer() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [bidsSubmitted, setBidsSubmitted] = useState(false);
  const [tempBids, setTempBids] = useState<Record<number, number>>({});
  const [tempTricks, setTempTricks] = useState<Record<number, number>>({});
  const [gameStarted, setGameStarted] = useState(false);

  // Generate round sequence: 8,7,6,5,4,3,2,1,1,2,3,4,5,6,7,8
  // But adjust max cards based on number of players (52 cards / players)
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
    
    // If sequence is less than 16 rounds, pad with max cards rounds
    if (sequence.length < 16) {
      const roundsNeeded = 16 - sequence.length;
      const roundsAtStart = Math.ceil(roundsNeeded / 2);
      const roundsAtEnd = roundsNeeded - roundsAtStart;
      
      // Add rounds at the beginning
      for (let i = 0; i < roundsAtStart; i++) {
        sequence.unshift(maxCards);
      }
      
      // Add rounds at the end
      for (let i = 0; i < roundsAtEnd; i++) {
        sequence.push(maxCards);
      }
    }
    
    return sequence;
  };
  
  const roundSequence = getRoundSequence();
  const currentCards = roundSequence[currentRoundIndex];
  const dealerIndex = currentRoundIndex % players.length;

// Reorder players so dealer is last
  const getOrderedPlayers = () => {
    if (players.length === 0) return [];
    const reordered: typeof players = [];
    for (let i = 0; i < players.length; i++) {
      const index = (dealerIndex + 1 + i) % players.length;
      reordered.push(players[index]);
    }
    return reordered;
  };

  const addPlayer = () => {
    if (newPlayerName.trim()) {
      const newPlayer = {
        id: Date.now(),
        name: newPlayerName.trim(),
        rounds: [],
        total: 0
      };
      setPlayers([...players, newPlayer]);
      setNewPlayerName('');
    }
  };

  const removePlayer = (id) => {
    if (players.length > 0 && !gameStarted) {
      setPlayers(players.filter(p => p.id !== id));
      const newTempBids = { ...tempBids };
      delete newTempBids[id];
      setTempBids(newTempBids);
    }
  };

  const startGame = () => {
    if (players.length >= 4) {
      setGameStarted(true);
    }
  };

  const updateBid = (playerId, bid) => {
    setTempBids({ ...tempBids, [playerId]: parseInt(bid) || 0 });
  };

  const updateTricks = (playerId, tricks) => {
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
    // For rounds with 1 or 2 cards, bids can equal the number of cards
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
      const initialTricks = {};
      players.forEach(p => {
        initialTricks[p.id] = 0;
      });
      setTempTricks(initialTricks);
      setBidsSubmitted(true);
    }
  };

  const submitRound = () => {
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

      setPlayers(updatedPlayers);
      setCurrentRoundIndex(currentRoundIndex + 1);
      setTempBids({});
      setTempTricks({});
      setBidsSubmitted(false);
    }
  };

  const resetGame = () => {
    setPlayers([]);
    setCurrentRoundIndex(0);
    setTempBids({});
    setTempTricks({});
    setBidsSubmitted(false);
    setGameStarted(false);
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
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 flex items-center justify-center gap-3">
              <Trophy className="text-yellow-400" size={40} />
              876 Score Tracker
            </h1>
            {gameStarted && (
              <p className="text-blue-200 text-lg">Round {currentRoundIndex + 1} of {roundSequence.length} • {currentCards} Cards</p>
            )}
          </div>

          {/* Game Over */}
          {isGameOver ? (
            <>
              <div className="text-center mb-8">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-8 mb-6">
                  <h2 className="text-4xl font-bold text-gray-900 mb-2">🎉 Game Over! 🎉</h2>
                  <p className="text-2xl font-bold text-gray-800 mb-4">Winner: {leader.name}</p>
                  <p className="text-xl text-gray-700">Final Score: {leader.total} points</p>
                </div>
              </div>

              {/* Final Score History */}
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
              {/* Setup Phase */}
              <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-4 text-center">Add Players</h3>
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                    placeholder="Enter player name..."
                    className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <button
                    onClick={addPlayer}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg"
                  >
                    <Users size={20} />
                    Add
                  </button>
                </div>

                {players.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {players.map((player, index) => (
                      <div key={player.id} className="bg-white/10 rounded-xl p-3 flex items-center justify-between">
                        <span className="text-white font-semibold">
                          {index + 1}. {player.name}
                        </span>
                        <button
                          onClick={() => removePlayer(player.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Minus size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {players.length >= 4 && (
                  <button
                    onClick={startGame}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-lg"
                  >
                    <CheckCircle size={20} />
                    Start Game
                  </button>
                )}

                {players.length < 4 && players.length > 0 && (
                  <p className="text-yellow-300 text-center text-sm">Add at least 4 players to start</p>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Leader Board */}
              {leader && currentRoundIndex > 0 && (
                <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-4 mb-6 text-center">
                  <p className="text-gray-800 font-semibold text-sm mb-1">Current Leader</p>
                  <p className="text-2xl font-bold text-gray-900">{leader.name}: {leader.total} points</p>
                </div>
              )}

              {/* Current Round Input */}
              <div className="bg-white/5 rounded-2xl p-6 mb-6 border border-white/10">
                <h3 className="text-2xl font-bold text-white mb-2 text-center">
                  {!bidsSubmitted ? '📝 Enter Bids' : '🎴 Enter Tricks Taken'}
                </h3>
                <p className="text-blue-200 text-center mb-4">
                  Dealer: <span className="text-yellow-300 font-bold">{players[dealerIndex]?.name}</span>
                </p>
                
                <div className="grid gap-4">
                  {getOrderedPlayers().map((player) => {
                    const isDealer = players.indexOf(player) === dealerIndex;
                    return (
                      <div key={player.id} className="bg-white/10 rounded-xl p-4 flex items-center gap-4">
                        <div className="flex-1 text-white font-semibold text-lg flex items-center gap-2">
                          {player.name}
                          {isDealer && <span className="text-yellow-400 text-sm">🃏 Dealer</span>}
                        </div>
                        
                        {!bidsSubmitted ? (
                          <div className="flex items-center gap-2">
                            <label className="text-blue-200">Bid:</label>
                            <input
                              type="number"
                              min="0"
                              max={currentCards}
                              value={tempBids[player.id] !== undefined ? tempBids[player.id] : ''}
                              onChange={(e) => updateBid(player.id, e.target.value)}
                              className="w-20 px-3 py-2 text-center rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="text-blue-200">
                              Bid: <span className="text-white font-bold">{tempBids[player.id] || 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-blue-200">Tricks:</label>
                              <input
                                type="number"
                                min="0"
                                max={currentCards}
                                value={tempTricks[player.id] || 0}
                                onChange={(e) => updateTricks(player.id, e.target.value)}
                                className="w-20 px-3 py-2 text-center rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                              />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
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

              {/* Score History */}
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

              {/* Reset Button */}
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
