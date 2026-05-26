import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, eventDate, eventTime, category, mood, weather, note, futureLetter, futureLetterDate, isPinned } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateData.title = title;
    if (eventDate !== undefined) updateData.event_date = eventDate;
    if (eventTime !== undefined) updateData.event_time = eventTime;
    if (category !== undefined) updateData.category = category;
    if (mood !== undefined) updateData.mood = mood;
    if (weather !== undefined) updateData.weather = weather;
    if (note !== undefined) updateData.note = note;
    if (futureLetter !== undefined) updateData.future_letter = futureLetter;
    if (futureLetterDate !== undefined) updateData.future_letter_date = futureLetterDate;
    if (isPinned !== undefined) updateData.is_pinned = isPinned;

    const { data, error } = await getSupabase()
      .from('records')
      .update(updateData)
      .eq('id', id)
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

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { error } = await getSupabase().from('records').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
