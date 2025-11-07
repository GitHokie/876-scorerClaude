'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Player {
  name: string;
  score: number;
}

interface Game {
  id: number;
  created_at: string;
  completed_at: string;
  max_cards: number;
  total_rounds: number;
  players: Player[];
}

export default function GameHistory() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/games/history');
      const data = await response.json();
      
      if (response.ok) {
        setGames(data.games);
      } else {
        setError('Failed to load game history');
      }
    } catch (err) {
      setError('Error loading game history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/20">
          
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-4"
            >
              <ArrowLeft size={20} />
              Back to Game
            </Link>
            
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2 flex items-center gap-3">
              <Trophy className="text-yellow-400" size={40} />
              Game History
            </h1>
            <p className="text-blue-200 text-lg">
              {games.length} {games.length === 1 ? 'game' : 'games'} completed
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="text-white text-xl">Loading game history...</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-6 text-center">
              <p className="text-red-200 text-lg">{error}</p>
            </div>
          )}

          {/* Games List */}
          {!loading && !error && games.length === 0 && (
            <div className="bg-white/5 rounded-2xl p-12 text-center border border-white/10">
              <Trophy className="text-white/30 mx-auto mb-4" size={64} />
              <p className="text-white/60 text-xl mb-2">No games completed yet</p>
              <p className="text-blue-200">Complete your first game to see it here!</p>
            </div>
          )}

          {!loading && !error && games.length > 0 && (
            <div className="space-y-6">
              {games.map((game) => (
                <div 
                  key={game.id}
                  className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all"
                >
                  {/* Game Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 text-blue-200 text-sm mb-2">
                        <Calendar size={16} />
                        {formatDate(game.completed_at)}
                      </div>
                      <div className="flex items-center gap-2 text-blue-200 text-sm">
                        <Users size={16} />
                        {game.players.length} players • {game.total_rounds} rounds
                      </div>
                    </div>
                    
                    {/* Winner Badge */}
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl px-4 py-2">
                      <div className="text-gray-900 font-bold text-lg">
                        🏆 {game.players[0].name}
                      </div>
                      <div className="text-gray-700 text-sm">
                        {game.players[0].score} points
                      </div>
                    </div>
                  </div>

                  {/* Players Leaderboard */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="space-y-2">
                      {game.players.map((player, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/5"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`
                              w-8 h-8 rounded-full flex items-center justify-center font-bold
                              ${index === 0 ? 'bg-yellow-400 text-gray-900' : 
                                index === 1 ? 'bg-gray-300 text-gray-900' : 
                                index === 2 ? 'bg-orange-400 text-gray-900' : 
                                'bg-white/10 text-white'}
                            `}>
                              {index + 1}
                            </span>
                            <span className="text-white font-semibold">
                              {player.name}
                            </span>
                          </div>
                          <span className="text-yellow-300 font-bold text-lg">
                            {player.score}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
