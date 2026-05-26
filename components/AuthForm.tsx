'use client';

import { useState } from 'react';

interface AuthFormProps {
  onLogin: (user: { id: string; username: string; isAdmin: boolean }) => void;
}

export default function AuthForm({ onLogin }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.length < 3) {
      setError('用户名至少3个字符');
      return;
    }

    if (password.length < 6) {
      setError('密码至少6个字符');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }

    setLoading(true);

    try {
      const url = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      if (isLogin) {
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError('');
        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
        setError('注册成功，请登录');
      }
    } catch {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #581c87 100%)' }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1
            className="text-5xl font-bold text-white mb-2"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            记录网
          </h1>
          <p className="text-gray-300" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>
            记录每一个值得铭记的时刻
          </p>
        </div>

        <div
          className="rounded-2xl p-8 shadow-2xl border border-white/10"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <h2 className="text-2xl font-bold text-white mb-6 text-center" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>
            {isLogin ? '登录' : '注册'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="用户名"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors"
                style={{ fontFamily: 'Noto Sans SC, sans-serif' }}
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors"
                style={{ fontFamily: 'Noto Sans SC, sans-serif' }}
              />
            </div>

            {!isLogin && (
              <div>
                <input
                  type="password"
                  placeholder="确认密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:border-orange-400 transition-colors"
                  style={{ fontFamily: 'Noto Sans SC, sans-serif' }}
                />
              </div>
            )}

            {error && (
              <p className="text-red-400 text-sm text-center" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-white transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ec4899 100%)',
                fontFamily: 'Noto Sans SC, sans-serif',
              }}
            >
              {loading ? '处理中...' : isLogin ? '登录' : '注册'}
            </button>
          </form>

          <p
            className="text-center mt-4 text-gray-400 cursor-pointer hover:text-white transition-colors"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            style={{ fontFamily: 'Noto Sans SC, sans-serif' }}
          >
            {isLogin ? '没有账号？注册' : '已有账号？登录'}
          </p>
        </div>
      </div>
    </div>
  );
}
