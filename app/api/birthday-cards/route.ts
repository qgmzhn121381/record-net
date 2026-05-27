import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

function mapCard(r: Record<string, unknown>) {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    birthday: r.birthday,
    birthdayType: r.birthday_type,
    relationship: r.relationship,
    remind30: r.remind_30,
    remind15: r.remind_15,
    remind7: r.remind_7,
    remind0: r.remind_0,
    notes: r.notes,
    createdAt: r.created_at,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });

  const { data, error } = await getSupabase()
    .from('birthday_cards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ cards: data.map(mapCard) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, name, birthday, birthdayType, relationship, remind30, remind15, remind7, remind0, notes } = body;
    if (!userId || !name || !birthday) return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });

    const { data, error } = await getSupabase()
      .from('birthday_cards')
      .insert({
        user_id: userId,
        name,
        birthday,
        birthday_type: birthdayType || 'solar',
        relationship: relationship || '朋友',
        remind_30: remind30 ?? false,
        remind_15: remind15 ?? false,
        remind_7: remind7 ?? true,
        remind_0: remind0 ?? true,
        notes: notes || null,
      })
      .select('*')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ card: mapCard(data) });
  } catch { return NextResponse.json({ error: '服务器错误' }, { status: 500 }); }
}
