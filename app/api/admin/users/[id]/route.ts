import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

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

    await getSupabase().from('records').delete().eq('user_id', id);

    const { error } = await getSupabase().from('users').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
