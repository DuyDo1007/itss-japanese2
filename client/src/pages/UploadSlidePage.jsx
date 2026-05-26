import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SlideViewer from '../components/SlideViewer.jsx';
import DictionaryPopup from '../components/DictionaryPopup.jsx';
import { slideService, courseService } from '../services/index.js';

/* ─── Bước 1: Khu vực Upload/Paste ──────────────────────────────── */
function UploadZone({ onContentReady }) {
  const [mode, setMode] = useState('upload'); // 'upload' | 'paste'
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const getFileIcon = (filename) => {
    const ext = filename?.slice(filename.lastIndexOf('.')).toLowerCase();
    if (ext === '.pptx' || ext === '.ppt') return 'PPTX';
    if (ext === '.md' || ext === '.markdown') return 'MD';
    return 'TXT';
  };

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (dropped) {
      setFile(dropped);
      setTitle(dropped.name.replace(/\.(txt|md|markdown|pptx|ppt|pdf)$/i, ''));
    }
  }, []);

  const handleAnalyze = () => {
    if (mode === 'upload' && !file) return;
    if (mode === 'paste' && !text.trim()) return;
    onContentReady(mode === 'upload' ? file : null, mode === 'paste' ? text : null, title);
  };

  return (
    <div className="upload-zone-wrap">

      {/* Mode switcher */}
      <div className="mode-switcher">
        <button
          className={`mode-btn ${mode === 'upload' ? 'mode-btn--active' : ''}`}
          onClick={() => setMode('upload')}
        >
          Upload File
        </button>
        <button
          className={`mode-btn ${mode === 'paste' ? 'mode-btn--active' : ''}`}
          onClick={() => setMode('paste')}
        >
          Dán nội dung
        </button>
      </div>

      {/* Upload mode */}
      {mode === 'upload' && (
        <div
          className={`dropzone ${dragging ? 'dropzone--active' : ''} ${file ? 'dropzone--has-file' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleFileDrop}
          onClick={() => !file && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".txt,.md,.markdown,.pptx,.ppt,.pdf"
            style={{ display: 'none' }}
            onChange={handleFileDrop}
          />
          {file ? (
            <div className="dropzone-file-info">
              <span className="file-icon">{getFileIcon(file.name)}</span>
              <div>
                <p className="file-name">{file.name}</p>
                <p className="file-size">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                className="file-remove"
                onClick={e => { e.stopPropagation(); setFile(null); }}
              >✕</button>
            </div>
          ) : (
            <div className="dropzone-hint">
              <p className="dropzone-title">Kéo &amp; thả file vào đây</p>
              <p className="dropzone-sub">
                hoặc click để chọn <strong>.txt</strong> / <strong>.md</strong> / <strong>.pptx</strong> / <strong>.pdf</strong>
              </p>
              <p className="dropzone-sub text-muted">Tối đa 20MB</p>
            </div>
          )}
        </div>
      )}

      {/* Paste mode */}
      {mode === 'paste' && (
        <div className="paste-zone">
          <textarea
            className="form-input form-textarea-code"
            rows={14}
            placeholder={`Dán nội dung slide vào đây. Hệ thống sẽ tự động phát hiện các thuật ngữ tiếng Nhật.\n\nVí dụ:\n# 情報システムの基礎\n\nデータベースはデータを管理するシステムです。\nアルゴリズムを使って効率的に処理します。\nクラウド上でソフトウェアを動かします。`}
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <p className="paste-hint">
            {text.length > 0 ? `${text.length} ký tự · ${text.split('\n').length} dòng` : 'Chưa có nội dung'}
          </p>
        </div>
      )}

      <button
        className="btn-analyze"
        onClick={handleAnalyze}
        disabled={(mode === 'upload' && !file) || (mode === 'paste' && !text.trim())}
      >
        Phân tích &amp; Tìm thuật ngữ
      </button>
    </div>
  );
}

