import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = parseInt(params.id);
    const { roundNumber, cards, playerResults } = await request.json();
    
    // Save each player's round result
    for (const result of playerResults) {
      await sql`
        INSERT INTO game_rounds (game_id, player_id, round_number, cards, bid, tricks, score, made_bid)
        VALUES (${gameId}, ${result.playerId}, ${roundNumber}, ${cards}, ${result.bid}, ${result.tricks}, ${result.score}, ${result.madeIt})
      `;
      
      // Update player's total score
      await sql`
        UPDATE game_players 
        SET total_score = total_score + ${result.score}
        WHERE id = ${result.playerId}
      `;
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error saving round:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
