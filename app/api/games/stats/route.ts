import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get average ranking by player
    const rankings = await sql`
      WITH player_rankings AS (
        SELECT 
          gp.player_name,
          g.id as game_id,
          ROW_NUMBER() OVER (PARTITION BY g.id ORDER BY gp.total_score DESC) as position
        FROM game_players gp
        JOIN games g ON gp.game_id = g.id
        WHERE g.status = 'completed'
      )
      SELECT 
        player_name,
        ROUND(AVG(position::numeric), 2) as avg_position,
        COUNT(*) as games_played
      FROM player_rankings
      GROUP BY player_name
      ORDER BY avg_position ASC
    `;

    // Get Wall of Shame (players who scored below 83)
    const wallOfShame = await sql`
      SELECT DISTINCT
        gp.player_name,
        MIN(gp.total_score) as lowest_score,
        g.completed_at,
        g.id as game_id
      FROM game_players gp
      JOIN games g ON gp.game_id = g.id
      WHERE g.status = 'completed' 
        AND gp.total_score < 83
      GROUP BY gp.player_name, g.completed_at, g.id
      ORDER BY gp.player_name, MIN(gp.total_score) ASC
    `;

    // Get Perfect Games (players who made their bid every round)
    const perfectGames = await sql`
      WITH round_counts AS (
        SELECT 
          game_id,
          player_id,
          COUNT(*) as total_rounds,
          SUM(CASE WHEN made_bid = true THEN 1 ELSE 0 END) as perfect_rounds
        FROM game_rounds
        GROUP BY game_id, player_id
      ),
      perfect_players AS (
        SELECT 
          rc.game_id,
          rc.player_id,
          gp.player_name,
          gp.total_score,
          g.completed_at
        FROM round_counts rc
        JOIN game_players gp ON rc.player_id = gp.id
        JOIN games g ON rc.game_id = g.id
        WHERE rc.total_rounds = rc.perfect_rounds
          AND g.status = 'completed'
      )
      SELECT 
        player_name,
        total_score,
        completed_at,
        game_id
      FROM perfect_players
      ORDER BY total_score DESC, completed_at DESC
    `;

    return NextResponse.json({ 
      rankings: rankings.rows,
      wallOfShame: wallOfShame.rows,
      perfectGames: perfectGames.rows
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
