import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, title, eventDate, eventTime, category, mood, weather, note, futureLetter, futureLetterDate } = body;

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
        future_letter: futureLetter || null,
        future_letter_date: futureLetterDate || null,
      })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      record: {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        eventDate: data.event_date,
        eventTime: data.event_time,
        category: data.category,
        mood: data.mood,
        weather: data.weather,
        note: data.note,
        futureLetter: data.future_letter,
        futureLetterDate: data.future_letter_date,
        isPinned: data.is_pinned,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      },
    });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
