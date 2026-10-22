import { Request, Response } from 'express';
import { query } from '../src/db/mysql.js';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  publishedDate: string;
  author: { name: string; role: string; avatar: string };
  image: string;
  content: string;
}

// Helpers for relative time formatting
function formatTimeAgo(timestamp: any, defaultTimeAgo?: string): string {
  if (defaultTimeAgo && defaultTimeAgo !== 'Just now') {
    return defaultTimeAgo;
  }
  if (!timestamp) return 'Recently';
  const num = Number(timestamp);
  if (isNaN(num) || num <= 0) return 'Recently';
  const diffMs = Date.now() - num;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

// Default production datasets for auxiliary sections if tables don't exist in live MySQL DB
const DEFAULT_FAQS = [
  { q: 'What makes Beyounge different from other fitness apps?', a: 'Beyounge combines an adaptive AI Coach, real-time exercise volume auto-regulation, photo macro tracking, and personal record tracking into a seamless, dark-mode-first Android experience with complete offline support.' },
  { q: 'Is Beyounge free to download on Google Play?', a: 'Yes! Beyounge is free to download on Android with generous free features including AI workout generation, basic food logging, exercise library, and habit tracking. Beyounge Pro unlocks unlimited AI coach recommendations and advanced analytics.' },
  { q: 'Does Beyounge work offline in the gym?', a: 'Absolutely. Beyounge is built with an offline-first local database. You can log workouts, view exercise videos, and record PRs without internet connection. Your data syncs automatically when reconnected.' },
  { q: 'Can I sync my fitness wearables with Beyounge?', a: 'Yes. Beyounge connects seamlessly with Android Health Connect, Google Fit, Garmin, Fitbit, Galaxy Watch, and Whoop to track heart rate, daily steps, calories burned, and sleep quality.' },
  { q: 'How does the AI Coach create personalized workouts?', a: 'Our AI analyzes your experience level, available equipment (gym, dumbbells, bodyweight), time availability, injury constraints, and daily recovery scores to generate optimized sets, reps, and target weights.' },
  { q: 'How can I request my personal data deletion?', a: 'You can request complete data deletion directly inside the app settings or via our dedicated online Data Deletion Page. All requests are processed within 14 business days in accordance with GDPR regulations.' }
];

const DEFAULT_BLOGS = [
  {
    id: 'blog-1',
    slug: 'how-ai-is-revolutionizing-progressive-overload',
    title: 'How AI is Revolutionizing Progressive Overload & Hypertrophy',
    excerpt: 'Discover how computer vision and machine learning adjust set volume, rest intervals, and load progression based on recovery metrics.',
    category: 'AI Technology',
    readTime: '6 min read',
    publishedDate: 'July 24, 2026',
    author: { name: 'Dr. Sarah Lin', role: 'Head of Exercise Physiology', avatar: 'https://i.pravatar.cc/150?u=lin' },
    image: 'https://images.unsplash.com/photo-1526506114868-874b281b37f4?auto=format&fit=crop&w=800&q=80',
    content: '<h2>The End of Static Workout Programs</h2><p>For decades, traditional strength training relied on fixed spreadsheets and rigid percentage-based periodization. While effective for basic progression, static programs fail to account for daily biological variables such as sleep quality, autonomic stress (HRV), micro-nutrition, and joint fatigue.</p><h2>Real-Time Auto-Regulation</h2><p>Beyounge\'s proprietary AI engine uses continuous biometric feedback and historical set performance to calculate your precise <em>Rate of Perceived Exertion (RPE)</em> and velocity loss. If your velocity on Bench Press set 1 indicates high CNS readiness, Beyounge dynamically recommends a +2.5kg increase for set 2.</p><h2>Key Advantages of AI-Driven Volume Management</h2><ul><li><strong>Injury Reduction:</strong> Automatically deloads when fatigue indicators spike above safe thresholds.</li><li><strong>Optimal Hypertrophy:</strong> Keeps every working set within the 1 to 3 reps in reserve (RIR) target zone.</li><li><strong>Zero Guesswork:</strong> Calculates exact rest intervals customized to muscle group metabolic recovery rate.</li></ul><p>By transforming raw workout logs into actionable neurological signals, Beyounge eliminates plateaus and maximizes lean muscle adaptation per minute spent in the gym.</p>'
  },
  {
    id: 'blog-2',
    slug: 'mastering-macro-tracking-with-computer-vision',
    title: 'Mastering Macro Tracking Without Manual Logging',
    excerpt: 'Say goodbye to searching databases for ingredients. How Beyounge AI visual food recognition instantly scans your plate.',
    category: 'Nutrition',
    readTime: '5 min read',
    publishedDate: 'July 18, 2026',
    author: { name: 'Marcus Vance', role: 'Sports Nutritionist & CISSN', avatar: 'https://i.pravatar.cc/150?u=vance' },
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80',
    content: '<h2>The Friction of Traditional Food Logging</h2><p>Studies show that over 70% of fitness app users abandon nutrition tracking within two weeks due to the cognitive burden of searching ingredient databases and weighing food portions manually.</p><h2>Visual Meal Analysis in Under 2 Seconds</h2><p>Using Beyounge\'s instant camera photo recognition, users take a quick snapshot of their meal. Our multi-stage neural network identifies individual protein, carbohydrate, and fat components, estimates volume density, and calculates caloric composition with up to 92% accuracy.</p><p>Whether dining out or prepping meals at home, Beyounge keeps your nutritional balance in perfect harmony with your daily caloric expenditure.</p>'
  },
  {
    id: 'blog-3',
    slug: 'science-of-recovery-hrv-and-sleep-optimization',
    title: 'The Science of Recovery: HRV, Sleep, and Readiness Scores',
    excerpt: 'Why training hard is only 30% of the equation, and how smart recovery tracking accelerates physical transformation.',
    category: 'Wellness',
    readTime: '7 min read',
    publishedDate: 'July 10, 2026',
    author: { name: 'Elena Rostova', role: 'Biomedical Researcher', avatar: 'https://i.pravatar.cc/150?u=elena' },
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
    content: '<h2>Muscle Is Built During Sleep</h2><p>During deep non-REM sleep, human growth hormone (HGH) surges and protein synthesis reaches peak velocity. Failing to monitor recovery readiness often leads to overreaching and chronic cortisol elevation.</p><h2>How Beyounge Computes Your Readiness Score</h2><p>By integrating with Android Health Connect, Google Fit, and wearable sensors, Beyounge synthesizes Heart Rate Variability (HRV), resting pulse, sleep phase distribution, and muscle soreness logs to generate a daily 0-100 Readiness Score.</p><p>On high readiness days, Beyounge prompts you to tackle heavy compound movements. On low readiness days, the AI seamlessly transforms your workout into active mobility and active recovery cardio.</p>'
  }
];

const DEFAULT_CHANGELOG = [
  { version: 'v2.4.0', date: 'July 2026', title: 'Health Connect Sync & Custom SuperSet Engine', highlights: ['Full integration with Android Health Connect for 2-way sleep & biometric sync', 'Interactive SuperSet Builder with rest time auto-calculator', 'AI Coach voice guidance during active workout logging', 'Enhanced Offline Mode with automatic background database reconciliation'] },
  { version: 'v2.2.0', date: 'June 2026', title: 'AI Photo Macro Recognition & Social Feed 2.0', highlights: ['Instant camera photo food scanner with instant macro breakdown', 'Community Challenges & real-time friends leaderboard', '100+ new high-definition exercise demonstration videos'] },
  { version: 'v2.0.0', date: 'May 2026', title: 'Beyounge AI Engine 2.0 Engine Upgrade', highlights: ['Adaptive auto-regulation protocol for strength PR predictions', 'New Dark Glass UI overhaul for maximum night-use comfort', 'Custom macro goal builder for cutting, bulking, and body recomposition'] }
];

const DEFAULT_CAREERS = [
  { id: 'job-1', title: 'Senior Mobile Engineer (Android / Kotlin)', location: 'Remote / San Francisco', type: 'Full-time', department: 'Engineering', description: 'Lead the architecture and development of the Beyounge Android application, optimizing offline synchronization and performance.' },
  { id: 'job-2', title: 'Staff AI/ML Engineer (Computer Vision)', location: 'Remote / New York', type: 'Full-time', department: 'AI & Data Science', description: 'Build real-time form detection and computer vision nutrition models serving millions of daily inferences.' },
  { id: 'job-3', title: 'Head of Growth & Performance Marketing', location: 'Remote / London', type: 'Full-time', department: 'Marketing', description: 'Drive user acquisition across Google Play, organic SEO, influencer partnerships, and viral community referral loops.' }
];

// Query real feed posts from existing 'posts' table filtered by postType column
async function getDbPosts(limit: number = 5) {
  try {
    const rows: any = await query(`
      SELECT p.id, p.content, p.imageUrl, p.image, p.postType, p.timestamp, p.time_ago,
             COALESCE(p.likes, 0) AS likes, COALESCE(p.comments, 0) AS comments,
             COALESCE(u.displayName, u.full_name, u.username, 'Beyounge Member') AS name,
             COALESCE(u.username, u.handle, 'beyounge') AS handle,
             COALESCE(u.photoUrl, u.avatar, 'https://i.pravatar.cc/150') AS avatar
      FROM posts p
      LEFT JOIN users u ON p.userId = u.uid
      WHERE p.postType IS NULL OR p.postType = 'post' OR p.postType != 'reel'
      ORDER BY p.timestamp DESC, p.id DESC
      LIMIT ?
    `, [limit]);

    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map((r: any) => {
        const handleStr = r.handle ? (r.handle.startsWith('@') ? r.handle : `@${r.handle}`) : '@beyounge';
        return {
          id: String(r.id),
          user: {
            name: r.name || 'Beyounge Member',
            handle: handleStr,
            avatar: r.avatar || 'https://i.pravatar.cc/150'
          },
          time: formatTimeAgo(r.timestamp, r.time_ago),
          content: r.content || 'Sharing fitness progress with the Beyounge community!',
          image: r.imageUrl || r.image || null,
          likes: Number(r.likes || 0),
          comments: Number(r.comments || 0)
        };
      });
    }
  } catch (err: any) {
    console.log('Notice querying posts from MySQL:', err?.message || err);
  }
  return [];
}

