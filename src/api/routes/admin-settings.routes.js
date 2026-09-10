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
  saveAdminSystemSettings
} from '../controllers/admin-settings.controller.js';

const router = express.Router();

// 1. Intake Schema Builder
router.get('/intake-schema', getIntakeSchema);
router.post('/intake-schema/question', (req, res) => updateIntakeQuestion(req, res));
router.put('/intake-schema/question/:id', updateIntakeQuestion);
router.delete('/intake-schema/question/:id', deleteIntakeQuestion);

// 2. Exercise Catalog & Video Manager
router.get('/exercises', getAdminExercises);
router.post('/exercises', saveAdminExercise);
router.put('/exercises/:id', (req, res) => {
  req.body.id = req.params.id;
  return saveAdminExercise(req, res);
});
router.delete('/exercises/:id', deleteAdminExercise);

// 3. Subscription Packages & Pricing Manager
router.get('/packages', getSubscriptionPackages);
router.post('/packages', saveSubscriptionPackage);
router.put('/packages/:id', (req, res) => {
  req.body.id = req.params.id;
  return saveSubscriptionPackage(req, res);
});
router.delete('/packages/:id', deleteSubscriptionPackage);

// 4. Food & Nutrition Catalog Manager
router.get('/foods', getAdminFoods);
router.post('/foods', saveAdminFood);
router.put('/foods/:id', (req, res) => {
  req.body.id = req.params.id;
  return saveAdminFood(req, res);
});
router.delete('/foods/:id', deleteAdminFood);

// 5. Global System & Coach Settings
router.get('/system', getAdminSystemSettings);
router.post('/system', saveAdminSystemSettings);
router.put('/system', saveAdminSystemSettings);
router.get('/settings/system', getAdminSystemSettings);
router.post('/settings/system', saveAdminSystemSettings);
router.put('/settings/system', saveAdminSystemSettings);

export default router;

