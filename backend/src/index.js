import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { config as loadEnv } from 'dotenv';
import { body, param, query, validationResult } from 'express-validator';
import { nanoid } from 'nanoid';

// Load .env
loadEnv();

// Configuration from env
const PORT = parseInt(process.env.PORT || '3001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN
  || process.env.REACT_APP_FRONTEND_URL
  || 'http://localhost:3000';
const TRUST_PROXY = String(process.env.TRUST_PROXY || process.env.REACT_APP_TRUST_PROXY || 'false').toLowerCase() === 'true';
const LOG_LEVEL = (process.env.LOG_LEVEL || process.env.REACT_APP_LOG_LEVEL || 'info').toLowerCase();

// Initialize app
const app = express();
if (TRUST_PROXY) app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // enable serving /assets if added later
}));

// Basic CORS
app.use(cors({
  origin: function (origin, callback) {
    // allow non-browser tools (no origin) and the configured frontend origin
    if (!origin) return callback(null, true);
    if (origin === FRONTEND_ORIGIN) return callback(null, true);
    return callback(new Error('CORS not allowed for this origin'), false);
  },
  credentials: true,
}));

// Logging
if (NODE_ENV !== 'test') {
  app.use(morgan(LOG_LEVEL === 'debug' ? 'dev' : 'tiny'));
}

// Parse JSON
app.use(express.json({ limit: '1mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// In-memory stores (skills, enrollments, progress)
// This is a simple in-memory layer; replace with database later.
const skills = seedSkills();
const enrollments = new Map(); // userId -> Set(skillId)
const progress = new Map(); // userId -> Map(skillId -> { items: [], updatedAt })

// PUBLIC_INTERFACE
// Health route
app.get('/', (req, res) => {
  /**
   * Health check
   * Returns basic environment info and ok flag.
   */
  res.json({
    ok: true,
    environment: NODE_ENV,
    message: 'MicroSkill API',
    version: '0.1.0',
  });
});

// PUBLIC_INTERFACE
// GET /api/skills - list with filters
app.get(
  '/api/skills',
  [
    query('search').optional().isString().trim().isLength({ max: 120 }),
    query('level').optional().isString().isIn(['beginner', 'intermediate', 'advanced']),
    query('tag').optional().isString().trim().isLength({ min: 1, max: 32 }),
  ],
  validateRequest,
  (req, res, next) => {
    try {
      const { search = '', level, tag } = req.query;
      const q = (search || '').toString().toLowerCase();
      let list = [...skills.values()];
      if (q) {
        list = list.filter((s) =>
          s.title.toLowerCase().includes(q) ||
          s.brief.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      if (level) {
        list = list.filter((s) => s.level === level);
      }
      if (tag) {
        const tgt = tag.toLowerCase();
        list = list.filter((s) => s.tags.some((t) => t.toLowerCase() === tgt));
      }
      // return light weight items
      const out = list.map(({ id, title, brief, duration, level, tags }) => ({
        id, title, brief, duration, level, tags
      }));
      res.json(out);
    } catch (e) {
      next(e);
    }
  }
);

// PUBLIC_INTERFACE
// GET /api/skills/:id - skill detail
app.get(
  '/api/skills/:id',
  [param('id').isString().trim().isLength({ min: 1, max: 64 })],
  validateRequest,
  (req, res, next) => {
    try {
      const { id } = req.params;
      const skill = skills.get(id);
      if (!skill) return res.status(404).json(errorPayload('NOT_FOUND', 'Skill not found'));
      res.json(skill);
    } catch (e) {
      next(e);
    }
  }
);

// PUBLIC_INTERFACE
// POST /api/skills/:id/enroll - enroll current user
app.post(
  '/api/skills/:id/enroll',
  [param('id').isString().trim().isLength({ min: 1, max: 64 })],
  validateRequest,
  (req, res, next) => {
    try {
      const { id } = req.params;
      const skill = skills.get(id);
      if (!skill) return res.status(404).json(errorPayload('NOT_FOUND', 'Skill not found'));
      const userId = getUserId(req);
      let set = enrollments.get(userId);
      if (!set) {
        set = new Set();
        enrollments.set(userId, set);
      }
      set.add(id);
      res.json({ ok: true, enrolled: true, userId, skillId: id });
    } catch (e) {
      next(e);
    }
  }
);

// PUBLIC_INTERFACE
// GET /api/progress/:skillId - get progress for skill
app.get(
  '/api/progress/:skillId',
  [param('skillId').isString().trim().isLength({ min: 1, max: 64 })],
  validateRequest,
  (req, res, next) => {
    try {
      const { skillId } = req.params;
      const userId = getUserId(req);
      const skill = skills.get(skillId);
      if (!skill) return res.status(404).json(errorPayload('NOT_FOUND', 'Skill not found'));
      const store = getProgressStore(userId, skillId);
      res.json({
        userId,
        skillId,
        items: store.items,
        stats: calculateStats(skill, store.items),
        updatedAt: store.updatedAt,
      });
    } catch (e) {
      next(e);
    }
  }
);

// PUBLIC_INTERFACE
// POST /api/progress/:skillId - update progress
app.post(
  '/api/progress/:skillId',
  [
    param('skillId').isString().trim().isLength({ min: 1, max: 64 }),
    body('lessonId').isString().trim().isLength({ min: 1, max: 64 }),
    body('completed').optional().isBoolean(),
    body('watched').optional().isBoolean(),
    body('score').optional().isNumeric().custom((v) => v >= 0 && v <= 100),
  ],
  validateRequest,
  (req, res, next) => {
    try {
      const { skillId } = req.params;
      const { lessonId, completed = false, watched = false, score } = req.body;
      const userId = getUserId(req);
      const skill = skills.get(skillId);
      if (!skill) return res.status(404).json(errorPayload('NOT_FOUND', 'Skill not found'));

      const store = getProgressStore(userId, skillId);
      const idx = store.items.findIndex((x) => x.lessonId === lessonId);
      if (idx === -1) {
        store.items.push({
          lessonId,
          watched: !!watched,
          completed: !!completed,
          score: typeof score === 'number' ? Number(score) : undefined,
          updatedAt: new Date().toISOString(),
        });
      } else {
        const prev = store.items[idx];
        store.items[idx] = {
          ...prev,
          watched: watched || prev.watched,
          completed: completed || prev.completed,
          score: typeof score === 'number' ? Number(score) : prev.score,
          updatedAt: new Date().toISOString(),
        };
      }
      store.updatedAt = new Date().toISOString();
      res.json({
        ok: true,
        userId,
        skillId,
        items: store.items,
        stats: calculateStats(skill, store.items),
        updatedAt: store.updatedAt,
      });
    } catch (e) {
      next(e);
    }
  }
);

// Serve static assets if present (optional). This allows /assets for media if generated.
app.use('/assets', express.static('public/assets', {
  maxAge: '1h',
  etag: true,
}));

// Centralized error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (NODE_ENV !== 'test') {
    // Basic internal log (avoid sensitive data)
    // eslint-disable-next-line no-console
    console.error('[error]', { message: err.message, status, path: req.path });
  }
  res.status(status).json(errorPayload('INTERNAL_ERROR', err.message || 'Unexpected error'));
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`MicroSkill API listening on http://localhost:${PORT}`);
});

// Helpers

function getUserId(req) {
  // Mock user: header preferred, else fixed 'anon'
  const h = (req.headers['x-user-id'] || '').toString().trim();
  if (h) return h;
  return 'anon';
}

function getProgressStore(userId, skillId) {
  let byUser = progress.get(userId);
  if (!byUser) {
    byUser = new Map();
    progress.set(userId, byUser);
  }
  let store = byUser.get(skillId);
  if (!store) {
    store = { items: [], updatedAt: new Date().toISOString() };
    byUser.set(skillId, store);
  }
  return store;
}

function calculateStats(skill, items) {
  const lessonIds = (skill.lessons || []).map((l) => l.id);
  const totalLessons = lessonIds.length;
  const byId = new Map(items.map((i) => [i.lessonId, i]));
  let watched = 0;
  let completed = 0;
  lessonIds.forEach((id) => {
    const rec = byId.get(id);
    if (rec?.watched) watched += 1;
    if (rec?.completed) completed += 1;
  });
  const overall = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
  return { watched, completed, overall, totalLessons, points: completed * 10, streak: 0 };
}

function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json(errorPayload('VALIDATION_ERROR', 'Invalid input', { errors: errors.array().map(sanitizeValidationError) }));
  }
  return next();
}

