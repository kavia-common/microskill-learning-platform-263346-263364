import React, { useMemo, useState } from 'react';
import ProfileCard from '../components/ProfileCard';
import { addGlobalToast } from '../ui/ToastHost';

/**
 * PUBLIC_INTERFACE
 * ProfilePage shows user info and saved lessons list.
 */
export default function ProfilePage() {
  const [saved] = useState([]);
  const user = useMemo(() => ({
    name: localStorage.getItem('lms_user_name') || 'Guest User',
    email: localStorage.getItem('lms_user_name') || 'anonymous'
  }), []);

  const onLogout = () => {
    localStorage.removeItem('lms_user_name');
    addGlobalToast({ type: 'success', message: 'Logged out' });
  };

  return (
    <div style={{ padding: 16 }}>
      <ProfileCard user={user} saved={saved} onLogout={onLogout} />
    </div>
  );
}