// Query real reels from existing 'posts' table using postType column
async function getDbReels() {
  try {
    const rows: any = await query(`
      SELECT p.id, p.content, p.imageUrl, p.videoUrl, p.postType, p.timestamp,
             COALESCE(u.username, u.handle, 'beyounge') AS user,
             COALESCE(u.photoUrl, u.avatar, 'https://i.pravatar.cc/150') AS avatar
      FROM posts p
      LEFT JOIN users u ON p.userId = u.uid
      WHERE p.postType = 'reel' OR p.postType = 'video' OR (p.videoUrl IS NOT NULL AND p.videoUrl != '')
      ORDER BY p.timestamp DESC, p.id DESC
    `);

    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map((r: any) => ({
        id: String(r.id),
        user: r.user ? (r.user.startsWith('@') ? r.user : `@${r.user}`) : '@beyounge',
        avatar: r.avatar || 'https://i.pravatar.cc/150',
        video: r.videoUrl || r.imageUrl || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80',
        views: '12K'
      }));
    }
  } catch (err: any) {
    console.log('Notice querying reels from MySQL:', err?.message || err);
  }

  // Fallback reels dataset if no post items with postType='reel' exist
  return [
    {
      id: 'reel-1',
      user: '@sarah_fit',
      avatar: 'https://i.pravatar.cc/150?u=sarah',
      video: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80',
      views: '12.4K'
    },
    {
      id: 'reel-2',
      user: '@mike_lifts',
      avatar: 'https://i.pravatar.cc/150?u=mike',
      video: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80',
      views: '8.5K'
    },
    {
      id: 'reel-3',
      user: '@emma_yoga',
      avatar: 'https://i.pravatar.cc/150?u=emma',
      video: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80',
      views: '24.1K'
    }
  ];
}

