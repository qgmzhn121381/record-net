import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

function mapAnniversary(r: Record<string, unknown>) {
  return {
    id: r.id, cardId: r.card_id, title: r.title, anniversaryDate: r.anniversary_date,
    repeatYearly: r.repeat_yearly, notes: r.notes, createdAt: r.created_at,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get('cardId');
  if (!cardId) return NextResponse.json({ error: '缺少卡片ID' }, { status: 400 });

  const { data, error } = await getSupabase()
    .from('anniversaries').select('*').eq('card_id', cardId).order('anniversary_date', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ anniversaries: data.map(mapAnniversary) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cardId, title, anniversaryDate, repeatYearly, notes } = body;
    if (!cardId || !title || !anniversaryDate) return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });

    const { data, error } = await getSupabase()
      .from('anniversaries')
      .insert({ card_id: cardId, title, anniversary_date: anniversaryDate, repeat_yearly: repeatYearly ?? true, notes: notes || null })
      .select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ anniversary: mapAnniversary(data) });
  } catch { return NextResponse.json({ error: '服务器错误' }, { status: 500 }); }
}
