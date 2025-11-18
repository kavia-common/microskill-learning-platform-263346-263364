import React, { useEffect, useMemo, useState } from 'react';
import { getSkillProgress, listSkills } from '../services/api';
import ProgressTracker from '../components/ProgressTracker';
import { Skeleton } from '../ui/Skeleton';
import { emptyStates, sectionHeadings } from '../data/dummyLessons';

/**
 * PUBLIC_INTERFACE
 * ProgressPageView fetches and displays user progress with a list.
 */
export default function ProgressPageView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = useMemo(() => {
    const key = 'lms_user_id';
    let v = localStorage.getItem(key);
    if (!v) {
      v = `anon_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(key, v);
    }
    return v;
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    (async () => {
      try {
        // Fetch all skills, then fetch per-skill progress and aggregate
        const skills = await listSkills();
        const progresses = await Promise.all((skills || []).map(async (s) => {
          try {
            const pr = await getSkillProgress(s.id);
            return { skill: s, progress: pr };
          } catch {
            return { skill: s, progress: null };
          }
        }));
        // Aggregate stats
        let watched = 0;
        let completed = 0;
        let totalLessons = 0;
        const items = [];
        progresses.forEach(({ skill, progress }) => {
          if (!skill) return;
          const tl = Array.isArray(skill.tags) ? (skill.lessonsCount || 0) : 0;
          // We don't have lessonsCount; progress has stats when exists
          if (progress?.stats) {
            watched += progress.stats.watched || 0;
            completed += progress.stats.completed || 0;
            totalLessons += progress.stats.totalLessons || 0;
            (progress.items || []).forEach((it) => items.push({ ...it, skillId: skill.id }));
          }
        });
        const overall = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
        const result = { stats: { watched, completed, overall, totalLessons, points: completed * 10, streak: 0 }, items };
        if (mounted) setData(result);
      } catch {
        if (mounted) setData({ stats: { watched: 0, completed: 0, overall: 0, totalLessons: 0, points: 0, streak: 0 }, items: [] });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <Skeleton width="40%" />
        <div style={{ height: 8 }} />
        <Skeleton height={10} />
        <div style={{ height: 8 }} />
        <Skeleton />
      </div>
    );
  }

  const completed = (data?.items || []).filter(i => i.completed);

  return (
    <div style={{ padding: 16, display: 'grid', gap: 12 }}>
      <h1 style={{ margin: 0 }}>{sectionHeadings.continue}</h1>
      <ProgressTracker stats={data?.stats || {}} />
      <section aria-label="Completed lessons" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
        <h3 style={{ marginTop: 0 }}>Completed lessons</h3>
        <ul>
          {completed.map((it) => (
            <li key={it.lessonId}>{it.lessonId} — Score {it.score}</li>
          ))}
          {completed.length === 0 && <li>{emptyStates.continue}</li>}
        </ul>
      </section>
    </div>
  );
}
