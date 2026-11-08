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

function formatJoinedDate(timestamp: any): string {
  if (!timestamp) return 'Recently';
  const num = Number(timestamp);
  if (isNaN(num) || num <= 0) return 'Recently';
  const date = new Date(num);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export const RESERVED_SLUGS = new Set([
  'admin', 'feed', 'post', 'features', 'benefits', 'ai-coach', 'about', 'contact', 'faq',
  'blog', 'download', 'changelog', 'careers', 'press-kit', 'sitemap',
  'privacy-policy', 'privacy', 'privacy-policy-v2', 'terms-and-conditions', 'terms-of-service', 'data-deletion',
  'cookie-policy', 'refund-policy', 'community-guidelines', 'accessibility-statement',
  'api', 'robots.txt', 'sitemap.xml', 'favicon.ico', 'images', 'css', 'js', 'assets'
]);

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

// Fetch Main Feed Posts using the exact MySQL schema
async function getDbPosts(limit: number = 20) {
  try {
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
    const rows: any = await query(`
      SELECT 
          p.id, p.userId, p.content, p.imageUrl, p.videoUrl, p.coverImageUrl, 
          p.postType, p.privacy, p.tags, p.timestamp,
          u.username, u.displayName, u.photoUrl, u.is_verified,
          (SELECT COUNT(*) FROM post_likes WHERE postId = p.id) AS likeCount,
          (SELECT COUNT(*) FROM post_comments WHERE postId = p.id) AS commentCount,
          (SELECT COUNT(*) FROM post_shares WHERE postId = p.id) AS shareCount
      FROM posts p
      JOIN users u ON p.userId = u.uid
      WHERE p.postType = 'post' AND p.privacy = 'public'
      ORDER BY p.timestamp DESC
      LIMIT ${safeLimit} OFFSET 0
    `);

    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map((r: any) => {
        const rawUsername = r.username || r.displayName || r.userId || 'user';
        const handleStr = rawUsername.startsWith('@') ? rawUsername : `@${rawUsername}`;
        return {
          id: String(r.id),
          userId: String(r.userId),
          user: {
            name: r.displayName || r.username || 'User',
            handle: handleStr,
            avatar: r.photoUrl || '',
            isVerified: Boolean(r.is_verified)
          },
          time: formatTimeAgo(r.timestamp),
          content: r.content || '',
          image: r.imageUrl || r.coverImageUrl || null,
          videoUrl: r.videoUrl || null,
          tags: r.tags || '',
          likes: Number(r.likeCount || 0),
          comments: Number(r.commentCount || 0),
          shares: Number(r.shareCount || 0)
        };
      });
    }
  } catch (err: any) {
    console.error('Error querying posts from MySQL:', err?.message || err);
  }
  return [];
}

// Fetch Reels Feed using the exact MySQL schema
async function getDbReels(limit: number = 10) {
  try {
    const safeLimit = Math.max(1, Math.min(50, Number(limit) || 10));
    const rows: any = await query(`
      SELECT 
          p.id, p.userId, p.content, p.videoUrl, p.coverImageUrl, p.imageUrl, p.timestamp,
          u.username, u.displayName, u.photoUrl, u.is_verified,
          (SELECT COUNT(*) FROM post_likes WHERE postId = p.id) AS likeCount,
          (SELECT COUNT(*) FROM post_comments WHERE postId = p.id) AS commentCount,
          (SELECT COUNT(*) FROM post_shares WHERE postId = p.id) AS shareCount
      FROM posts p
      JOIN users u ON p.userId = u.uid
      WHERE p.postType = 'reel'
      ORDER BY p.timestamp DESC
      LIMIT ${safeLimit}
    `);

    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map((r: any) => {
        const rawUsername = r.username || r.displayName || r.userId || 'user';
        const handleStr = rawUsername.startsWith('@') ? rawUsername : `@${rawUsername}`;
        return {
          id: String(r.id),
          userId: String(r.userId),
          user: handleStr,
          displayName: r.displayName || r.username || 'User',
          avatar: r.photoUrl || '',
          isVerified: Boolean(r.is_verified),
          content: r.content || '',
          videoUrl: r.videoUrl || '',
          video: r.coverImageUrl || r.imageUrl || r.videoUrl || '',
          likes: Number(r.likeCount || 0),
          comments: Number(r.commentCount || 0),
          shares: Number(r.shareCount || 0)
        };
      });
    }
  } catch (err: any) {
    console.error('Error querying reels from MySQL:', err?.message || err);
  }
  return [];
}

