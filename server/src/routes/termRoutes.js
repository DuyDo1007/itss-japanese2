import express from 'express';
import {
  getAllTerms,
  getTermById,
  createTerm,
  updateTerm,
  deleteTerm,
} from '../controllers/termController.js';

const router = express.Router();

// /api/terms
router.route('/').get(getAllTerms).post(createTerm);

// /api/terms/:id
router.route('/:id').get(getTermById).put(updateTerm).delete(deleteTerm);

export default router;
