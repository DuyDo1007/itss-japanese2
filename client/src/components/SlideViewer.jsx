import { useMemo } from 'react';

/**
 * Parse nội dung Markdown thành các "tokens" để render.
 *
 * Logic nhận diện thuật ngữ:
 * - Slide content dùng **từ** (bold markdown) để đánh dấu thuật ngữ quan trọng
 * - Ngoài ra khớp trực tiếp với word field trong terms array
 *
 * @param {string} content   - Raw Markdown string từ DB
 * @param {Array}  terms     - Danh sách Term objects (populated từ API)
 * @param {Function} onTermClick - Callback khi click vào một term
 */
function SlideContent({ content, terms, onTermClick }) {
  // Tạo map: word → term object để lookup nhanh O(1)
  const termMap = useMemo(() => {
    const map = {};
    const stripHtml = (s) => (s ? s.replace(/<[^>]*>?/gm, '') : '');
    terms.forEach((t) => {
      const cleanWord = stripHtml(t.word);
      const cleanReading = stripHtml(t.reading);
      const cleanFuri = stripHtml(t.furigana);
      
      const cleanTerm = { ...t, word: cleanWord, reading: cleanReading, furigana: cleanFuri };
      map[cleanWord] = cleanTerm;
      // Cũng map theo reading nếu có
      if (cleanReading && cleanReading !== cleanWord) {
        map[cleanReading] = cleanTerm;
      }
    });
    return map;
  }, [terms]);

  /**
   * Render một đoạn text, tìm và highlight các thuật ngữ.
   * Dùng regex để tách text thành chunks: thuật ngữ | text thường
   */
  const renderInlineText = (text, keyPrefix) => {
    if (!terms.length) return text;

    // Build regex từ tất cả từ trong termMap (escape special chars)
    const escaped = Object.keys(termMap).map((w) =>
      w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    );
    if (!escaped.length) return text;

    const pattern = new RegExp(`(${escaped.join('|')})`, 'g');
    const parts = text.split(pattern);

    return parts.map((part, i) => {
      if (termMap[part]) {
        const term = termMap[part];
        return (
          <span
            key={`${keyPrefix}-${i}`}
            className="clickable-term"
            onClick={(e) => onTermClick(term, e)}
            title={`Click để xem định nghĩa: ${term.romaji}`}
          >
            {/* Hiển thị furigana nếu là Kanji */}
            {term.type === 'kanji' && term.furigana ? (
              <ruby>
                {part}
                <rt>{term.furigana}</rt>
              </ruby>
            ) : (
              part
            )}
          </span>
        );
      }
      return part;
    });
  };

  /**
   * Render từng dòng Markdown cơ bản:
   * # H1, ## H2, ### H3, **bold**, - list item, plain text
   */
  const renderLine = (line, lineIndex) => {
    const key = `line-${lineIndex}`;

    // H1
    if (line.startsWith('# ')) {
      const text = line.slice(2);
      return (
        <h1 key={key} className="slide-h1">
          {renderInlineText(text, key)}
        </h1>
      );
    }
    // H2
    if (line.startsWith('## ')) {
      const text = line.slice(3);
      return (
        <h2 key={key} className="slide-h2">
          {renderInlineText(text, key)}
        </h2>
      );
    }
    // H3
    if (line.startsWith('### ')) {
      const text = line.slice(4);
      return (
        <h3 key={key} className="slide-h3">
          {renderInlineText(text, key)}
        </h3>
      );
    }
    // List item
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const text = line.slice(2);
      return (
        <li key={key} className="slide-list-item">
          {renderInlineText(text, key)}
        </li>
      );
    }
    // Empty line → spacer
    if (line.trim() === '') {
      return <div key={key} className="slide-spacer" />;
    }
    // Normal paragraph — process bold **text**
    const processedParts = line.split(/\*\*([^*]+)\*\*/g).map((part, i) => {
      if (i % 2 === 1) {
        // Nằm giữa **, kiểm tra có phải term không
        const term = termMap[part];
        if (term) {
          return (
            <span
              key={`bold-term-${i}`}
              className="clickable-term"
              onClick={(e) => onTermClick(term, e)}
              title={`Click để xem định nghĩa: ${term.romaji}`}
            >
              {term.type === 'kanji' && term.furigana ? (
                <ruby>
                  {part}
                  <rt>{term.furigana}</rt>
                </ruby>
              ) : (
                part
              )}
            </span>
          );
        }
        // Bold nhưng không phải term
        return <strong key={`bold-${i}`}>{part}</strong>;
      }
      // Text thường — tìm thêm terms trong đó
      return <span key={`text-${i}`}>{renderInlineText(part, `${key}-${i}`)}</span>;
    });

    return (
      <p key={key} className="slide-paragraph">
        {processedParts}
      </p>
    );
  };

  const lines = content.split('\n');
  const pages = [];
  let currentPageElements = [];
  let listBuffer = [];
  let emptyLineCount = 0;

  const flushList = () => {
    if (listBuffer.length > 0) {
      currentPageElements.push(
        <ul key={`ul-${pages.length}-${currentPageElements.length}`} className="slide-list">
          {listBuffer}
        </ul>
      );
      listBuffer = [];
    }
  };

  lines.forEach((line, i) => {
    const trimmed = line.trim();

    // Đếm dòng trống
    if (trimmed === '') {
      emptyLineCount++;
    } else {
      emptyLineCount = 0;
    }

    // Tiêu chí ngắt trang: gặp --- hoặc === hoặc có >= 3 dòng trống liên tiếp
    const isExplicitDivider = trimmed === '---' || trimmed === '===';
    const isTripleEmpty = emptyLineCount === 3;
    
    // Header chính (#) cũng có thể coi là bắt đầu slide mới (tuỳ chọn)
    const isMainHeader = line.startsWith('# ');

    // Nếu không có delimiter rõ ràng, ngắt trang khi có dòng trống sau 12 blocks
    const isTooLong = currentPageElements.length >= 10 && trimmed === '';

    if (isExplicitDivider || isTripleEmpty || (isMainHeader && currentPageElements.length > 0) || isTooLong) {
      flushList();
      if (currentPageElements.length > 0) {
        pages.push(currentPageElements);
        currentPageElements = [];
      }
      if (isExplicitDivider || isTripleEmpty) return; // Không render dải phân cách này thành text
    }

    const isList = line.startsWith('- ') || line.startsWith('* ');

    if (isList) {
      listBuffer.push(renderLine(line, i));
    } else {
      // Bỏ qua dòng trống thừa nếu đang ở đầu trang
      if (trimmed === '' && currentPageElements.length === 0 && listBuffer.length === 0) return;
      
      flushList();
      currentPageElements.push(renderLine(line, i));
    }
  });

  flushList();
  if (currentPageElements.length > 0) {
    pages.push(currentPageElements);
  }

  return (
    <div className="slide-content-pages">
      {pages.map((pageEls, idx) => (
        <div key={`page-${idx}`} className="slide-page-card">
          <div className="slide-page-number">{idx + 1}</div>
          {pageEls}
        </div>
      ))}
    </div>
  );
}

