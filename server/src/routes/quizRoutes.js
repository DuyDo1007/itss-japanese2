import express from 'express';
import { generateQuiz, checkAnswer } from '../controllers/quizController.js';

const router = express.Router();

// POST /api/quiz/generate — Tạo bài quiz cho một slide
router.post('/generate', generateQuiz);

// POST /api/quiz/check — Kiểm tra đáp án
router.post('/check', checkAnswer);

export default router;
