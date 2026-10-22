import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import indexRouter from './routes/index.js';
import legalRouter from './routes/legal.js';
import apiRouter from './routes/api.js';
import { initDatabase, query } from './src/db/mysql.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Set EJS View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Static Assets
app.use(express.static(path.join(process.cwd(), 'public')));

// Serve Robots.txt & Sitemap.xml
app.get('/robots.txt', (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'robots.txt'));
});

app.get('/sitemap.xml', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/xml');
  res.sendFile(path.join(process.cwd(), 'sitemap.xml'));
});

// Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Beyounge Web Platform', timestamp: new Date().toISOString() });
});

// Database Connection Test Endpoint
app.get('/api/db-status', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT 1 + 1 AS test_connection');
    res.json({
      status: 'connected',
      mysqlHost: process.env.DBHOST || process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
      mysqlPort: process.env.DBPORT || process.env.DB_PORT || process.env.MYSQL_PORT || '3306',
      database: process.env.DBNAME || process.env.DB_NAME || process.env.MYSQL_DATABASE || 'beyounge',
      testQueryResult: result
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'disconnected_or_error',
      mysqlHost: process.env.DBHOST || process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
      mysqlPort: process.env.DBPORT || process.env.DB_PORT || process.env.MYSQL_PORT || '3306',
      database: process.env.DBNAME || process.env.DB_NAME || process.env.MYSQL_DATABASE || 'beyounge',
      error: err.message || err
    });
  }
});

// Mount Routes
app.use('/', indexRouter);
app.use('/', legalRouter);
app.use('/api', apiRouter);

// 404 Catch-All Handler
app.use((req: Request, res: Response) => {
  res.status(404).render('pages/404', {
    title: 'Page Not Found | Beyounge',
    description: 'The page you requested could not be found.',
    canonical: req.path,
    pageName: '404'
  });
});

// Start Server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Beyounge Express EJS Server running on http://0.0.0.0:${PORT}`);
  await initDatabase();
});
