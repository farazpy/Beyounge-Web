# Beyounge WordPress-Style Executive Admin CMS & Full 54-Table Database Manager

Transform the `/admin` console (PIN `9292`) into a WordPress-inspired (`wp-admin`) high-density administration suite with full Create, Read, Update, and Delete (CRUD) capabilities across all **54 shared Android & Web MySQL tables**, specialized rich editors for Users, Posts/Reels, Workouts, and Coaches, one-click Android moderation workflows, and bulk operations—while strictly preserving the existing MySQL schema without altering any tables or columns.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> All core product and design preferences have been confirmed in Phase 1 and are incorporated into this plan. No database DDL changes (`ALTER`, `DROP`, `CREATE TABLE`) will ever be executed; all operations strictly read and mutate rows within the existing 54 tables used by the Beyounge Android app.

- **Confirmed Decision 1 — Classic WordPress (`wp-admin`) Visual Posture**: Fixed dark charcoal-slate left navigation sidebar (`#1d2327` / `#2c3338`) with expandable sub-menus and live row counts, paired with a clean, high-density light workspace canvas (`#f0f0f1` background, `#ffffff` single-elevation panels, `#2271b1` WordPress admin blue accents, and crisp `1px` borders).
- **Confirmed Decision 2 — Full 54-Table CRUD**: Complete row-level Create, Read, Update, and Delete support across every table in the shared MySQL database, dynamically introspecting primary keys (such as `uid`, `id`, `config_key`, or composite keys) and column data types from `information_schema.COLUMNS`.
- **Confirmed Decision 3 — Rich Editors, One-Click Android Moderation & Bulk Actions**:
  - Dedicated WordPress-style two-column editor screens (main form canvas + right-hand "Publish / Status / Meta Box" sidebar) for **Users (46 columns)**, **Posts & Reels (22 columns)**, **Workouts & Exercises**, **Coach Applications**, and **System/Website CMS**.
  - Instant one-click Android app moderation actions directly from table rows (Verify/Unverify User, Grant/Revoke Admin, Approve/Reject Coach Application, Toggle Post/Reel Type, Reset User Streaks/Points).
  - WordPress-style bulk action bar (Select All checkboxes, Bulk Delete, Bulk Field Update, and CSV Export) plus quick inline "Quick Edit" and full modal/drawer "Edit Record" across all 54 tables.

---

### 1. Overview & Core Concept

