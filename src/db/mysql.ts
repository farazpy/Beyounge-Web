import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Read MySQL credentials from environment variables / AI Studio secrets
const DB_HOST = process.env.DBHOST || process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DBPORT || process.env.DB_PORT || process.env.MYSQL_PORT || '3306', 10);
const DB_USER = process.env.DBUSER || process.env.DB_USER || process.env.MYSQL_USER || process.env.USERNAME || 'root';
const DB_PASSWORD = process.env.DBPASSWORD || process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || process.env.PASSWORD || '';
const DB_NAME = process.env.DBNAME || process.env.DB_NAME || process.env.MYSQL_DATABASE || process.env.DATABASE || 'beyounge';

console.log(`[MySQL Config] Host: ${DB_HOST}, Port: ${DB_PORT}, User: ${DB_USER}, DB: ${DB_NAME}`);

// Create MySQL Connection Pool
export const dbPool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Helper function to execute queries safely
export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  const [results] = await dbPool.execute(sql, params);
  return results as T;
}

// Function to test the database connection
export async function initDatabase(): Promise<boolean> {
  let connection;
  try {
    connection = await dbPool.getConnection();
    console.log(`✅ Successfully connected to MySQL database: ${DB_NAME} at ${DB_HOST}:${DB_PORT}`);
    return true;
  } catch (error: any) {
    console.warn(`⚠️ MySQL Database Connection warning/failure (${DB_HOST}:${DB_PORT}):`, error.message || error);
    return false;
  } finally {
    if (connection) {
      try { connection.release(); } catch {}
    }
  }
}