function sanitizeValidationError(e) {
  const out = {
    type: e.type,
    value: scrub(e.value),
    msg: e.msg,
    path: e.path,
    location: e.location,
  };
  return out;
}

function scrub(v) {
  if (typeof v !== 'string') return v;
  // limit length to avoid logs with large PII
  return v.length > 64 ? v.slice(0, 61) + '...' : v;
}

function errorPayload(code, message, details) {
  return {
    error: {
      code,
      message,
      details: details || undefined,
      timestamp: new Date().toISOString(),
    },
  };
}

function seedSkills() {
  // Provide a few micro skills with lessons
  const m = new Map();
  const list = [
    {
      id: 'inbox-zero',
      title: 'Inbox Zero in Minutes',
      brief: 'Triage and clear your inbox fast.',
      duration: 12,
      level: 'beginner',
      tags: ['productivity', 'email'],
      description: 'Use three labels and batching to cut email time.',
      lessons: [
        { id: 'inbox-zero-1', title: 'Triage Fundamentals', duration: 4 },
        { id: 'inbox-zero-2', title: 'Batching Responses', duration: 4 },
        { id: 'inbox-zero-3', title: 'Automation Tips', duration: 4 }
      ]
    },
    {
      id: 'focus-sprints',
      title: 'Focus Sprints',
      brief: 'Deep work in short bursts.',
      duration: 10,
      level: 'beginner',
      tags: ['focus', 'timeboxing'],
      description: 'Sprint, rest, repeat—maximize attention and energy.',
      lessons: [
        { id: 'focus-sprints-1', title: 'Sprint Setup', duration: 3 },
        { id: 'focus-sprints-2', title: 'Breaks That Restore', duration: 3 },
        { id: 'focus-sprints-3', title: 'Avoiding Context Switches', duration: 4 }
      ]
    },
    {
      id: 'gma',
      title: 'G-M-A Formula',
      brief: 'Goals → Methods → Actions.',
      duration: 9,
      level: 'intermediate',
      tags: ['planning'],
      description: 'Convert intentions into concrete steps with G-M-A.',
      lessons: [
        { id: 'gma-1', title: 'Goals that Guide', duration: 3 },
        { id: 'gma-2', title: 'Choosing Methods', duration: 3 },
        { id: 'gma-3', title: 'First Actions', duration: 3 }
      ]
    }
  ];
  list.forEach((s) => m.set(s.id, s));
  return m;
}
