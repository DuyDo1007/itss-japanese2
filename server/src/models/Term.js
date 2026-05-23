import mongoose from 'mongoose';

/**
 * Term Schema — Lưu trữ một thuật ngữ/từ vựng tiếng Nhật.
 * Thiết kế để hỗ trợ Kanji, Katakana, Furigana, Romaji và dịch đa ngôn ngữ.
 */
const termSchema = new mongoose.Schema(
  {
    // ── Chữ viết ──────────────────────────────────────────────────────────
    word: {
      type: String,
      required: true,
      trim: true,
      index: true,
      // Ví dụ: "人工知能", "データベース", "アルゴリズム"
    },

    reading: {
      type: String,
      trim: true,
      // Cách đọc Hiragana: "じんこうちのう"
      // Với Katakana (đã là phiên âm) thì để trống hoặc lặp lại
    },

    romaji: {
      type: String,
      trim: true,
      // Phiên âm Latin: "jinkou chinou", "deeta beesu"
    },

    furigana: {
      type: String,
      trim: true,
      // Furigana dạng text thuần: "じんこうちのう"
      // Dùng để render <ruby>人工知能<rt>じんこうちのう</rt></ruby>
    },

    // ── Phân loại ─────────────────────────────────────────────────────────
    type: {
      type: String,
      enum: ['kanji', 'katakana', 'hiragana', 'mixed', 'romaji'],
      default: 'kanji',
    },

    category: {
      type: String,
      trim: true,
      // Ví dụ: "IT", "Math", "Business", "Science"
    },

    // ── Định nghĩa đa ngôn ngữ ────────────────────────────────────────────
    definitions: {
      ja: {
        type: String,
        trim: true,
        // Định nghĩa tiếng Nhật
      },
      en: {
        type: String,
        trim: true,
        // Definition in English
      },
      vi: {
        type: String,
        trim: true,
        // Định nghĩa tiếng Việt
      },
    },

    // ── Ví dụ minh hoạ ────────────────────────────────────────────────────
    examples: [
      {
        sentence: {
          type: String,
          trim: true,
          // Câu ví dụ: "人工知能は未来を変える。"
        },
        furigana: {
          type: String,
          // Furigana cho cả câu (dạng text)
        },
        translation: {
          en: String,
          vi: String,
        },
      },
    ],

    // ── Metadata ──────────────────────────────────────────────────────────
    tags: [{ type: String, trim: true }],

    difficulty: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
      // 1 = rất dễ, 5 = rất khó
    },
  },
  {
    timestamps: true, // Tự thêm createdAt, updatedAt
  }
);

// Index full-text search trên word và romaji
termSchema.index({ word: 'text', romaji: 'text', 'definitions.en': 'text' });

const Term = mongoose.model('Term', termSchema);
export default Term;
