import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: Request) {
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

  const { data: users, error } = await getSupabase()
    .from('users')
    .select('id, username, is_admin, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: records } = await getSupabase().from('records').select('user_id');

  const recordCountMap: Record<string, number> = {};
  if (records) {
    for (const r of records) {
      recordCountMap[r.user_id] = (recordCountMap[r.user_id] || 0) + 1;
    }
  }

  const result = users.map((u) => ({
    id: u.id,
    username: u.username,
    isAdmin: u.is_admin,
    createdAt: u.created_at,
    recordCount: recordCountMap[u.id] || 0,
  }));

  return NextResponse.json({ users: result });
}
