'use client';

import { useState, useEffect, useCallback } from 'react';

interface AdminUser {
  id: string;
  username: string;
  isAdmin: boolean;
  createdAt: string;
  recordCount: number;
}

interface AdminRecord {
  id: string;
  userId: string;
  title: string;
  eventDate: string;
  category: string;
  mood: string;
}

interface AdminPanelProps {
  adminId: string;
  onBack: () => void;
}

export default function AdminPanel({ adminId, onBack }: AdminPanelProps) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userRecords, setUserRecords] = useState<AdminRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    const res = await fetch(`/api/admin/users?adminId=${adminId}`);
    const data = await res.json();
    if (data.users) setUsers(data.users);
    setLoading(false);
  }, [adminId]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchUserRecords = async (user: AdminUser) => {
    setSelectedUser(user);
    const res = await fetch(`/api/admin/records?adminId=${adminId}&userId=${user.id}`);
    const data = await res.json();
    if (data.records) setUserRecords(data.records);
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('确定删除该用户及其所有记录？')) return;
    await fetch(`/api/admin/users/${userId}?adminId=${adminId}`, { method: 'DELETE' });
    setSelectedUser(null);
    fetchUsers();
  };

  const deleteRecord = async (recordId: string) => {
    if (!confirm('确定删除该记录？')) return;
    await fetch(`/api/admin/records/${recordId}?adminId=${adminId}`, { method: 'DELETE' });
    if (selectedUser) fetchUserRecords(selectedUser);
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const totalRecords = users.reduce((sum, u) => sum + u.recordCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <p className="text-gray-400">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" style={{ background: '#0f172a' }}>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: 'Noto Sans SC, sans-serif' }}>
            管理后台
          </h1>
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            返回主页
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl p-6 text-center" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <p className="text-4xl font-bold" style={{ color: '#f59e0b', fontFamily: 'DM Mono, monospace' }}>
              {users.length}
            </p>
            <p className="text-sm text-gray-400 mt-2">总用户数</p>
          </div>
          <div className="rounded-xl p-6 text-center" style={{ background: '#1e293b', border: '1px solid #334155' }}>
            <p className="text-4xl font-bold" style={{ color: '#f59e0b', fontFamily: 'DM Mono, monospace' }}>
              {totalRecords}
            </p>
            <p className="text-sm text-gray-400 mt-2">总记录数</p>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="搜索用户..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border focus:outline-none"
            style={{ background: '#1e293b', borderColor: '#334155', color: '#fff' }}
          />
        </div>

        {selectedUser ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ← 返回
              </button>
              <h2 className="text-lg font-bold text-white">
                {selectedUser.username} 的记录
              </h2>
            </div>

            <div
              className="rounded-xl overflow-hidden"
              style={{ background: '#1e293b', border: '1px solid #334155' }}
            >
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#0f172a' }}>
                    <th className="px-4 py-3 text-left text-xs text-gray-400">事件</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-400">日期</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-400">分类</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-400">心情</th>
                    <th className="px-4 py-3 text-right text-xs text-gray-400">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {userRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-white">{r.title}</td>
                      <td className="px-4 py-3 text-sm text-gray-400" style={{ fontFamily: 'DM Mono, monospace' }}>{r.eventDate}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{r.category}</td>
                      <td className="px-4 py-3 text-sm">{r.mood}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => deleteRecord(r.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {userRecords.length === 0 && (
                <p className="text-center py-8 text-gray-500">暂无记录</p>
              )}
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: '#1e293b', border: '1px solid #334155' }}
          >
            <table className="w-full">
              <thead>
                <tr style={{ background: '#0f172a' }}>
                  <th className="px-4 py-3 text-left text-xs text-gray-400">用户名</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-400">注册时间</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-400">记录数</th>
                  <th className="px-4 py-3 text-right text-xs text-gray-400">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-sm text-white">
                      {u.username}
                      {u.isAdmin && <span className="ml-2 text-xs text-yellow-500">👑管理员</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400" style={{ fontFamily: 'DM Mono, monospace' }}>
                      {new Date(u.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-3 text-sm" style={{ color: '#f59e0b', fontFamily: 'DM Mono, monospace' }}>
                      {u.recordCount}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button
                        onClick={() => fetchUserRecords(u)}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        查看记录
                      </button>
                      {!u.isAdmin && (
                        <button
                          onClick={() => deleteUser(u.id)}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                        >
                          删除用户
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
