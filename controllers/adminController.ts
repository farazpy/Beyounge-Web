import { Request, Response } from 'express';
import crypto from 'crypto';
import { dbPool } from '../src/db/mysql.js';

const ADMIN_PIN = '9292';

function isAuthorized(req: Request): boolean {
  const headerPin = req.headers['x-admin-pin'];
  const queryPin = req.query.pin;
  const bodyPin = req.body?.pin;
  return headerPin === ADMIN_PIN || queryPin === ADMIN_PIN || bodyPin === ADMIN_PIN;
}

async function safeQuery<T = any>(sql: string, params?: any[], fallback: any = []): Promise<T> {
  try {
    const [rows] = await dbPool.query(sql, params);
    return rows as T;
  } catch (err: any) {
    console.warn(`[Admin Query Warning] ${err?.message || err}`);
    return fallback as T;
  }
}

interface TableColumnMeta {
  Field: string;
  Type: string;
  Null: string;
  Key: string;
  Default: any;
  Extra: string;
}

async function getValidatedTableMeta(requestedTable: string): Promise<{
  valid: boolean;
  tableName: string;
  columns: TableColumnMeta[];
  columnMap: Record<string, TableColumnMeta>;
  primaryKeys: string[];
}> {
  const cleanName = String(requestedTable || '').trim();
  const tablesRaw = await safeQuery<any[]>(`SHOW TABLES`);
  const validTables = tablesRaw.map((r: any) => String(Object.values(r)[0]));

  if (!validTables.includes(cleanName)) {
    return { valid: false, tableName: cleanName, columns: [], columnMap: {}, primaryKeys: [] };
  }

  const columns = await safeQuery<TableColumnMeta[]>(`SHOW COLUMNS FROM \`${cleanName}\``);
  const columnMap: Record<string, TableColumnMeta> = {};
  const primaryKeys: string[] = [];

  for (const col of columns) {
    columnMap[col.Field] = col;
    if (col.Key === 'PRI') {
      primaryKeys.push(col.Field);
    }
  }

  // Fallback key resolution if a table has no formal PRI key constraint
  if (primaryKeys.length === 0 && columns.length > 0) {
    const candidates = ['id', 'uid', 'config_key', 'slug', 'email', 'username'];
    for (const cand of candidates) {
      if (columnMap[cand]) {
        primaryKeys.push(cand);
        break;
      }
    }
    if (primaryKeys.length === 0) {
      primaryKeys.push(columns[0].Field);
    }
  }

  return {
    valid: true,
    tableName: cleanName,
    columns,
    columnMap,
    primaryKeys
  };
}

function coerceColumnValue(col: TableColumnMeta, rawVal: any): any {
  const typeLower = String(col.Type || '').toLowerCase();
  const isNullable = String(col.Null || '').toUpperCase() === 'YES';

  if (rawVal === null || rawVal === undefined) {
    return isNullable ? null : col.Default ?? '';
  }

  // Handle boolean / tinyint(1)
  if (typeLower.startsWith('tinyint(1)') || typeLower === 'boolean' || typeLower === 'bool') {
    if (rawVal === '' && isNullable) return null;
    if (rawVal === true || rawVal === 'true' || rawVal === '1' || rawVal === 1 || rawVal === 'on') return 1;
    if (rawVal === false || rawVal === 'false' || rawVal === '0' || rawVal === 0 || rawVal === 'off') return 0;
    return Number(rawVal) ? 1 : 0;
  }

  // Handle numeric or temporal types when empty string is submitted
  const isNumeric =
    typeLower.includes('int') ||
    typeLower.includes('double') ||
    typeLower.includes('float') ||
    typeLower.includes('decimal') ||
    typeLower.includes('numeric');
  const isTemporal =
    typeLower.includes('date') ||
    typeLower.includes('time') ||
    typeLower.includes('timestamp') ||
    typeLower.includes('year');

  if (rawVal === '' && (isNumeric || isTemporal)) {
    if (isNullable) return null;
    if (col.Default !== null && col.Default !== undefined && col.Default !== 'CURRENT_TIMESTAMP') {
      return col.Default;
    }
    return isNumeric ? 0 : null;
  }

  if (isNumeric && typeof rawVal === 'string' && rawVal.trim() !== '') {
    const parsed = Number(rawVal);
    if (!Number.isNaN(parsed)) return parsed;
  }

  if (typeof rawVal === 'object') {
    try {
      return JSON.stringify(rawVal);
    } catch {
      return String(rawVal);
    }
  }

  return rawVal;
}

function buildWhereClause(
  whereKey: Record<string, any>,
  columnMap: Record<string, TableColumnMeta>,
  primaryKeys: string[]
): { sql: string; params: any[] } {
  const clauses: string[] = [];
  const params: any[] = [];

  // Prefer primary keys if present in whereKey
  const keysToUse: string[] = [];
  for (const pk of primaryKeys) {
    if (whereKey && whereKey[pk] !== undefined) {
      keysToUse.push(pk);
    }
  }

  // If primaryKeys weren't all provided, use all valid columns present in whereKey
  const activeKeys =
    keysToUse.length > 0
      ? keysToUse
      : Object.keys(whereKey || {}).filter((k) => Boolean(columnMap[k]) && whereKey[k] !== undefined);

  for (const key of activeKeys) {
    const val = whereKey[key];
    if (val === null) {
      clauses.push(`\`${key}\` IS NULL`);
    } else {
      clauses.push(`\`${key}\` = ?`);
      params.push(val);
    }
  }

  return {
    sql: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    params
  };
}