async function getDbBlogPosts(limit?: number) {
  try {
    const sql = limit 
      ? `SELECT * FROM blog_posts ORDER BY id ASC LIMIT ${limit}`
      : `SELECT * FROM blog_posts ORDER BY id ASC`;
    const rows: any = await query(sql);

    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map((r: any) => ({
        id: String(r.id),
        slug: r.slug,
        title: r.title,
        excerpt: r.excerpt,
        category: r.category,
        readTime: r.read_time,
        publishedDate: r.published_date,
        author: { name: r.author_name, role: r.author_role, avatar: r.author_avatar },
        image: r.image,
        content: r.content
      }));
    }
  } catch {
    // Return default blog array if blog_posts table does not exist
  }
  return limit ? DEFAULT_BLOGS.slice(0, limit) : DEFAULT_BLOGS;
}

async function getDbBlogPostBySlug(slug: string) {
  try {
    const rows: any = await query(`SELECT * FROM blog_posts WHERE slug = ? LIMIT 1`, [slug]);
    if (Array.isArray(rows) && rows.length > 0) {
      const r = rows[0];
      return {
        id: String(r.id),
        slug: r.slug,
        title: r.title,
        excerpt: r.excerpt,
        category: r.category,
        readTime: r.read_time,
        publishedDate: r.published_date,
        author: { name: r.author_name, role: r.author_role, avatar: r.author_avatar },
        image: r.image,
        content: r.content
      };
    }
  } catch {
    // Fallback to searching local dataset
  }
  return DEFAULT_BLOGS.find(b => b.slug === slug) || null;
}

