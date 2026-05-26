import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { courseService, slideService } from '../services/index.js';
import ConfirmModal from '../components/ConfirmModal.jsx';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteCourseConfirm, setDeleteCourseConfirm] = useState(false);
  const [deleteSlideTarget, setDeleteSlideTarget] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    courseService
      .getById(courseId)
      .then((res) => setCourse(res.data))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleDeleteCourseClick = () => {
    setDeleteCourseConfirm(true);
  };

  const executeDeleteCourse = async () => {
    try {
      await courseService.delete(courseId);
      navigate('/');
    } catch (err) {
      alert('Lỗi khi xoá môn học: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleteCourseConfirm(false);
    }
  };

  const handleDeleteSlideClick = (e, slideId) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteSlideTarget(slideId);
  };

  const executeDeleteSlide = async () => {
    if (!deleteSlideTarget) return;
    try {
      await slideService.delete(deleteSlideTarget);
      setCourse({
        ...course,
        slides: course.slides.filter((s) => s._id !== deleteSlideTarget),
        totalSlides: course.totalSlides > 0 ? course.totalSlides - 1 : 0
      });
    } catch (err) {
      alert('Lỗi khi xoá slide: ' + (err.response?.data?.message || err.message));
    } finally {
      setDeleteSlideTarget(null);
    }
  };

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!course) return <div className="page-error">Course not found</div>;

  return (
    <main className="course-detail-page">
      <div className="course-detail-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <Link to="/" className="back-link" style={{ marginBottom: 0 }}>← Courses</Link>
          <button 
            onClick={handleDeleteCourseClick} 
            className="btn-icon text-muted"
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#f87171' }}
          >
            Xoá môn học
          </button>
        </div>
        <h1 className="jp-text course-detail-title-ja">{course.titleJa}</h1>
        <p className="course-detail-title-en">{course.title}</p>
        {course.description && (
          <p className="course-detail-desc">{course.description}</p>
        )}
      </div>

      <div className="slides-list">
        <h2 className="slides-list-heading">Danh sách Slides</h2>
        {course.slides?.map((slide, idx) => (
          <Link
            key={slide._id}
            to={`/slides/${slide._id}`}
            className="slide-list-item-card"
          >
            <span className="slide-index">{String(idx + 1).padStart(2, '0')}</span>
            <div className="slide-info">
              <span className="jp-text slide-info-title">{slide.title}</span>
              {slide.titleRomaji && (
                <span className="slide-info-romaji">{slide.titleRomaji}</span>
              )}
            </div>
            <span className="slide-arrow" style={{ marginRight: '1rem' }}>→</span>
            <button
              className="btn-icon text-muted"
              onClick={(e) => handleDeleteSlideClick(e, slide._id)}
              title="Xoá slide"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', marginLeft: 'auto', color: '#f87171' }}
            >
              Xóa
            </button>
          </Link>
        ))}
      </div>

      <ConfirmModal
        isOpen={deleteCourseConfirm}
        title="Xoá môn học?"
        message="Bạn có chắc muốn xoá môn học này và toàn bộ slide bên trong không? Hành động này không thể hoàn tác."
        confirmText="Xoá môn học"
        onConfirm={executeDeleteCourse}
        onCancel={() => setDeleteCourseConfirm(false)}
      />

      <ConfirmModal
        isOpen={!!deleteSlideTarget}
        title="Xoá slide?"
        message="Bạn có chắc muốn xoá slide này không? Thuật ngữ trong slide vẫn sẽ được giữ lại trong từ điển (Directory)."
        confirmText="Xoá slide"
        onConfirm={executeDeleteSlide}
        onCancel={() => setDeleteSlideTarget(null)}
      />
    </main>
  );
}
