import React from 'react';

/**
 * PUBLIC_INTERFACE
 * LeaderboardCard shows a single leaderboard row.
 */
export default function LeaderboardCard({ rank, user, points }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 10
    }}>
      <div style={{ fontWeight: 800, color: 'var(--secondary)' }}>#{rank}</div>
      <div style={{ flex: 1, padding: '0 10px' }}>{user}</div>
      <div style={{ color: 'var(--muted)' }}>{points} pts</div>
    </div>
  );
}
