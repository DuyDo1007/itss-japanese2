import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { courseService } from '../services/index.js';
import ConfirmModal from '../components/ConfirmModal.jsx';

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null); // id of course to delete

  useEffect(() => {
    courseService
      .getAll()
      .then((res) => setCourses(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteClick = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget(id);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    try {
      await courseService.delete(deleteTarget);
      setCourses(courses.filter(c => c._id !== deleteTarget));
    } catch (err) {
      alert('Lỗi khi xoá: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" />
        <p>Loading courses...</p>
      </div>
    );
  }

  return (
    <main className="courses-page">
      <div className="page-hero">
        <h1 className="page-hero-title">
          <span className="jp-text">学習コース</span>
          <span>Learning Courses</span>
        </h1>
        <p className="page-hero-sub">
          Học từ vựng chuyên ngành tiếng Nhật trực tiếp trên slide bài giảng
        </p>
      </div>

      <div className="courses-grid">
        {courses.map((course) => (
          <Link
            key={course._id}
            to={`/courses/${course._id}`}
            className="course-card"
          >
            <div className="course-card-top" style={{ justifyContent: 'space-between' }}>
              <div>
                <span className={`course-level-badge course-level-badge--${course.level}`}>
                  {course.level}
                </span>
                <span className="course-lang-badge" style={{ marginLeft: '0.5rem' }}>{course.language}</span>
              </div>
              <button
                className="btn-icon text-muted"
                onClick={(e) => handleDeleteClick(e, course._id)}
                title="Xoá môn học"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#f87171' }}
              >
                Xóa
              </button>
            </div>

            <h2 className="course-card-title">
              {course.titleJa && (
                <span className="jp-text course-title-ja">{course.titleJa}</span>
              )}
              <span className="course-title-en">{course.title}</span>
            </h2>

            {course.description && (
              <p className="course-card-desc">{course.description}</p>
            )}

            <div className="course-card-meta">
              {course.instructor?.name && (
                <span>{course.instructor.name}</span>
              )}
              <span>{course.totalSlides} slides</span>
              <span>{course.totalTerms} terms</span>
            </div>

            <div className="course-card-cta">
              Bắt đầu học →
            </div>
          </Link>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Xoá môn học?"
        message="Bạn có chắc muốn xoá môn học này và toàn bộ slide/thuật ngữ bên trong không? Hành động này không thể hoàn tác."
        confirmText="Xoá môn học"
        onConfirm={executeDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </main>
  );
}
