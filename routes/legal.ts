import { Router } from 'express';
import { legalController } from '../controllers/legalController.js';

const router = Router();

router.get('/privacy-policy', legalController.getPrivacyPolicy);
router.get('/terms-and-conditions', legalController.getTerms);
router.get('/data-deletion', legalController.getDataDeletion);
router.get('/cookie-policy', legalController.getCookiePolicy);
router.get('/refund-policy', legalController.getRefundPolicy);
router.get('/community-guidelines', legalController.getCommunityGuidelines);
router.get('/accessibility-statement', legalController.getAccessibility);

export default router;
