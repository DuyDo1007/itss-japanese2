import Term from '../models/Term.js';

// GET /api/terms — Lấy tất cả terms (có filter theo category/type)
export const getAllTerms = async (req, res) => {
  try {
    const { category, type, search, limit = 50 } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (type) filter.type = type;
    if (search) filter.$text = { $search: search };

    const terms = await Term.find(filter).limit(Number(limit)).sort({ createdAt: -1 });
    res.json({ success: true, data: terms, count: terms.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/terms/:id — Lấy một term theo ID
export const getTermById = async (req, res) => {
  try {
    const term = await Term.findById(req.params.id);
    if (!term) return res.status(404).json({ success: false, message: 'Term not found' });
    res.json({ success: true, data: term });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/terms — Tạo term mới
export const createTerm = async (req, res) => {
  try {
    const term = await Term.create(req.body);
    res.status(201).json({ success: true, data: term });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/terms/:id — Cập nhật term
export const updateTerm = async (req, res) => {
  try {
    const term = await Term.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!term) return res.status(404).json({ success: false, message: 'Term not found' });
    res.json({ success: true, data: term });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/terms/:id — Xoá term
export const deleteTerm = async (req, res) => {
  try {
    const term = await Term.findByIdAndDelete(req.params.id);
    if (!term) return res.status(404).json({ success: false, message: 'Term not found' });
    res.json({ success: true, message: 'Term deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