async function seedInitialData(connection: any) {
  // Seed users if empty
  try {
    const [userRows]: any = await connection.query(`SELECT COUNT(*) as count FROM users`);
    if (userRows[0].count === 0) {
      console.log(`🌱 Seeding initial users into MySQL database...`);
      await connection.query(`
        INSERT INTO users (id, username, full_name, handle, avatar, role) VALUES
        (1, 'sarah_fit', 'Sarah Jenkins', '@sarah_fit', 'https://i.pravatar.cc/150?u=sarah', 'Fitness Coach'),
        (2, 'mike_lifts', 'Mike Thompson', '@mike_lifts', 'https://i.pravatar.cc/150?u=mike', 'Powerlifter'),
        (3, 'emma_yoga', 'Emma Davis', '@emma_yoga', 'https://i.pravatar.cc/150?u=emma', 'Yoga Instructor'),
        (4, 'alex_trains', 'Alex Rivers', '@alex_trains', 'https://i.pravatar.cc/150?u=alex', 'HIIT Athlete'),
        (5, 'jess_wellness', 'Jessica Chen', '@jess_wellness', 'https://i.pravatar.cc/150?u=jessica', 'Wellness Specialist'),
        (6, 'david_k', 'David Kim', '@david_k', 'https://i.pravatar.cc/150?u=david', 'Calisthenics Lead');
      `);
    }
  } catch (err: any) {
    console.warn('⚠️ Error seeding users:', err.message || err);
  }

  // Seed posts if empty
  try {
    const [postRows]: any = await connection.query(`SELECT COUNT(*) as count FROM posts`);
    if (postRows[0].count === 0) {
      console.log(`🌱 Seeding initial posts into MySQL database...`);
      await connection.query(`
        INSERT INTO posts (user_id, content, image, likes, comments, time_ago) VALUES
        (1, 'Just crushed my new PR on deadlifts! 🏋️‍♀️ Thanks to the Beyounge AI coach for the perfect progression plan over the last 6 weeks.', 'https://images.unsplash.com/photo-1526506114868-874b281b37f4?auto=format&fit=crop&w=800&q=80', 342, 28, '2 hours ago'),
        (2, 'Post-workout meal prep. The macro scanner makes tracking this so much easier! 🥗', 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80', 124, 12, '5 hours ago'),
        (3, 'Morning flow 🧘‍♀️ Focusing on mobility and core strength today. Remember, recovery is just as important as the workout itself!', 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80', 567, 45, '1 day ago'),
        (4, 'HIIT circuit today was absolutely brutal, but exactly what I needed. 🔥', NULL, 213, 8, '1 day ago'),
        (5, 'Found this amazing trail for my weekend run! Beyounge GPS tracking didn''t miss a beat. 🌲🏃‍♀️', 'https://images.unsplash.com/photo-1502904550040-7534597466ae?auto=format&fit=crop&w=800&q=80', 421, 15, '2 days ago'),
        (6, 'Hit my first muscle up today! Thanks to the community for all the tips and form checks. 🙌', NULL, 189, 32, '3 days ago');
      `);
    }
  } catch (err: any) {
    console.warn('⚠️ Error seeding posts:', err.message || err);
  }

  // Seed reels if empty
  try {
    const [reelRows]: any = await connection.query(`SELECT COUNT(*) as count FROM reels`);
    if (reelRows[0].count === 0) {
      console.log(`🌱 Seeding initial reels into MySQL database...`);
      await connection.query(`
        INSERT INTO reels (user_id, video_url, views) VALUES
        (1, 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=400&q=80', '12K'),
        (2, 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80', '8.5K'),
        (3, 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80', '24K'),
        (4, 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80', '5K'),
        (5, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80', '19K');
      `);
    }
  } catch (err: any) {
    console.warn('⚠️ Error seeding reels:', err.message || err);
  }

  // Seed blog_posts if empty
  try {
    const [blogRows]: any = await connection.query(`SELECT COUNT(*) as count FROM blog_posts`);
    if (blogRows[0].count === 0) {
      console.log(`🌱 Seeding initial blog posts into MySQL database...`);
      await connection.query(`
        INSERT INTO blog_posts (slug, title, excerpt, category, read_time, published_date, author_name, author_role, author_avatar, image, content) VALUES
        ('how-ai-is-revolutionizing-progressive-overload', 'How AI is Revolutionizing Progressive Overload & Hypertrophy', 'Discover how computer vision and machine learning adjust set volume, rest intervals, and load progression based on recovery metrics.', 'AI Technology', '6 min read', 'July 24, 2026', 'Dr. Sarah Lin', 'Head of Exercise Physiology', '/images/author-lin.jpg', '/images/blog-ai-training.jpg', '<h2>The End of Static Workout Programs</h2><p>For decades, traditional strength training relied on fixed spreadsheets and rigid percentage-based periodization. While effective for basic progression, static programs fail to account for daily biological variables such as sleep quality, autonomic stress (HRV), micro-nutrition, and joint fatigue.</p><h2>Real-Time Auto-Regulation</h2><p>Beyounge''s proprietary AI engine uses continuous biometric feedback and historical set performance to calculate your precise <em>Rate of Perceived Exertion (RPE)</em> and velocity loss. If your velocity on Bench Press set 1 indicates high CNS readiness, Beyounge dynamically recommends a +2.5kg increase for set 2.</p><h2>Key Advantages of AI-Driven Volume Management</h2><ul><li><strong>Injury Reduction:</strong> Automatically deloads when fatigue indicators spike above safe thresholds.</li><li><strong>Optimal Hypertrophy:</strong> Keeps every working set within the 1 to 3 reps in reserve (RIR) target zone.</li><li><strong>Zero Guesswork:</strong> Calculates exact rest intervals customized to muscle group metabolic recovery rate.</li></ul><p>By transforming raw workout logs into actionable neurological signals, Beyounge eliminates plateaus and maximizes lean muscle adaptation per minute spent in the gym.</p>'),
        ('mastering-macro-tracking-with-computer-vision', 'Mastering Macro Tracking Without Manual Logging', 'Say goodbye to searching databases for ingredients. How Beyounge AI visual food recognition instantly scans your plate.', 'Nutrition', '5 min read', 'July 18, 2026', 'Marcus Vance', 'Sports Nutritionist & CISSN', '/images/author-vance.jpg', '/images/blog-nutrition.jpg', '<h2>The Friction of Traditional Food Logging</h2><p>Studies show that over 70% of fitness app users abandon nutrition tracking within two weeks due to the cognitive burden of searching ingredient databases and weighing food portions manually.</p><h2>Visual Meal Analysis in Under 2 Seconds</h2><p>Using Beyounge''s instant camera photo recognition, users take a quick snapshot of their meal. Our multi-stage neural network identifies individual protein, carbohydrate, and fat components, estimates volume density, and calculates caloric composition with up to 92% accuracy.</p><p>Whether dining out or prepping meals at home, Beyounge keeps your nutritional balance in perfect harmony with your daily caloric expenditure.</p>'),
        ('science-of-recovery-hrv-and-sleep-optimization', 'The Science of Recovery: HRV, Sleep, and Readiness Scores', 'Why training hard is only 30% of the equation, and how smart recovery tracking accelerates physical transformation.', 'Wellness', '7 min read', 'July 10, 2026', 'Elena Rostova', 'Biomedical Researcher', '/images/author-elena.jpg', '/images/blog-recovery.jpg', '<h2>Muscle Is Built During Sleep</h2><p>During deep non-REM sleep, human growth hormone (HGH) surges and protein synthesis reaches peak velocity. Failing to monitor recovery readiness often leads to overreaching and chronic cortisol elevation.</p><h2>How Beyounge Computes Your Readiness Score</h2><p>By integrating with Android Health Connect, Google Fit, and wearable sensors, Beyounge synthesizes Heart Rate Variability (HRV), resting pulse, sleep phase distribution, and muscle soreness logs to generate a daily 0-100 Readiness Score.</p><p>On high readiness days, Beyounge prompts you to tackle heavy compound movements. On low readiness days, the AI seamlessly transforms your workout into active mobility and active recovery cardio.</p>');
      `);
    }
  } catch (err: any) {
    console.warn('⚠️ Error seeding blog posts:', err.message || err);
  }

  // Seed faqs if empty
  try {
    const [faqRows]: any = await connection.query(`SELECT COUNT(*) as count FROM faqs`);
    if (faqRows[0].count === 0) {
      console.log(`🌱 Seeding initial FAQs into MySQL database...`);
      await connection.query(`
        INSERT INTO faqs (question, answer, display_order) VALUES
        ('What makes Beyounge different from other fitness apps?', 'Beyounge combines an adaptive AI Coach, real-time exercise volume auto-regulation, photo macro tracking, and personal record tracking into a seamless, dark-mode-first Android experience with complete offline support.', 1),
        ('Is Beyounge free to download on Google Play?', 'Yes! Beyounge is free to download on Android with generous free features including AI workout generation, basic food logging, exercise library, and habit tracking. Beyounge Pro unlocks unlimited AI coach recommendations and advanced analytics.', 2),
        ('Does Beyounge work offline in the gym?', 'Absolutely. Beyounge is built with an offline-first local database. You can log workouts, view exercise videos, and record PRs without internet connection. Your data syncs automatically when reconnected.', 3),
        ('Can I sync my fitness wearables with Beyounge?', 'Yes. Beyounge connects seamlessly with Android Health Connect, Google Fit, Garmin, Fitbit, Galaxy Watch, and Whoop to track heart rate, daily steps, calories burned, and sleep quality.', 4),
        ('How does the AI Coach create personalized workouts?', 'Our AI analyzes your experience level, available equipment (gym, dumbbells, bodyweight), time availability, injury constraints, and daily recovery scores to generate optimized sets, reps, and target weights.', 5),
        ('How can I request my personal data deletion?', 'You can request complete data deletion directly inside the app settings or via our dedicated online Data Deletion Page. All requests are processed within 14 business days in accordance with GDPR regulations.', 6);
      `);
    }
  } catch (err: any) {
    console.warn('⚠️ Error seeding faqs:', err.message || err);
  }

  // Seed changelog_items if empty
  try {
    const [changeRows]: any = await connection.query(`SELECT COUNT(*) as count FROM changelog_items`);
    if (changeRows[0].count === 0) {
      console.log(`🌱 Seeding initial changelog into MySQL database...`);
      await connection.query(`
        INSERT INTO changelog_items (version, date, title, highlights_json) VALUES
        ('v2.4.0', 'July 2026', 'Health Connect Sync & Custom SuperSet Engine', '["Full integration with Android Health Connect for 2-way sleep & biometric sync", "Interactive SuperSet Builder with rest time auto-calculator", "AI Coach voice guidance during active workout logging", "Enhanced Offline Mode with automatic background database reconciliation"]'),
        ('v2.2.0', 'June 2026', 'AI Photo Macro Recognition & Social Feed 2.0', '["Instant camera photo food scanner with instant macro breakdown", "Community Challenges & real-time friends leaderboard", "100+ new high-definition exercise demonstration videos"]'),
        ('v2.0.0', 'May 2026', 'Beyounge AI Engine 2.0 Engine Upgrade', '["Adaptive auto-regulation protocol for strength PR predictions", "New Dark Glass UI overhaul for maximum night-use comfort", "Custom macro goal builder for cutting, bulking, and body recomposition"]');
      `);
    }
  } catch (err: any) {
    console.warn('⚠️ Error seeding changelog:', err.message || err);
  }

  // Seed career_openings if empty
  try {
    const [careerRows]: any = await connection.query(`SELECT COUNT(*) as count FROM career_openings`);
    if (careerRows[0].count === 0) {
      console.log(`🌱 Seeding initial career openings into MySQL database...`);
      await connection.query(`
        INSERT INTO career_openings (title, location, type, department, description) VALUES
        ('Senior Mobile Engineer (Android / Kotlin)', 'Remote / San Francisco', 'Full-time', 'Engineering', 'Lead the architecture and development of the Beyounge Android application, optimizing offline synchronization and performance.'),
        ('Staff AI/ML Engineer (Computer Vision)', 'Remote / New York', 'Full-time', 'AI & Data Science', 'Build real-time form detection and computer vision nutrition models serving millions of daily inferences.'),
        ('Head of Growth & Performance Marketing', 'Remote / London', 'Full-time', 'Marketing', 'Drive user acquisition across Google Play, organic SEO, influencer partnerships, and viral community referral loops.');
      `);
    }
  } catch (err: any) {
    console.warn('⚠️ Error seeding career openings:', err.message || err);
  }
}

export default dbPool;
