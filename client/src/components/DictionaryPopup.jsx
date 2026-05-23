import { useState, useEffect, useRef } from 'react';

/**
 * DictionaryPopup — Hiện khi click vào một clickable-term.
 *
 * Props:
 *  - term:     Object Term đầy đủ từ API
 *  - position: { x, y } tọa độ hiển thị
 *  - onClose:  () => void
 */
export default function DictionaryPopup({ term, position, onClose }) {
  const [lang, setLang] = useState('vi'); // 'vi' | 'en' | 'ja'
  const [tab, setTab] = useState('def');  // 'def' | 'examples'
  const [visible, setVisible] = useState(false);
  const popupRef = useRef(null);

  // Animate in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Reset khi đổi term
  // Tự điều chỉnh vị trí để không bị tràn màn hình
  useEffect(() => {
    if (!popupRef.current) return;
    const popup = popupRef.current;
    const rect = popup.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (rect.right > vw - 16) {
      popup.style.left = `${Math.max(8, position.x - rect.width)}px`;
    }
    if (rect.bottom > vh - 16) {
      popup.style.top = `${Math.max(8, position.y - rect.height - 50)}px`;
    }
  }, [visible, position]);

  if (!term) return null;

  const definition = term.definitions?.[lang] || term.definitions?.en || '—';
  const hasExamples = term.examples?.length > 0;
  const diffStars = '★'.repeat(term.difficulty || 1) + '☆'.repeat(5 - (term.difficulty || 1));

  const LANGS = [
    { key: 'vi', label: '🇻🇳 VI' },
    { key: 'en', label: '🇬🇧 EN' },
    { key: 'ja', label: '🇯🇵 JP' },
  ];

  return (
    <div
      ref={popupRef}
      className={`dict-popup ${visible ? 'dict-popup--visible' : ''}`}
      style={{ left: position.x, top: position.y }}
      onClick={e => e.stopPropagation()}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="dict-header">
        <div className="dict-word-block">
          {/* Furigana nếu là Kanji */}
          {term.type === 'kanji' && term.furigana ? (
            <ruby className="dict-word jp-text">
              {term.word}
              <rt className="dict-furigana">{term.furigana}</rt>
            </ruby>
          ) : (
            <span className="dict-word jp-text">{term.word}</span>
          )}

          {term.romaji && (
            <span className="dict-romaji">/{term.romaji}/</span>
          )}
        </div>

        <div className="dict-header-right">
          <span className={`dict-type-badge dict-type-badge--${term.type}`}>
            {term.type}
          </span>
          <button className="dict-close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
      </div>

      {/* ── Difficulty & category ────────────────────────────── */}
      <div className="dict-meta">
        {term.category && <span className="dict-category">📂 {term.category}</span>}
        <span className="dict-difficulty" title={`Độ khó: ${term.difficulty}/5`}>
          {diffStars}
        </span>
      </div>

      {/* ── Language switcher ─────────────────────────────────── */}
      <div className="dict-lang-row">
        {LANGS.map(l => (
          <button
            key={l.key}
            className={`dict-lang-btn ${lang === l.key ? 'dict-lang-btn--active' : ''}`}
            onClick={() => setLang(l.key)}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      {hasExamples && (
        <div className="dict-tabs">
          <button
            className={`dict-tab ${tab === 'def' ? 'dict-tab--active' : ''}`}
            onClick={() => setTab('def')}
          >
            📖 Định nghĩa
          </button>
          <button
            className={`dict-tab ${tab === 'examples' ? 'dict-tab--active' : ''}`}
            onClick={() => setTab('examples')}
          >
            💬 Ví dụ
          </button>
        </div>
      )}

      {/* ── Definition ──────────────────────────────────────── */}
      {tab === 'def' && (
        <div className="dict-body">
          <p className={`dict-definition ${lang === 'ja' ? 'jp-text' : ''}`}>
            {definition}
          </p>

          {/* Reading nếu là Kanji */}
          {term.type === 'kanji' && term.reading && (
            <div className="dict-reading">
              <span className="dict-reading-label">読み方</span>
              <span className="jp-text dict-reading-text">{term.reading}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Examples ────────────────────────────────────────── */}
      {tab === 'examples' && (
        <div className="dict-body">
          {term.examples.map((ex, i) => (
            <div key={i} className="dict-example">
              <p className="dict-example-sentence jp-text">{ex.sentence}</p>
              {ex.furigana && (
                <p className="dict-example-furigana jp-text">{ex.furigana}</p>
              )}
              {ex.translation?.[lang === 'ja' ? 'en' : lang] && (
                <p className="dict-example-trans">
                  → {ex.translation[lang === 'ja' ? 'en' : lang]}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="dict-footer">
        <span className="dict-footer-hint">
          {term.type === 'katakana' ? '🔤 Katakana loan word' : '🖊 Kanji compound'}
        </span>
      </div>
    </div>
  );
}
