'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthForm from '@/components/AuthForm';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      router.push('/dashboard');
    }
    setLoading(false);
  }, [router]);

  if (loading) return null;

  return (
    <AuthForm
      onLogin={(user) => {
        localStorage.setItem('user', JSON.stringify(user));
        router.push('/dashboard');
      }}
    />
  );
}
