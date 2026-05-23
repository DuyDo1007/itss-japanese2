import mongoose from 'mongoose';

/**
 * Course Schema — Khoá học bao gồm nhiều Slides.
 * Là entry point chính khi người dùng chọn bài giảng cần học.
 */
const courseSchema = new mongoose.Schema(
  {
    // ── Thông tin cơ bản ──────────────────────────────────────────────────
    title: {
      type: String,
      required: true,
      trim: true,
      // Ví dụ: "情報システム論 - Introduction to Information Systems"
    },

    titleJa: {
      type: String,
      trim: true,
      // Tiêu đề tiếng Nhật: "情報システム論"
    },

    description: {
      type: String,
      trim: true,
    },

    // ── Instructor ─────────────────────────────────────────────────────────
    instructor: {
      name: { type: String, trim: true },
      nameJa: { type: String, trim: true },
    },

    // ── Danh sách slide (có thứ tự) ───────────────────────────────────────
    slides: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Slide',
      },
    ],

    // ── Phân loại & metadata ──────────────────────────────────────────────
    category: {
      type: String,
      trim: true,
      // "IT", "Business", "Engineering", ...
    },

    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
    },

    language: {
      type: String,
      enum: ['ja', 'ja-en', 'ja-vi', 'ja-en-vi'],
      default: 'ja-en-vi',
      // Ngôn ngữ chính của slide (Nhật), kèm ngôn ngữ hỗ trợ
    },

    coverImageUrl: {
      type: String,
      default: '',
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    // ── Thống kê nhanh (denormalized) ─────────────────────────────────────
    totalSlides: {
      type: Number,
      default: 0,
    },

    totalTerms: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Hook: tự cập nhật totalSlides trước khi save (Mongoose 8+ async style)
courseSchema.pre('save', async function () {
  this.totalSlides = this.slides.length;
});

const Course = mongoose.model('Course', courseSchema);
export default Course;
