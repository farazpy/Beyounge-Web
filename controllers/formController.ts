import { Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';
import { query } from '../src/db/mysql.js';

// Initialize Gemini lazily if API key exists
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export const formController = {
  // Contact Form Submission
  handleContact: async (req: Request, res: Response) => {
    try {
      const { name, email, subject, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          error: 'Please fill in all required fields (Name, Email, Message).'
        });
      }

      // Basic email syntax check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Please enter a valid email address.'
        });
      }

      // Log contact request safely
      console.log(`[CONTACT FORM] Received inquiry from ${name} (${email}) - Subject: ${subject || 'General'}`);

      // Try inserting into MySQL database
      try {
        await query(
          'INSERT INTO contact_submissions (name, email, subject, message) VALUES (?, ?, ?, ?)',
          [name, email, subject || 'General', message]
        );
      } catch (dbErr: any) {
        console.warn('MySQL save skipped/failed for contact form:', dbErr.message || dbErr);
      }

      return res.status(200).json({
        success: true,
        message: 'Thank you for contacting Beyounge! Our team will respond within 24 hours.'
      });
    } catch (err) {
      console.error('Contact Form Error:', err);
      return res.status(500).json({
        success: false,
        error: 'An error occurred while processing your request. Please try again.'
      });
    }
  },

  // Newsletter Subscription
  handleNewsletter: async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          error: 'Email address is required.'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email address.'
        });
      }

      console.log(`[NEWSLETTER] New subscriber: ${email}`);

      // Save to MySQL
      try {
        await query(
          'INSERT INTO newsletter_subscribers (email) VALUES (?) ON DUPLICATE KEY UPDATE subscribed_at = CURRENT_TIMESTAMP',
          [email]
        );
      } catch (dbErr: any) {
        console.warn('MySQL save skipped/failed for newsletter:', dbErr.message || dbErr);
      }

      return res.status(200).json({
        success: true,
        message: 'You have successfully subscribed to Beyounge updates and fitness insights!'
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: 'Subscription failed. Please try again later.'
      });
    }
  },

  // Data Deletion Request
  handleDataDeletion: async (req: Request, res: Response) => {
    try {
      const { fullName, email, accountUsername, reason, confirmCheck } = req.body;

      if (!fullName || !email || !confirmCheck) {
        return res.status(400).json({
          success: false,
          error: 'Full name, email, and confirmation check are required to initiate deletion.'
        });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email address provided.'
        });
      }

      const requestId = 'BY-DEL-' + Math.floor(100000 + Math.random() * 900000);
      console.log(`[DATA DELETION REQUEST] ID: ${requestId} | Name: ${fullName} | Email: ${email} | Username: ${accountUsername || 'N/A'}`);

      // Save to MySQL
      try {
        await query(
          'INSERT INTO data_deletion_requests (request_id, full_name, email, account_username) VALUES (?, ?, ?, ?)',
          [requestId, fullName, email, accountUsername || null]
        );
      } catch (dbErr: any) {
        console.warn('MySQL save skipped/failed for data deletion:', dbErr.message || dbErr);
      }

      return res.status(200).json({
        success: true,
        requestId,
        message: `Your data deletion request (${requestId}) has been received. A verification link will be sent to ${email} within 24 hours.`
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: 'Data deletion request failed. Please contact privacy@beyounge.app directly.'
      });
    }
  },

  // Interactive AI Coach Demo (Gemini integration with smart fitness fallback)
  handleAiCoachDemo: async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return res.status(400).json({ error: 'Please enter a valid workout or fitness question.' });
      }

      const userPrompt = prompt.trim();
      const ai = getGenAI();

      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are the AI Coach for Beyounge fitness app. Provide a concise, highly motivating, expert fitness or nutrition advice (maximum 3 bullet points or 100 words) tailored to this user prompt: "${userPrompt}". Focus on evidence-based hypertrophy, strength, or nutrition science with actionable steps.`,
          });

          if (response.text) {
            return res.status(200).json({ response: response.text });
          }
        } catch (geminiError) {
          console.warn('Gemini API call warning:', geminiError);
        }
      }

      // Smart Fallback Recommendations if Gemini API key is unavailable
      let fallbackText = `🔥 **Beyounge AI Coach Protocol**:\n\n1. **Progressive Overload Target**: Focus on maintaining 2-3 Reps In Reserve (RIR) on compound movements to maximize neural drive.\n2. **Macro Allocation**: Target 2.0g protein per kg of bodyweight to support muscle protein synthesis.\n3. **Recovery Focus**: Aim for 7-9 hours of deep sleep tonight to optimize natural growth hormone release.`;

      if (userPrompt.toLowerCase().includes('fat loss') || userPrompt.toLowerCase().includes('weight loss')) {
        fallbackText = `⚡ **AI Weight Loss Protocol**:\n\n1. **Caloric Deficit**: Set a moderate 300-500 kcal daily deficit to preserve lean mass while shedding fat.\n2. **High Protein & Fiber**: Prioritize 1.8g-2.2g protein/kg plus green vegetables to maintain satiety.\n3. **Daily NEAT Target**: Aim for 8,000-10,000 steps daily alongside 3-4 resistance training sessions.`;
      } else if (userPrompt.toLowerCase().includes('muscle') || userPrompt.toLowerCase().includes('hypertrophy') || userPrompt.toLowerCase().includes('bulk')) {
        fallbackText = `💪 **AI Muscle Hypertrophy Protocol**:\n\n1. **Optimal Volume**: Perform 12-16 high-effort working sets per target muscle group per week.\n2. **Mechanical Tension**: Prioritize full range of motion with a controlled 2-second eccentric phase.\n3. **Caloric Surplus**: Maintain a slight +250 kcal surplus rich in complex carbohydrates post-workout.`;
      }

      return res.status(200).json({ response: fallbackText });
    } catch (err) {
      console.error('AI Coach Demo Error:', err);
      return res.status(500).json({ error: 'Failed to generate AI response. Please try again.' });
    }
  },

  // Phone Callback Request Handler
  handleCallback: async (req: Request, res: Response) => {
    try {
      const { name, phone, preferredTime, topic } = req.body;

      if (!name || !phone) {
        return res.status(400).json({
          success: false,
          error: 'Name and Phone Number are required for callback requests.'
        });
      }

      console.log(`[CALLBACK REQUEST] Received from ${name} (${phone}) - Preferred: ${preferredTime || 'ASAP'} | Topic: ${topic || 'General'}`);

      // Save to MySQL
      try {
        await query(
          'INSERT INTO callback_requests (name, phone, preferred_time, topic) VALUES (?, ?, ?, ?)',
          [name, phone, preferredTime || 'ASAP', topic || 'General']
        );
      } catch (dbErr: any) {
        console.warn('MySQL save skipped/failed for callback request:', dbErr.message || dbErr);
      }

      return res.status(200).json({
        success: true,
        message: `Callback scheduled! A Beyounge representative will call ${phone} during ${preferredTime || 'your selected window'}.`
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: 'Failed to schedule callback. Please try again or email support@beyounge.app directly.'
      });
    }
  }
};
