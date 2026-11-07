import { Request, Response } from 'express';
import { GoogleGenAI, Type } from "@google/genai";
import crypto from 'crypto';
import { dbPool } from '../src/db/mysql.js';

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const MODEL_NAME = "gemini-3.1-flash-lite";

async function safeQuery<T = any>(sql: string, params?: any[]): Promise<T> {
  const [results] = await dbPool.query(sql, params);
  return results as T;
}

export const aiController = {
  // Generate and Publish a Post
  generateAndPublishPost: async (req: Request, res: Response) => {
    const { topic, userId, postType = 'post' } = req.body;

    if (!topic || !userId) {
      return res.status(400).json({ error: 'Topic and UserId are required.' });
    }

    try {
      // 1. Generate content using Gemini
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Generate a short, engaging fitness/wellness social media post about "${topic}". Just return the post text, no hashtags unless relevant, no quotes.`,
      });

      const content = response.text?.trim() || `Just finished a great workout focused on ${topic}!`;

      // 2. Insert into DB
      const postId = crypto.randomUUID();
      const timestamp = Date.now();

      await safeQuery(
        'INSERT INTO posts (id, userId, content, postType, privacy, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        [postId, userId, content, postType, 'public', timestamp]
      );

      return res.json({
        success: true,
        message: 'AI Post generated and published.',
        post: { id: postId, content, userId }
      });
    } catch (err: any) {
      console.error('[AI Post Generation Error]:', err);
      return res.status(500).json({ error: err.message || 'Failed to generate post.' });
    }
  },

  // Generate Dummy Likes
  generateDummyLikes: async (req: Request, res: Response) => {
    const { postId, count = 5 } = req.body;

    if (!postId) {
      return res.status(400).json({ error: 'PostId is required.' });
    }

    try {
      // 1. Get random users
      const randomUsers: any[] = await safeQuery(
        'SELECT uid FROM users ORDER BY RAND() LIMIT ?',
        [Math.min(count, 50)]
      );

      if (randomUsers.length === 0) {
        return res.status(400).json({ error: 'No users found to create likes.' });
      }

      let added = 0;
      for (const user of randomUsers) {
        try {
          await safeQuery(
            'INSERT IGNORE INTO post_likes (postId, userId, timestamp) VALUES (?, ?, ?)',
            [postId, user.uid, Date.now()]
          );
          added++;
        } catch (e) {
          // Ignore duplicates
        }
      }

      return res.json({
        success: true,
        message: `Generated ${added} dummy likes for post ${postId}.`
      });
    } catch (err: any) {
      console.error('[AI Likes Generation Error]:', err);
      return res.status(500).json({ error: err.message || 'Failed to generate likes.' });
    }
  },

  // Generate Dummy Comments
  generateDummyComments: async (req: Request, res: Response) => {
    const { postId, count = 3 } = req.body;

    if (!postId) {
      return res.status(400).json({ error: 'PostId is required.' });
    }

    try {
      // 1. Get the post content to give context to Gemini
      const postRows: any = await safeQuery('SELECT content FROM posts WHERE id = ?', [postId]);
      if (postRows.length === 0) {
        return res.status(404).json({ error: 'Post not found.' });
      }
      const postContent = postRows[0].content;

      // 2. Generate comments using Gemini
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: `Based on this post: "${postContent}", generate ${count} short, positive, and realistic social media comments. Return them as a JSON array of strings.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      const comments: string[] = JSON.parse(response.text || '[]');

      // 3. Get random users
      const randomUsers: any[] = await safeQuery(
        'SELECT uid FROM users ORDER BY RAND() LIMIT ?',
        [comments.length]
      );

      if (randomUsers.length === 0) {
        return res.status(400).json({ error: 'No users found to create comments.' });
      }

      let added = 0;
      for (let i = 0; i < comments.length; i++) {
        const user = randomUsers[i % randomUsers.length];
        const commentId = crypto.randomUUID();
        await safeQuery(
          'INSERT INTO post_comments (id, postId, userId, content, timestamp) VALUES (?, ?, ?, ?, ?)',
          [commentId, postId, user.uid, comments[i], Date.now()]
        );
        added++;
      }

      return res.json({
        success: true,
        message: `Generated ${added} dummy comments for post ${postId}.`,
        comments
      });
    } catch (err: any) {
      console.error('[AI Comments Generation Error]:', err);
      return res.status(500).json({ error: err.message || 'Failed to generate comments.' });
    }
  }
};
