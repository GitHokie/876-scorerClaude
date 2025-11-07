import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { playerNames } = await request.json();
    
    // Update last_played for all players in the list
    for (const name of playerNames) {
      await sql`
        UPDATE players 
        SET last_played = CURRENT_TIMESTAMP
        WHERE name = ${name}
      `;
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
