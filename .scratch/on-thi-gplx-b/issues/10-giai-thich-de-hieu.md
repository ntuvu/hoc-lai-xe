# 10: Giải thích dễ hiểu + minh họa cho từng câu

**What to build:** Mỗi câu trong 600 câu có thêm phần "Hiểu nhanh": giải thích bằng lời đơn giản vì sao đáp án đúng, một minh họa (emoji / tình huống đời thường) và một câu nhớ nhanh. Hiện sau khi trả lời trong chế độ ôn và khi xem lại bài thi thử (không hiện trong lúc thi).

**Blocked by:** 01

**Status:** done

- [x] Dữ liệu nguồn `data/giai-thich/*.json` (key = số câu → `easy`, `picture`, `remember`); pipeline gộp vào `questions.json` và báo lỗi nếu thiếu trường / trùng / sai số câu.
- [x] UI hiện khối "Hiểu nhanh" sau khi trả lời và khi xem lại bài thi.
- [x] Đủ 600/600 câu; test pipeline kiểm tra đủ 600 câu đều có giải thích, và nội dung khớp đáp án đúng (không nhắc sai số thứ tự đáp án).
