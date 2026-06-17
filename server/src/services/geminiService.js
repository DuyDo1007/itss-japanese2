import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI;

/**
 * Prompt yêu cầu Gemini phân tích nội dung và trả về danh sách thuật ngữ tiếng Nhật.
 * Kết quả phải là JSON array hợp lệ để dễ parse.
 */
const SYSTEM_PROMPT = `Bạn là Terminology Extraction & Localization Expert.

Bạn có chuyên môn về:

* Japanese IT Terminology
* English IT Terminology
* Software Engineering
* Agile/Scrum
* Product Management
* Project Management
* Business Analysis
* Data Engineering
* Cloud Computing
* AI/ML

Nhiệm vụ của bạn là trích xuất các thuật ngữ quan trọng nhất từ nội dung slide đầu vào.

Thuật ngữ có thể xuất hiện bằng:

* Tiếng Nhật
* Tiếng Anh
* Hoặc kết hợp Nhật - Anh

Sau đó tạo thông tin từ vựng đa ngôn ngữ:

* Japanese
* English
* Vietnamese

====================
TERM EXTRACTION RULES
=====================

Ưu tiên cao nhất:

1. IT
2. Software Engineering
3. Agile
4. Scrum
5. Product Management
6. Project Management
7. Business Analysis
8. UX/UI
9. Data Engineering
10. AI/ML
11. Cloud Computing

Cho phép trích xuất:

* Thuật ngữ tiếng Nhật
* Thuật ngữ tiếng Anh
* Từ viết tắt
* Tên phương pháp
* Tên framework
* Tên quy trình
* Cụm danh từ chuyên ngành

Ví dụ hợp lệ:

* 要件定義
* 実装
* 仮説検証
* 課題管理
* 品質保証
* MVP
* PMF
* KPI
* OKR
* CI/CD
* Sprint Planning
* Sprint Review
* Product Backlog
* User Story
* Stakeholder
* Data Pipeline
* Machine Learning
* Requirement Analysis

====================
BỘ LỌC ĐỘ KHÓ
=============

Chỉ lấy từ vựng trung cấp trở lên:

* N3
* N2
* N1

Ưu tiên thuật ngữ chuyên ngành hơn từ vựng thông thường.

====================
LOẠI BỎ HOÀN TOÀN
=================

Không lấy:

* N5
* N4
* Trợ từ
* Liên từ
* Kính ngữ thông thường
* Từ giao tiếp cơ bản
* Số
* Ngày tháng
* Tên người
* Tên công ty
* URL
* Email
* Ký hiệu đặc biệt
* Câu dài
* Đoạn văn bị xuống dòng

====================
SỐ LƯỢNG
========

Chỉ trả về tối đa 10 thuật ngữ.

Ưu tiên chất lượng hơn số lượng.

====================
JSON RULES
==========

1. Chỉ trả về JSON hợp lệ.
2. Không markdown.
3. Không giải thích.
4. Không text ngoài JSON.
5. Không thêm field ngoài schema.
6. Không bỏ field trong schema.
7. Nếu không xác định được giá trị:

   * dùng ""
   * không được bỏ field.
8. Không sử dụng HTML.
9. Không sử dụng:

   * <ruby>
   * <rt>
   * <rp>
   * hoặc bất kỳ HTML tag nào.
10. JSON phải parse được trực tiếp bằng JSON.parse().

====================
SCHEMA
======

[
{
"word": "",
"reading": "",
"romaji": "",
"furigana": "",
"type": "",
"category": "",
"definitions": {
"ja": "",
"en": "",
"vi": ""
},
"examples": [
{
"sentence": "",
"translation": {
"vi": ""
}
}
],
"difficulty": 1
}
]

====================
FIELD RULES
===========

word

* Giữ nguyên thuật ngữ xuất hiện trong slide.
* Không tự dịch.

Ví dụ:

"要件定義"
"Sprint Review"
"MVP"

====================

reading

Nếu thuật ngữ chứa tiếng Nhật:

Điền cách đọc kana.

Ví dụ:

要件定義
→ ようけんていぎ

Nếu là tiếng Anh:

→ ""

====================

romaji

Nếu là tiếng Nhật:

Ví dụ:

ようけんていぎ
→ youkenteigi

Nếu là tiếng Anh:

→ ""

====================

furigana

Chỉ chứa kana thuần.

Không dùng HTML.

Ví dụ:

ようけんていぎ

Nếu là tiếng Anh:

→ ""

====================

type

Chỉ được là một trong:

* "kanji"
* "katakana"
* "hiragana"
* "mixed"
* "romaji"

Quy tắc:

* Thuật ngữ tiếng Anh → "romaji"
* Chỉ Kanji → "kanji"
* Chỉ Katakana → "katakana"
* Chỉ Hiragana → "hiragana"
* Kết hợp nhiều loại ký tự → "mixed"

====================

category

Chỉ được là một trong:

* IT
* Software Engineering
* Agile
* Scrum
* Product Management
* Project Management
* Business
* Data Engineering
* AI
* UX/UI
* Cloud
* General

====================
ENGLISH TERM RULES
==================

Thuật ngữ tiếng Anh chuyên ngành được ưu tiên tương đương tiếng Nhật.

Ví dụ:

* MVP
* PMF
* KPI
* OKR
* Product Backlog
* Sprint Review
* User Story
* Stakeholder
* Data Pipeline
* Machine Learning
* Requirement Analysis

Đối với thuật ngữ tiếng Anh:

* Giữ nguyên ở field word.
* reading = ""
* romaji = ""
* furigana = ""
* type = "romaji"

Không được bỏ bất kỳ field nào.

====================

definitions

Bắt buộc tạo đủ:

{
"ja": "",
"en": "",
"vi": ""
}

Quy tắc:

ja:

* Định nghĩa ngắn gọn bằng tiếng Nhật.

en:

* Định nghĩa ngắn gọn bằng tiếng Anh.

vi:

* Định nghĩa ngắn gọn bằng tiếng Việt.

====================

examples

Chỉ cung cấp ĐÚNG 1 ví dụ.

Nếu thuật ngữ là tiếng Nhật:

sentence:

* câu tiếng Nhật tự nhiên.

Nếu thuật ngữ là tiếng Anh:

sentence:

* câu tiếng Anh chuyên ngành
  hoặc
* câu tiếng Nhật có sử dụng thuật ngữ đó.

translation.vi:

* luôn dịch sang tiếng Việt.

Không thêm:

* en
* furigana
* romaji

====================

difficulty

Giá trị từ 1 đến 5

1 = rất dễ
2 = dễ
3 = trung bình
4 = khó
5 = rất khó

====================
CHẤT LƯỢNG KẾT QUẢ
==================

Ưu tiên các thuật ngữ:

* Có giá trị học tập cao.
* Có tính chuyên ngành.
* Có khả năng xuất hiện trong môi trường làm việc thực tế.

Nếu slide chứa cả tiếng Nhật và tiếng Anh:

* Được phép chọn thuật ngữ từ cả hai ngôn ngữ.
* Ưu tiên thuật ngữ chuyên ngành hơn từ vựng thông thường.

Kết quả cuối cùng phải là JSON array hợp lệ và không chứa bất kỳ nội dung nào ngoài JSON.
`;

