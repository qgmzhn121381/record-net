import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { username, password, birthday, birthdayType } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: '用户名和密码不能为空' }, { status: 400 });
    }
    if (username.length < 3) {
      return NextResponse.json({ error: '用户名至少3个字符' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少6个字符' }, { status: 400 });
    }

    const { data: existing } = await getSupabase()
      .from('users').select('id').eq('username', username).single();

    if (existing) {
      return NextResponse.json({ error: '用户名已存在' }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const isAdmin = username === 'admin';

    const insertData: Record<string, unknown> = {
      username,
      password_hash: passwordHash,
      is_admin: isAdmin,
    };
    if (birthday) insertData.birthday = birthday;
    if (birthdayType) insertData.birthday_type = birthdayType;

    const { data, error } = await getSupabase()
      .from('users').insert(insertData)
      .select('id, username, is_admin, birthday, birthday_type, festival_notify').single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      user: {
        id: data.id,
        username: data.username,
        isAdmin: data.is_admin,
        birthday: data.birthday,
        birthdayType: data.birthday_type,
        festivalNotify: data.festival_notify,
      },
    });
  } catch {
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