async function getDbFaqs() {
  try {
    const rows: any = await query(`SELECT question AS q, answer AS a FROM faqs ORDER BY display_order ASC, id ASC`);
    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map((r: any) => ({ q: r.q, a: r.a }));
    }
  } catch {
    // Return default FAQs array if faqs table does not exist
  }
  return DEFAULT_FAQS;
}

async function getDbChangelog() {
  try {
    const rows: any = await query(`SELECT version, date, title, highlights_json FROM changelog_items ORDER BY id ASC`);
    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map((r: any) => {
        let highlights = [];
        try {
          highlights = typeof r.highlights_json === 'string' ? JSON.parse(r.highlights_json) : r.highlights_json;
        } catch {
          highlights = [];
        }
        return {
          version: r.version,
          date: r.date,
          title: r.title,
          highlights
        };
      });
    }
  } catch {
    // Return default changelog if table does not exist
  }
  return DEFAULT_CHANGELOG;
}

async function getDbCareers() {
  try {
    const rows: any = await query(`SELECT id, title, location, type, department, description FROM career_openings ORDER BY id ASC`);
    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map((r: any) => ({
        id: String(r.id),
        title: r.title,
        location: r.location,
        type: r.type,
        department: r.department,
        description: r.description
      }));
    }
  } catch {
    // Return default career openings if table does not exist
  }
  return DEFAULT_CAREERS;
}

