import { Router } from 'express';
import { pageController } from '../controllers/pageController.js';

const router = Router();

router.get('/', pageController.getHome);
router.get('/feed', pageController.getFeed);
router.get('/features', pageController.getFeatures);
router.get('/benefits', pageController.getBenefits);
router.get('/ai-coach', pageController.getAiCoach);
router.get('/about', pageController.getAbout);
router.get('/contact', pageController.getContact);
router.get('/faq', pageController.getFaq);
router.get('/blog', pageController.getBlog);
router.get('/blog/:slug', pageController.getBlogDetail);
router.get('/download', pageController.getDownload);
router.get('/changelog', pageController.getChangelog);
router.get('/careers', pageController.getCareers);
router.get('/press-kit', pageController.getPressKit);
router.get('/sitemap', pageController.getSitemapPage);

export default router;
