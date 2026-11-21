# 09: PWA offline

**What to build:** Sau lần mở đầu tiên, tôi ôn được khi không có mạng, kể cả các câu có hình. Tôi cài được app lên màn hình chính điện thoại.

**Blocked by:** 01 (Khung app + ôn theo chương)

**Status:** done

- [x] Có web app manifest (tên tiếng Việt, icon, chạy dạng standalone); cài được lên màn hình chính.
- [x] Service worker precache app shell, `questions.json`, `tips.json` (khi có) và toàn bộ hình.
- [x] Kiểm tra thủ công: build bản production, mở một lần, tắt mạng, reload → app chạy và hiện được câu có hình.
- [x] Khi có bản build mới, app nhận được bản mới (không bị kẹt cache cũ).