export const adminController = {
  // Render the /admin page shell
  getAdminPage: (req: Request, res: Response) => {
    const subpage = req.params.subpage || 'dashboard';
    res.render('pages/admin', {
      title: 'Beyounge Admin Console',
      description:
        'Beyounge WordPress-Style Executive Admin CMS — Full CRUD for Users, Posts, Reels, Workouts, Coaches, Nutrition, Health Connect, and all 54 Android MySQL tables.',
      canonical: '/admin',
      pageName: 'admin',
      activeSubpage: subpage
    });
  },

  // Verify PIN endpoint
  verifyPin: (req: Request, res: Response) => {
    if (isAuthorized(req)) {
      return res.json({ success: true, authorized: true });
    }
    return res.status(401).json({ success: false, error: 'Invalid Admin PIN. Access denied.' });
  },

  // Giant Dashboard Overview Payload
  getDashboardData: async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized: Valid PIN 9292 required.' });
    }

    try {
      // 1. Discover all tables and their columns from information_schema
      const [tablesRaw, columnsRaw] = await Promise.all([
        safeQuery<any[]>(`SHOW TABLES`),
        safeQuery<any[]>(`
          SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName, COLUMN_TYPE AS columnType,
                 IS_NULLABLE AS isNullable, COLUMN_KEY AS columnKey, COLUMN_DEFAULT AS columnDefault, EXTRA AS extra
          FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
          ORDER BY TABLE_NAME ASC, ORDINAL_POSITION ASC
        `)
      ]);

      const tableNames: string[] = tablesRaw.map((r: any) => String(Object.values(r)[0]));

      // Group columns by table name
      const columnsByTable: Record<string, any[]> = {};
      for (const t of tableNames) {
        columnsByTable[t] = [];
      }
      for (const col of columnsRaw) {
        if (!columnsByTable[col.tableName]) {
          columnsByTable[col.tableName] = [];
        }
        columnsByTable[col.tableName].push(col);
      }

      // 2. Get exact row counts for every single table in parallel
      const tableCounts: Record<string, number> = {};
      await Promise.all(
        tableNames.map(async (tName) => {
          const cntRows = await safeQuery<any[]>(`SELECT COUNT(*) AS cnt FROM \`${tName}\``);
          tableCounts[tName] = Number(cntRows?.[0]?.cnt || 0);
        })
      );

      // Build complete schema inventory including primaryKeys
      const schemaTables = tableNames.map((tName) => {
        const cols = columnsByTable[tName] || [];
        const pks = cols.filter((c: any) => c.columnKey === 'PRI').map((c: any) => c.columnName);
        if (pks.length === 0 && cols.length > 0) {
          const fallback = cols.find((c: any) => ['id', 'uid', 'config_key', 'slug'].includes(c.columnName));
          pks.push(fallback ? fallback.columnName : cols[0].columnName);
        }
        return {
          tableName: tName,
          rowCount: tableCounts[tName] || 0,
          columnCount: cols.length,
          primaryKeys: pks,
          columns: cols
        };
      });

      // 3. Query rich datasets from all primary operational tables in parallel
      const [
        users,
        posts,
        postComments,
        stories,
        directMessages,
        userFollows,
        workouts,
        workoutExercises,
        workoutSets,
        workoutTemplates,
        exerciseDefinitions,
        aiExercises,
        coachApplications,
        nutritionLogs,
        foods,
        healthDailySummaries,
        userIntegrations,
        geminiLogs,
        aiSummaries,
        activities,
        activityMetadata,
        userAchievements,
        appConfig,
        smtpConfig,
        emailLogs,
        faqs,
        blogPosts,
        changelogItems,
        careerOpenings,
        contactSubmissions,
        dataDeletionRequests
      ] = await Promise.all([
        // All Users with all columns + aggregated counts
        safeQuery(`
          SELECT u.*,
            (SELECT COUNT(*) FROM posts p WHERE p.userId = u.uid) AS postsCount,
            (SELECT COUNT(*) FROM workouts w WHERE w.userId = u.uid) AS workoutsCount,
            (SELECT COUNT(*) FROM nutrition_logs nl WHERE nl.userId = u.uid) AS nutritionCount
          FROM users u
          ORDER BY u.createdAt DESC, u.uid ASC
          LIMIT 500
        `),
        // All Posts & Reels with author info & live interaction counts
        safeQuery(`
          SELECT p.*,
            u.username AS authorUsername,
            u.displayName AS authorDisplayName,
            u.photoUrl AS authorPhotoUrl,
            u.is_verified AS authorVerified,
            (SELECT COUNT(*) FROM post_likes pl WHERE pl.postId = p.id) AS liveLikes,
            (SELECT COUNT(*) FROM post_comments pc WHERE pc.postId = p.id) AS liveComments,
            (SELECT COUNT(*) FROM post_shares ps WHERE ps.postId = p.id) AS liveShares,
            (SELECT COUNT(*) FROM saved_posts sp WHERE sp.postId = p.id) AS liveSaves
          FROM posts p
          LEFT JOIN users u ON p.userId = u.uid
          ORDER BY p.timestamp DESC
          LIMIT 500
        `),
        // Post Comments
        safeQuery(`
          SELECT pc.*, u.username, u.displayName, u.photoUrl, p.content AS postExcerpt
          FROM post_comments pc
          LEFT JOIN users u ON pc.userId = u.uid
          LEFT JOIN posts p ON pc.postId = p.id
          ORDER BY pc.timestamp DESC
          LIMIT 250
        `),
        // Stories with view counts
        safeQuery(`
          SELECT s.*, u.username, u.displayName, u.photoUrl,
            (SELECT COUNT(*) FROM story_views sv WHERE sv.storyId = s.id) AS viewCount
          FROM stories s
          LEFT JOIN users u ON s.userId = u.uid
          ORDER BY s.timestamp DESC
          LIMIT 200
        `),
        // Direct Messages
        safeQuery(`
          SELECT dm.*,
            su.username AS senderUsername, su.displayName AS senderName,
            ru.username AS receiverUsername, ru.displayName AS receiverName
          FROM direct_messages dm
          LEFT JOIN users su ON dm.senderId = su.uid
          LEFT JOIN users ru ON dm.receiverId = ru.uid
          ORDER BY dm.timestamp DESC
          LIMIT 200
        `),
        // User Follows
        safeQuery(`
          SELECT uf.*,
            fu.username AS followerUsername, fu.displayName AS followerName,
            tu.username AS followingUsername, tu.displayName AS followingName
          FROM user_follows uf
          LEFT JOIN users fu ON uf.followerId = fu.uid
          LEFT JOIN users tu ON uf.followingId = tu.uid
          ORDER BY uf.timestamp DESC
          LIMIT 200
        `),
        // Workouts
        safeQuery(`
          SELECT w.*, u.username, u.displayName, u.photoUrl,
            (SELECT COUNT(*) FROM workout_log_exercises wle WHERE wle.workoutId = w.id) AS loggedExerciseCount
          FROM workouts w
          LEFT JOIN users u ON w.userId = u.uid
          ORDER BY w.timestamp DESC
          LIMIT 250
        `),
        // Workout Log Exercises
        safeQuery(`
          SELECT wle.*, w.title AS workoutTitle, w.userId,
            (SELECT COUNT(*) FROM workout_log_sets wls WHERE wls.workoutLogExerciseId = wle.id) AS setCount
          FROM workout_log_exercises wle
          LEFT JOIN workouts w ON wle.workoutId = w.id
          ORDER BY wle.id DESC
          LIMIT 250
        `),
        // Workout Log Sets
        safeQuery(`
          SELECT wls.*, wle.exerciseName, wle.workoutId
          FROM workout_log_sets wls
          LEFT JOIN workout_log_exercises wle ON wls.workoutLogExerciseId = wle.id
          ORDER BY wls.id DESC
          LIMIT 300
        `),
        // Workout Templates
        safeQuery(`
          SELECT wt.*, u.username, u.displayName,
            (SELECT COUNT(*) FROM workout_template_exercises wte WHERE wte.templateId = wt.id) AS exerciseCount
          FROM workout_templates wt
          LEFT JOIN users u ON wt.userId = u.uid
          LIMIT 100
        `),
        // Exercise Definitions
        safeQuery(`SELECT * FROM exercise_definitions LIMIT 250`),
        // AI Exercise Library
        safeQuery(`SELECT * FROM ai_exercise_library ORDER BY id ASC LIMIT 250`),
        // Coach Applications
        safeQuery(`
          SELECT ca.*, u.username, u.photoUrl
          FROM coach_applications ca
          LEFT JOIN users u ON ca.userId = u.uid
          ORDER BY ca.createdAt DESC
          LIMIT 150
        `),
        // Nutrition Logs
        safeQuery(`
          SELECT nl.*, u.username, u.displayName
          FROM nutrition_logs nl
          LEFT JOIN users u ON nl.userId = u.uid
          ORDER BY nl.timestamp DESC
          LIMIT 250
        `),
        // Foods Library
        safeQuery(`SELECT * FROM foods LIMIT 300`),
        // Health Connect Daily Summaries
        safeQuery(`
          SELECT hc.*, u.username, u.displayName, u.photoUrl
          FROM health_connect_daily_summaries hc
          LEFT JOIN users u ON hc.userId = u.uid
          ORDER BY hc.syncTimestamp DESC, hc.date DESC
          LIMIT 200
        `),
        // User Integrations
        safeQuery(`
          SELECT ui.*, u.username, u.displayName
          FROM user_integrations ui
          LEFT JOIN users u ON ui.userId = u.uid
          ORDER BY ui.lastSyncTime DESC
          LIMIT 100
        `),
        // Gemini Token Logs
        safeQuery(`
          SELECT gtl.*, u.username, u.displayName
          FROM gemini_token_logs gtl
          LEFT JOIN users u ON gtl.userId = u.uid
          ORDER BY gtl.timestamp DESC
          LIMIT 250
        `),
        // AI Summary Cache
        safeQuery(`
          SELECT asc_tbl.*, u.username, u.displayName
          FROM ai_summary_cache asc_tbl
          LEFT JOIN users u ON asc_tbl.userId = u.uid
          ORDER BY asc_tbl.updatedAt DESC
          LIMIT 100
        `),
        // Activities
        safeQuery(`
          SELECT a.*, u.username, u.displayName
          FROM activities a
          LEFT JOIN users u ON a.userId = u.uid
          ORDER BY a.timestamp DESC
          LIMIT 250
        `),
        // Activity Metadata
        safeQuery(`
          SELECT am.*, a.eventType, a.userId, a.timestamp
          FROM activity_metadata am
          LEFT JOIN activities a ON am.activityId = a.id
          ORDER BY am.id DESC
          LIMIT 250
        `),
        // User Achievements
        safeQuery(`
          SELECT ua.*, u.username, u.displayName
          FROM user_achievements ua
          LEFT JOIN users u ON ua.userId = u.uid
          ORDER BY ua.unlockedAt DESC, ua.currentProgress DESC
          LIMIT 250
        `),
        // App Config
        safeQuery(`SELECT * FROM app_config ORDER BY config_key ASC`),
        // SMTP Config
        safeQuery(`SELECT * FROM smtp_config`),
        // Email Logs
        safeQuery(`SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 100`),
        // FAQs
        safeQuery(`SELECT * FROM faqs ORDER BY display_order ASC, id ASC`),
        // Blog Posts
        safeQuery(`SELECT * FROM blog_posts ORDER BY id ASC`),
        // Changelog Items
        safeQuery(`SELECT * FROM changelog_items ORDER BY id ASC`),
        // Career Openings
        safeQuery(`SELECT * FROM career_openings ORDER BY id ASC`),
        // Contact Submissions
        safeQuery(`SELECT * FROM contact_submissions ORDER BY id DESC LIMIT 100`),
        // Data Deletion Requests
        safeQuery(`SELECT * FROM data_deletion_requests ORDER BY id DESC LIMIT 100`)
      ]);

      const totalRecordsAcrossDb = Object.values(tableCounts).reduce((acc, v) => acc + v, 0);
      const totalGeminiTokens = (geminiLogs as any[]).reduce((acc, r) => acc + Number(r.totalTokens || 0), 0);
      const totalPromptTokens = (geminiLogs as any[]).reduce((acc, r) => acc + Number(r.promptTokens || 0), 0);
      const totalCandidateTokens = (geminiLogs as any[]).reduce((acc, r) => acc + Number(r.candidateTokens || 0), 0);

      const postTypeBreakdown = {
        reels: (posts as any[]).filter((p) => p.postType === 'reel' || Boolean(p.videoUrl && String(p.videoUrl).trim().length > 0)).length,
        imagePosts: (posts as any[]).filter((p) => p.postType !== 'reel' && !p.videoUrl && p.imageUrl && String(p.imageUrl).trim().length > 0).length,
        textPosts: (posts as any[]).filter((p) => p.postType !== 'reel' && !p.videoUrl && (!p.imageUrl || String(p.imageUrl).trim().length === 0)).length
      };

      const userStats = {
        total: tableCounts['users'] || 0,
        onboarded: (users as any[]).filter((u) => Boolean(u.isOnboarded)).length,
        verified: (users as any[]).filter((u) => Boolean(u.is_verified)).length,
        admins: (users as any[]).filter((u) => Boolean(u.isAdmin) || u.role === 'admin').length,
        privateAccounts: (users as any[]).filter((u) => Boolean(u.isPrivateAccount)).length
      };

      return res.json({
        success: true,
        timestamp: Date.now(),
        summary: {
          totalTables: tableNames.length,
          totalColumns: columnsRaw.length,
          totalRecordsAcrossDb,
          tableCounts,
          userStats,
          postTypeBreakdown,
          geminiStats: {
            calls: tableCounts['gemini_token_logs'] || 0,
            totalTokens: totalGeminiTokens,
            promptTokens: totalPromptTokens,
            candidateTokens: totalCandidateTokens
          }
        },
        schemaTables,
        datasets: {
          users,
          posts,
          postComments,
          stories,
          directMessages,
          userFollows,
          workouts,
          workoutExercises,
          workoutSets,
          workoutTemplates,
          exerciseDefinitions,
          aiExercises,
          coachApplications,
          nutritionLogs,
          foods,
          healthDailySummaries,
          userIntegrations,
          geminiLogs,
          aiSummaries,
          activities,
          activityMetadata,
          userAchievements,
          appConfig,
          smtpConfig,
          emailLogs,
          faqs,
          blogPosts,
          changelogItems,
          careerOpenings,
          contactSubmissions,
          dataDeletionRequests
        }
      });
    } catch (err: any) {
      console.error('Admin Dashboard Error:', err);
      return res.status(500).json({ error: err?.message || 'Failed to load admin dashboard data' });
    }
  },

  // Universal Raw Table & Column Explorer (for all 54 tables)
  getTableExplorer: async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized: Valid PIN 9292 required.' });
    }

    try {
      const meta = await getValidatedTableMeta(String(req.params.tableName || ''));
      if (!meta.valid) {
        return res.status(404).json({ error: `Table '${meta.tableName}' not found in database.` });
      }

      const limit = Math.max(1, Math.min(500, parseInt(String(req.query.limit || '100'), 10) || 100));
      const offset = Math.max(0, parseInt(String(req.query.offset || '0'), 10) || 0);
      const search = String(req.query.search || '').trim();

      const columnNames = meta.columns.map((c) => String(c.Field));

      let whereClause = '';
      const queryParams: any[] = [];

      if (search && columnNames.length > 0) {
        const searchConditions = columnNames.map((col) => `CAST(\`${col}\` AS CHAR) LIKE ?`);
        whereClause = `WHERE ${searchConditions.join(' OR ')}`;
        for (let i = 0; i < columnNames.length; i++) {
          queryParams.push(`%${search}%`);
        }
      }

      const sortBy = String(req.query.sortBy || '').trim();
      const sortOrder = String(req.query.sortOrder || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Order by requested column if valid, else fallback to primary key or timestamp
      let orderClause = '';
      if (sortBy && meta.columnMap[sortBy]) {
        orderClause = `ORDER BY \`${sortBy}\` ${sortOrder}`;
      } else if (meta.columnMap['timestamp']) {
        orderClause = 'ORDER BY `timestamp` DESC';
      } else if (meta.columnMap['createdAt']) {
        orderClause = 'ORDER BY `createdAt` DESC';
      } else if (meta.columnMap['created_at']) {
        orderClause = 'ORDER BY `created_at` DESC';
      } else if (meta.primaryKeys.length > 0) {
        orderClause = `ORDER BY \`${meta.primaryKeys[0]}\` DESC`;
      }

      const [countRows, dataRows] = await Promise.all([
        safeQuery<any[]>(`SELECT COUNT(*) AS cnt FROM \`${meta.tableName}\` ${whereClause}`, queryParams),
        safeQuery<any[]>(
          `SELECT * FROM \`${meta.tableName}\` ${whereClause} ${orderClause} LIMIT ${limit} OFFSET ${offset}`,
          queryParams
        )
      ]);

      return res.json({
        success: true,
        tableName: meta.tableName,
        columns: meta.columns,
        primaryKeys: meta.primaryKeys,
        totalRows: Number(countRows?.[0]?.cnt || 0),
        limit,
        offset,
        rows: dataRows
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Failed to query table' });
    }
  },

  // Universal Create Row (POST /api/admin/table/:tableName/row)
  createTableRow: async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized: Valid PIN 9292 required.' });
    }

    try {
      const meta = await getValidatedTableMeta(String(req.params.tableName || ''));
      if (!meta.valid) {
        return res.status(404).json({ error: `Table '${meta.tableName}' not found.` });
      }

      const rawData: Record<string, any> = req.body?.data || req.body || {};
      const insertCols: string[] = [];
      const insertVals: any[] = [];
      const placeholders: string[] = [];

      for (const col of meta.columns) {
        const field = col.Field;
        const extraLower = String(col.Extra || '').toLowerCase();
        const typeLower = String(col.Type || '').toLowerCase();
        const isAutoInc = extraLower.includes('auto_increment');

        let val = rawData[field];

        // Skip auto_increment primary key if left blank
        if (isAutoInc && (val === undefined || val === null || val === '')) {
          continue;
        }

        // Auto-generate UUID if primary key is a char/varchar (e.g., uid, id) and left blank
        if (
          col.Key === 'PRI' &&
          !isAutoInc &&
          (typeLower.includes('varchar') || typeLower.includes('char') || typeLower.includes('text')) &&
          (val === undefined || val === null || String(val).trim() === '')
        ) {
          val = crypto.randomUUID();
        }

        // Auto-fill millisecond timestamp if bigint timestamp/createdAt is left blank
        if (
          (field === 'timestamp' || field === 'createdAt' || field === 'updatedAt') &&
          typeLower.includes('bigint') &&
          (val === undefined || val === null || val === '')
        ) {
          val = Date.now();
        }

        if (val === undefined) {
          continue;
        }

        insertCols.push(`\`${field}\``);
        insertVals.push(coerceColumnValue(col, val));
        placeholders.push('?');
      }

      if (insertCols.length === 0) {
        return res.status(400).json({ error: 'No valid columns provided for row creation.' });
      }

      const sql = `INSERT INTO \`${meta.tableName}\` (${insertCols.join(', ')}) VALUES (${placeholders.join(', ')})`;
      const [result]: any = await dbPool.query(sql, insertVals);

      return res.json({
        success: true,
        message: `Created new record in '${meta.tableName}'.`,
        insertId: result?.insertId,
        affectedRows: result?.affectedRows || 1
      });
    } catch (err: any) {
      console.error(`[Admin Create Row Error - ${req.params.tableName}]:`, err);
      return res.status(500).json({ error: err?.sqlMessage || err?.message || 'Failed to create record.' });
    }
  },

  // Universal Update Row (PUT /api/admin/table/:tableName/row)
  updateTableRow: async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized: Valid PIN 9292 required.' });
    }

    try {
      const meta = await getValidatedTableMeta(String(req.params.tableName || ''));
      if (!meta.valid) {
        return res.status(404).json({ error: `Table '${meta.tableName}' not found.` });
      }

      const rawData: Record<string, any> = req.body?.data || {};
      let whereKey: Record<string, any> = req.body?.whereKey || {};

      // Fallback: extract primary keys from rawData if whereKey was not separately populated
      if (Object.keys(whereKey).length === 0) {
        for (const pk of meta.primaryKeys) {
          if (rawData[pk] !== undefined) {
            whereKey[pk] = rawData[pk];
          }
        }
      }

      const where = buildWhereClause(whereKey, meta.columnMap, meta.primaryKeys);
      if (!where.sql) {
        return res.status(400).json({ error: `Missing primary key or row identifier for table '${meta.tableName}'.` });
      }

      const setClauses: string[] = [];
      const setParams: any[] = [];

      for (const [key, val] of Object.entries(rawData)) {
        const col = meta.columnMap[key];
        if (!col) continue; // Ignore virtual/joined columns like postsCount, liveLikes, authorUsername

        const extraLower = String(col.Extra || '').toLowerCase();
        if (extraLower.includes('auto_increment') && meta.primaryKeys.includes(key)) {
          continue;
        }

        setClauses.push(`\`${key}\` = ?`);
        setParams.push(coerceColumnValue(col, val));
      }

      if (setClauses.length === 0) {
        return res.status(400).json({ error: 'No valid editable columns submitted.' });
      }

      const sql = `UPDATE \`${meta.tableName}\` SET ${setClauses.join(', ')} ${where.sql} LIMIT 1`;
      const [result]: any = await dbPool.query(sql, [...setParams, ...where.params]);

      return res.json({
        success: true,
        message: `Updated record in '${meta.tableName}'.`,
        affectedRows: result?.affectedRows ?? 0
      });
    } catch (err: any) {
      console.error(`[Admin Update Row Error - ${req.params.tableName}]:`, err);
      return res.status(500).json({ error: err?.sqlMessage || err?.message || 'Failed to update record.' });
    }
  },

  // Universal Delete Row (DELETE /api/admin/table/:tableName/row)
  deleteTableRow: async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized: Valid PIN 9292 required.' });
    }

    try {
      const meta = await getValidatedTableMeta(String(req.params.tableName || ''));
      if (!meta.valid) {
        return res.status(404).json({ error: `Table '${meta.tableName}' not found.` });
      }

      const whereKey: Record<string, any> = req.body?.whereKey || req.query || {};
      const where = buildWhereClause(whereKey, meta.columnMap, meta.primaryKeys);

      if (!where.sql) {
        return res.status(400).json({ error: `Missing primary key identifier to delete row from '${meta.tableName}'.` });
      }

      const sql = `DELETE FROM \`${meta.tableName}\` ${where.sql} LIMIT 1`;
      const [result]: any = await dbPool.query(sql, where.params);

      return res.json({
        success: true,
        message: `Deleted record from '${meta.tableName}'.`,
        affectedRows: result?.affectedRows ?? 0
      });
    } catch (err: any) {
      console.error(`[Admin Delete Row Error - ${req.params.tableName}]:`, err);
      return res.status(500).json({ error: err?.sqlMessage || err?.message || 'Failed to delete record.' });
    }
  },

  // Bulk Table Action (POST /api/admin/table/:tableName/bulk)
  bulkTableAction: async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized: Valid PIN 9292 required.' });
    }

    try {
      const meta = await getValidatedTableMeta(String(req.params.tableName || ''));
      if (!meta.valid) {
        return res.status(404).json({ error: `Table '${meta.tableName}' not found.` });
      }

      const action = String(req.body?.action || '').trim();
      const whereKeys: Record<string, any>[] = Array.isArray(req.body?.whereKeys) ? req.body.whereKeys : [];
      const updateData: Record<string, any> = req.body?.updateData || {};

      if (whereKeys.length === 0) {
        return res.status(400).json({ error: 'No rows selected for bulk operation.' });
      }

      let totalAffected = 0;

      if (action === 'delete') {
        for (const wk of whereKeys) {
          const where = buildWhereClause(wk, meta.columnMap, meta.primaryKeys);
          if (where.sql) {
            const [resDel]: any = await dbPool.query(`DELETE FROM \`${meta.tableName}\` ${where.sql} LIMIT 1`, where.params);
            totalAffected += Number(resDel?.affectedRows || 0);
          }
        }
        return res.json({
          success: true,
          message: `Bulk deleted ${totalAffected} record(s) from '${meta.tableName}'.`,
          affectedRows: totalAffected
        });
      }

      if (action === 'update') {
        const setClauses: string[] = [];
        const setParams: any[] = [];

        for (const [k, v] of Object.entries(updateData)) {
          const col = meta.columnMap[k];
          if (!col) continue;
          setClauses.push(`\`${k}\` = ?`);
          setParams.push(coerceColumnValue(col, v));
        }

        if (setClauses.length === 0) {
          return res.status(400).json({ error: 'No valid update fields specified for bulk update.' });
        }

        for (const wk of whereKeys) {
          const where = buildWhereClause(wk, meta.columnMap, meta.primaryKeys);
          if (where.sql) {
            const [resUpd]: any = await dbPool.query(
              `UPDATE \`${meta.tableName}\` SET ${setClauses.join(', ')} ${where.sql} LIMIT 1`,
              [...setParams, ...where.params]
            );
            totalAffected += Number(resUpd?.affectedRows || 0);
          }
        }

        return res.json({
          success: true,
          message: `Bulk updated ${totalAffected} record(s) in '${meta.tableName}'.`,
          affectedRows: totalAffected
        });
      }

      return res.status(400).json({ error: `Unsupported bulk action '${action}'.` });
    } catch (err: any) {
      console.error(`[Admin Bulk Action Error - ${req.params.tableName}]:`, err);
      return res.status(500).json({ error: err?.sqlMessage || err?.message || 'Bulk operation failed.' });
    }
  },

  // One-Click Android Moderation & Quick Actions (POST /api/admin/quick-action)
  handleQuickAction: async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized: Valid PIN 9292 required.' });
    }

    try {
      const { actionType, uid, id, value, tableName, whereKey, column } = req.body || {};

      if (actionType === 'toggle_user_verified' && uid) {
        const nextVal = value ? 1 : 0;
        await dbPool.query(`UPDATE \`users\` SET \`is_verified\` = ? WHERE \`uid\` = ? LIMIT 1`, [nextVal, uid]);
        return res.json({
          success: true,
          message: `User verification status updated to ${nextVal ? 'Verified' : 'Unverified'}.`
        });
      }

      if (actionType === 'toggle_user_admin' && uid) {
        const nextVal = value ? 1 : 0;
        const nextRole = nextVal ? 'admin' : 'user';
        await dbPool.query(`UPDATE \`users\` SET \`isAdmin\` = ?, \`role\` = ? WHERE \`uid\` = ? LIMIT 1`, [
          nextVal,
          nextRole,
          uid
        ]);
        return res.json({
          success: true,
          message: `User role updated to ${nextRole.toUpperCase()}.`
        });
      }

      if (actionType === 'toggle_user_onboarded' && uid) {
        const nextVal = value ? 1 : 0;
        await dbPool.query(`UPDATE \`users\` SET \`isOnboarded\` = ? WHERE \`uid\` = ? LIMIT 1`, [nextVal, uid]);
        return res.json({
          success: true,
          message: `User onboarding flag set to ${nextVal ? 'Onboarded' : 'Pending'}.`
        });
      }

      if (actionType === 'toggle_user_private' && uid) {
        const nextVal = value ? 1 : 0;
        await dbPool.query(`UPDATE \`users\` SET \`isPrivateAccount\` = ? WHERE \`uid\` = ? LIMIT 1`, [nextVal, uid]);
        return res.json({
          success: true,
          message: `User privacy set to ${nextVal ? 'Private Account' : 'Public Account'}.`
        });
      }

      if (actionType === 'update_coach_status' && (id || uid)) {
        const statusVal = String(value || 'approved');
        
        let targetUid = uid ? String(uid) : undefined;
        let targetId = id ? String(id) : undefined;

        // If UID is missing, try to find it via application ID
        if (!targetUid && targetId) {
          const [appRows]: any = await dbPool.query(
            'SELECT `userId` FROM `coach_applications` WHERE `id` = ? LIMIT 1',
            [targetId]
          );
          if (appRows && appRows.length > 0) {
            targetUid = appRows[0].userId;
          }
        }

        // Update the application status
        if (targetId) {
          await dbPool.query('UPDATE `coach_applications` SET `status` = ? WHERE `id` = ?', [statusVal, targetId]);
        } else if (targetUid) {
          await dbPool.query('UPDATE `coach_applications` SET `status` = ? WHERE `userId` = ?', [statusVal, targetUid]);
        }

        // If approved, set user role to 'coach'
        if (statusVal === 'approved' && targetUid) {
          await dbPool.query("UPDATE `users` SET `role` = 'coach' WHERE `uid` = ?", [targetUid]);
        }

        return res.json({
          success: true,
          message: `Coach application marked as ${statusVal.toUpperCase()}${statusVal === 'approved' && targetUid ? ` and user role set to 'coach'` : ''}.`
        });
      }

      if (actionType === 'toggle_post_type' && id) {
        const nextType = value === 'reel' ? 'reel' : 'post';
        await dbPool.query(`UPDATE \`posts\` SET \`postType\` = ? WHERE \`id\` = ? LIMIT 1`, [nextType, id]);
        return res.json({
          success: true,
          message: `Post ${id} switched to '${nextType}'.`
        });
      }

      if (actionType === 'set_column' && tableName && column && whereKey) {
        const meta = await getValidatedTableMeta(String(tableName));
        if (!meta.valid || !meta.columnMap[column]) {
          return res.status(400).json({ error: 'Invalid table or column for quick update.' });
        }
        const where = buildWhereClause(whereKey, meta.columnMap, meta.primaryKeys);
        if (!where.sql) {
          return res.status(400).json({ error: 'Missing row identifier.' });
        }
        const coerced = coerceColumnValue(meta.columnMap[column], value);
        await dbPool.query(
          `UPDATE \`${meta.tableName}\` SET \`${column}\` = ? ${where.sql} LIMIT 1`,
          [coerced, ...where.params]
        );
        return res.json({
          success: true,
          message: `Updated ${meta.tableName}.${column} successfully.`
        });
      }

      return res.status(400).json({ error: 'Invalid quick action parameters.' });
    } catch (err: any) {
      console.error('[Admin Quick Action Error]:', err);
      return res.status(500).json({ error: err?.sqlMessage || err?.message || 'Quick action failed.' });
    }
  },

  // =========================================================================
  // MEDIA HEALTH & 404 DETECTOR (POSTS, REELS & USER PROFILE PICTURES)
  // =========================================================================
  scanMediaHealth: async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized: Valid PIN 9292 required.' });
    }

    try {
      const scope = String(req.body?.scope || 'all');
      const limitCount = Math.min(Number(req.body?.limit) || 120, 500);

      const candidates: Array<{
        itemType: 'user_photo' | 'post_image' | 'reel_video' | 'reel_cover';
        table: 'users' | 'posts';
        recordId: string;
        recordTitle: string;
        authorHandle: string;
        field: 'photoUrl' | 'avatar' | 'imageUrl' | 'image' | 'videoUrl' | 'coverImageUrl';
        currentUrl: string;
        publicUrl?: string;
      }> = [];

      // 1. Gather User Avatars
      if (scope === 'all' || scope === 'users') {
        const [users]: any = await dbPool.query(
          `SELECT uid, username, displayName, photoUrl, avatar FROM users
           WHERE (photoUrl IS NOT NULL AND TRIM(photoUrl) != '')
              OR (avatar IS NOT NULL AND TRIM(avatar) != '')
           ORDER BY uid DESC LIMIT ?`,
          [limitCount]
        );

        for (const u of users) {
          const url = (u.photoUrl || u.avatar || '').trim();
          if (url) {
            candidates.push({
              itemType: 'user_photo',
              table: 'users',
              recordId: String(u.uid),
              recordTitle: u.displayName || u.username || `User #${u.uid}`,
              authorHandle: u.username ? `@${u.username}` : `UID:${u.uid}`,
              field: u.photoUrl ? 'photoUrl' : 'avatar',
              currentUrl: url,
              publicUrl: `/admin/users`
            });
          }
        }
      }

      // 2. Gather Posts & Reels Media
      if (scope === 'all' || scope === 'posts' || scope === 'reels') {
        const [posts]: any = await dbPool.query(
          `SELECT p.id, p.userId, p.content, p.postType, p.imageUrl, p.videoUrl, p.coverImageUrl, u.username, u.displayName
           FROM posts p
           LEFT JOIN users u ON p.userId = u.uid
           WHERE (p.imageUrl IS NOT NULL AND TRIM(p.imageUrl) != '')
              OR (p.videoUrl IS NOT NULL AND TRIM(p.videoUrl) != '')
              OR (p.coverImageUrl IS NOT NULL AND TRIM(p.coverImageUrl) != '')
           ORDER BY p.id DESC LIMIT ?`,
          [limitCount]
        );

        for (const p of posts) {
          const caption = p.content ? (p.content.length > 55 ? p.content.slice(0, 55) + '…' : p.content) : `Post #${p.id}`;
          const author = p.username ? `@${p.username}` : `UID:${p.userId}`;

          if (p.videoUrl && (scope === 'all' || scope === 'reels')) {
            candidates.push({
              itemType: 'reel_video',
              table: 'posts',
              recordId: String(p.id),
              recordTitle: caption,
              authorHandle: author,
              field: 'videoUrl',
              currentUrl: p.videoUrl.trim(),
              publicUrl: `/post/${p.id}`
            });
          }

          if (p.coverImageUrl && (scope === 'all' || scope === 'reels')) {
            candidates.push({
              itemType: 'reel_cover',
              table: 'posts',
              recordId: String(p.id),
              recordTitle: `${caption} (Cover)`,
              authorHandle: author,
              field: 'coverImageUrl',
              currentUrl: p.coverImageUrl.trim(),
              publicUrl: `/post/${p.id}`
            });
          }

          if (p.imageUrl && (scope === 'all' || scope === 'posts')) {
            candidates.push({
              itemType: 'post_image',
              table: 'posts',
              recordId: String(p.id),
              recordTitle: caption,
              authorHandle: author,
              field: 'imageUrl',
              currentUrl: p.imageUrl.trim(),
              publicUrl: `/post/${p.id}`
            });
          }
        }
      }

      // 3. Batch Check Accessibility with Concurrency Limit
      const brokenItems: any[] = [];
      let healthyCount = 0;
      const startTime = Date.now();
      const BATCH_SIZE = 8;

      for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
        const batch = candidates.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (candidate) => {
            const check = await checkMediaUrlAccessibility(candidate.currentUrl);
            if (!check.accessible) {
              brokenItems.push({
                ...candidate,
                statusCode: check.statusCode,
                errorReason: check.errorReason,
                checkedAt: new Date().toISOString()
              });
            } else {
              healthyCount++;
            }
          })
        );
      }

      return res.json({
        success: true,
        summary: {
          totalScanned: candidates.length,
          healthyCount,
          brokenCount: brokenItems.length,
          scope,
          durationMs: Date.now() - startTime
        },
        brokenItems
      });
    } catch (err: any) {
      console.error('[Media Audit Scan Error]:', err);
      return res.status(500).json({ error: err?.message || 'Media audit scan failed.' });
    }
  },

  // 1-Click / Inline Fix for Broken Media URL
  fixMediaUrl: async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized: Valid PIN 9292 required.' });
    }

    try {
      const { table, id, field, newUrl } = req.body || {};
      if (!table || !id || !field) {
        return res.status(400).json({ error: 'Missing required parameters: table, id, or field.' });
      }

      const allowedFields: Record<string, string[]> = {
        users: ['photoUrl', 'avatar'],
        posts: ['imageUrl', 'image', 'videoUrl', 'coverImageUrl']
      };

      if (!allowedFields[table] || !allowedFields[table].includes(field)) {
        return res.status(400).json({ error: `Invalid field '${field}' for table '${table}'.` });
      }

      const cleanUrl = typeof newUrl === 'string' ? newUrl.trim() : '';

      // Validate new replacement URL if provided
      if (cleanUrl) {
        const check = await checkMediaUrlAccessibility(cleanUrl);
        if (!check.accessible) {
          return res.status(400).json({
            error: `Replacement URL is inaccessible (${check.errorReason || 'HTTP ' + check.statusCode}). Please verify the link.`,
            accessible: false,
            statusCode: check.statusCode
          });
        }
      }

      if (table === 'users') {
        await dbPool.query(`UPDATE \`users\` SET \`${field}\` = ? WHERE \`uid\` = ? LIMIT 1`, [cleanUrl || null, String(id)]);
      } else if (table === 'posts') {
        await dbPool.query(`UPDATE \`posts\` SET \`${field}\` = ? WHERE \`id\` = ? LIMIT 1`, [cleanUrl || null, String(id)]);
      }

      return res.json({
        success: true,
        message: `Successfully updated ${table}.${field} for record #${id}.`,
        table,
        id,
        field,
        newUrl: cleanUrl
      });
    } catch (err: any) {
      console.error('[Fix Media URL Error]:', err);
      return res.status(500).json({ error: err?.message || 'Failed to update media URL.' });
    }
  },

  // Test single URL accessibility
  testMediaUrl: async (req: Request, res: Response) => {
    if (!isAuthorized(req)) {
      return res.status(401).json({ error: 'Unauthorized: Valid PIN 9292 required.' });
    }
    const { url } = req.body || {};
    if (!url) {
      return res.status(400).json({ error: 'Missing URL to test.' });
    }
    const check = await checkMediaUrlAccessibility(String(url));
    return res.json({
      success: true,
      url: String(url),
      ...check
    });
  }
};

