import { Request, Response } from 'express';

export const legalController = {
  getPrivacyPolicy: (req: Request, res: Response) => {
    res.render('pages/privacy', {
      title: 'Privacy Policy | Beyounge Data Protection',
      description: 'Learn how Beyounge collects, uses, and safeguards your personal biometrics, fitness logs, and account information in compliance with GDPR.',
      canonical: '/privacy-policy',
      pageName: 'privacy'
    });
  },

  getTerms: (req: Request, res: Response) => {
    res.render('pages/terms', {
      title: 'Terms & Conditions | Beyounge Terms of Service',
      description: 'Read the official Terms & Conditions governing your access and use of the Beyounge fitness mobile application and website.',
      canonical: '/terms-and-conditions',
      pageName: 'terms'
    });
  },

  getDataDeletion: (req: Request, res: Response) => {
    res.render('pages/data-deletion', {
      title: 'Account Data Deletion Request | Beyounge Privacy',
      description: 'Learn how to request complete deletion of your Beyounge user account, workout history, and biometrics data under GDPR rights.',
      canonical: '/data-deletion',
      pageName: 'data-deletion'
    });
  },

  getCookiePolicy: (req: Request, res: Response) => {
    res.render('pages/cookie-policy', {
      title: 'Cookie Policy | Beyounge Web Analytics & Tracking',
      description: 'Information about how Beyounge uses essential and performance cookies to enhance web navigation and analytics.',
      canonical: '/cookie-policy',
      pageName: 'cookie-policy'
    });
  },

  getRefundPolicy: (req: Request, res: Response) => {
    res.render('pages/refund-policy', {
      title: 'Subscription & Refund Policy | Beyounge Pro',
      description: 'Official Beyounge Pro subscription cancellation, Google Play billing, trial terms, and refund policy guidelines.',
      canonical: '/refund-policy',
      pageName: 'refund-policy'
    });
  },

  getCommunityGuidelines: (req: Request, res: Response) => {
    res.render('pages/community-guidelines', {
      title: 'Community Guidelines | Beyounge Safe Fitness Space',
      description: 'Our community standards for workout sharing, challenges, leaderboards, and maintaining a respectful, encouraging space.',
      canonical: '/community-guidelines',
      pageName: 'community-guidelines'
    });
  },

  getAccessibility: (req: Request, res: Response) => {
    res.render('pages/accessibility', {
      title: 'Accessibility Statement | Beyounge Digital Inclusion',
      description: 'Beyounge commitment to web and mobile accessibility standards (WCAG 2.1 AA) for all users regardless of ability.',
      canonical: '/accessibility-statement',
      pageName: 'accessibility'
    });
  }
};
