import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

function mapRecord(r: Record<string, unknown>) {
  return {
    id: r.id,
    userId: r.user_id,
    title: r.title,
    eventDate: r.event_date,
    eventTime: r.event_time,
    category: r.category,
    mood: r.mood,
    weather: r.weather,
    note: r.note,
    tags: r.tags,
    futureLetter: r.future_letter,
    futureLetterDate: r.future_letter_date,
    isPinned: r.is_pinned,
    notifyDaily: r.notify_daily,
    notifyMilestone: r.notify_milestone,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from('records')
    .select('*')
    .eq('user_id', userId)
    .order('is_pinned', { ascending: false })
    .order('event_date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ records: data.map(mapRecord) });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, title, eventDate, eventTime, category, mood, weather, note, tags, futureLetter, futureLetterDate, notifyDaily, notifyMilestone } = body;

    if (!userId || !title || !eventDate) {
      return NextResponse.json({ error: '缺少必填字段' }, { status: 400 });
    }

    const { data, error } = await getSupabase()
      .from('records')
      .insert({
        user_id: userId,
        title,
        event_date: eventDate,
        event_time: eventTime || null,
        category: category || '其他',
        mood: mood || '😊',
        weather: weather || '☀️',
        note: note || null,
        tags: tags || '',
        future_letter: futureLetter || null,
        future_letter_date: futureLetterDate || null,
        notify_daily: notifyDaily ?? false,
        notify_milestone: notifyMilestone ?? true,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ record: mapRecord(data) });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