// =========================================================================
// HELPER: ROBUST MEDIA ACCESSIBILITY & 404 CHECKER
// =========================================================================
async function checkMediaUrlAccessibility(rawUrl: string): Promise<{ accessible: boolean; statusCode: number; contentType?: string; errorReason?: string }> {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { accessible: false, statusCode: 0, errorReason: 'Empty or blank URL' };
  }
  const trimmed = rawUrl.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    return { accessible: false, statusCode: 0, errorReason: 'Invalid Protocol (must start with http:// or https://)' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    let fetchRes: any;
    try {
      fetchRes = await fetch(trimmed, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*'
        },
        signal: controller.signal
      });
    } catch (headErr: any) {
      // Some media CDNs reject HEAD; fallback to GET with tiny byte range
      fetchRes = await fetch(trimmed, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Range': 'bytes=0-1024',
          'Accept': '*/*'
        },
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const statusCode = Number(fetchRes?.status) || 0;
    const contentType = fetchRes?.headers?.get ? fetchRes.headers.get('content-type') : '';

    if (statusCode === 404) {
      return { accessible: false, statusCode: 404, errorReason: '404 Not Found' };
    }
    if (statusCode === 403) {
      return { accessible: false, statusCode: 403, errorReason: '403 Forbidden / Expired Access' };
    }
    if (statusCode === 410) {
      return { accessible: false, statusCode: 410, errorReason: '410 Gone / Permanently Removed' };
    }
    if (statusCode >= 500) {
      return { accessible: false, statusCode, errorReason: `HTTP ${statusCode} Server Error` };
    }
    if (statusCode >= 400) {
      return { accessible: false, statusCode, errorReason: `HTTP ${statusCode} Client Error` };
    }

    return { accessible: true, statusCode, contentType: contentType || 'media' };
  } catch (err: any) {
    if (err?.name === 'AbortError' || err?.message?.includes('timeout') || err?.message?.includes('aborted')) {
      return { accessible: false, statusCode: 0, errorReason: 'Connection Timed Out (4s)' };
    }
    if (err?.code === 'ENOTFOUND' || err?.message?.includes('ENOTFOUND')) {
      return { accessible: false, statusCode: 0, errorReason: 'DNS Lookup Failed (Invalid Domain)' };
    }
    if (err?.code === 'ECONNREFUSED' || err?.message?.includes('ECONNREFUSED')) {
      return { accessible: false, statusCode: 0, errorReason: 'Connection Refused by Remote Host' };
    }
    return { accessible: false, statusCode: 0, errorReason: err?.message || 'Inaccessible / Network Fetch Failed' };
  }
}