// Fetch a single post by ID using the exact MySQL schema
async function getDbPostById(postId: string) {
  try {
    const rows: any = await query(`
      SELECT 
          p.id, p.userId, p.content, p.imageUrl, p.videoUrl, p.coverImageUrl, 
          p.postType, p.privacy, p.tags, p.timestamp,
          u.username, u.displayName, u.photoUrl, u.is_verified,
          (SELECT COUNT(*) FROM post_likes WHERE postId = p.id) AS likeCount,
          (SELECT COUNT(*) FROM post_comments WHERE postId = p.id) AS commentCount,
          (SELECT COUNT(*) FROM post_shares WHERE postId = p.id) AS shareCount
      FROM posts p
      JOIN users u ON p.userId = u.uid
      WHERE p.id = ?
      LIMIT 1
    `, [postId]);

    if (Array.isArray(rows) && rows.length > 0) {
      const r = rows[0];
      const rawUsername = r.username || r.displayName || r.userId || 'user';
      const handleStr = rawUsername.startsWith('@') ? rawUsername : `@${rawUsername}`;
      return {
        id: String(r.id),
        userId: String(r.userId),
        user: {
          name: r.displayName || r.username || 'User',
          handle: handleStr,
          avatar: r.photoUrl || '',
          isVerified: Boolean(r.is_verified)
        },
        time: formatTimeAgo(r.timestamp),
        content: r.content || '',
        image: r.imageUrl || r.coverImageUrl || null,
        videoUrl: r.videoUrl || null,
        tags: r.tags || '',
        likes: Number(r.likeCount || 0),
        comments: Number(r.commentCount || 0),
        shares: Number(r.shareCount || 0),
        postType: r.postType
      };
    }
  } catch (err: any) {
    console.error('Error querying post by ID from MySQL:', err?.message || err);
  }
  return null;
}

// Fetch Top / Discoverable Users from the 'users' table using the exact MySQL schema
async function getDbUsers(limit: number = 10) {
  try {
    const safeLimit = Math.max(1, Math.min(50, Number(limit) || 10));
    const rows: any = await query(`
      SELECT 
          u.uid, u.username, u.displayName, u.photoUrl, u.is_verified, u.bio, u.fitnessGoal, u.role,
          (SELECT COUNT(*) FROM workouts WHERE userId = u.uid) AS totalWorkouts,
          (SELECT COUNT(*) FROM user_follows WHERE followingId = u.uid) AS followerCount
      FROM users u
      ORDER BY totalWorkouts DESC, followerCount DESC
      LIMIT ${safeLimit}
    `);

    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map((r: any) => {
        const rawUsername = r.username || r.displayName || r.uid;
        return {
          uid: String(r.uid),
          username: rawUsername.startsWith('@') ? rawUsername : `@${rawUsername}`,
          displayName: r.displayName || r.username || 'Member',
          photoUrl: r.photoUrl || '',
          isVerified: Boolean(r.is_verified),
          bio: r.bio || '',
          fitnessGoal: r.fitnessGoal || r.role || 'Member',
          totalWorkouts: Number(r.totalWorkouts || 0),
          followerCount: Number(r.followerCount || 0)
        };
      });
    }
  } catch (err: any) {
    console.error('Error querying users from MySQL:', err?.message || err);
  }
  return [];
}

async function getDbBlogPosts(limit?: number) {
  return limit ? DEFAULT_BLOGS.slice(0, limit) : DEFAULT_BLOGS;
}

async function getDbBlogPostBySlug(slug: string) {
  return DEFAULT_BLOGS.find(b => b.slug === slug) || null;
}

async function getDbFaqs() {
  return DEFAULT_FAQS;
}

