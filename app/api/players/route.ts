import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const players = await sql`
      SELECT * FROM players ORDER BY name ASC
    `;
    
    return NextResponse.json({ players: players.rows }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Player name is required' }, { status: 400 });
    }
    
    // Insert new player
    const result = await sql`
      INSERT INTO players (name)
      VALUES (${name.trim()})
      ON CONFLICT (name) DO NOTHING
      RETURNING *
    `;
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Player already exists' }, { status: 400 });
    }
    
    return NextResponse.json({ player: result.rows[0] }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