- **What It Does**: Provides a centralized, production-grade backend administration system modeled after WordPress `wp-admin` that lets administrators inspect, create, edit, moderate, and delete records across all 54 MySQL tables shared between the Beyounge Android application and web platform.
- **Target Audience / Persona**: Beyounge platform administrators, community moderators, fitness content managers, and operations engineers managing live Android app users and content.
- **Key Value**: Bridges the Android mobile app and web platform with immediate operational control—allowing admins to edit any of the 46 fields on a user profile, manage Reels and Posts, approve coaches, update workout/food libraries, tune app configurations, and perform raw row edits on any of the 54 database tables from a single unified interface.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **PIN `9292` Security Gate**: Administrators unlock `/admin` via the 4-digit PIN pad (persisted in `sessionStorage` for seamless session continuity and validated via `x-admin-pin: 9292` on every read/write API request).
  2. **WordPress-Style Left Navigation & Top Admin Bar**:
     - A persistent `32px`/`44px` top admin bar displays live database status, quick "+ New" creation shortcuts (`+ New User`, `+ New Post/Reel`, `+ New Exercise`, `+ New Food`, `+ New Table Row`), global search, and a one-click Refresh data button.
     - The left `250px` dark sidebar organizes all 54 tables into intuitive WordPress-style menu groups: **Dashboard (At a Glance)**, **Users & Profiles**, **Posts & Reels**, **Social & Messaging**, **Workouts & Exercises**, **Coaches & Sessions**, **Nutrition & Health Connect**, **AI & Telemetry Logs**, **Website CMS & Config**, and **All 54 Tables (Universal CRUD Explorer)**.
  3. **WordPress List Tables with Status Views, Quick Actions & Bulk Bar**:
     - Above each data table, clean status filter links (`All (405) | Verified (12) | Onboarded (380) | Admins (3)`) and a Bulk Actions dropdown (`Bulk Delete`, `Mark Verified`, `Export Selected CSV`) with `Apply` button mirror the familiar WordPress post/user list experience.
     - Hovering any row reveals classic WordPress row action links right below the primary title: `Edit | Quick Edit | View Full JSON | Delete`, alongside one-click Android moderation toggles.
  4. **Dedicated WordPress Two-Column Editor Drawer / View**:
     - Clicking **Edit** on a User, Post/Reel, Workout, Coach Application, or CMS item opens a comprehensive WordPress-style two-column editor:
       - **Left Primary Column (70% width)**: Grouped fieldsets covering every database column (e.g., for `users`: Identity & Auth, Physical & Biometric Profile, Fitness Goals & Coaching Preferences, Gamification & Streaks, Privacy & Notification Flags, Health Connect Sync).
       - **Right Meta-Box Column (30% width)**: WordPress "Publish / Save Changes" box with primary key info, timestamps, quick status toggles (Verified, Admin, Onboarded, Private Account), live media preview (profile photo or Reel video player), and a danger-zone Delete button.
  5. **Universal 54-Table Dynamic CRUD**:
     - Selecting any of the 54 tables in the **Database Explorer** (or clicking any table card on the Dashboard) loads its live schema definition (`SHOW COLUMNS`), primary key metadata, paginated rows, and a dynamic **"+ Add New Row"** / **"Edit Row"** form generator that adapts inputs to each column's SQL type (`INT`, `DOUBLE`, `TINYINT(1)` toggle, `TEXT` textarea, `ENUM` select, `BIGINT` timestamp helper).

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Classic WordPress Admin (`wp-admin`) utilitarian precision combined with modern SaaS tabular clarity.
  - *Color Palette & Mood*:
    - Admin Bar & Sidebar Background: `#1d2327` (Deep WP Charcoal) with `#2c3338` hover surface and `#72aee6` / `#2271b1` active indicator bar.
    - Workspace Canvas: `#f0f0f1` (Classic WP Light Neutral Gray) with `#ffffff` content boxes and `#c3c4c7` / `#dcdcde` 1px structural borders.
    - Primary Interactive Accent: `#2271b1` (WP Admin Blue, hover `#135e96`) for primary action buttons, links, and active tabs.
    - Semantic Status Tokens: `#00a32a` (Nominal / Verified / Published), `#dba617` (Pending / Warning), `#d63638` (Delete / Destructive / Error).
  - *Typography & Hierarchy*:
    - Headings & Navigation: `Plus Jakarta Sans` (`600`–`700` weight) for crisp section headers and menu labels.
    - High-Density Data Tables & Forms: `Public Sans` / system UI sans at `13px` (`0.8125rem`) for effortless scanning across wide multi-column tables.
    - Tabular Numerals & Keys: `JetBrains Mono` (`tabular-nums`) for all UUIDs, primary keys, timestamps, token counts, and workout/nutrition metrics.
  - *Component Styling & Layout*:
    - Single-elevation white meta-boxes (`border border-[#c3c4c7] bg-white shadow-xs`) with classic WordPress header bars (`px-4 py-3 border-b border-[#c3c4c7] font-semibold text-[#1d2327]`).
    - Compact `38px`–`44px` table rows with alternating subtle zebra striping (`odd:bg-white even:bg-[#f6f7f7]`) and instant hover action links.

