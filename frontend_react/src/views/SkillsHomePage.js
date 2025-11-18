import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listSkills } from '../services/api';
import '../lms.css';

// PUBLIC_INTERFACE
export default function SkillsHomePage() {
  /**
   * Home page listing micro-skills with search/filter bar.
   * Applies Ocean Professional dark theme via global CSS variables.
   */
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [params, setParams] = useSearchParams();
  const search = params.get('q') || '';
  const level = params.get('level') || '';
  const tag = params.get('tag') || '';

  const validatedSearch = useMemo(() => {
    const s = (search || '').trim();
    // basic input validation - alnum and punctuation only, limit length
    const safe = s.replace(/[^a-z0-9 ,._-]/gi, '').slice(0, 120);
    return safe;
  }, [search]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setErr('');
      try {
        const data = await listSkills({ search: validatedSearch, level: level || undefined, tag: tag || undefined });
        if (!active) return;
        setSkills(data);
      } catch (e) {
        if (!active) return;
        setErr(e.message || 'Failed to load skills');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [validatedSearch, level, tag]);

  const onSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const q = (fd.get('q') || '').toString().trim();
    const lvl = (fd.get('level') || '').toString();
    const tg = (fd.get('tag') || '').toString().trim();
    const next = {};
    if (q) next.q = q;
    if (lvl) next.level = lvl;
    if (tg) next.tag = tg;
    setParams(next, { replace: true });
  };

  return (
    <div style={{ padding: 16, display: 'grid', gap: 12 }}>
      <header style={{ display: 'grid', gap: 8 }}>
        <h1 style={{ margin: 0 }}>Micro-Skills</h1>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr auto auto auto', alignItems: 'center' }}>
          <input
            name="q"
            defaultValue={search}
            placeholder="Search by title, tag…"
            aria-label="Search"
            style={inputStyle}
          />
          <select name="level" defaultValue={level} style={inputStyle}>
            <option value="">All levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <input name="tag" defaultValue={tag} placeholder="Tag" style={inputStyle} />
          <button className="btn primary" type="submit">Search</button>
        </form>
      </header>

      {loading && <div style={{ color: 'var(--muted)' }}>Loading…</div>}
      {err && <div style={{ color: '#EF4444' }}>{err}</div>}

      <section style={{ display: 'grid', gap: 12 }}>
        {skills.map((s) => (
          <div key={s.id} style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'baseline' }}>
              <div style={{ fontWeight: 800 }}>{s.title}</div>
              <div style={pillStyle}>{s.level}</div>
            </div>
            <div style={{ color: 'var(--muted)', marginTop: 4 }}>{s.brief}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {s.tags.map((t) => <span key={t} style={tagStyle}>{t}</span>)}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <Link to={`/skill/${encodeURIComponent(s.id)}`} className="btn">View</Link>
            </div>
          </div>
        ))}
        {!loading && skills.length === 0 && <div style={{ color: 'var(--muted)' }}>No skills found.</div>}
      </section>
    </div>
  );
}

const inputStyle = {
  background: 'transparent',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '8px 10px',
  outline: 'none'
};
const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: 12
};
const pillStyle = {
  padding: '2px 8px',
  borderRadius: 999,
  border: '1px solid var(--border)',
  fontSize: 12,
  color: 'var(--muted)'
};
const tagStyle = {
  padding: '4px 8px',
  borderRadius: 999,
  border: '1px solid var(--border)',
  background: 'rgba(249,115,22,0.15)'
};
