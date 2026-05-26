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

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, eventDate, eventTime, category, mood, weather, note, tags, futureLetter, futureLetterDate, isPinned, notifyDaily, notifyMilestone } = body;

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
    if (tags !== undefined) updateData.tags = tags;
    if (futureLetter !== undefined) updateData.future_letter = futureLetter;
    if (futureLetterDate !== undefined) updateData.future_letter_date = futureLetterDate;
    if (isPinned !== undefined) updateData.is_pinned = isPinned;
    if (notifyDaily !== undefined) updateData.notify_daily = notifyDaily;
    if (notifyMilestone !== undefined) updateData.notify_milestone = notifyMilestone;

    const { data, error } = await getSupabase()
      .from('records')
      .update(updateData)
      .eq('id', id)
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

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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
