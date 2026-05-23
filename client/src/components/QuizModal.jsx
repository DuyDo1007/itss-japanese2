import { useState, useEffect } from 'react';
import { quizService } from '../services/index.js';

/**
 * QuizModal — Hiện bài trắc nghiệm nhanh cho một slide.
 *
 * Props:
 *  - slideId:  string
 *  - onClose:  () => void
 */
export default function QuizModal({ slideId, onClose }) {
  const [stage, setStage] = useState('loading'); // loading | ready | playing | result
  const [quiz, setQuiz] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState([]); // { selected, correct, isCorrect }[]
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [lang, setLang] = useState('vi');

  useEffect(() => {
    if (!slideId) return;
    quizService
      .generate(slideId, { count: 5, lang })
      .then(res => {
        setQuiz(res.data);
        setStage('ready');
      })
      .catch(() => setStage('error'));
  }, [slideId, lang]);

  const startQuiz = () => {
    setCurrentIdx(0);
    setAnswers([]);
    setSelected(null);
    setRevealed(false);
    setStage('playing');
  };

  const handleSelect = (optionText) => {
    if (revealed) return;
    setSelected(optionText);
  };

  const handleConfirm = () => {
    if (!selected) return;
    const q = quiz.questions[currentIdx];
    const isCorrect = selected === q.correctAnswer;
    setAnswers(prev => [...prev, { selected, correct: q.correctAnswer, isCorrect }]);
    setRevealed(true);
  };

  const handleNext = () => {
    if (currentIdx + 1 >= quiz.questions.length) {
      setStage('result');
    } else {
      setCurrentIdx(i => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  const score = answers.filter(a => a.isCorrect).length;
  const total = quiz?.questions?.length || 0;

  // ── Screens ────────────────────────────────────────────────────────────
  const renderLoading = () => (
    <div className="quiz-center">
      <div className="spinner" />
      <p>Đang tạo bài quiz...</p>
    </div>
  );

  const renderError = () => (
    <div className="quiz-center">
      <p style={{ color: '#f87171' }}>❌ Slide cần ít nhất 2 thuật ngữ để tạo quiz.</p>
      <button className="btn-secondary" onClick={onClose}>Đóng</button>
    </div>
  );

  const renderReady = () => (
    <div className="quiz-ready">
      <div className="quiz-ready-icon">📝</div>
      <h2 className="quiz-ready-title">Bài Trắc Nghiệm Nhanh</h2>
      <p className="quiz-ready-sub">
        {total} câu hỏi · Slide: <span className="jp-text">{quiz.slideTitle}</span>
      </p>

      <div className="quiz-lang-row">
        <span>Ngôn ngữ đáp án:</span>
        {[{k:'vi',l:'🇻🇳 Tiếng Việt'},{k:'en',l:'🇬🇧 English'},{k:'ja',l:'🇯🇵 日本語'}].map(({k,l}) => (
          <button
            key={k}
            className={`dict-lang-btn ${lang === k ? 'dict-lang-btn--active' : ''}`}
            onClick={() => { setLang(k); setStage('loading'); }}
          >
            {l}
          </button>
        ))}
      </div>

      <button className="btn-primary quiz-start-btn" onClick={startQuiz}>
        ▶ Bắt đầu
      </button>
    </div>
  );

  const renderPlaying = () => {
    const q = quiz.questions[currentIdx];
    const progress = ((currentIdx + 1) / total) * 100;

    return (
      <div className="quiz-playing">
        {/* Progress */}
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="quiz-progress-label">
          <span>{currentIdx + 1} / {total}</span>
          <span className="quiz-score-live">✅ {answers.filter(a=>a.isCorrect).length}</span>
        </div>

        {/* Term display */}
        <div className="quiz-term-display">
          <span className={`quiz-type-badge quiz-type-badge--${q.type}`}>
            {q.type === 'word2def' ? 'Nghĩa là gì?' : q.type === 'def2word' ? 'Chữ Nhật?' : 'Romaji?'}
          </span>
          <p className="quiz-question jp-text">{q.question}</p>
        </div>

        {/* Options */}
        <div className="quiz-options">
          {q.options.map((opt, i) => {
            let cls = 'quiz-option';
            if (revealed) {
              if (opt.isCorrect) cls += ' quiz-option--correct';
              else if (selected === opt.text && !opt.isCorrect) cls += ' quiz-option--wrong';
            } else if (selected === opt.text) {
              cls += ' quiz-option--selected';
            }
            return (
              <button
                key={i}
                className={cls}
                onClick={() => handleSelect(opt.text)}
                disabled={revealed}
              >
                <span className="quiz-option-letter">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className={`quiz-option-text ${q.type !== 'word2def' && opt.text.match(/[\u3000-\u9fff]/) ? 'jp-text' : ''}`}>
                  {opt.text}
                </span>
                {revealed && opt.isCorrect && <span className="quiz-check">✓</span>}
                {revealed && selected === opt.text && !opt.isCorrect && <span className="quiz-cross">✗</span>}
              </button>
            );
          })}
        </div>

        {/* Feedback after reveal */}
        {revealed && (
          <div className={`quiz-feedback ${answers[answers.length-1]?.isCorrect ? 'quiz-feedback--ok' : 'quiz-feedback--err'}`}>
            {answers[answers.length-1]?.isCorrect ? (
              <span>🎉 Chính xác!</span>
            ) : (
              <span>❌ Đáp án đúng: <strong>{q.correctAnswer}</strong></span>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="quiz-actions">
          {!revealed ? (
            <button
              className="btn-primary"
              onClick={handleConfirm}
              disabled={!selected}
            >
              Xác nhận
            </button>
          ) : (
            <button className="btn-primary" onClick={handleNext}>
              {currentIdx + 1 >= total ? '📊 Xem kết quả' : 'Câu tiếp →'}
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderResult = () => {
    const pct = Math.round((score / total) * 100);
    const grade =
      pct === 100 ? { emoji: '🏆', msg: 'Hoàn hảo! Xuất sắc!', cls: 'grade--gold' }
      : pct >= 80 ? { emoji: '🎉', msg: 'Rất tốt!', cls: 'grade--green' }
      : pct >= 60 ? { emoji: '👍', msg: 'Khá ổn!', cls: 'grade--blue' }
      : { emoji: '📚', msg: 'Cần ôn lại!', cls: 'grade--red' };

    return (
      <div className="quiz-result">
        <div className={`quiz-result-score ${grade.cls}`}>
          <span className="result-emoji">{grade.emoji}</span>
          <span className="result-fraction">{score}/{total}</span>
          <span className="result-pct">{pct}%</span>
        </div>
        <p className="result-msg">{grade.msg}</p>

        {/* Review từng câu */}
        <div className="result-review">
          {quiz.questions.map((q, i) => (
            <div key={i} className={`review-item ${answers[i]?.isCorrect ? 'review-item--ok' : 'review-item--err'}`}>
              <span className="review-icon">{answers[i]?.isCorrect ? '✅' : '❌'}</span>
              <div>
                <p className="jp-text review-word">{q.term.word}</p>
                {!answers[i]?.isCorrect && (
                  <p className="review-correct">→ {answers[i]?.correct}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="quiz-actions">
          <button className="btn-secondary" onClick={startQuiz}>🔁 Làm lại</button>
          <button className="btn-primary" onClick={onClose}>Đóng</button>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div className="quiz-backdrop" onClick={onClose} />

      {/* Modal */}
      <div className="quiz-modal" onClick={e => e.stopPropagation()}>
        <button className="quiz-modal-close" onClick={onClose}>✕</button>

        {stage === 'loading' && renderLoading()}
        {stage === 'error' && renderError()}
        {stage === 'ready' && renderReady()}
        {stage === 'playing' && renderPlaying()}
        {stage === 'result' && renderResult()}
      </div>
    </>
  );
}
