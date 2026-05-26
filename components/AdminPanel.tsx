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
      <div className="admin-loading">
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <h1>管理后台</h1>
          <button onClick={onBack} className="admin-back">返回主页</button>
        </div>

        <div className="admin-stats-cards">
          <div className="admin-stat-card">
            <p className="admin-stat-number">{users.length}</p>
            <p className="admin-stat-label">总用户数</p>
          </div>
          <div className="admin-stat-card">
            <p className="admin-stat-number">{totalRecords}</p>
            <p className="admin-stat-label">总记录数</p>
          </div>
        </div>

        <div className="admin-search">
          <input
            type="text"
            placeholder="搜索用户..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-search-input"
          />
        </div>

        {selectedUser ? (
          <div>
            <div className="admin-sub-header">
              <button onClick={() => setSelectedUser(null)} className="admin-back-link">← 返回</button>
              <h2>{selectedUser.username} 的记录</h2>
            </div>
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>事件</th>
                    <th>日期</th>
                    <th>分类</th>
                    <th>心情</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {userRecords.map((r) => (
                    <tr key={r.id}>
                      <td>{r.title}</td>
                      <td>{r.eventDate}</td>
                      <td>{r.category}</td>
                      <td>{r.mood}</td>
                      <td>
                        <button onClick={() => deleteRecord(r.id)} className="admin-delete-btn">删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {userRecords.length === 0 && <p className="admin-empty">暂无记录</p>}
            </div>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>用户名</th>
                  <th>注册时间</th>
                  <th>记录数</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id}>
                    <td>
                      {u.username}
                      {u.isAdmin && <span className="admin-badge">👑管理员</span>}
                    </td>
                    <td>{new Date(u.createdAt).toLocaleDateString('zh-CN')}</td>
                    <td className="admin-count">{u.recordCount}</td>
                    <td className="admin-actions">
                      <button onClick={() => fetchUserRecords(u)} className="admin-view-btn">查看记录</button>
                      {!u.isAdmin && (
                        <button onClick={() => deleteUser(u.id)} className="admin-delete-btn">删除用户</button>
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
