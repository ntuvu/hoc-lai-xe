# 04: Ôn câu sai

**What to build:** Câu nào tôi trả lời sai sẽ vào danh sách câu sai. Tôi có chế độ chỉ ôn các câu đó, và thấy còn bao nhiêu câu. Một câu chỉ ra khỏi danh sách khi tôi trả lời đúng 2 lần liên tiếp; sai lại thì đếm lại từ đầu.

**Blocked by:** 03 (Lưu tiến độ ôn + ôn 60 câu điểm liệt)

**Status:** done

- [x] Engine: trả lời sai → câu vào danh sách, bộ đếm đúng liên tiếp = 0; trả lời đúng khi đang trong danh sách → bộ đếm +1; đạt 2 → ra khỏi danh sách.
- [x] Engine: bộ lọc "câu sai" để lấy danh sách câu cần ôn, và số câu còn lại.
- [x] Chế độ ôn câu sai trên UI, có hiện số câu còn lại; danh sách rỗng thì báo rõ.
- [x] Test engine: sai → vào; đúng 1 lần → còn; đúng 2 lần liên tiếp → ra; đúng–sai–đúng → còn.
