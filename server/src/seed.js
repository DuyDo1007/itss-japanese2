/**
 * Seed Script — Chạy một lần để tạo dữ liệu mẫu trong MongoDB.
 * Lệnh: node src/seed.js
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Term from './models/Term.js';
import Slide from './models/Slide.js';
import Course from './models/Course.js';

dotenv.config();

const SAMPLE_TERMS = [
  {
    word: '人工知能',
    reading: 'じんこうちのう',
    romaji: 'jinkou chinou',
    furigana: 'じんこうちのう',
    type: 'kanji',
    category: 'IT',
    definitions: {
      ja: '人間の知的な働きをコンピュータに行わせる技術。',
      en: 'Artificial Intelligence — technology enabling computers to perform intellectual tasks.',
      vi: 'Trí tuệ nhân tạo — công nghệ cho phép máy tính thực hiện các tác vụ trí tuệ.',
    },
    examples: [
      {
        sentence: '人工知能は現代社会に欠かせない技術です。',
        furigana: 'じんこうちのうはげんだいしゃかいにかかせないぎじゅつです。',
        translation: {
          en: 'Artificial Intelligence is an indispensable technology in modern society.',
          vi: 'Trí tuệ nhân tạo là công nghệ không thể thiếu trong xã hội hiện đại.',
        },
      },
    ],
    difficulty: 4,
    tags: ['AI', 'technology'],
  },
  {
    word: 'データベース',
    reading: 'データベース',
    romaji: 'deeta beesu',
    furigana: 'データベース',
    type: 'katakana',
    category: 'IT',
    definitions: {
      ja: 'データを系統的に集め、管理するシステム。',
      en: 'Database — an organized collection of structured data.',
      vi: 'Cơ sở dữ liệu — tập hợp dữ liệu có cấu trúc và được quản lý có hệ thống.',
    },
    examples: [
      {
        sentence: 'MySQLは人気のあるデータベース管理システムです。',
        furigana: 'MySQLはにんきのあるデータベースかんりシステムです。',
        translation: {
          en: 'MySQL is a popular database management system.',
          vi: 'MySQL là hệ quản trị cơ sở dữ liệu phổ biến.',
        },
      },
    ],
    difficulty: 2,
    tags: ['database', 'IT'],
  },
  {
    word: 'アルゴリズム',
    reading: 'アルゴリズム',
    romaji: 'arugorizumu',
    furigana: 'アルゴリズム',
    type: 'katakana',
    category: 'IT',
    definitions: {
      ja: '問題を解くための手順や計算方法。',
      en: 'Algorithm — a step-by-step procedure to solve a problem.',
      vi: 'Thuật toán — quy trình từng bước để giải quyết một vấn đề.',
    },
    examples: [
      {
        sentence: '効率的なアルゴリズムはプログラムの性能を向上させます。',
        furigana: 'こうりつてきなアルゴリズムはプログラムのせいのうをこうじょうさせます。',
        translation: {
          en: 'An efficient algorithm improves program performance.',
          vi: 'Thuật toán hiệu quả giúp cải thiện hiệu suất chương trình.',
        },
      },
    ],
    difficulty: 3,
    tags: ['algorithm', 'programming'],
  },
  {
    word: 'ソフトウェア',
    reading: 'ソフトウェア',
    romaji: 'sofutouea',
    furigana: 'ソフトウェア',
    type: 'katakana',
    category: 'IT',
    definitions: {
      ja: 'コンピュータを動かすためのプログラムの総称。',
      en: 'Software — programs and operating information used by a computer.',
      vi: 'Phần mềm — tập hợp các chương trình điều khiển máy tính.',
    },
    examples: [],
    difficulty: 1,
    tags: ['software', 'IT'],
  },
  {
    word: 'クラウド',
    reading: 'クラウド',
    romaji: 'kuraudo',
    furigana: 'クラウド',
    type: 'katakana',
    category: 'IT',
    definitions: {
      ja: 'インターネット経由でサービスを提供する技術基盤。',
      en: 'Cloud — delivery of computing services over the internet.',
      vi: 'Điện toán đám mây — cung cấp dịch vụ tính toán qua internet.',
    },
    examples: [],
    difficulty: 2,
    tags: ['cloud', 'infrastructure'],
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Xoá dữ liệu cũ
    await Term.deleteMany({});
    await Slide.deleteMany({});
    await Course.deleteMany({});
    console.log('🗑️  Cleared old data');

    // Tạo Terms
    const createdTerms = await Term.insertMany(SAMPLE_TERMS);
    console.log(`📚 Created ${createdTerms.length} terms`);

    // Tạo Slide
    const slide1 = await Slide.create({
      title: '第1章：情報システムの基礎',
      titleRomaji: 'Dai 1 Shou: Jouhou Shisutemu no Kiso',
      order: 1,
      content: `# 情報システムの基礎

**人工知能**（じんこうちのう）は現代のITの中核技術です。

データを保存するためには**データベース**が必要であり、
処理には効率的な**アルゴリズム**が求められます。

これらは**ソフトウェア**として実装され、
現在では**クラウド**上で動作することが多くなっています。`,
      terms: createdTerms.map((t) => t._id),
    });

    // Tạo Course
    const course = await Course.create({
      title: 'Introduction to Information Systems (情報システム論)',
      titleJa: '情報システム論',
      description: 'Khoá học giới thiệu các thuật ngữ IT cơ bản bằng tiếng Nhật dành cho sinh viên ITSS.',
      instructor: {
        name: 'Prof. Tanaka',
        nameJa: '田中教授',
      },
      slides: [slide1._id],
      category: 'IT',
      level: 'beginner',
      language: 'ja-en-vi',
      totalSlides: 1,
      totalTerms: createdTerms.length,
    });

    console.log(`🎓 Created course: "${course.title}"`);
    console.log(`📄 Created 1 slide: "${slide1.title}"`);
    console.log('\n✨ Seed complete! Check MongoDB Compass → edtech_jp');
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
