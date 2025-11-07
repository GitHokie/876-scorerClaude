import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const games = await sql`
      SELECT 
        g.id,
        g.created_at,
        g.completed_at,
        g.max_cards,
        g.total_rounds,
        json_agg(
          json_build_object(
            'name', gp.player_name,
            'score', gp.total_score
          ) ORDER BY gp.total_score DESC
        ) as players
      FROM games g
      LEFT JOIN game_players gp ON g.id = gp.game_id
      WHERE g.status = 'completed'
      GROUP BY g.id
      ORDER BY g.completed_at DESC
      LIMIT 50
    `;
    
    return NextResponse.json({ games: games.rows }, { status: 200 });
  } catch (error) {
    console.error('Error fetching history:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