- **Interactive Feedback & Motion**:
  - Top-of-page WordPress-style dismissible admin notices (`border-l-4 border-[#00a32a] bg-white px-4 py-3 shadow-xs`) confirming row creation, column updates, moderation toggles, or bulk deletions in real time.
  - Confirmation safeguard modal before executing destructive `DELETE` or bulk delete operations on live Android database rows.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Schema-Driven Dynamic CRUD Engine vs. Hardcoded Table Endpoints**
  - *Chosen Approach*: Build a schema-introspecting CRUD engine in the admin controller that validates table names and column names against `information_schema.COLUMNS` and `SHOW KEYS`, paired with specialized rich form layouts for high-frequency Android entities (`users`, `posts`, `workouts`, `coach_applications`, `nutrition_logs`, `foods`, `app_config`).
  - *Why*: The database has 54 tables (ranging from 46-column `users` to `workout_log_sets`, `stories`, `direct_messages`, and `health_connect_daily_summaries`). Dynamic schema introspection guarantees 100% of tables and columns are editable immediately while specialized editors make everyday user/post management effortless.
  - *Alternatives Considered*: Writing 54 separate hardcoded CRUD endpoints, which would be brittle and repetitive.
- **Decision 2: Primary Key & Composite Key Resolution for Safe Row Updates/Deletes**
  - *Chosen Approach*: Automatically detect each table's primary key column(s) (`PRI` in `SHOW COLUMNS`)—such as `uid` in `users`, `id` in `posts`, `config_key` in `app_config`, or composite keys in join tables like `post_likes` (`postId`, `userId`) and `user_follows` (`followerId`, `followingId`)—and pass a structured `whereKey` dictionary when updating or deleting a specific row.
  - *Why*: Ensures every single table in the 54-table schema can be edited or deleted safely without assuming an `id` column exists on every table.
- **Decision 3: Strictly Zero DDL / Schema Mutations**
  - *Chosen Approach*: Whitelist only `SELECT`, `INSERT`, `UPDATE`, and `DELETE` parameterized queries against existing validated tables and columns, stripping computed virtual columns (like `postsCount` or `liveLikes` joined in read queries) before `UPDATE`/`INSERT`.
  - *Why*: Preserves 100% compatibility with the live Beyounge Android app in production.

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:
```
┌──────────────────────────────────────────────────────────────────────────────┐
│                  Beyounge WordPress-Style Admin Console (/admin)             │
├──────────────────────┬───────────────────────────────────────────────────────┤
│ WP Dark Admin Bar    │ + New (User/Post/Row) | Global Search | DB Sync | PIN │
├──────────────────────┼───────────────────────────────────────────────────────┤
│ WP Left Sidebar      │ Main Light Workspace (#f0f0f1)                        │
│ (#1d2327, 250px)     │ ┌───────────────────────────────────────────────────┐ │
│                      │ │ WP Screen Header + Status Filter Links + Bulk Bar │ │
│ • Dashboard          │ └───────────────────────────────────────────────────┘ │
│ • Users (46 cols)    │ ┌───────────────────────────────────────────────────┐ │
│ • Posts & Reels (22) │ │ High-Density WP List Table                        │ │
│ • Comments & Social  │ │ [x] Row Title + Hover Actions:                    │ │
│ • Workouts & Sets    │ │     Edit | Quick Edit | Inspect JSON | Delete     │ │
│ • Coaches & Apps     │ └───────────────────────────────────────────────────┘ │
│ • Nutrition & Foods  │ ┌──────────────────────────────────┬────────────────┐ │
│ • Health Connect     │ │ Two-Column Rich Editor Drawer    │ Publish / Meta │ │
│ • Gemini AI & Logs   │ │ • Grouped Fieldsets (All Cols)   │ • Save Changes │ │
│ • Website & Config   │ │ • Live Media / Reel Preview      │ • Quick Status │ │
│ • All 54 Tables CRUD │ │ • Raw Column Type Validation     │ • Delete Row   │ │
│                      │ └──────────────────────────────────┴────────────────┘ │
└──────────────────────┴───────────────────────────┬───────────────────────────┘
                                                   │ REST API (x-admin-pin: 9292)
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     Admin Controller & Schema Validator                      │
│  • GET    /api/admin/dashboard                (54-table overview + datasets) │
│  • GET    /api/admin/table/:tableName         (Paginated rows + PK metadata) │
│  • POST   /api/admin/table/:tableName/row     (Create row in any table)      │
│  • PUT    /api/admin/table/:tableName/row     (Update row by PK/composite)   │
│  • DELETE /api/admin/table/:tableName/row     (Delete row by PK/composite)   │
│  • POST   /api/admin/table/:tableName/bulk    (Bulk delete / bulk update)    │
│  • POST   /api/admin/quick-action             (Verify user, approve coach,   │
│                                                toggle reel/post, etc.)       │
└──────────────────────────────────────────────────┬───────────────────────────┘
                                                   │ mysql2/promise Pool
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                Shared Production MySQL Database (54 Tables)                  │
│   users (46 cols) | posts (22 cols) | workouts | nutrition_logs | foods ...  │
└──────────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - **Primary Key Introspection**: Every table query inspects `COLUMN_KEY === 'PRI'`. If a table has a single primary key (`uid`, `id`, `config_key`, `slug`), updates and deletes target `WHERE \`pk\` = ?`. If a table uses a composite primary key (e.g., `post_likes` with `postId` + `userId`, or `user_achievements` with `userId` + `achievementId`), updates and deletes target all key columns simultaneously.
  - **Editable Column Sanitization**: When saving a User or Post from the rich editor, the backend cross-references submitted fields against `SHOW COLUMNS FROM \`tableName\``, automatically ignoring read-only joined aliases (like `authorUsername`, `liveLikes`, `postsCount`) and coercing booleans (`TINYINT(1)`), numbers (`INT`, `DOUBLE`, `BIGINT`), and nullable values accurately.