async function getDbChangelog() {
  return DEFAULT_CHANGELOG;
}

async function getDbCareers() {
  return DEFAULT_CAREERS;
}

// Controller methods fetching real MySQL data
export const pageController = {
  getPostDetail: async (req: Request, res: Response) => {
    const post = await getDbPostById(req.params.id);
    if (!post) {
      return res.status(404).render('pages/404', {
        title: 'Post Not Found | Beyounge',
        description: 'The requested community post could not be found.',
        canonical: req.path,
        pageName: '404'
      });
    }

    res.render('pages/post-detail', {
      title: `${post.user.name} on Beyounge: "${post.content ? post.content.substring(0, 50) + '...' : 'Post'}"`,
      description: post.content || 'Check out this post on the Beyounge community feed.',
      canonical: `/post/${post.id}`,
      pageName: 'feed',
      post
    });
  },

  getFeed: async (req: Request, res: Response) => {
    const [posts, reels, users] = await Promise.all([
      getDbPosts(20),
      getDbReels(10),
      getDbUsers(10)
    ]);
    res.render('pages/feed', {
      title: 'Community Feed | Beyounge',
      description: 'See what the Beyounge community is up to. Discover real workouts, recipes, and motivation.',
      canonical: '/feed',
      pageName: 'feed',
      posts,
      reels,
      users
    });
  },

  getHome: async (req: Request, res: Response) => {
    const [posts, reels, users, faqs, recentBlogs] = await Promise.all([
      getDbPosts(20),
      getDbReels(10),
      getDbUsers(10),
      getDbFaqs(),
      getDbBlogPosts(3)
    ]);
    res.render('pages/index', {
      title: 'Beyounge - AI Fitness, Workouts & Wellness Platform',
      description: 'Beyounge is an AI-powered fitness app with personalized workouts, macro nutrition tracking, personal record analytics, and community challenges.',
      canonical: '/',
      pageName: 'home',
      faqs,
      recentBlogs,
      posts,
      reels,
      users
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
  },

  getUserProfile: async (req: Request, res: Response, next: any) => {
    try {
      const rawParam = (req.params.username || '').trim();
      const cleanUsername = rawParam.replace(/^@/, '').trim();

      if (!cleanUsername || RESERVED_SLUGS.has(cleanUsername.toLowerCase())) {
        return next();
      }

      // Query user by username, handle, or uid
      const userRows: any = await query(
        `SELECT uid, username, displayName, email, photoUrl, avatar, dob, gender, height, weight,
                fitnessGoal, createdAt, is_verified, bio, bioLink, isPrivateAccount, role,
                followerCount, fitness_score, dailyWaterTarget, dailyCaloriesTarget,
                dailyStepsTarget, dailyProteinTarget, full_name, handle, isAdmin
         FROM users
         WHERE username = ? OR handle = ? OR handle = ? OR uid = ?
         ORDER BY is_verified DESC, createdAt DESC`,
        [cleanUsername, `@${cleanUsername}`, cleanUsername, cleanUsername]
      );

      if (!Array.isArray(userRows) || userRows.length === 0) {
        return next();
      }

      const primaryUser = userRows[0];
      const userIds = Array.from(new Set(userRows.map((u: any) => String(u.uid)).filter(Boolean)));
      if (primaryUser.uid && !userIds.includes(String(primaryUser.uid))) {
        userIds.push(String(primaryUser.uid));
      }

      // Format user details
      const displayName = primaryUser.displayName || primaryUser.full_name || primaryUser.username || cleanUsername;
      const username = primaryUser.username || cleanUsername;
      const avatar = primaryUser.photoUrl || primaryUser.avatar || '';
      const bio = primaryUser.bio || 'Fitness athlete & Beyounge community member.';
      const bioLink = primaryUser.bioLink ? primaryUser.bioLink.trim() : '';
      const fitnessGoal = primaryUser.fitnessGoal || 'Overall Fitness';
      const isVerified = Boolean(primaryUser.is_verified);
      const role = primaryUser.role || (primaryUser.isAdmin ? 'Admin' : 'Member');
      const joinedDate = formatJoinedDate(primaryUser.createdAt);

      // Follower & following counts
      let followersCount = Number(primaryUser.followerCount || 0);
      let followingCount = 0;
      let workoutCount = 0;

      try {
        const placeholders = userIds.map(() => '?').join(',');
        const followerRes: any = await query(
          `SELECT COUNT(*) AS cnt FROM user_follows WHERE followingId IN (${placeholders})`,
          userIds
        );
        if (followerRes && followerRes.length > 0 && followerRes[0].cnt > 0) {
          followersCount = Number(followerRes[0].cnt);
        }

        const followingRes: any = await query(
          `SELECT COUNT(*) AS cnt FROM user_follows WHERE followerId IN (${placeholders})`,
          userIds
        );
        if (followingRes && followingRes.length > 0) {
          followingCount = Number(followingRes[0].cnt);
        }

        const activityRes: any = await query(
          `SELECT COUNT(*) AS cnt FROM activities WHERE userId IN (${placeholders})`,
          userIds
        );
        if (activityRes && activityRes.length > 0) {
          workoutCount = Number(activityRes[0].cnt);
        }
      } catch (err: any) {
        console.warn('Error fetching follow/activity stats for user profile:', err?.message || err);
      }

      const isPrivateAccount = Number(primaryUser.isPrivateAccount) === 1 ||
                               primaryUser.isPrivateAccount === true ||
                               primaryUser.isPrivateAccount === '1' ||
                               req.query.private === '1' ||
                               req.query.preview_private === '1';

      // Fetch user's posts & reels ONLY if account is NOT private
      let posts: any[] = [];
      let reels: any[] = [];

      if (!isPrivateAccount) {
        try {
          const placeholders = userIds.map(() => '?').join(',');
          const postRows: any = await query(
            `SELECT 
                p.id, p.userId, p.content, p.imageUrl, p.videoUrl, p.coverImageUrl, 
                p.postType, p.privacy, p.tags, p.timestamp,
                (SELECT COUNT(*) FROM post_likes WHERE postId = p.id) AS likeCount,
                (SELECT COUNT(*) FROM post_comments WHERE postId = p.id) AS commentCount,
                (SELECT COUNT(*) FROM post_shares WHERE postId = p.id) AS shareCount
             FROM posts p
             WHERE (p.userId IN (${placeholders}) OR p.userId = ?) AND p.privacy = 'public'
             ORDER BY p.timestamp DESC`,
            [...userIds, cleanUsername]
          );

          if (Array.isArray(postRows)) {
            for (const r of postRows) {
              const isReel = r.postType === 'reel' || Boolean(r.videoUrl && !r.imageUrl);
              const formattedItem = {
                id: String(r.id),
                userId: String(r.userId),
                user: {
                  name: displayName,
                  handle: `@${username}`,
                  avatar: avatar,
                  isVerified: isVerified
                },
                time: formatTimeAgo(r.timestamp),
                content: r.content || '',
                image: r.imageUrl || (!isReel ? r.coverImageUrl : null),
                videoUrl: r.videoUrl || null,
                coverImageUrl: r.coverImageUrl || r.imageUrl || null,
                tags: r.tags || '',
                likes: Number(r.likeCount || 0),
                comments: Number(r.commentCount || 0),
                shares: Number(r.shareCount || 0),
                postType: r.postType
              };

              if (isReel) {
                reels.push(formattedItem);
              } else {
                posts.push(formattedItem);
              }
            }
          }
        } catch (err: any) {
          console.error('Error fetching user posts/reels for profile:', err?.message || err);
        }
      }

      // Filter media posts (posts with image attachments)
      const mediaPosts = posts.filter(p => Boolean(p.image));

      // Fetch suggested athletes from MySQL
      let suggestedAthletes: any[] = [];
      try {
        const placeholders = userIds.map(() => '?').join(',');
        const sugRows: any = await query(
          `SELECT uid, username, displayName, photoUrl, avatar, bio, is_verified, fitnessGoal 
           FROM users 
           WHERE username != ? AND uid NOT IN (${placeholders}) AND (photoUrl != '' OR is_verified = 1)
           ORDER BY is_verified DESC, createdAt DESC 
           LIMIT 4`,
          [cleanUsername, ...userIds]
        );
        if (Array.isArray(sugRows)) {
          suggestedAthletes = sugRows.map((u: any) => ({
            uid: String(u.uid),
            username: u.username || 'athlete',
            handle: `@${u.username || 'athlete'}`,
            displayName: u.displayName || u.username || 'Athlete',
            avatar: u.photoUrl || u.avatar || '',
            bio: u.bio || '',
            isVerified: Boolean(u.is_verified),
            fitnessGoal: u.fitnessGoal || ''
          }));
        }
      } catch (err: any) {
        console.warn('Error fetching suggested athletes:', err?.message || err);
      }

      // Fetch trending community reels for sidebar preview
      let trendingReels: any[] = [];
      try {
        const reelRows: any = await query(
          `SELECT p.id, p.userId, p.content, p.videoUrl, p.coverImageUrl, p.imageUrl,
                  u.username, u.displayName, u.photoUrl,
                  (SELECT COUNT(*) FROM post_likes WHERE postId = p.id) AS likeCount
           FROM posts p
           JOIN users u ON p.userId = u.uid
           WHERE p.postType = 'reel' AND p.videoUrl != ''
           ORDER BY likeCount DESC, p.timestamp DESC
           LIMIT 3`
        );
        if (Array.isArray(reelRows)) {
          trendingReels = reelRows.map((r: any) => ({
            id: String(r.id),
            user: `@${r.username || 'user'}`,
            displayName: r.displayName || r.username || 'User',
            avatar: r.photoUrl || '',
            videoUrl: r.videoUrl || '',
            cover: r.coverImageUrl || r.imageUrl || '',
            content: r.content || '',
            likes: Number(r.likeCount || 0)
          }));
        }
      } catch (err: any) {
        console.warn('Error fetching trending reels:', err?.message || err);
      }

      // Sanitize fitness score so uncalculated defaults (-1) don't render as negative
      const rawScore = Number(primaryUser.fitness_score);
      const cleanFitnessScore = (!isNaN(rawScore) && rawScore > 0) ? rawScore : null;

      const profileUser = {
        uid: primaryUser.uid,
        username,
        displayName,
        avatar,
        bio: isPrivateAccount ? 'This athlete has made their profile and activity private.' : bio,
        bioLink: isPrivateAccount ? '' : bioLink,
        fitnessGoal: isPrivateAccount ? '' : fitnessGoal,
        isVerified,
        isPrivate: isPrivateAccount,
        role,
        joinedDate,
        height: isPrivateAccount ? null : primaryUser.height,
        weight: isPrivateAccount ? null : primaryUser.weight,
        fitnessScore: isPrivateAccount ? null : cleanFitnessScore,
        dailyCaloriesTarget: isPrivateAccount ? null : primaryUser.dailyCaloriesTarget,
        dailyWaterTarget: isPrivateAccount ? null : primaryUser.dailyWaterTarget,
        dailyStepsTarget: isPrivateAccount ? null : primaryUser.dailyStepsTarget,
        dailyProteinTarget: isPrivateAccount ? null : primaryUser.dailyProteinTarget,
        followersCount,
        followingCount,
        workoutCount: isPrivateAccount ? 0 : workoutCount,
        postsCount: isPrivateAccount ? 0 : posts.length,
        reelsCount: isPrivateAccount ? 0 : reels.length,
        mediaCount: isPrivateAccount ? 0 : mediaPosts.length
      };

      res.render('pages/user-profile', {
        title: `${displayName} (@${username}) | Beyounge`,
        description: bio || `${displayName}'s fitness profile, workout logs, and reels on Beyounge.`,
        canonical: `/${username}`,
        pageName: 'profile',
        profileUser,
        posts,
        reels,
        mediaPosts,
        suggestedAthletes,
        trendingReels
      });
    } catch (error: any) {
      console.error('Error in getUserProfile:', error?.message || error);
      next(error);
    }
  }
};
