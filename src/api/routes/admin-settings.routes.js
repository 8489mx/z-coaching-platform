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
  deleteSubscriptionPackage
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

export default router;
