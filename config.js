/* ===== إعدادات الموقع — عدّل هنا فقط ===== */
window.CFG = {
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyGLGY8glSxqD0dxoJUlOdSfBCkUvjbqV_1h9Ei5XJSW883keiBBYJi3LWPfbDi_7Eagw/exec",   // ← رابط Google Apps Script الذي ينتهي بـ /exec (اتركه فارغاً للتجربة المحلية)
  OFFICE: "مكتب الأولمبياد العلمي السوري بدرعا",
  ENGINEER: "المهندس أسامة الصلخدي",
  SUBJECT: "المعلوماتية"
};

/* ===== قائمة الاختبارات =====
   لإضافة اختبار جديد: انسخ exams/exam-01.js باسم جديد، غيّر id والأسئلة،
   ثم أضف سطراً هنا، وضع مفتاح إجاباته في Code.gs داخل ANSWER_KEYS بنفس الـ id. */
window.EXAMS_MANIFEST = [
  { id: "exam1", file: "exams/exam-01.js", title: "الاختبار التجريبي الأول",
    desc: "أسئلة المرحلة الأولى 2024-2025", count: 34 }
  // { id: "exam2", file: "exams/exam-02.js", title: "الاختبار التجريبي الثاني", desc: "...", count: 30 },
];
