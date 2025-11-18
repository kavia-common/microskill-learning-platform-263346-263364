import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLessons } from '../services/api';
import LessonCard from '../components/LessonCard';
import { Skeleton } from '../ui/Skeleton';
import TagList from '../components/TagList';
import { addGlobalToast } from '../ui/ToastHost';

/**
 * PUBLIC_INTERFACE
 * HomeFeedPage renders a TikTok-style infinite scroll of lessons.
 */
export default function HomeFeedPage() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);

  const load = useCallback(async () => {
    if (!hasMore) return;
    setLoading(true);
    try {
      // getLessons() returns all; simulate pagination client-side
      const all = await getLessons();
      const size = 6;
      const start = page * size;
      const next = all.slice(start, start + size);
      setItems((prev) => [...prev, ...next]);
      setHasMore(start + size < all.length);
      setPage((p) => p + 1);
    } catch (e) {
      addGlobalToast({ type: 'error', message: 'Failed to load lessons' });
    } finally {
      setLoading(false);
    }
  }, [page, hasMore]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Intersection observer for active card
  useEffect(() => {
    const nodes = containerRef.current?.querySelectorAll('.lesson-card') || [];
    const observer = new IntersectionObserver(
      (entries) => {
        let maxRatio = 0;
        let idx = activeIndex;
        entries.forEach((entry) => {
          const i = Array.from(nodes).indexOf(entry.target);
          if (entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            idx = i;
          }
        });
        setActiveIndex(idx);
      },
      { threshold: Array.from({ length: 10 }, (_, i) => i / 10) }
    );
    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  // Infinite scroll sentinel
  const sentinelRef = useCallback((node) => {
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading) {
        load();
      }
    }, { rootMargin: '800px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [load, loading]);

  const renderCardHeader = (l) => (
    <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <TagList tags={l.tags || []} />
      <div style={{ background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 8, fontSize: 12, border: '1px solid var(--border)' }}>
        {Math.round((l.durationSeconds || 60) / 60)}m
      </div>
    </div>
  );

  return (
    <div className="feed" ref={containerRef}>
      {items.map((l, i) => (
        <div key={l.id} style={{ position: 'relative' }}>
          {renderCardHeader(l)}
          <LessonCard
            lesson={l}
            active={i === activeIndex}
            onQuiz={() => {}}
            onWatched={() => {}}
          />
          <div style={{ position: 'absolute', bottom: 72, right: 16 }}>
            <Link to={`/lesson/${l.id}`} className="btn" aria-label="Open lesson detail">Details</Link>
          </div>
        </div>
      ))}
      {loading && (
        <div style={{ padding: 16 }}>
          <Skeleton height={240} />
          <div style={{ height: 8 }} />
          <Skeleton height={16} width="80%" />
          <div style={{ height: 6 }} />
          <Skeleton height={16} width="60%" />
        </div>
      )}
      {hasMore && <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />}
      {!hasMore && items.length > 0 && (
        <div style={{ textAlign: 'center', padding: 16, color: 'var(--muted)' }}>You reached the end</div>
      )}
    </div>
  );
}
