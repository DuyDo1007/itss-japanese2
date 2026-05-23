import Slide from '../models/Slide.js';
import Term from '../models/Term.js';

/**
 * Shuffle mảng theo Fisher-Yates algorithm
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Tạo một câu hỏi trắc nghiệm từ một term + pool distractors
 * @param {Object} correctTerm - Term đúng
 * @param {Array}  allTerms    - Pool tất cả terms để lấy đáp án sai
 * @param {string} lang        - Ngôn ngữ hiển thị đáp án: 'en' | 'vi' | 'ja'
 * @param {string} questionType - Loại câu hỏi
 */
function buildQuestion(correctTerm, allTerms, lang = 'en', questionType = 'word2def') {
  // Lấy 3 distractors (terms khác, ngẫu nhiên)
  const distractors = shuffle(allTerms.filter((t) => t._id.toString() !== correctTerm._id.toString()))
    .slice(0, 3);

  let question, correctAnswer, options;

  switch (questionType) {
    /**
     * word2def: Hiển thị chữ Nhật → Chọn định nghĩa đúng
     * Câu hỏi: 「データベース」の意味は？
     * Đáp án: A/B/C/D là definitions
     */
    case 'word2def':
      question = `「${correctTerm.word}」の意味は？ (What does "${correctTerm.word}" mean?)`;
      correctAnswer = correctTerm.definitions[lang] || correctTerm.definitions.en || correctTerm.word;
      options = shuffle([
        { text: correctAnswer, isCorrect: true },
        ...distractors.map((d) => ({
          text: d.definitions[lang] || d.definitions.en || d.word,
          isCorrect: false,
        })),
      ]);
      break;

    /**
     * def2word: Hiển thị định nghĩa → Chọn chữ Nhật đúng
     * Câu hỏi: "Artificial Intelligence" bằng tiếng Nhật là gì?
     */
    case 'def2word':
      question = `"${correctTerm.definitions[lang] || correctTerm.definitions.en}" — 日本語で何ですか？`;
      correctAnswer = correctTerm.word;
      options = shuffle([
        { text: correctTerm.word, isCorrect: true },
        ...distractors.map((d) => ({ text: d.word, isCorrect: false })),
      ]);
      break;

    /**
     * word2romaji: Hiển thị chữ Nhật → Chọn Romaji đúng
     * Câu hỏi: 「人工知能」のローマ字読みは？
     */
    case 'word2romaji':
      question = `「${correctTerm.word}」のローマ字読みは？`;
      correctAnswer = correctTerm.romaji || correctTerm.reading;
      options = shuffle([
        { text: correctAnswer, isCorrect: true },
        ...distractors
          .filter((d) => d.romaji || d.reading)
          .slice(0, 3)
          .map((d) => ({ text: d.romaji || d.reading, isCorrect: false })),
      ]);
      break;

    default:
      return buildQuestion(correctTerm, allTerms, lang, 'word2def');
  }

  return {
    id: `q_${correctTerm._id}_${questionType}`,
    type: questionType,
    question,
    term: {
      id: correctTerm._id,
      word: correctTerm.word,
      furigana: correctTerm.furigana,
      romaji: correctTerm.romaji,
    },
    options,
    correctAnswer,
  };
}

/**
 * POST /api/quiz/generate
 * Body: { slideId, count, lang, types }
 *
 * - slideId: ID của slide cần tạo quiz
 * - count:   Số câu hỏi (default: 5)
 * - lang:    Ngôn ngữ đáp án 'en'|'vi'|'ja' (default: 'en')
 * - types:   Mảng loại câu hỏi (default: ['word2def','def2word','word2romaji'])
 */
export const generateQuiz = async (req, res) => {
  try {
    const { slideId, count = 5, lang = 'en', types } = req.body;

    if (!slideId) {
      return res.status(400).json({ success: false, message: 'slideId is required' });
    }

    // Lấy slide và populate terms
    const slide = await Slide.findById(slideId).populate('terms');
    if (!slide) {
      return res.status(404).json({ success: false, message: 'Slide not found' });
    }

    const allTermsInSlide = slide.terms;
    if (allTermsInSlide.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Slide needs at least 2 terms to generate a quiz',
      });
    }

    // Nếu không đủ terms trong slide, bổ sung từ toàn bộ DB
    let termPool = allTermsInSlide;
    if (termPool.length < 4) {
      const extraTerms = await Term.find({ _id: { $nin: allTermsInSlide.map((t) => t._id) } }).limit(10);
      termPool = [...allTermsInSlide, ...extraTerms];
    }

    // Xác định các loại câu hỏi
    const questionTypes = types || ['word2def', 'def2word', 'word2romaji'];

    // Lấy terms ngẫu nhiên để tạo câu hỏi (không vượt quá số terms có sẵn)
    const maxQuestions = Math.min(count, allTermsInSlide.length * questionTypes.length);
    const selectedTerms = shuffle(allTermsInSlide).slice(0, Math.min(count, allTermsInSlide.length));

    // Tạo câu hỏi: xoay vòng các types
    const questions = selectedTerms.map((term, i) => {
      const qType = questionTypes[i % questionTypes.length];
      return buildQuestion(term, termPool, lang, qType);
    });

    res.json({
      success: true,
      data: {
        slideId,
        slideTitle: slide.title,
        lang,
        totalQuestions: questions.length,
        questions: shuffle(questions), // Xáo trộn thứ tự câu hỏi
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/quiz/check
 * Body: { questionId, selectedAnswer, correctAnswer }
 * Trả về kết quả đúng/sai và giải thích
 */
export const checkAnswer = async (req, res) => {
  try {
    const { selectedAnswer, correctAnswer, termId } = req.body;
    const isCorrect = selectedAnswer === correctAnswer;

    let termDetail = null;
    if (termId) {
      termDetail = await Term.findById(termId).select('word furigana romaji definitions examples');
    }

    res.json({
      success: true,
      data: {
        isCorrect,
        selectedAnswer,
        correctAnswer,
        term: termDetail,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
