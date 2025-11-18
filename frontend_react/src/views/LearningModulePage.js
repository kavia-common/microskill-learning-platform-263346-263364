import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getSkill, getSkillProgress, updateSkillProgress } from '../services/api';
import '../lms.css';

// PUBLIC_INTERFACE
export default function LearningModulePage() {
  /**
   * Learning module view: displays lesson content area, next/prev, progress bar, mark complete.
   */
  const { skillId, lessonId } = useParams();
  const navigate = useNavigate();
  const [skill, setSkill] = useState(null);
  const [progress, setProgress] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

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
    let active = true;
    async function load() {
      setErr('');
      try {
        const s = await getSkill(skillId);
        if (!active) return;
        setSkill(s);
        const pr = await getSkillProgress(skillId);
        if (!active) return;
        setProgress(pr);
      } catch (e) {
        if (!active) return;
        setErr(e.message || 'Failed to load module');
      }
    }
    load();
    return () => { active = false; };
  }, [skillId]);

  if (err) {
    return <div style={{ padding: 16, color: '#EF4444' }}>{err}</div>;
  }
  if (!skill) {
    return <div style={{ padding: 16, color: 'var(--muted)' }}>Loading…</div>;
  }

  const idx = skill.lessons.findIndex(l => l.id === lessonId);
  const cur = skill.lessons[idx] || skill.lessons[0];
  const prevId = idx > 0 ? skill.lessons[idx - 1].id : null;
  const nextId = idx < skill.lessons.length - 1 ? skill.lessons[idx + 1].id : null;
  const pct = progress?.stats?.overall || 0;
  const rec = progress?.items?.find(i => i.lessonId === cur.id);
  const done = !!rec?.completed;

  const markComplete = async () => {
    setBusy(true);
    try {
      const pr = await updateSkillProgress(skillId, { lessonId: cur.id, completed: true, watched: true });
      setProgress(pr);
    } catch (e) {
      setErr(e.message || 'Failed to update progress');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 16, display: 'grid', gap: 12 }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <h1 style={{ margin: 0 }}>{skill.title}</h1>
          <div style={{ flex: 1, marginLeft: 16 }}>
            <div style={{ height: 10, borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', background: '#111' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{pct}% complete</div>
          </div>
          <Link className="btn" to={`/skill/${encodeURIComponent(skill.id)}`}>Back to skill</Link>
        </div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
          <div style={{ fontWeight: 800 }}>{cur.title}</div>
          <div style={{ color: 'var(--muted)' }}>{cur.duration}m</div>
        </div>
        <div style={{ color: 'var(--muted)', marginTop: 6 }}>
          Lesson content goes here. Use the controls below to navigate and mark complete.
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {prevId ? (
            <button className="btn" onClick={() => navigate(`/learn/${encodeURIComponent(skill.id)}/${encodeURIComponent(prevId)}`)}>&larr; Prev</button>
          ) : <button className="btn" disabled>&larr; Prev</button>}
          {nextId ? (
            <button className="btn" onClick={() => navigate(`/learn/${encodeURIComponent(skill.id)}/${encodeURIComponent(nextId)}`)}>Next &rarr;</button>
          ) : <button className="btn" disabled>Next &rarr;</button>}
          {!done ? (
            <button className="btn primary" onClick={markComplete} disabled={busy}>Mark complete</button>
          ) : (
            <span style={{ color: 'var(--secondary)' }}>Completed ✓</span>
          )}
        </div>
      </div>
    </div>
  );
}
