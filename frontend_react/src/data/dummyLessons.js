 // PUBLIC_INTERFACE
 /**
  * Dummy lesson content for local fallback and demos.
  * Controlled via REACT_APP_USE_DUMMY='true' or used when API returns empty.
  *
  * Fields per lesson:
  * - id, title, description, cta, tags, duration (minutes), media (optional)
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

 // Seven dummy lessons
 const baseLessons = [
   {
     id: 'focus-60',
     title: '60-Second Focus Reset',
     description:
       'Use a short breathing pattern and micro-break to reset attention. Try 4-4 breathing and a quick stretch to reduce cognitive load.',
     cta: 'Start Lesson',
     tags: ['productivity', 'focus', 'wellbeing'],
     duration: 1,
     media: { videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
   },
   {
     id: 'inbox-zero',
     title: 'Inbox Zero in Minutes',
     description:
       'Triage emails quickly with three labels: Act, Defer, Archive. Batch respond twice daily to reduce context switching.',
     cta: 'Start Lesson',
     tags: ['productivity', 'email', 'timeboxing'],
     duration: 2,
     media: { videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
   },
   {
     id: 'clear-ask',
     title: 'Make a Clear Ask',
     description:
       'Use the CTA formula: Context, Task, Ask. Be specific with owners and deadlines to reduce back-and-forth.',
     cta: 'Start Lesson',
     tags: ['communication', 'soft skills', 'leadership'],
     duration: 1,
     media: { videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4' },
   },
   {
     id: 'two-minute-rule',
     title: 'The Two-Minute Rule',
     description:
       'If a task takes less than two minutes, do it now. Otherwise, schedule it. Keeps momentum while avoiding overload.',
     cta: 'Start Lesson',
     tags: ['productivity', 'habits'],
     duration: 1,
     media: { videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4' },
   },
   {
     id: 'feedback-fast',
     title: 'Feedback in 30 Seconds',
     description:
       'Use SBI: Situation, Behavior, Impact. Keep it timely, specific, and focused on actions to improve outcomes.',
     cta: 'Start Lesson',
     tags: ['soft skills', 'feedback'],
     duration: 1,
     media: { videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4' },
   },
   {
     id: 'atomic-habit',
     title: 'Make It Obvious',
     description:
       'Stack habits: After I [current habit], I will [new micro action]. Reduce friction and make it visible.',
     cta: 'Start Lesson',
     tags: ['habits', 'behavior change'],
     duration: 1,
     media: { videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
   },
   {
     id: 'async-standup',
     title: 'Async Standups That Work',
     description:
       'Share yesterday, today, blockers in a written channel. Keep updates lightweight and actionable for distributed teams.',
     cta: 'Start Lesson',
     tags: ['remote work', 'teamwork', 'communication'],
     duration: 2,
     media: { videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
   },
 ];

 // Normalize with derived fields that our UI expects (summary, takeaways, videoUrl, durationSeconds)
 export const dummyLessons = baseLessons.map((l) => {
   const summary = summaryFrom(l.description);
   const takeaways = bulletsFrom(l.description);
   const durationSeconds = Math.max(30, (l.duration || 1) * 60);
   const videoUrl = l.media?.videoUrl || 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
   const thumbnail = undefined;
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
