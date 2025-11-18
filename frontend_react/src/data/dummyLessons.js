 // PUBLIC_INTERFACE
 /**
  * Dummy lesson content for local fallback and demos.
  * Controlled via REACT_APP_USE_DUMMY='true' or used when API returns empty.
  *
  * Fields per lesson:
  * - id, title, description, cta, tags, duration (minutes)
  * - optional: videoUrl, thumbnail (auto-resolved by title if missing)
  * - summary: short summary derived from description
  * - takeaways: up to three bullet points derived from description
  */
 export const sectionHeadings = {
   welcome: 'Welcome back',
   today: 'Your Micro Skills for Today',
   continue: 'Continue Learning',
   popular: 'Popular Micro Lessons',
   recommended: 'Recommended for You',
   productivity: 'Productivity Essentials',
   softSkills: 'Soft Skills Boosters',
   saved: 'Your Saved Lessons',
 };
 
 export const emptyStates = {
   feed: 'No lessons yet. Explore new micro-skills soon!',
   profile: 'No profile activity yet. Start with your first micro lesson.',
   saved: 'Nothing saved yet. Tap the bookmark to save lessons for later.',
   continue: 'No in-progress lessons. Pick any lesson to begin.',
   popular: 'Popular lessons will appear here.',
   recommended: 'We\'ll recommend lessons based on your activity.',
 };
 
 export const ctas = {
   takeQuiz: 'Take Quiz',
   startLesson: 'Start Lesson',
   beginQuiz: 'Begin Quiz',
   viewDetails: 'View Details',
 };
 
 function bulletsFrom(text) {
   if (!text) return [];
   const parts = text
     .split(/[.?!]/)
     .map((s) => s.trim())
     .filter(Boolean)
     .slice(0, 3);
   if (parts.length === 0) {
     return ['Understand the concept', 'Apply it quickly', 'Avoid common pitfalls'];
   }
   return parts;
 }
 
 function summaryFrom(text) {
   if (!text) return 'A quick, practical micro-lesson to boost your skills.';
   const s = text.trim();
   return s.length > 160 ? s.slice(0, 157) + '...' : s;
 }
 
 // Seven lessons mapped to topic-relevant canonical slugs per requirements
 const baseLessons = [
   {
     id: 'focus-60',
     title: '60-Second Focus Reset',
     description:
       'Use a short breathing pattern and micro-break to reset attention. Try the 4-4-6 reset and a quick stretch to reduce cognitive load.',
     cta: 'Start Lesson',
     tags: ['productivity', 'focus', 'wellbeing'],
     duration: 1,
     // -> 4-4-6-reset.mp4
   },
   {
     id: 'inbox-zero',
     title: 'Inbox Zero in Minutes',
     description:
       'Triage emails quickly with three labels: Act, Defer, Archive. Batch respond twice daily to reduce context switching.',
     cta: 'Start Lesson',
     tags: ['productivity', 'email', 'timeboxing'],
     duration: 2,
     // -> quick-inbox-zero.mp4
   },
   {
     id: 'focus-sprints',
     title: 'Focus Sprints',
     description:
       'Use short, intense focus intervals with brief, restorative breaks to maximize deep work and avoid burnout.',
     cta: 'Start Lesson',
     tags: ['productivity', 'deep work'],
     duration: 2,
     // -> focus-sprints.mp4
   },
   {
     id: 'gma',
     title: 'G-M-A Formula',
     description:
       'A simple planning loop: Goals, Methods, Actions. Translate intentions into concrete steps to remove ambiguity.',
     cta: 'Start Lesson',
     tags: ['planning', 'productivity'],
     duration: 2,
     // -> g-m-a-formula.mp4
   },
   {
     id: 'five-map',
     title: 'Five-Minute Map',
     description:
       'Sketch a quick visual plan: outcomes, constraints, first next steps. Five minutes to clarify direction before starting.',
     cta: 'Start Lesson',
     tags: ['planning', 'strategy'],
     duration: 1,
     // -> five-minute-map.mp4
   },
   {
     id: 'memory-ladder',
     title: 'Memory Ladder',
     description:
       'Chain new information to memorable anchors. Use chunking and spaced recall to retain key ideas.',
     cta: 'Start Lesson',
     tags: ['learning', 'memory'],
     duration: 2,
     // -> memory-ladder.mp4
   },
   {
     id: 'micro-leadership',
     title: 'Micro Leadership Tips',
     description:
       'Practice small leadership behaviors daily: clear asks, celebrate wins, unblock decisively, and model curiosity.',
     cta: 'Start Lesson',
     tags: ['leadership', 'communication'],
     duration: 2,
     // -> micro-leadership-tips.mp4
   },
 ];
 
 // Normalize with derived fields expected by UI. Video/thumbnail resolved later by mapping if absent.
 export const dummyLessons = baseLessons.map((l) => {
   const summary = summaryFrom(l.description);
   const takeaways = bulletsFrom(l.description);
   const durationSeconds = Math.max(30, (l.duration || 1) * 60);
   const videoUrl = l.videoUrl || null;
   const thumbnail = l.thumbnail || null;
   return { ...l, summary, takeaways, durationSeconds, videoUrl, thumbnail };
 });
 
 // PUBLIC_INTERFACE
 export function getDummyLessons() {
   /** Returns the normalized dummy lessons array. */
   return dummyLessons;
 }
 
 // PUBLIC_INTERFACE
 export function useDummyContentFlag() {
   /**
    * Checks REACT_APP_USE_DUMMY env flag.
    * Returns true if REACT_APP_USE_DUMMY === 'true'
    */
   return (process.env.REACT_APP_USE_DUMMY || '').toString().toLowerCase() === 'true';
 }
