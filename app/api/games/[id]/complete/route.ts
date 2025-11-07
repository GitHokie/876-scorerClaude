import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const gameId = parseInt(params.id);
    
    await sql`
      UPDATE games 
      SET status = 'completed', completed_at = CURRENT_TIMESTAMP
      WHERE id = ${gameId}
    `;
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error completing game:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