// Controller methods fetching real MySQL data
export const pageController = {
  getFeed: async (req: Request, res: Response) => {
    const posts = await getDbPosts(5);
    const reels = await getDbReels();
    res.render('pages/feed', {
      title: 'Community Feed | Beyounge',
      description: 'See what the Beyounge community is up to. Discover real workouts, recipes, and motivation.',
      canonical: '/feed',
      pageName: 'feed',
      posts,
      reels
    });
  },

  getHome: async (req: Request, res: Response) => {
    const posts = await getDbPosts(5);
    const reels = await getDbReels();
    const faqs = await getDbFaqs();
    const recentBlogs = await getDbBlogPosts(3);
    res.render('pages/index', {
      title: 'Beyounge - AI Fitness, Workouts & Wellness Platform',
      description: 'Beyounge is an AI-powered fitness app with personalized workouts, macro nutrition tracking, personal record analytics, and community challenges.',
      canonical: '/',
      pageName: 'home',
      faqs,
      recentBlogs,
      posts,
      reels
    });
  },

  getFeatures: (req: Request, res: Response) => {
    res.render('pages/features', {
      title: 'Features | Beyounge AI Fitness Platform',
      description: 'Explore Beyounge features: AI Workout Builder, Photo Macro Tracker, 1000+ Exercise Library, Recovery Scoring, PR Analytics, and Community Leaderboards.',
      canonical: '/features',
      pageName: 'features'
    });
  },

  getBenefits: (req: Request, res: Response) => {
    res.render('pages/benefits', {
      title: 'Benefits for All Fitness Levels | Beyounge',
      description: 'Discover how Beyounge empowers beginners, busy professionals, muscle builders, weight loss seekers, home gym users, and athletes.',
      canonical: '/benefits',
      pageName: 'benefits'
    });
  },

  getAiCoach: (req: Request, res: Response) => {
    res.render('pages/ai-coach', {
      title: 'AI Fitness Coach & Adaptive Periodization | Beyounge',
      description: 'Experience your personal AI workout coach. Adaptive routine adjustments, recovery recommendations, and real-time form feedback.',
      canonical: '/ai-coach',
      pageName: 'ai-coach'
    });
  },

  getAbout: (req: Request, res: Response) => {
    res.render('pages/about', {
      title: 'About Beyounge | Our Mission & Science',
      description: 'Learn about the vision behind Beyounge, our core values, exercise science advisory board, and technology roadmap.',
      canonical: '/about',
      pageName: 'about'
    });
  },

  getContact: (req: Request, res: Response) => {
    res.render('pages/contact', {
      title: 'Contact Beyounge Support & Partnerships',
      description: 'Get in touch with the Beyounge team for support, feature suggestions, press inquiries, or partnership opportunities.',
      canonical: '/contact',
      pageName: 'contact'
    });
  },

  getFaq: async (req: Request, res: Response) => {
    const faqs = await getDbFaqs();
    res.render('pages/faq', {
      title: 'Frequently Asked Questions | Beyounge',
      description: 'Searchable FAQ covering Beyounge app installation, AI coach, nutrition tracking, wearable sync, and subscription details.',
      canonical: '/faq',
      pageName: 'faq',
      faqs
    });
  },

  getBlog: async (req: Request, res: Response) => {
    const posts = await getDbBlogPosts();
    res.render('pages/blog', {
      title: 'Beyounge Fitness, AI & Nutrition Blog',
      description: 'Latest research, workout guides, nutrition tips, and AI technology updates from the Beyounge fitness science team.',
      canonical: '/blog',
      pageName: 'blog',
      posts
    });
  },

  getBlogDetail: async (req: Request, res: Response) => {
    const post = await getDbBlogPostBySlug(req.params.slug);
    if (!post) {
      return res.status(404).render('pages/404', {
        title: 'Page Not Found | Beyounge',
        description: 'The requested page or blog post could not be found.',
        canonical: req.path,
        pageName: '404'
      });
    }

    const allBlogs = await getDbBlogPosts();
    const relatedPosts = allBlogs.filter((p: any) => p.slug !== post.slug);

    res.render('pages/blog-detail', {
      title: `${post.title} | Beyounge Blog`,
      description: post.excerpt,
      canonical: `/blog/${post.slug}`,
      pageName: 'blog',
      post,
      relatedPosts
    });
  },

  getDownload: (req: Request, res: Response) => {
    res.render('pages/download', {
      title: 'Download Beyounge on Google Play | Android Fitness App',
      description: 'Download the Beyounge Android application. Start your AI-powered workout journey with personalized routines and smart nutrition.',
      canonical: '/download',
      pageName: 'download'
    });
  },

  getChangelog: async (req: Request, res: Response) => {
    const changelog = await getDbChangelog();
    res.render('pages/changelog', {
      title: 'Product Changelog & Updates | Beyounge',
      description: 'Track new feature releases, AI improvements, bug fixes, and updates to the Beyounge Android platform.',
      canonical: '/changelog',
      pageName: 'changelog',
      changelog
    });
  },

  getCareers: async (req: Request, res: Response) => {
    const jobs = await getDbCareers();
    res.render('pages/careers', {
      title: 'Careers at Beyounge | Join Our Team',
      description: 'Join Beyounge in shaping the future of AI fitness, sports science, and digital health. View open remote positions.',
      canonical: '/careers',
      pageName: 'careers',
      jobs
    });
  },

  getPressKit: (req: Request, res: Response) => {
    res.render('pages/press-kit', {
      title: 'Press Kit & Brand Assets | Beyounge',
      description: 'Download official Beyounge logos, brand colors, typography guidelines, app screenshots, and press release materials.',
      canonical: '/press-kit',
      pageName: 'press-kit'
    });
  },

  getSitemapPage: (req: Request, res: Response) => {
    res.render('pages/sitemap-page', {
      title: 'Sitemap & Site Directory | Beyounge',
      description: 'Full overview and direct navigation directory for all pages on Beyounge website.',
      canonical: '/sitemap',
      pageName: 'sitemap'
    });
  }
};
