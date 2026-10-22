import { Router } from 'express';
import { formController } from '../controllers/formController.js';

const router = Router();

router.post('/contact', formController.handleContact);
router.post('/newsletter', formController.handleNewsletter);
router.post('/data-deletion', formController.handleDataDeletion);
router.post('/ai-coach-demo', formController.handleAiCoachDemo);
router.post('/callback', formController.handleCallback);

export default router;
