import express from 'express';
import {
  getIntakeSchema,
  updateIntakeQuestion,
  deleteIntakeQuestion,
  getAdminExercises,
  saveAdminExercise,
  deleteAdminExercise,
  getSubscriptionPackages,
  saveSubscriptionPackage,
  deleteSubscriptionPackage,
  getAdminFoods,
  saveAdminFood,
  deleteAdminFood,
  getAdminSystemSettings,
  saveAdminSystemSettings,
  getAdminCacheStats
} from '../controllers/admin-settings.controller.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// 1. Intake Schema Builder
router.get('/intake-schema', requireAuth, requireAdmin, getIntakeSchema);
router.post('/intake-schema/question', requireAuth, requireAdmin, (req, res) => updateIntakeQuestion(req, res));
router.put('/intake-schema/question/:id', requireAuth, requireAdmin, updateIntakeQuestion);
router.delete('/intake-schema/question/:id', requireAuth, requireAdmin, deleteIntakeQuestion);

// 2. Exercise Catalog & Video Manager
router.get('/exercises', requireAuth, requireAdmin, getAdminExercises);
router.post('/exercises', requireAuth, requireAdmin, saveAdminExercise);
router.put('/exercises/:id', requireAuth, requireAdmin, (req, res) => {
  req.body.id = req.params.id;
  return saveAdminExercise(req, res);
});
router.delete('/exercises/:id', requireAuth, requireAdmin, deleteAdminExercise);

// 3. Subscription Packages & Pricing Manager
router.get('/packages', requireAuth, requireAdmin, getSubscriptionPackages);
router.post('/packages', requireAuth, requireAdmin, saveSubscriptionPackage);
router.put('/packages/:id', requireAuth, requireAdmin, (req, res) => {
  req.body.id = req.params.id;
  return saveSubscriptionPackage(req, res);
});
router.delete('/packages/:id', requireAuth, requireAdmin, deleteSubscriptionPackage);

// 4. Food & Nutrition Catalog Manager
router.get('/foods', requireAuth, requireAdmin, getAdminFoods);
router.post('/foods', requireAuth, requireAdmin, saveAdminFood);
router.put('/foods/:id', requireAuth, requireAdmin, (req, res) => {
  req.body.id = req.params.id;
  return saveAdminFood(req, res);
});
router.delete('/foods/:id', requireAuth, requireAdmin, deleteAdminFood);

// 5. Global System & Coach Settings
router.get('/system', requireAuth, requireAdmin, getAdminSystemSettings);
router.post('/system', requireAuth, requireAdmin, saveAdminSystemSettings);
router.put('/system', requireAuth, requireAdmin, saveAdminSystemSettings);
router.get('/settings/system', requireAuth, requireAdmin, getAdminSystemSettings);
router.post('/settings/system', requireAuth, requireAdmin, saveAdminSystemSettings);
router.put('/settings/system', requireAuth, requireAdmin, saveAdminSystemSettings);

// 6. In-Memory Cache Monitoring
router.get('/cache-stats', requireAuth, requireAdmin, getAdminCacheStats);

export default router;