/**
 * SlideViewer — Component chính hiển thị một slide đầy đủ.
 *
 * Props:
 *  - slide:        Object slide từ API (với terms populated)
 *  - onTermClick:  (term, event) => void
 *  - activeTermId: ID của term đang được chọn (để highlight)
 */
export default function SlideViewer({ slide, onTermClick, activeTermId }) {
  if (!slide) return null;

  return (
    <article className="slide-viewer">
      {/* Header của slide */}
      <header className="slide-header">
        <div className="slide-badge">
          <span>Slide {slide.order}</span>
        </div>
        <h1 className="slide-title">{slide.title}</h1>
        {slide.titleRomaji && (
          <p className="slide-title-romaji">{slide.titleRomaji}</p>
        )}

        {/* Thanh terms indicator */}
        <div className="slide-terms-bar">
          <span className="terms-label">Thuật ngữ trong slide:</span>
          <div className="terms-chips">
            {slide.terms?.map((term) => (
              <button
                key={term._id}
                className={`term-chip ${activeTermId === term._id ? 'term-chip--active' : ''}`}
                onClick={(e) => onTermClick(term, e)}
                title={term.romaji}
              >
                {term.word}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Nội dung chính */}
      <div className="slide-body">
        <SlideContent
          content={slide.content}
          terms={slide.terms || []}
          onTermClick={onTermClick}
        />
      </div>

      {/* Footer hint */}
      <footer className="slide-footer">
        <span>Click vào bất kỳ thuật ngữ nào được gạch chân để xem định nghĩa</span>
      </footer>
    </article>
  );
}