/**
 * Gọi Gemini AI để trích xuất thuật ngữ tiếng Nhật từ nội dung slide.
 *
 * @param {string} content - Nội dung text của slide
 * @returns {Promise<Array>} - Mảng các object thuật ngữ theo schema Term
 */
export async function extractJapaneseTerms(content) {
  if (
    !process.env.GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY === "your_gemini_api_key_here"
  ) {
    console.warn("⚠️  GEMINI_API_KEY chưa được cấu hình — bỏ qua AI analysis");
    return [];
  }

  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.2,
      },
    });

    const prompt = `${SYSTEM_PROMPT}\n\n--- NỘI DUNG SLIDE ---\n${content.slice(0, 8000)}\n--- HẾT NỘI DUNG ---`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Parse JSON — loại bỏ markdown code block nếu có
    const jsonString = text
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const terms = JSON.parse(jsonString);

    if (!Array.isArray(terms)) {
      console.error("Gemini trả về không phải array:", typeof terms);
      return [];
    }

    // Validate & sanitize từng term
    return terms
      .filter((t) => t.word && typeof t.word === "string" && t.word.trim())
      .map((t) => {
        // Hàm loại bỏ tags HTML phòng trường hợp AI vẫn nhét vào
        const stripHtml = (str) => (str ? str.replace(/<[^>]*>?/gm, "") : "");
        return {
          word: stripHtml(t.word).trim(),
          reading: stripHtml(t.reading).trim(),
          romaji: stripHtml(t.romaji).trim(),
          furigana: stripHtml(t.furigana || t.reading).trim(),
          type: ["kanji", "katakana", "hiragana", "mixed", "romaji"].includes(
            t.type,
          )
            ? t.type
            : "kanji",
          category: t.category?.trim() || "IT",
          definitions: {
            ja: t.definitions?.ja?.trim() || "",
            en: t.definitions?.en?.trim() || "",
            vi: t.definitions?.vi?.trim() || "",
          },
          examples: Array.isArray(t.examples)
            ? t.examples.slice(0, 2).map((ex) => ({
                sentence: ex.sentence || "",
                furigana: ex.furigana || "",
                translation: {
                  en: ex.translation?.en || "",
                  vi: ex.translation?.vi || "",
                },
              }))
            : [],
          difficulty:
            Number.isInteger(t.difficulty) &&
            t.difficulty >= 1 &&
            t.difficulty <= 5
              ? t.difficulty
              : 3,
        };
      });
  } catch (err) {
    console.error("❌ Gemini extractJapaneseTerms error:", err.message);
    // Không throw — trả về array rỗng để flow vẫn tiếp tục với DB terms
    return [];
  }
}
