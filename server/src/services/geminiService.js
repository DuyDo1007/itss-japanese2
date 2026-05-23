import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI;

/**
 * Prompt yêu cầu Gemini phân tích nội dung và trả về danh sách thuật ngữ tiếng Nhật.
 * Kết quả phải là JSON array hợp lệ để dễ parse.
 */
const SYSTEM_PROMPT = `Bạn là một chuyên gia ngôn ngữ tiếng Nhật chuyên ngành Công nghệ thông tin (IT) và Quản lý dự án.
Nhiệm vụ của bạn là trích xuất các thuật ngữ quan trọng nhất từ đoạn văn bản slide sau đây.

YÊU CẦU NGHIÊM NGẶT:
1. BỘ LỌC ĐỘ KHÓ: Bỏ qua hoàn toàn các từ vựng giao tiếp cơ bản, từ nối, và các từ thuộc trình độ sơ cấp (N5, N4). Chỉ trích xuất các từ vựng ở mức độ trung - cao cấp (N3, N2 trở lên).
2. TẬP TRUNG CHUYÊN NGÀNH: Ưu tiên tuyệt đối các thuật ngữ liên quan đến IT, phát triển phần mềm, Agile/Scrum, kinh doanh, và quản lý (ví dụ: 解決策, 仮説, 要件, 実装...).
3. GIỚI HẠN SỐ LƯỢNG (QUAN TRỌNG): Chỉ chọn ra và trả về tối đa 5 - 10 từ vựng cốt lõi nhất. Trả về ít từ giúp tốc độ xử lý nhanh hơn.
4. LOẠI TRỪ NHIỄU: Không lấy các con số, tên riêng, ký tự đặc biệt, hoặc các đoạn câu dài bị ngắt dòng. Chỉ lấy từ đơn hoặc cụm từ có nghĩa hoàn chỉnh.
5. KHÔNG DÙNG THẺ HTML: Tuyệt đối không sử dụng các thẻ HTML (như <ruby>, <rt>, <rp>) trong bất kỳ trường nào. Các trường word, reading, furigana chỉ chứa chữ thuần tuý.

Trả về JSON array (KHÔNG có markdown, KHÔNG có text ngoài JSON):
[
  {
    "word": "データベース",
    "reading": "でーたべーす",
    "romaji": "deetabeesu",
    "furigana": "でーたべーす",
    "type": "katakana",
    "category": "IT",
    "definitions": {
      "ja": "データを整理・管理するシステム",
      "en": "A system for organizing and managing data",
      "vi": "Hệ thống tổ chức và quản lý dữ liệu"
    },
    "examples": [
      {
        "sentence": "データベースを使ってデータを管理します。",
        "translation": {
          "vi": "Chúng ta dùng database để quản lý dữ liệu."
        }
      }
    ],
    "difficulty": 2
  }
]

- examples: Chỉ cung cấp ĐÚNG 1 ví dụ ngắn gọn, và chỉ dịch sang tiếng Việt (vi). Bỏ qua tiếng Anh (en) và furigana của ví dụ để tăng tốc độ.

type phải là một trong: "kanji", "katakana", "hiragana", "mixed", "romaji"
difficulty: 1 (rất dễ) đến 5 (rất khó)`;

/**
 * Gọi Gemini AI để trích xuất thuật ngữ tiếng Nhật từ nội dung slide.
 *
 * @param {string} content - Nội dung text của slide
 * @returns {Promise<Array>} - Mảng các object thuật ngữ theo schema Term
 */
export async function extractJapaneseTerms(content) {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
    console.warn('⚠️  GEMINI_API_KEY chưa được cấu hình — bỏ qua AI analysis');
    return [];
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    const prompt = `${SYSTEM_PROMPT}\n\n--- NỘI DUNG SLIDE ---\n${content.slice(0, 8000)}\n--- HẾT NỘI DUNG ---`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse JSON — loại bỏ markdown code block nếu có
    const jsonString = text
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const terms = JSON.parse(jsonString);

    if (!Array.isArray(terms)) {
      console.error('Gemini trả về không phải array:', typeof terms);
      return [];
    }

    // Validate & sanitize từng term
    return terms
      .filter((t) => t.word && typeof t.word === 'string' && t.word.trim())
      .map((t) => {
        // Hàm loại bỏ tags HTML phòng trường hợp AI vẫn nhét vào
        const stripHtml = (str) => (str ? str.replace(/<[^>]*>?/gm, '') : '');
        return {
          word: stripHtml(t.word).trim(),
          reading: stripHtml(t.reading).trim(),
          romaji: stripHtml(t.romaji).trim(),
          furigana: stripHtml(t.furigana || t.reading).trim(),
          type: ['kanji', 'katakana', 'hiragana', 'mixed', 'romaji'].includes(t.type)
          ? t.type
          : 'kanji',
        category: t.category?.trim() || 'IT',
        definitions: {
          ja: t.definitions?.ja?.trim() || '',
          en: t.definitions?.en?.trim() || '',
          vi: t.definitions?.vi?.trim() || '',
        },
        examples: Array.isArray(t.examples)
          ? t.examples.slice(0, 2).map((ex) => ({
            sentence: ex.sentence || '',
            furigana: ex.furigana || '',
            translation: {
              en: ex.translation?.en || '',
              vi: ex.translation?.vi || '',
            },
          }))
          : [],
        difficulty: Number.isInteger(t.difficulty) && t.difficulty >= 1 && t.difficulty <= 5
          ? t.difficulty
          : 3,
        };
      });
  } catch (err) {
    console.error('❌ Gemini extractJapaneseTerms error:', err.message);
    // Không throw — trả về array rỗng để flow vẫn tiếp tục với DB terms
    return [];
  }
}
