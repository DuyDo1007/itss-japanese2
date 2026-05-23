import Course from '../models/Course.js';

// GET /api/courses — Danh sách tất cả courses
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .select('-slides') // Không trả slides array (nặng), chỉ trả metadata
      .sort({ createdAt: -1 });
    res.json({ success: true, data: courses, count: courses.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/courses/:id — Chi tiết course + populate slides (không populate terms)
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate({
      path: 'slides',
      select: 'title titleRomaji order isPublished thumbnailUrl',
      options: { sort: { order: 1 } },
    });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/courses — Tạo course mới
export const createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/courses/:id — Cập nhật course
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, data: course });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/courses/:id
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/courses/directory/data — Lấy tất cả courses kèm theo danh sách unique terms
export const getDirectoryData = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate({
        path: 'slides',
        select: 'terms title',
        populate: {
          path: 'terms',
        }
      })
      .sort({ createdAt: -1 });

    // Format lại data: Gộp tất cả terms từ các slides vào một mảng duy nhất cho mỗi course
    const data = courses.map(course => {
      const allTermsMap = new Map(); // Dùng Map để lọc các term trùng lặp

      if (course.slides) {
        course.slides.forEach(slide => {
          if (slide.terms) {
            slide.terms.forEach(term => {
              if (term && term._id && !allTermsMap.has(term._id.toString())) {
                allTermsMap.set(term._id.toString(), term);
              }
            });
          }
        });
      }

      return {
        _id: course._id,
        title: course.title,
        titleJa: course.titleJa,
        category: course.category,
        totalTerms: allTermsMap.size,
        terms: Array.from(allTermsMap.values())
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
