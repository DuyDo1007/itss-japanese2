import { useState, useEffect } from 'react';
import { courseService } from '../services/index.js';

export default function DirectoryPage() {
  const [directoryData, setDirectoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    courseService
      .getDirectoryData()
      .then((res) => setDirectoryData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-loading" style={{ minHeight: 200 }}>
        <div className="spinner" />
        <p>Loading directory...</p>
      </div>
    );
  }

  const filteredData = directoryData
    .map(course => {
      const filteredTerms = course.terms?.filter(t => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          t.word?.toLowerCase().includes(query) ||
          t.romaji?.toLowerCase().includes(query) ||
          t.furigana?.toLowerCase().includes(query) ||
          t.definitions?.vi?.toLowerCase().includes(query) ||
          t.definitions?.en?.toLowerCase().includes(query)
        );
      });
      return { ...course, terms: filteredTerms, totalTerms: filteredTerms?.length || 0 };
    })
    .filter(course => course.terms && course.terms.length > 0);

  return (
    <main className="directory-page">
      <div className="page-hero">
        <h1 className="page-hero-title">
          <span className="jp-text">用語集</span>
          <span>Directory</span>
        </h1>
        <p className="page-hero-sub">
          Truy cập nhanh toàn bộ thuật ngữ đã được AI nhận diện từ các slide, chia theo từng môn học.
        </p>
        <div className="directory-search-wrapper" style={{ marginTop: '1.5rem', maxWidth: '600px', width: '100%' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Tìm kiếm thuật ngữ tiếng Nhật, Romaji, tiếng Việt..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '8px' }}
          />
        </div>
      </div>

      <div className="directory-content">
        {filteredData.length === 0 ? (
          <p className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>
            {searchQuery ? 'Không tìm thấy thuật ngữ nào phù hợp với tìm kiếm của bạn.' : 'Chưa có thuật ngữ nào được nhận diện.'}
          </p>
        ) : (
          filteredData.map((course) => (
            <div key={course._id} className="directory-course-section">
              <div className="directory-course-header">
                <h2 className="directory-course-title">
                  {course.titleJa && <span className="jp-text course-title-ja">{course.titleJa}</span>}
                  <span className="course-title-en">{course.title}</span>
                </h2>
                <div className="directory-course-meta">
                  <span className="badge badge--primary">{course.totalTerms} terms</span>
                </div>
              </div>

              {course.terms && course.terms.length > 0 ? (
                <div className="terms-table-wrap">
                  <table className="terms-table">
                    <thead>
                      <tr>
                        <th>Từ</th>
                        <th>Romaji</th>
                        <th>Loại</th>
                        <th>Định nghĩa (VI)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.terms.map((t) => (
                        <tr key={t._id}>
                          <td className="term-word-cell jp-text">
                            {t.word ? t.word.replace(/<[^>]*>?/gm, '') : ''}
                            {t.furigana && t.furigana !== t.word && (
                              <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                                {t.furigana.replace(/<[^>]*>?/gm, '')}
                              </div>
                            )}
                          </td>
                          <td className="romaji-cell">{t.romaji}</td>
                          <td><span className="type-badge">{t.type}</span></td>
                          <td className="def-cell">{t.definitions?.vi || t.definitions?.en || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted" style={{ padding: '1rem' }}>Chưa có thuật ngữ nào trong môn này.</p>
              )}
            </div>
          ))
        )}
      </div>
    </main>
  );
}
