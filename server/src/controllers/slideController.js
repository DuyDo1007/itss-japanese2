import Slide from '../models/Slide.js';
import Term from '../models/Term.js';
import Course from '../models/Course.js';
import { extractJapaneseTerms } from '../services/geminiService.js';
import { parseOffice } from 'officeparser';


// ── Helper: extract text từ file PPTX dùng officeparser ─────────────────────
async function extractTextFromPptx(buffer) {
  // Khi truyền Buffer, officeparser không tự detect file type
  // → cần khai báo fileType: 'pptx' rõ ràng
  const text = await parseOffice(buffer, {
    fileType: 'pptx',
    newlineDelimiter: '\n',
    putNewlineAfterNParagraphs: 1,
    ignoreNotes: false,
  });
  return text || '';
}

// ── Helper: annotate content — bold các thuật ngữ tìm được ──────────────────
function annotateContent(content, terms) {
  let annotated = content;
  // Sắp xếp theo độ dài giảm dần để ưu tiên match dài hơn
  const sorted = [...terms].sort((a, b) => b.word.length - a.word.length);

  for (const term of sorted) {
    const word = term.word;
    if (!content.includes(word)) continue;
    const boldedWord = `**${word}**`;
    const parts = annotated.split(boldedWord);
    annotated = parts.map(part => part.split(word).join(boldedWord)).join(boldedWord);
  }
  return annotated;
}

