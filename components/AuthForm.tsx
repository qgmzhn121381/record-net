'use client';

import { useState } from 'react';

interface AuthFormProps {
  onLogin: (user: { id: string; username: string; isAdmin: boolean; birthday?: string | null }) => void;
}

export default function AuthForm({ onLogin }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthday, setBirthday] = useState('');
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
      const body: Record<string, string> = { username, password };
      if (!isLogin && birthday) body.birthday = birthday;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
    <div className="login-page">
      <div className="login-particles">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="login-particle"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${6 + Math.random() * 10}px`,
              height: `${6 + Math.random() * 10}px`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 8}s`,
              opacity: 0.15 + Math.random() * 0.2,
            }}
          />
        ))}
      </div>

      <div className="login-container">
        <div className="login-brand">
          <h1 className="login-title">记录网</h1>
          <p className="login-subtitle">记录每一个值得铭记的时刻</p>
        </div>

        <div className="login-card">
          <div className="login-tabs">
            <button
              className={`login-tab ${isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(true); setError(''); }}
            >
              登录
            </button>
            <button
              className={`login-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => { setIsLogin(false); setError(''); }}
            >
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <input
                type="text"
                placeholder="用户名（至少3个字符）"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="login-input"
              />
            </div>

            <div className="login-field">
              <input
                type="password"
                placeholder="密码（至少6个字符）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
              />
            </div>

            {!isLogin && (
              <>
                <div className="login-field">
                  <input
                    type="password"
                    placeholder="确认密码"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="login-input"
                  />
                </div>
                <div className="login-field">
                  <label className="login-label">生日（选填）</label>
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="login-input"
                  />
                </div>
              </>
            )}

            {error && (
              <p className={`login-error ${error.includes('成功') ? 'success' : ''}`}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="login-button"
            >
              {loading ? '处理中...' : isLogin ? '登 录' : '注 册'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
