import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLessons } from '../services/api';
import LessonCard from '../components/LessonCard';
import { Skeleton } from '../ui/Skeleton';
import TagList from '../components/TagList';
import { addGlobalToast } from '../ui/ToastHost';
import { ctas, emptyStates, getDummyLessons, sectionHeadings, useDummyContentFlag } from '../data/dummyLessons';

/**
 * PUBLIC_INTERFACE
 * HomeFeedPage renders TikTok-like feed and an optional grid view with dummy content fallback.
 */
export default function HomeFeedPage() {
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState('feed'); // 'feed' | 'grid'
  const containerRef = useRef(null);

  const useDummy = useDummyContentFlag();

  const paginateAndAppend = useCallback((source, p) => {
    const size = 6;
    const start = p * size;
    const next = source.slice(start, start + size);
    setItems((prev) => [...prev, ...next]);
    setHasMore(start + size < source.length);
    setPage((pp) => pp + 1);
  }, []);

  const load = useCallback(async () => {
    if (!hasMore && allItems.length > 0) return;
    setLoading(true);
    try {
      let all = [];
      let fallbackUsed = false;
      if (!useDummy) {
        try {
          all = await getLessons();
        } catch {
          all = [];
        }
      }
      if (useDummy || !all || all.length === 0) {
        all = getDummyLessons();
        fallbackUsed = true;
      }
      setAllItems(all);
      if (page === 0) {
        setItems([]);
        paginateAndAppend(all, 0);
      } else if (fallbackUsed && items.length === 0) {
        // In case first load failed earlier, seed now
        paginateAndAppend(all, page);
      }
    } catch (e) {
      addGlobalToast({ type: 'error', message: 'Failed to load lessons' });
    } finally {
      setLoading(false);
    }
  }, [useDummy, hasMore, allItems.length, page, items.length, paginateAndAppend]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useDummy]);

  // Intersection observer for active card (feed mode only)
  useEffect(() => {
    if (viewMode !== 'feed') return;
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
  }, [items.length, viewMode]);

  // Infinite scroll sentinel (both views)
  const sentinelRef = useCallback(
    (node) => {
      if (!node) return;
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && !loading && hasMore && allItems.length > 0) {
            paginateAndAppend(allItems, page);
          }
        },
        { rootMargin: '800px' }
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [paginateAndAppend, loading, hasMore, allItems, page]
  );

  const renderCardHeader = (l) => (
    <div style={{ position: 'absolute', top: 12, left: 12, right: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <TagList tags={l.tags || []} />
      <div style={{ background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: 8, fontSize: 12, border: '1px solid var(--border)' }}>
        {Math.round((l.durationSeconds || 60) / 60)}m
      </div>
    </div>
  );

  const headerBar = (
    <div style={{ position: 'sticky', top: 56, zIndex: 10, background: 'linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.6))', borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px' }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>{sectionHeadings.welcome}</h1>
        <div role="group" aria-label="View toggle" style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn"
            aria-pressed={viewMode === 'feed'}
            onClick={() => setViewMode('feed')}
          >
            View: Feed
          </button>
          <button
            className="btn"
            aria-pressed={viewMode === 'grid'}
            onClick={() => setViewMode('grid')}
          >
            View: Grid
          </button>
        </div>
      </div>
      <div style={{ padding: '0 12px 8px', color: 'var(--muted)', fontSize: 14 }}>
        {sectionHeadings.today}
      </div>
    </div>
  );

  if (viewMode === 'grid') {
    return (
      <div style={{ minHeight: 'calc(100vh - 56px)', overflowY: 'auto' }} ref={containerRef}>
        {headerBar}
        <section aria-label={sectionHeadings.popular} style={{ padding: 12 }}>
          <h2 style={{ marginTop: 0 }}>{sectionHeadings.popular}</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 12,
            }}
          >
            {items.map((l) => (
              <div key={l.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', aspectRatio: '16/9', background: '#000' }}>
                  {/* Poster by video element muted without autoplay */}
                  <video src={l.videoUrl} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}>
                    <TagList tags={l.tags || []} />
                  </div>
                </div>
                <div style={{ padding: 10, display: 'grid', gap: 6 }}>
                  <div style={{ fontWeight: 800 }}>{l.title}</div>
                  <div style={{ color: 'var(--muted)', fontSize: 14, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{l.summary}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{Math.round((l.durationSeconds || 60) / 60)} min</div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link to={`/lesson/${l.id}`} className="btn">{ctas.viewDetails}</Link>
                      <Link to={`/quiz/${l.id}`} className="btn primary">{ctas.takeQuiz}</Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {loading && (
            <div style={{ padding: 16 }}>
              <Skeleton height={160} />
              <div style={{ height: 8 }} />
              <Skeleton height={16} width="80%" />
            </div>
          )}
          {hasMore && <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />}
          {!loading && items.length === 0 && <div style={{ color: 'var(--muted)', padding: 16 }}>{emptyStates.feed}</div>}
        </section>

        <section aria-label={sectionHeadings.recommended} style={{ padding: '0 12px 24px' }}>
          <h2>{sectionHeadings.recommended}</h2>
          {!items.length && <div style={{ color: 'var(--muted)' }}>{emptyStates.recommended}</div>}
        </section>
      </div>
    );
  }

  // Feed mode
  return (
    <div className="feed" ref={containerRef}>
      {headerBar}
      {items.map((l, i) => (
        <div key={l.id} style={{ position: 'relative' }}>
          {renderCardHeader(l)}
          <LessonCard
            lesson={l}
            active={i === activeIndex}
            onQuiz={() => {}}
            onWatched={() => {}}
          />
          <div style={{ position: 'absolute', bottom: 72, right: 16, display: 'flex', gap: 8 }}>
            <Link to={`/lesson/${l.id}`} className="btn" aria-label="Open lesson detail">{ctas.viewDetails}</Link>
            <Link to={`/quiz/${l.id}`} className="btn primary" aria-label="Start quiz">{ctas.takeQuiz}</Link>
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
      {!loading && items.length === 0 && <div style={{ color: 'var(--muted)', padding: 16 }}>{emptyStates.feed}</div>}
      {!hasMore && items.length > 0 && (
        <div style={{ textAlign: 'center', padding: 16, color: 'var(--muted)' }}>You reached the end</div>
      )}
    </div>
  );
}
