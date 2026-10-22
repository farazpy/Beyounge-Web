# Beyounge - AI-Powered Fitness & Wellness Platform

Official web landing platform for **Beyounge**, the premium AI-powered fitness, workout, nutrition tracking, and wellness Android application.

## 🌟 Overview

Beyounge is designed to help users train smarter and live stronger. This web repository showcases the Beyounge mobile application, presents science-backed features, improves search engine indexing (SEO), and drives app downloads on Google Play.

## 🚀 Key Features

* **Flat Premium Dark Architecture**: Custom luxury dark design system built with modern CSS variables, glassmorphism cards, glowing ambient gradients, and smooth scroll animations.
* **Full Mobile-First Design**: Responsive across smartphones, tablets, laptops, and ultra-wide desktops.
* **Interactive AI Coach Live Demo**: Visitors can test Beyounge's AI Coach in real-time powered by server-side Gemini 2.5 Flash API with smart fitness fallback.
* **Interactive App Screen Switcher**: Toggle between Workouts, Nutrition, and Analytics views inside an animated smartphone frame mockup.
* **Complete Pages Ecosystem**:
  - **Home**: Hero, Statistics Counter, AI Coach Playground, How it Works, Feature Grid, Testimonials, FAQs, Latest Blog Updates.
  - **Features**: Deep dive into AI Coach, Workout Builder, Video Library, Photo Macro Scanner, PR Benchmarks, and Offline DB.
  - **Benefits**: Specialized value propositions for beginners, busy professionals, muscle builders, weight loss seekers, women, and home gym users.
  - **AI Coach**: Detailed breakdown of adaptive periodization, HRV readiness scoring, and injury prevention.
  - **About**: Company story, mission, core values, and product roadmap.
  - **Contact**: Interactive contact form with server validation, business contacts, and map frame.
  - **Searchable FAQ**: Instant keyword filter across all common questions.
  - **Blog & Detail View**: Fitness science articles and category filters.
  - **Download Page**: Google Play CTA, QR code scanner, coming soon badges for iOS/Web, and system requirements.
  - **Legal & Compliance**: Privacy Policy, Terms & Conditions, Data Deletion Request Form with reference ID generation, Cookie Policy, Refund Policy, Community Guidelines, and Accessibility Statement.
  - **Careers & Press Kit**: Job listings and downloadable brand color codes & SVG logo assets.
  - **Changelog & Sitemap**: Product version timeline and human-readable site directory.

## 🛠️ Tech Stack

* **Runtime**: Node.js & Express.js
* **Template Engine**: EJS (Embedded JavaScript)
* **Styling**: Modern Vanilla CSS with CSS Variables, Flexbox, and CSS Grid
* **Scripting**: Vanilla JavaScript (ES2022) with IntersectionObserver for animations
* **AI Integration**: `@google/genai` (Gemini 2.5 Flash)
* **SEO**: OpenGraph, Twitter Cards, JSON-LD Schema markup, `sitemap.xml`, and `robots.txt`

## 📁 Project Structure

```
beyounge-web/
├── server.ts                 # Express application entry point
├── package.json              # Project dependencies and build scripts
├── routes/
│   ├── index.ts              # Main page routes
│   ├── legal.ts              # Privacy and legal routes
│   └── api.ts                # API endpoints (Contact, Newsletter, AI Coach, Data Deletion)
├── controllers/
│   ├── pageController.ts     # Page data and view rendering
│   ├── formController.ts     # Server validation & AI Coach logic
│   └── legalController.ts    # Policy pages controller
├── views/
│   ├── partials/             # Head, Header, Footer, CTA, StructuredData
│   └── pages/                # All 22 EJS page views
├── public/
│   ├── css/styles.css        # Premium dark mode stylesheet
│   ├── js/                   # main.js, animations.js, forms.js
│   └── images/               # Favicon and brand assets
├── sitemap.xml               # XML Sitemap for search engines
├── robots.txt                # Search crawler instructions
└── README.md
```

## 💻 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

3. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

## 🔒 Security & Compliance

* **GDPR Ready**: Includes a dedicated Data Deletion request workflow with reference tracking.
* **Server-side Validation**: All forms enforce strict data validation and sanitization.
* **Zero Client API Key Leakage**: Gemini API keys are maintained exclusively on the Express server.
