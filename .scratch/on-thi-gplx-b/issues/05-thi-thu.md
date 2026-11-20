# 05: Thi thử

**What to build:** Tôi bấm "Thi thử", nhận một đề 30 câu giống đề thật hạng B, làm trong 20 phút. Trong lúc thi không thấy mẹo, đáp án hay nhãn điểm liệt. Nộp bài (hoặc hết giờ) thì biết ngay ĐẠT/TRƯỢT, có báo rõ khi trượt vì sai câu điểm liệt, rồi xem lại từng câu kèm giải thích và mẹo. Câu sai được đưa vào danh sách câu sai; kết quả được lưu vào lịch sử thi thử.

**Blocked by:** 02 (Mẹo đã kiểm chứng hiện trong chế độ ôn), 04 (Ôn câu sai)

**Status:** ready-for-agent

- [ ] Exam config là một object duy nhất: 30 câu, 20 phút, đạt ≥ 27, phân bổ I 8 / điểm liệt 1 / II 1 / III 1 / IV 1 / V 9 / VI 9 (Thông tư 12/2025/TT-BCA, Công văn 2262/CSGT-P5).
- [ ] Engine tạo đề từ config + RNG: 1 câu từ nhóm điểm liệt; các câu còn lại theo phân bổ chương, chỉ lấy câu không phải điểm liệt; không trùng; xếp theo chương.
- [ ] Engine chấm đề: câu bỏ trống tính sai; trả về số câu đúng, đạt/trượt, cờ "trượt vì sai câu điểm liệt", chi tiết từng câu; lưu vào lịch sử thi thử; ghi nhận các câu vào thống kê và danh sách câu sai.
- [ ] Engine nhận clock từ ngoài để tính thời gian còn lại.
- [ ] UI thi: đồng hồ đếm ngược, lưới câu (đánh dấu câu đã/chưa làm), chuyển qua lại giữa các câu, nộp sớm có xác nhận, hết giờ tự nộp. Không hiện mẹo, đáp án, nhãn điểm liệt.
- [ ] UI kết quả: ĐẠT/TRƯỢT, số câu đúng, lý do trượt; xem lại từng câu (đáp án chọn, đáp án đúng, giải thích, mẹo).
- [ ] Test engine: đúng 30 câu, đúng phân bổ, đúng 1 câu điểm liệt, không trùng, cùng seed thì cùng đề; 27/30 đạt; 26/30 trượt; 30/30 nhưng sai câu điểm liệt thì trượt kèm cờ; câu bỏ trống tính sai; hết giờ (clock giả) thì tự nộp.
