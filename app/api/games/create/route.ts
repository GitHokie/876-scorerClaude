import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { players, maxCards, totalRounds } = await request.json();
    
    // Create game
    const gameResult = await sql`
      INSERT INTO games (max_cards, total_rounds, status)
      VALUES (${maxCards}, ${totalRounds}, 'in_progress')
      RETURNING id
    `;
    
    const gameId = gameResult.rows[0].id;
    
    // Add players
    for (let i = 0; i < players.length; i++) {
      const playerResult = await sql`
        INSERT INTO game_players (game_id, player_name, player_order, total_score)
        VALUES (${gameId}, ${players[i].name}, ${i}, 0)
        RETURNING id
      `;
      players[i].dbId = playerResult.rows[0].id;
    }
    
    return NextResponse.json({ gameId, players }, { status: 200 });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
