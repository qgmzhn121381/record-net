import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }

    const passwordHash = hashPassword(password);

    const { data, error } = await getSupabase()
      .from('users')
      .select('id, username, is_admin')
      .eq('username', username)
      .eq('password_hash', passwordHash)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: data.id,
        username: data.username,
        isAdmin: data.is_admin,
      },
    });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
