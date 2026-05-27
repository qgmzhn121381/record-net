import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.birthday !== undefined) updateData.birthday = body.birthday;
    if (body.birthdayType !== undefined) updateData.birthday_type = body.birthdayType;
    if (body.relationship !== undefined) updateData.relationship = body.relationship;
    if (body.remind30 !== undefined) updateData.remind_30 = body.remind30;
    if (body.remind15 !== undefined) updateData.remind_15 = body.remind15;
    if (body.remind7 !== undefined) updateData.remind_7 = body.remind7;
    if (body.remind0 !== undefined) updateData.remind_0 = body.remind0;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data, error } = await getSupabase()
      .from('birthday_cards').update(updateData).eq('id', id).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      card: {
        id: data.id, userId: data.user_id, name: data.name, birthday: data.birthday,
        birthdayType: data.birthday_type, relationship: data.relationship,
        remind30: data.remind_30, remind15: data.remind_15, remind7: data.remind_7,
        remind0: data.remind_0, notes: data.notes, createdAt: data.created_at,
      },
    });
  } catch { return NextResponse.json({ error: '服务器错误' }, { status: 500 }); }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await getSupabase().from('birthday_cards').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: '服务器错误' }, { status: 500 }); }
}