/* ─── Term Card ──────────────────────────────────────────────────── */
function TermCard({ term, isNew }) {
  const [lang, setLang] = useState('vi');
  return (
    <div className={`found-term-card ${isNew ? 'found-term-card--new' : ''}`}>
      {isNew && <span className="term-new-badge">NEW</span>}
      <div className="found-term-word jp-text">{term.word}</div>
      {term.furigana && term.furigana !== term.word && (
        <div className="found-term-furigana jp-text">{term.furigana}</div>
      )}
      <div className="found-term-romaji">{term.romaji}</div>
      <div className="found-term-type">{term.type}</div>
      <div className="found-term-def">
        {lang === 'vi' && (term.definitions?.vi || '—')}
        {lang === 'en' && (term.definitions?.en || '—')}
        {lang === 'ja' && (term.definitions?.ja || '—')}
      </div>
      <div className="term-card-langs">
        {['vi', 'en', 'ja'].map(l => (
          <button
            key={l}
            className={`lang-btn-mini ${lang === l ? 'lang-btn-mini--active' : ''}`}
            onClick={() => setLang(l)}
          >
            {l === 'vi' ? 'VI' : l === 'en' ? 'EN' : 'JA'}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Bước 2: Kết quả phân tích + Preview ───────────────────────── */
function AnalysisResult({ result, onReset }) {
  const [courses, setCourses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedSlideId, setSavedSlideId] = useState(() => sessionStorage.getItem('upload_saved_id') || null);
  const [editedTitle, setEditedTitle] = useState(() => sessionStorage.getItem('upload_edited_title') || result.title || '');
  const [newCourseTitle, setNewCourseTitle] = useState(() => sessionStorage.getItem('upload_new_course') || '');
  const [selectedCourseId, setSelectedCourseId] = useState(() => sessionStorage.getItem('upload_selected_course') || '');

  useEffect(() => {
    if (savedSlideId) sessionStorage.setItem('upload_saved_id', savedSlideId);
    else sessionStorage.removeItem('upload_saved_id');
  }, [savedSlideId]);

  useEffect(() => { sessionStorage.setItem('upload_edited_title', editedTitle); }, [editedTitle]);
  useEffect(() => { sessionStorage.setItem('upload_new_course', newCourseTitle); }, [newCourseTitle]);
  useEffect(() => { sessionStorage.setItem('upload_selected_course', selectedCourseId); }, [selectedCourseId]);


  
  // Dictionary popup state
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  const handleTermClick = (term, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + window.scrollX;
    const y = rect.bottom + window.scrollY + 10;

    if (selectedTerm?._id === term._id) {
      setSelectedTerm(null);
    } else {
      setSelectedTerm(term);
      setPopupPos({ x, y });
    }
  };

  const closePopup = () => setSelectedTerm(null);

  const navigate = useNavigate();

  const newTerms = result.newTermsCreated || [];
  const dbTerms = result.dbTermsFound || [];

  useEffect(() => {
    courseService.getAll().then(r => setCourses(r.data)).catch(() => { });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const slideRes = await slideService.create({
        title: editedTitle || result.title || 'Slide chưa có tên',
        order: 1,
        content: result.annotatedContent,
        terms: result.foundTermIds,
      });
      const newSlide = slideRes.data;

      if (selectedCourseId) {
        const courseRes = await courseService.getById(selectedCourseId);
        const course = courseRes.data;
        const existingSlideIds = course.slides?.map(s => s._id || s) || [];
        await courseService.update(selectedCourseId, {
          slides: [...existingSlideIds, newSlide._id],
          totalSlides: existingSlideIds.length + 1,
        });
      } else if (newCourseTitle.trim()) {
        // Tạo môn học mới
        const createCourseRes = await courseService.create({
          title: newCourseTitle.trim(),
          slides: [newSlide._id],
          totalSlides: 1,
        });
        // Có thể cần refresh lại danh sách courses nếu quay lại upload
        setCourses(prev => [...prev, createCourseRes.data]);
      }

      setSavedSlideId(newSlide._id);
    } catch (err) {
      alert('Lỗi khi lưu slide: ' + (err.message || err));
    } finally {
      setSaving(false);
    }
  };

  const previewSlide = {
    title: editedTitle || result.title || 'Slide Preview',
    order: 1,
    content: result.annotatedContent,
    terms: result.foundTerms,
  };

  if (savedSlideId) {
    return (
      <div className="save-success">
        <h2>Slide đã được lưu thành công!</h2>
        <p>
          {dbTerms.length > 0 && `${dbTerms.length} thuật ngữ từ DB`}
          {dbTerms.length > 0 && newTerms.length > 0 && ' + '}
          {newTerms.length > 0 && <strong>{newTerms.length} thuật ngữ mới (phát hiện &amp; đã lưu vào DB)</strong>}
          {dbTerms.length === 0 && newTerms.length === 0 && 'Slide đã được lưu.'}
        </p>
        <div className="success-actions">
          <button className="btn-primary" onClick={() => navigate(`/slides/${savedSlideId}`)}>
            Xem Slide
          </button>
          <button className="btn-secondary" onClick={onReset}>
            Upload thêm
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-result" onClick={closePopup}>
      {/* Thuật ngữ mới từ AI */}
      {newTerms.length > 0 && (
        <div className="found-terms-section found-terms-section--new">
          <h3 className="section-title">
            Thuật ngữ mới — phát hiện &amp; đã lưu vào Database
            <span className="section-badge section-badge--green">{newTerms.length}</span>
          </h3>
          <div className="found-terms-grid">
            {newTerms.map(term => (
              <TermCard key={term._id} term={term} isNew={true} />
            ))}
          </div>
        </div>
      )}

      {/* Thuật ngữ đã có trong DB (đã ẩn theo yêu cầu) */}

      {/* Không tìm thấy gì */}
      {result.foundTerms.length === 0 && (
        <div className="no-terms-warning">
          Không tìm thấy thuật ngữ nào. Hãy kiểm tra lại nội dung hoặc cấu hình GEMINI_API_KEY trên server.
        </div>
      )}

      {/* Title edit */}
      <div className="form-group" style={{ margin: '1.5rem 0 0.5rem' }}>
        <label className="form-label">Tiêu đề slide</label>
        <input
          className="form-input jp-text"
          value={editedTitle}
          onChange={e => setEditedTitle(e.target.value)}
          placeholder="第1章：..."
        />
      </div>

      {/* Course assignment */}
      <div className="form-group" style={{ marginBottom: '1.5rem' }}>
        <label className="form-label">Thêm vào Course (Môn học)</label>
        <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
          <select
            className="form-input"
            value={selectedCourseId}
            onChange={e => { setSelectedCourseId(e.target.value); setNewCourseTitle(''); }}
          >
            <option value="">(Không gắn vào course hoặc tạo mới bên dưới)</option>
            {courses.map(c => (
              <option key={c._id} value={c._id}>{c.titleJa || c.title}</option>
            ))}
          </select>
          <input
            className="form-input"
            placeholder="Hoặc nhập tên môn học mới để tạo (ví dụ: Lập trình Web)"
            value={newCourseTitle}
            onChange={e => { setNewCourseTitle(e.target.value); setSelectedCourseId(''); }}
            disabled={!!selectedCourseId}
          />
        </div>
      </div>

      {/* Preview slide */}
      <h3 className="section-title">Preview — Click vào thuật ngữ để thử</h3>
      <div className="preview-wrapper" onClick={e => e.stopPropagation()}>
        <SlideViewer
          slide={previewSlide}
          onTermClick={handleTermClick}
          activeTermId={selectedTerm?._id}
        />
        {selectedTerm && (
          <DictionaryPopup
            key={selectedTerm._id}
            term={selectedTerm}
            position={popupPos}
            onClose={closePopup}
          />
        )}
      </div>

      {/* Actions */}
      <div className="result-actions">
        <button className="btn-secondary" onClick={onReset}>
          ← Upload lại
        </button>
        <button
          className="btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Đang lưu...' : 'Lưu Slide'}
        </button>
      </div>
    </div>
  );
}

/* ─── Trang chính: UploadSlidePage ──────────────────────────────── */
export default function UploadSlidePage() {
  const [step, setStep] = useState(() => sessionStorage.getItem('upload_step') || 'upload'); // 'upload' | 'analyzing' | 'result'
  const [result, setResult] = useState(() => {
    const saved = sessionStorage.getItem('upload_result');
    return saved ? JSON.parse(saved) : null;
  });
  const [error, setError] = useState(() => sessionStorage.getItem('upload_error') || null);

  useEffect(() => {
    sessionStorage.setItem('upload_step', step);
  }, [step]);

  useEffect(() => {
    if (result) sessionStorage.setItem('upload_result', JSON.stringify(result));
    else sessionStorage.removeItem('upload_result');
  }, [result]);

  useEffect(() => {
    if (error) sessionStorage.setItem('upload_error', error);
    else sessionStorage.removeItem('upload_error');
  }, [error]);

  const handleContentReady = async (file, text, title) => {
    setStep('analyzing');
    setError(null);
    try {
      const res = await slideService.analyze(text, file, title);
      setResult(res.data);
      setStep('result');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Có lỗi khi phân tích nội dung');
      setStep('upload');
    }
  };

  const handleReset = () => {
    setStep('upload');
    setResult(null);
    setError(null);
    sessionStorage.removeItem('upload_step');
    sessionStorage.removeItem('upload_result');
    sessionStorage.removeItem('upload_error');
    sessionStorage.removeItem('upload_saved_id');
    sessionStorage.removeItem('upload_edited_title');
    sessionStorage.removeItem('upload_new_course');
    sessionStorage.removeItem('upload_selected_course');
  };

  return (
    <main className="upload-page">
      {/* Header */}
      <div className="upload-page-header">
        <h1 className="upload-page-title">
          Upload Slide
        </h1>
        <p className="upload-page-sub">
          Upload file <strong>.txt</strong>, <strong>.md</strong> hoặc <strong>.pptx</strong> — Tự động nhận diện &amp; lưu thuật ngữ tiếng Nhật mới vào database
        </p>

        {/* Stepper */}
        <div className="stepper">
          <div className={`step ${step !== 'upload' ? 'step--done' : 'step--active'}`}>
            <span className="step-num">1</span>
            <span>Upload nội dung</span>
          </div>
          <div className="step-line" />
          <div className={`step ${step === 'analyzing' ? 'step--active' : step === 'result' ? 'step--done' : ''}`}>
            <span className="step-num">2</span>
            <span>Phân tích</span>
          </div>
          <div className="step-line" />
          <div className={`step ${step === 'result' ? 'step--active' : ''}`}>
            <span className="step-num">3</span>
            <span>Xem &amp; Lưu</span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="upload-error">{error}</div>
      )}

      {/* Step content */}
      <div className="upload-page-body">
        {step === 'upload' && (
          <UploadZone onContentReady={handleContentReady} />
        )}

        {step === 'analyzing' && (
          <div className="page-loading" style={{ minHeight: '300px' }}>
            <div className="spinner" />
            <p>Đang phân tích thuật ngữ tiếng Nhật...</p>
            <p className="text-muted" style={{ fontSize: '0.85rem' }}>
              Đang trích xuất nội dung &amp; phân tích — có thể mất 10-30 giây
            </p>
          </div>
        )}

        {step === 'result' && result && (
          <AnalysisResult
            result={result}
            onReset={handleReset}
          />
        )}
      </div>
    </main>
  );
}
