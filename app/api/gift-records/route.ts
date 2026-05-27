import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

function mapGift(r: Record<string, unknown>) {
  return {
    id: r.id, cardId: r.card_id, year: r.year, direction: r.direction,
    giftName: r.gift_name, notes: r.notes, createdAt: r.created_at,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get('cardId');
  if (!cardId) return NextResponse.json({ error: '缺少卡片ID' }, { status: 400 });

  const { data, error } = await getSupabase()
    .from('gift_records').select('*').eq('card_id', cardId).order('year', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ gifts: data.map(mapGift) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cardId, year, direction, giftName, notes } = body;
    if (!cardId || !year || !direction || !giftName) return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });

    const { data, error } = await getSupabase()
      .from('gift_records')
      .insert({ card_id: cardId, year, direction, gift_name: giftName, notes: notes || null })
      .select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ gift: mapGift(data) });
  } catch { return NextResponse.json({ error: '服务器错误' }, { status: 500 }); }
}
