'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, Calendar, Users, ArrowLeft, TrendingUp, Flame, Star } from 'lucide-react';
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

interface PlayerRanking {
  player_name: string;
  avg_position: number;
  games_played: number;
}

interface ShameEntry {
  player_name: string;
  lowest_score: number;
  completed_at: string;
  game_id: number;
}

interface PerfectGame {
  player_name: string;
  total_score: number;
  completed_at: string;
  game_id: number;
}

interface Stats {
  rankings: PlayerRanking[];
  wallOfShame: ShameEntry[];
  perfectGames: PerfectGame[];
}

export default function GameHistory() {
  const [games, setGames] = useState<Game[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/setup-db').catch(() => {});
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [historyResponse, statsResponse] = await Promise.all([
        fetch('/api/games/history'),
        fetch('/api/games/stats')
      ]);

      let anyError = false;

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setGames(historyData.games);
      } else {
        console.error('Failed to load game history');
        anyError = true;
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        console.error('Failed to load stats');
        anyError = true;
      }

      if (anyError && !historyResponse.ok && !statsResponse.ok) {
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

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  };

  const getPositionSuffix = (position: number) => {
    const rounded = Math.round(position * 10) / 10;
    if (rounded === 1) return '1st';
    if (rounded === 2) return '2nd';
    if (rounded === 3) return '3rd';
    return `${rounded}th`;
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
              Game History & Stats
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

          {!loading && !error && (
            <>
              {/* Stats Section */}
              {stats && (
                <div className="space-y-6 mb-8">
                  
                  {/* Average Rankings */}
                  {stats.rankings.length > 0 && (
                    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="text-blue-400" size={28} />
                        Average Rankings
                      </h2>
                      <div className="grid gap-3">
                        {stats.rankings.map((player, index) => (
                          <div 
                            key={player.player_name}
                            className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/5 border border-white/10"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`
                                w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                                ${index === 0 ? 'bg-yellow-400 text-gray-900' : 
                                  index === 1 ? 'bg-gray-300 text-gray-900' : 
                                  index === 2 ? 'bg-orange-400 text-gray-900' : 
                                  'bg-white/10 text-white'}
                              `}>
                                {index + 1}
                              </span>
                              <div>
                                <span className="text-white font-semibold text-lg">
                                  {player.player_name}
                                </span>
                                <div className="text-blue-200 text-sm">
                                  {player.games_played} {player.games_played === 1 ? 'game' : 'games'} played
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-yellow-300 font-bold text-2xl">
                                {player.avg_position}
                              </div>
                              <div className="text-blue-200 text-xs">avg finish</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Perfect Games */}
                  {stats.perfectGames.length > 0 && (
                    <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl p-6 border border-yellow-400/30">
                      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <Star className="text-yellow-400" size={28} />
                        Perfect Games
                        <span className="text-sm font-normal text-yellow-200 ml-2">
                          (Made every bid!)
                        </span>
                      </h2>
                      <div className="grid gap-3">
                        {stats.perfectGames.map((game, index) => (
                          <div 
                            key={`${game.game_id}-${game.player_name}`}
                            className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/10 border border-yellow-400/30"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">🌟</span>
                              <div>
                                <span className="text-white font-semibold text-lg">
                                  {game.player_name}
                                </span>
                                <div className="text-yellow-200 text-sm">
                                  {formatShortDate(game.completed_at)}
                                </div>
                              </div>
                            </div>
                            <div className="text-yellow-300 font-bold text-2xl">
                              {game.total_score}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Wall of Shame */}
                  {stats.wallOfShame.length > 0 && (
                    <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-2xl p-6 border border-red-400/30">
                      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                        <Flame className="text-red-400" size={28} />
                        Wall of Shame
                        <span className="text-sm font-normal text-red-200 ml-2">
                          (Scored below 83)
                        </span>
                      </h2>
                      <div className="grid gap-3">
                        {stats.wallOfShame.map((entry, index) => (
                          <div 
                            key={`${entry.game_id}-${entry.player_name}`}
                            className="flex items-center justify-between py-3 px-4 rounded-lg bg-white/10 border border-red-400/30"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">😬</span>
                              <div>
                                <span className="text-white font-semibold text-lg">
                                  {entry.player_name}
                                </span>
                                <div className="text-red-200 text-sm">
                                  {formatShortDate(entry.completed_at)}
                                </div>
                              </div>
                            </div>
                            <div className="text-red-300 font-bold text-2xl">
                              {entry.lowest_score}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Games List */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar className="text-blue-400" size={28} />
                  Recent Games
                </h2>
                
                {games.length === 0 ? (
                  <div className="text-center py-8">
                    <Trophy className="text-white/30 mx-auto mb-4" size={64} />
                    <p className="text-white/60 text-xl mb-2">No games completed yet</p>
                    <p className="text-blue-200">Complete your first game to see it here!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {games.map((game) => (
                      <div 
                        key={game.id}
                        className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all"
                      >
                        {/* Game Header */}
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                          <div>
                            <div className="flex items-center gap-2 text-blue-200 text-sm mb-1">
                              <Calendar size={14} />
                              {formatDate(game.completed_at)}
                            </div>
                            <div className="flex items-center gap-2 text-blue-200 text-sm">
                              <Users size={14} />
                              {game.players.length} players • {game.total_rounds} rounds
                            </div>
                          </div>
                          
                          {/* Winner Badge */}
                          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg px-3 py-1.5">
                            <div className="text-gray-900 font-bold text-base">
                              🏆 {game.players[0].name}
                            </div>
                            <div className="text-gray-700 text-xs">
                              {game.players[0].score} points
                            </div>
                          </div>
                        </div>

                        {/* Players Leaderboard */}
                        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {game.players.map((player, index) => (
                              <div 
                                key={index}
                                className="flex items-center gap-2 py-2 px-2 rounded bg-white/5"
                              >
                                <span className={`
                                  w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs
                                  ${index === 0 ? 'bg-yellow-400 text-gray-900' : 
                                    index === 1 ? 'bg-gray-300 text-gray-900' : 
                                    index === 2 ? 'bg-orange-400 text-gray-900' : 
                                    'bg-white/10 text-white'}
                                `}>
                                  {index + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-white font-semibold text-sm truncate">
                                    {player.name}
                                  </div>
                                  <div className="text-yellow-300 font-bold text-xs">
                                    {player.score}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
