import { Router } from 'express';
import { formController } from '../controllers/formController.js';
import { adminController } from '../controllers/adminController.js';

const router = Router();

router.post('/contact', formController.handleContact);
router.post('/newsletter', formController.handleNewsletter);
router.post('/data-deletion', formController.handleDataDeletion);
router.post('/ai-coach-demo', formController.handleAiCoachDemo);
router.post('/callback', formController.handleCallback);

// Executive Admin Console & Full 54-Table CRUD Endpoints (Protected by PIN 9292)
router.post('/admin/verify-pin', adminController.verifyPin);
router.get('/admin/dashboard', adminController.getDashboardData);
router.get('/admin/table/:tableName', adminController.getTableExplorer);
router.post('/admin/table/:tableName/row', adminController.createTableRow);
router.put('/admin/table/:tableName/row', adminController.updateTableRow);
router.delete('/admin/table/:tableName/row', adminController.deleteTableRow);
router.post('/admin/table/:tableName/bulk', adminController.bulkTableAction);
router.post('/admin/quick-action', adminController.handleQuickAction);

export default router;
