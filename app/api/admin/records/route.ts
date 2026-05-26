import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const adminId = searchParams.get('adminId');
  const userId = searchParams.get('userId');

  if (!adminId) {
    return NextResponse.json({ error: '缺少管理员ID' }, { status: 400 });
  }

  const { data: admin } = await getSupabase()
    .from('users')
    .select('is_admin')
    .eq('id', adminId)
    .single();

  if (!admin?.is_admin) {
    return NextResponse.json({ error: '无权限' }, { status: 403 });
  }

  let query = getSupabase()
    .from('records')
    .select('*')
    .order('created_at', { ascending: false });

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const records = data.map((r) => ({
    id: r.id,
    userId: r.user_id,
    title: r.title,
    eventDate: r.event_date,
    eventTime: r.event_time,
    category: r.category,
    mood: r.mood,
    weather: r.weather,
    note: r.note,
    futureLetter: r.future_letter,
    futureLetterDate: r.future_letter_date,
    isPinned: r.is_pinned,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  return NextResponse.json({ records });
}