// GET /api/slides — Lấy danh sách slides
export const getAllSlides = async (req, res) => {
  try {
    const slides = await Slide.find().populate('terms').sort({ order: 1 });
    res.json({ success: true, data: slides, count: slides.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/slides/:id — Chi tiết một slide (populate đầy đủ terms)
export const getSlideById = async (req, res) => {
  try {
    const slide = await Slide.findById(req.params.id).populate('terms');
    if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });
    res.json({ success: true, data: slide });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/slides — Tạo slide mới
export const createSlide = async (req, res) => {
  try {
    const slide = await Slide.create(req.body);
    res.status(201).json({ success: true, data: slide });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PUT /api/slides/:id — Cập nhật slide
export const updateSlide = async (req, res) => {
  try {
    const slide = await Slide.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('terms');
    if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });
    res.json({ success: true, data: slide });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteSlide = async (req, res) => {
  try {
    const slide = await Slide.findByIdAndDelete(req.params.id);
    if (!slide) return res.status(404).json({ success: false, message: 'Slide not found' });

    // Cập nhật các Course chứa slide này (xoá ID khỏi mảng và giảm totalSlides)
    await Course.updateMany(
      { slides: slide._id },
      { $pull: { slides: slide._id }, $inc: { totalSlides: -1 } }
    );

    res.json({ success: true, message: 'Slide deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /api/slides/analyze
 *
 * Flow mới:
 * 1. Nhận file (.txt / .md / .pptx) hoặc content paste
 * 2. Extract text (nếu .pptx: dùng officeparser)
 * 3. Tìm terms đã có trong DB (match theo word)
 * 4. Gọi Gemini AI để tìm thêm thuật ngữ mới
 * 5. Lưu các terms mới vào DB (upsert)
 * 6. Annotate content, trả về kết quả đầy đủ
 */
export const analyzeSlide = async (req, res) => {
  try {
    let { content, title } = req.body;
    let isPptx = false;
    console.log("📥 Req.body:", req.body);
    console.log("📦 Req.file:", req.file);

    // ── Bước 1: Extract nội dung ────────────────────────────────────────────
    if (req.file) {
      req.file.originalname = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
      const ext = req.file.originalname.slice(req.file.originalname.lastIndexOf('.')).toLowerCase();

      if (ext === '.pptx') {
        isPptx = true;
        try {
          content = await extractTextFromPptx(req.file.buffer);
          // Tự động lấy tên file làm title nếu chưa có
          if (!title) {
            title = req.file.originalname.replace(/\.pptx$/i, '');
          }
        } catch (pptxErr) {

          return res.status(422).json({
            success: false,
            message: `Không thể đọc file PPTX: ${pptxErr.message}`,
          });
        }
      } else if (ext === '.pdf') {
        try {
          const { PDFParse } = await import('pdf-parse');
          if (!PDFParse) {
            throw new Error("Thư viện không được load đúng cách.");
          }
          const parser = new PDFParse({ data: req.file.buffer });
          const textResult = await parser.getText();
          content = textResult.text;
          if (!title) {
            title = req.file.originalname.replace(/\.pdf$/i, '');
          }
        } catch (pdfErr) {
          console.error("🚨 Lỗi chi tiết từ thư viện pdf-parse:", pdfErr);
          return res.status(422).json({
            success: false,
            message: `Không thể đọc file PDF: ${pdfErr.message}`,
          });
        }
      } else {
        // .txt / .md
        content = req.file.buffer.toString('utf-8');
      }
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Nội dung không được để trống' });
    }

    // ── Bước 2: Tìm terms đã có trong DB ────────────────────────────────────
    const allDbTerms = await Term.find({});

    const sortedDbTerms = [...allDbTerms].sort((a, b) => b.word.length - a.word.length);
    const dbFoundTerms = sortedDbTerms.filter((term) => content.includes(term.word));

    const dbFoundWordSet = new Set(dbFoundTerms.map((t) => t.word));

    // ── Bước 3: Gọi Gemini AI ────────────────────────────────────────────────
    console.log('🤖 Gọi Gemini AI để phân tích thuật ngữ...');
    const aiTermsRaw = await extractJapaneseTerms(content);

    // Tách: AI terms nào chưa có trong DB
    const newAiTermsData = aiTermsRaw.filter(
      (aiTerm) => !dbFoundWordSet.has(aiTerm.word) && content.includes(aiTerm.word)
    );

    // ── Bước 4: Lưu terms mới vào DB ────────────────────────────────────────
    let createdTerms = [];
    if (newAiTermsData.length > 0) {
      console.log(`✨ Tạo ${newAiTermsData.length} terms mới từ AI...`);

      // insertMany với upsert để tránh duplicate nếu race condition
      const insertOps = newAiTermsData.map((t) => ({
        updateOne: {
          filter: { word: t.word },
          update: { $setOnInsert: t },
          upsert: true,
        },
      }));
      await Term.bulkWrite(insertOps);

      // Lấy lại các terms vừa tạo để có _id
      createdTerms = await Term.find({ word: { $in: newAiTermsData.map((t) => t.word) } });
    }

    // AI terms đã có trong DB (AI tìm lại terms cũ)
    const aiFoundExistingTerms = aiTermsRaw
      .filter((aiTerm) => dbFoundWordSet.has(aiTerm.word))
      .map((aiTerm) => dbFoundTerms.find((t) => t.word === aiTerm.word))
      .filter(Boolean);

    // ── Bước 5: Merge tất cả terms ──────────────────────────────────────────
    // DB terms + terms mới từ AI (đã lưu) — tránh duplicate
    const allFoundTerms = [
      ...dbFoundTerms,
      ...createdTerms,
    ];
    // Deduplicate theo _id
    const termMap = new Map();
    allFoundTerms.forEach((t) => termMap.set(t._id.toString(), t));
    const mergedTerms = Array.from(termMap.values());

    // ── Bước 6: Annotate content ─────────────────────────────────────────────
    const annotatedContent = annotateContent(content, mergedTerms);

    // ── Thống kê ─────────────────────────────────────────────────────────────
    const stats = {
      totalChars: content.length,
      totalLines: content.split('\n').length,
      termsFound: mergedTerms.length,
      termsFromDb: dbFoundTerms.length,
      termsNewFromAi: createdTerms.length,
      isPptx,
      termWords: mergedTerms.map((t) => ({
        word: t.word,
        romaji: t.romaji,
        type: t.type,
        definitionVi: t.definitions?.vi,
        isNew: createdTerms.some((nt) => nt._id.toString() === t._id.toString()),
      })),
    };

    res.json({
      success: true,
      data: {
        title: title || '',
        originalContent: content,
        annotatedContent,
        foundTermIds: mergedTerms.map((t) => t._id),
        foundTerms: mergedTerms,
        // Phân loại để frontend hiển thị riêng
        newTermsCreated: createdTerms,
        dbTermsFound: dbFoundTerms,
        stats,
      },
    });
  } catch (err) {
    console.error('analyzeSlide error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
