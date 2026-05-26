'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminPanel from '@/components/AdminPanel';

interface UserData {
  id: string;
  username: string;
  isAdmin: boolean;
}

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (!stored) {
      router.push('/');
      return;
    }
    const userData = JSON.parse(stored);
    if (!userData.isAdmin) {
      router.push('/dashboard');
      return;
    }
    setUser(userData);
  }, [router]);

  if (!user || !user.isAdmin) return null;

  return (
    <AdminPanel
      adminId={user.id}
      onBack={() => router.push('/dashboard')}
    />
  );
}
