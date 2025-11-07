import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Create games table
    await sql`
      CREATE TABLE IF NOT EXISTS games (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'in_progress',
        max_cards INTEGER NOT NULL,
        total_rounds INTEGER NOT NULL
      );
    `;

    // Create game_players table
    await sql`
      CREATE TABLE IF NOT EXISTS game_players (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
        player_name VARCHAR(100) NOT NULL,
        player_order INTEGER NOT NULL,
        total_score INTEGER DEFAULT 0
      );
    `;

    // Create game_rounds table
    await sql`
      CREATE TABLE IF NOT EXISTS game_rounds (
        id SERIAL PRIMARY KEY,
        game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
        player_id INTEGER REFERENCES game_players(id) ON DELETE CASCADE,
        round_number INTEGER NOT NULL,
        cards INTEGER NOT NULL,
        bid INTEGER NOT NULL,
        tricks INTEGER NOT NULL,
        score INTEGER NOT NULL,
        made_bid BOOLEAN NOT NULL
      );
    `;

    return NextResponse.json({ message: 'Database tables created successfully!' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
