import express from 'express';
import multer from 'multer';
import {
  getAllSlides,
  getSlideById,
  createSlide,
  updateSlide,
  deleteSlide,
  analyzeSlide,
} from '../controllers/slideController.js';

const router = express.Router();

// Multer: lưu file trong RAM (buffer), giới hạn 20MB
// Hỗ trợ: .txt, .md, .markdown, .pptx
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB cho PPTX
  fileFilter: (_req, file, cb) => {
    // Chỉ kiểm tra extension — MIME type của PPTX rất khác nhau tuỳ browser/OS
    // (có thể là application/zip, application/octet-stream, application/vnd.ms-powerpoint, ...)
    const allowedExt = ['.txt', '.md', '.markdown', '.pptx', '.ppt', '.pdf'];
    const ext = file.originalname
      .slice(file.originalname.lastIndexOf('.'))
      .toLowerCase();

    if (allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ hỗ trợ file .txt, .md và .ppt và .pdf'));
    }
  },
});


// POST /api/slides/analyze — phải đặt TRƯỚC /:id để không bị nhầm
router.post('/analyze', upload.single('file'), analyzeSlide);

// CRUD
router.route('/').get(getAllSlides).post(createSlide);
router.route('/:id').get(getSlideById).put(updateSlide).delete(deleteSlide);

export default router;
