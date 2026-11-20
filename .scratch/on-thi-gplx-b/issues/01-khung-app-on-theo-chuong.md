# 01: Khung app + ôn theo chương

**What to build:** Tôi mở app, chọn một chương (I–VI) và làm lần lượt từng câu: chọn đáp án là biết ngay đúng/sai, xem giải thích, bấm hình để phóng to, chuyển câu trước/sau hoặc nhảy đến số câu. Đây là tracer bullet đi qua cả ba khối: data build pipeline (`questions.json` + hình), `study-engine` (lấy danh sách câu theo chương), và UI React. Xem spec: `.scratch/on-thi-gplx-b/spec.md`.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Project được `git init`, dựng bằng Vite + React + TypeScript ở thư mục gốc. `data/` và hai file `.txt` giữ nguyên làm dữ liệu nguồn.
- [x] Pipeline sinh `questions.json` gọn (id, mã chương I–VI, cờ điểm liệt, câu hỏi, đáp án a–d, đáp án đúng, giải thích, tên file hình local) và chép hình vào public assets.
- [x] Test pipeline (Vitest) chạy trên dữ liệu thật: 600 câu; số câu từng chương đúng (I 180, II 25, III 58, IV 37, V 185, VI 115); 60 câu điểm liệt; mọi câu có hình đều có file hình (#426 và #427 dùng chung `c426.webp`).
- [x] `study-engine` là module TS thuần (không import React hay API trình duyệt), có thao tác lấy danh sách câu theo chương, sắp theo số câu. Có test qua interface công khai.
- [x] Màn hình chọn chương và màn hình ôn câu: đáp án đúng thứ tự A/B/C/D (không xáo trộn), chọn đáp án thì hiện đúng/sai và giải thích, có câu trước/sau và nhảy đến số câu.
- [x] Bấm hình thì phóng to (lightbox, zoom được trên mobile).
- [x] Dùng tốt trên cả mobile và desktop; dark mode theo `prefers-color-scheme`; toàn bộ text tiếng Việt.
- [x] UI không chứa logic nghiệp vụ, chỉ gọi engine.
