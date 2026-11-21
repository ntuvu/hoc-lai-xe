# 02: Mẹo đã kiểm chứng hiện trong chế độ ôn

**What to build:** Khi ôn một câu, tôi thấy các mẹo áp dụng cho câu đó (bấm "Xem mẹo" trước khi trả lời, hoặc tự hiện sau khi trả lời). Mỗi mẹo cho biết câu này thuộc loại nào: mẹo đúng, **ngoại lệ** (mẹo cho sai đáp án), hay **mơ hồ** (mẹo không phân biệt được đáp án). Mẹo độ tin cậy thấp có nhãn riêng. Khi các mẹo mâu thuẫn thì đánh dấu mẹo nên theo. Mọi mẹo trong app đều đã được kiểm chứng với đáp án: build fail nếu có mẹo sai. Chi tiết mô hình mẹo và các sửa đổi đã chốt: xem spec mục "Mô hình mẹo" và "Các sửa đổi mẹo đã chốt". Báo cáo đối chiếu: `.scratch/on-thi-gplx-b/meo-check.md`.

**Blocked by:** 01 (Khung app + ôn theo chương)

**Status:** done

- [x] Có file nguồn mẹo có cấu trúc trong repo: mỗi mẹo có id, tên, quy tắc (viết lại rõ ràng, giữ ý gốc), nguồn, scope (`question`/`chapter`), độ tin cậy, `appliesTo` (id câu + đáp án mẹo chỉ ra), `exceptions` (id + đáp án đúng + lý do), `ambiguous`, `priority` khi cần. Danh sách được tạo một lần bằng script (tham khảo `meo-check.py`), rồi lưu cố định; app không so khớp từ khóa lúc chạy.
- [x] Đã áp đủ các sửa đổi đã chốt: ngoại lệ "quan sát" (#216, #217, #247, #259; giữ #253), "không được" (#261, #270, #484; "cả 3 ý" ưu tiên hơn), "ý x và ý y" (#229; giữ #232), "ưu tiên giảm tốc" (`low`, 10 ngoại lệ), "công an đi thẳng" (#489; lý do ghi sau khi xem hình `c489.webp`), điểm liệt #66 → chọn 4, các câu mơ hồ đã biết.
- [x] Mẹo phải nhìn hình (biển báo, vạch kẻ, sa hình) có `scope: chapter` (V/VI). Mẹo không áp dụng câu nào hoặc khó hiểu thì không đưa vào app, và được liệt kê cho người dùng.
- [x] Hai file `mẹo.txt` / `điểm-liệt.txt` được sửa tại chỗ theo các sửa đổi trên, mỗi chỗ đánh dấu `[sửa]`.
- [x] Pipeline sinh `tips.json` và **fail build** nếu: id câu không tồn tại; câu trong `appliesTo` mà đáp án mẹo chỉ ra ≠ đáp án đúng; câu trong `exceptions` mà đáp án mẹo chỉ ra = đáp án đúng; một id vừa ở `appliesTo` vừa ở `exceptions`. Có test cho từng điều kiện.
- [x] `study-engine` có thao tác lấy mẹo của một câu: trả về các mẹo, trạng thái `applies`/`exception`/`ambiguous`, độ tin cậy, cờ "mẹo nên theo". Có test (gồm #261, nơi "cả 3 ý" thắng "không được").
- [x] Màn hình ôn: nút "Xem mẹo" trước khi trả lời; sau khi trả lời tự hiện mẹo; ngoại lệ, mơ hồ và độ tin cậy thấp có cảnh báo rõ.
- [x] **Người dùng đã duyệt** (human step): bản viết lại câu chữ từng mẹo và danh sách câu áp dụng / ngoại lệ / mơ hồ. Ticket chỉ xong khi người dùng xác nhận.

## Comments

**Agent (2026-11-21):** Phần code xong. Còn bước duyệt của người dùng:
- File nguồn mẹo: `data/meo.json` (sinh bằng `scripts/seed-tips.py`, sửa tay trực tiếp file JSON được). `npm run build:data` kiểm chứng lại và fail nếu sai.
- Mẹo KHÔNG đưa vào app (liệt kê ở `excluded` trong `data/meo.json`): "B1 → xe 3 bánh" (không có câu nào), "tư thế lái → 10h" (khó hiểu), "số bánh xe cuối − 1" (không xác định được câu), "dừng đỗ → ý 2" cho mọi câu (chỉ đúng #14, #15, đã gộp).
- #489: lý do ngoại lệ lấy theo phần giải thích của bộ đề (xe tải đi đường ưu tiên → đi ngay sau xe công an).

**Agent (2026-11-21):** Người dùng đã xác nhận duyệt `data/meo.json` ("xác nhận"). Đóng ticket.
