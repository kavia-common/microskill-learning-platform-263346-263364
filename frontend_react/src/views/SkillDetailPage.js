import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { enrollSkill, getSkill, getSkillProgress, updateSkillProgress } from '../services/api';
import '../lms.css';

// PUBLIC_INTERFACE
export default function SkillDetailPage() {
  /**
   * Skill detail page showing description, lessons, estimated time, and CTA to Enroll/Continue.
   * Includes left navigation of modules and progress banner in top area.
   */
  const { id } = useParams();
  const [skill, setSkill] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
      setErr('');
      try {
        const s = await getSkill(id);
        if (!active) return;
        setSkill(s);
        const pr = await getSkillProgress(id);
        if (!active) return;
        setProgress(pr);
      } catch (e) {
        if (!active) return;
        setErr(e.message || 'Failed to load skill');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [id]);

  const enrolled = useMemo(() => {
    // naive: if any progress exists or user clicked enroll previously
    if (!progress) return false;
    return true;
  }, [progress]);

  const onEnroll = async () => {
    setBusy(true);
    try {
      await enrollSkill(id);
      // fetch progress so banner shows
      const pr = await getSkillProgress(id);
      setProgress(pr);
    } catch (e) {
      setErr(e.message || 'Enroll failed');
    } finally {
      setBusy(false);
    }
  };

  const markComplete = async (lessonId) => {
    setBusy(true);
    try {
      const pr = await updateSkillProgress(id, { lessonId, completed: true, watched: true });
      setProgress(pr);
    } catch (e) {
      setErr(e.message || 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 16, color: 'var(--muted)' }}>Loading…</div>;
  }
  if (err) {
    return <div style={{ padding: 16, color: '#EF4444' }}>{err}</div>;
  }
  if (!skill) {
    return <div style={{ padding: 16 }}>Skill not found</div>;
  }

  const pct = progress?.stats?.overall || 0;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 12, padding: 16 }}>
      <aside style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, position: 'sticky', top: 72, height: 'fit-content' }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>Modules</div>
        <ol style={{ paddingLeft: 18, margin: 0, display: 'grid', gap: 6 }}>
          {skill.lessons.map((ls) => (
            <li key={ls.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <span>{ls.title}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{ls.duration}m</span>
            </li>
          ))}
        </ol>
      </aside>
      <section style={{ display: 'grid', gap: 12 }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
            <h1 style={{ margin: 0 }}>{skill.title}</h1>
            <div style={{ color: 'var(--muted)' }}>{skill.duration} min • {skill.level}</div>
          </div>
          <div style={{ color: 'var(--muted)', marginTop: 6 }}>{skill.description || skill.brief}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {skill.tags.map((t) => <span key={t} style={tagStyle}>{t}</span>)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
            {!enrolled && <button className="btn primary" onClick={onEnroll} disabled={busy}>Enroll</button>}
            {enrolled && <span style={{ color: 'var(--muted)' }}>Enrolled</span>}
            <div style={{ flex: 1 }}>
              <div style={{ height: 10, borderRadius: 8, border: '1px solid var(--border)', overflow: 'hidden', background: '#111' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{pct}% complete</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {skill.lessons.map((ls, idx) => {
            const rec = progress?.items?.find((i) => i.lessonId === ls.id);
            const done = !!rec?.completed;
            return (
              <div key={ls.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 999, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                      {idx + 1}
                    </div>
                    <div style={{ fontWeight: 700 }}>{ls.title}</div>
                  </div>
                  <div style={{ color: 'var(--muted)' }}>{ls.duration}m</div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {!done ? (
                    <button className="btn primary" onClick={() => markComplete(ls.id)} disabled={busy}>Mark complete</button>
                  ) : (
                    <span style={{ color: 'var(--secondary)' }}>Completed ✓</span>
                  )}
                  <Link className="btn" to={`/learn/${encodeURIComponent(skill.id)}/${encodeURIComponent(ls.id)}`}>Open module</Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

const tagStyle = {
  padding: '4px 8px',
  borderRadius: 999,
  border: '1px solid var(--border)',
  background: 'rgba(249,115,22,0.15)'
};
