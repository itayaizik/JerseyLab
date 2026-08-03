import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const me = await base44.auth.me();
        setUser(me);
        setIsAdmin(me.role === 'admin');
      } catch {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    }
    check();
  }, []);

  return { isAdmin, user, loading };
}