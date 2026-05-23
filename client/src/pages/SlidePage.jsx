import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import SlideViewer from '../components/SlideViewer.jsx';
import DictionaryPopup from '../components/DictionaryPopup.jsx';
import QuizModal from '../components/QuizModal.jsx';
import { useSlide } from '../hooks/useSlide.js';

export default function SlidePage() {
  const { slideId } = useParams();
  const { slide, loading, error } = useSlide(slideId);

  // Dictionary popup state
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  // Quiz modal state
  const [quizOpen, setQuizOpen] = useState(false);

  const handleTermClick = (term, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + window.scrollX;
    const y = rect.bottom + window.scrollY + 10;

    // Toggle: click lại cùng term thì đóng popup
    if (selectedTerm?._id === term._id) {
      setSelectedTerm(null);
    } else {
      setSelectedTerm(term);
      setPopupPos({ x, y });
    }
  };

  const closePopup = () => setSelectedTerm(null);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p className="jp-text">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-error">
        <p>{error}</p>
        <Link to="/">← Về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="slide-page" onClick={closePopup}>
      <div className="slide-page-inner" onClick={e => e.stopPropagation()}>

        {/* Toolbar trên đầu slide */}
        <div className="slide-toolbar">
          <Link to="/" className="back-link">← Courses</Link>

          <button
            className="quiz-trigger-btn"
            onClick={() => setQuizOpen(true)}
            disabled={!slide?.terms?.length}
            title={!slide?.terms?.length ? 'Slide chưa có thuật ngữ' : 'Mở bài trắc nghiệm'}
          >
            Làm Bài Quiz
            {slide?.terms?.length > 0 && (
              <span className="quiz-trigger-badge">{slide.terms.length} terms</span>
            )}
          </button>
        </div>

        {/* Slide content */}
        <SlideViewer
          slide={slide}
          onTermClick={handleTermClick}
          activeTermId={selectedTerm?._id}
        />

        {/* Dictionary Popup */}
        {selectedTerm && (
          <DictionaryPopup
            key={selectedTerm._id}
            term={selectedTerm}
            position={popupPos}
            onClose={closePopup}
          />
        )}
      </div>

      {/* Quiz Modal */}
      {quizOpen && (
        <QuizModal
          slideId={slideId}
          onClose={() => setQuizOpen(false)}
        />
      )}
    </div>
  );
}
