# 03: Lưu tiến độ ôn + ôn 60 câu điểm liệt

**What to build:** Câu trả lời của tôi được lưu lại; đóng tab rồi mở lại, app vẫn nhớ tôi đang ở câu nào trong từng chương. Tôi có thể bật "ngẫu nhiên" để đảo thứ tự câu. Có chế độ riêng ôn 60 câu điểm liệt, và khi ôn thì câu điểm liệt có nhãn "Điểm liệt" nổi bật.

**Blocked by:** 01 (Khung app + ôn theo chương)

**Status:** ready-for-agent

- [ ] `study-engine` nhận storage adapter từ ngoài; app dùng adapter localStorage, test dùng adapter in-memory. Engine nhận RNG có seed được.
- [ ] Ghi nhận câu trả lời (câu, đáp án chọn, đúng/sai, thời điểm); tự lưu sau mỗi câu.
- [ ] Nhớ và khôi phục vị trí đang làm dở theo từng bộ lọc ôn (mỗi chương, điểm liệt).
- [ ] Công tắc "ngẫu nhiên": thứ tự câu xáo bằng RNG; mặc định theo số câu. Thứ tự đáp án trong câu không bao giờ bị xáo.
- [ ] Chế độ ôn 60 câu điểm liệt.
- [ ] Nhãn "Điểm liệt" hiện trong các chế độ ôn.
- [ ] Test engine: ghi nhận và đọc lại câu trả lời, nhớ vị trí, cùng seed thì cùng thứ tự, bộ lọc điểm liệt trả đúng 60 câu.