- **Interactive Component & State Mapping**:
  - **Rich User Editor (All 46 `users` Columns)**:
    - *Identity & Account*: `uid`, `username`, `displayName`, `email`, `phoneNumber`, `photoUrl`, `bio`, `role`, `isAdmin`, `is_verified`, `isOnboarded`, `isPrivateAccount`, `registrationIp`.
    - *Body & Biometrics*: `age`, `dateOfBirth`, `gender`, `heightCm`, `weightKg`, `targetWeightKg`, `bodyFatPercentage`, `fitnessLevel`, `activityLevel`.
    - *Goals, Coaching & AI*: `fitnessGoal`, `primaryGoal`, `workoutDaysPerWeek`, `preferredWorkoutDuration`, `dietaryPreference`, `allergies`, `medicalConditions`, `injuries`, `equipmentAccess`, `aiCoachTone`.
    - *Streaks, Gamification & Social*: `currentStreak`, `longestStreak`, `lastActiveDate`, `xpPoints`, `level`, `followersCount`, `followingCount`, `postsCount`.
  - **Rich Post & Reel Editor (All 22 `posts` Columns)**:
    - *Content & Media*: `id`, `userId`, `postType` (`post` / `reel`), `content`, `imageUrl`, `videoUrl`, `thumbnailUrl`, `aspectRatio`, `durationSeconds`, `audioTrackName`.
    - *Metrics, Tags & Visibility*: `likes`, `commentsCount`, `sharesCount`, `viewsCount`, `hashtags`, `location`, `visibility`, `isPinned`, `isArchived`, `workoutId`, `timestamp`.
    - Includes live preview of the image or HTML5 video reel inside the right-hand meta box.
  - **One-Click Moderation & Bulk Operations**:
    - Toggling a user's `is_verified` or `isAdmin` status, approving a `coach_applications` record (`status = 'approved'`), or switching a post between `post` and `reel` executes an immediate `PUT` request, updates the local state row, and displays a WordPress admin notice without losing scroll position.
    - Selecting multiple checkboxes in any table enables the top Bulk Action bar to delete selected rows or batch-update a column (such as setting `is_verified = 1` or `postType = 'reel'`) in a single transaction.
