# 08: Xuất / nhập / reset tiến độ

**What to build:** Tôi xuất toàn bộ tiến độ (câu trả lời, câu sai, vị trí đang làm, lịch sử thi thử) ra một file JSON để sao lưu, rồi nhập lại trên trình duyệt hoặc máy khác. File hỏng thì báo lỗi rõ và tiến độ hiện tại không bị đụng tới. Tôi cũng reset được tiến độ (có xác nhận).

**Blocked by:** 05 (Thi thử)

**Status:** done

- [x] Engine xuất tiến độ thành object JSON có trường `version` của schema.
- [x] Engine nhập: validate toàn bộ trước; không hợp lệ → trả lỗi, không thay đổi dữ liệu; hợp lệ → thay thế toàn bộ.
- [x] Engine reset tiến độ.
- [x] UI cài đặt: nút xuất (tải file), nhập (chọn file), reset (có xác nhận); hiện thông báo lỗi khi nhập thất bại.
- [x] Test engine: xuất → nhập ra lại đúng trạng thái; file sai schema / sai version / JSON hỏng → báo lỗi, trạng thái cũ giữ nguyên; reset xóa hết.
