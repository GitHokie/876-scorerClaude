import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Get all games regardless of status
    const games = await sql`
      SELECT * FROM games ORDER BY created_at DESC LIMIT 10
    `;
    
    // Get all players
    const players = await sql`
      SELECT * FROM game_players ORDER BY game_id DESC LIMIT 20
    `;
    
    // Get all rounds
    const rounds = await sql`
      SELECT * FROM game_rounds ORDER BY game_id DESC LIMIT 50
    `;
    
    return NextResponse.json({ 
      games: games.rows,
      players: players.rows,
      rounds: rounds.rows
    }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
