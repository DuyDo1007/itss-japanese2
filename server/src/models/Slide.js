import mongoose from 'mongoose';

/**
 * Slide Schema — Một trang slide trong bài giảng.
 * Nội dung lưu dạng Markdown/HTML blocks, có nhúng danh sách Term.
 */
const slideSchema = new mongoose.Schema(
  {
    // ── Tiêu đề & thứ tự ──────────────────────────────────────────────────
    title: {
      type: String,
      required: true,
      trim: true,
      // Ví dụ: "第3章：データベースの基礎"
    },

    titleRomaji: {
      type: String,
      trim: true,
      // "Dai 3 Shou: Deetabeesu no Kiso"
    },

    order: {
      type: Number,
      required: true,
      default: 0,
      // Thứ tự hiển thị trong course
    },

    // ── Nội dung chính ────────────────────────────────────────────────────
    content: {
      type: String,
      required: true,
      // Lưu dạng Markdown hoặc HTML thuần.
      // Các thuật ngữ cần click được đánh dấu bằng cú pháp [[term_id]] hoặc **bold**
      // Frontend sẽ parse và bọc <span class="clickable-term">
    },

    // ── Danh sách thuật ngữ trong slide này ───────────────────────────────
    terms: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Term',
      },
    ],

    // ── Metadata bổ sung ──────────────────────────────────────────────────
    thumbnailUrl: {
      type: String,
      default: '',
    },

    notes: {
      type: String,
      trim: true,
      // Ghi chú của giảng viên (không hiển thị với sinh viên)
    },

    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Slide = mongoose.model('Slide', slideSchema);
export default Slide;
