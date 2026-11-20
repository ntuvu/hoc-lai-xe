# Spec: Web app ôn thi lý thuyết GPLX hạng B kèm mẹo đã kiểm chứng

Status: ready-for-agent

## Problem Statement

Tôi sắp thi lý thuyết giấy phép lái xe ô tô hạng B (thi trước 01/03/2027, theo cấu trúc đề hiện hành). Tôi có bộ 600 câu hỏi chính thức (JSON/CSV + hình) và hai file ghi chú mẹo tự viết (`mẹo.txt`, `điểm-liệt.txt`). Hiện tại:

- Không có công cụ nào kết hợp bộ câu hỏi với **chính các mẹo của tôi**: khi làm một câu, tôi không biết mẹo nào áp dụng, và câu đó có phải ngoại lệ của mẹo không.
- Mẹo do tôi tự ghi nên có chỗ sai. Đối chiếu tự động với 600 câu đã phát hiện: điểm liệt #66 ghi sai đáp án, mẹo "ưu tiên giảm tốc độ" sai 10/32 câu, một số mẹo thiếu ngoại lệ. Học thuộc mẹo sai thì sẽ mất điểm, thậm chí trượt vì câu điểm liệt.
- Không có cách luyện đề thi thử đúng cấu trúc thật, theo dõi câu hay sai, và biết mình đã thuộc 60 câu điểm liệt đến đâu.

## Solution

Một web app cá nhân, chạy offline, giao diện tiếng Việt, dùng tốt trên cả điện thoại và máy tính. App có 4 chế độ: ôn theo chương hoặc ôn 60 câu điểm liệt, thi thử đúng cấu trúc đề thật, ôn lại câu sai, học theo mẹo. Mỗi câu hiển thị mẹo đã được kiểm chứng với đáp án, kèm cảnh báo khi câu là ngoại lệ hoặc khi mẹo không phân biệt được đáp án. Mẹo được lưu thành dữ liệu có cấu trúc (danh sách câu áp dụng, danh sách ngoại lệ). Bước build tự kiểm tra lại mẹo với đáp án, nên mẹo sai không thể lọt vào app. Tiến độ lưu trên trình duyệt, có xuất/nhập file để sao lưu.

## User Stories

### Ôn theo chương / điểm liệt

1. Là người ôn thi, tôi muốn chọn một chương (I–VI) để ôn, để tập trung vào phần mình yếu.
2. Là người ôn thi, tôi muốn có mục riêng "60 câu điểm liệt", để chắc chắn không trượt vì câu điểm liệt.
3. Là người ôn thi, tôi muốn câu hỏi mặc định đi theo số thứ tự, để ôn có hệ thống và dễ đối chiếu với tài liệu.
4. Là người ôn thi, tôi muốn bật công tắc "ngẫu nhiên" trong một chương, để kiểm tra mình thuộc thật chứ không phải nhớ thứ tự.
5. Là người ôn thi, tôi muốn app nhớ câu tôi đang làm dở trong từng chương, để lần sau mở lại làm tiếp.
6. Là người ôn thi, tôi muốn biết ngay đúng/sai sau khi chọn đáp án, để sửa sai tức thì.
7. Là người ôn thi, tôi muốn xem giải thích của câu sau khi trả lời, để hiểu vì sao đáp án đó đúng.
8. Là người ôn thi, tôi muốn xem mẹo áp dụng cho câu sau khi trả lời, để gắn mẹo với câu cụ thể.
9. Là người ôn thi, tôi muốn có nút "Xem mẹo" trước khi trả lời, để tập áp dụng mẹo vào câu.
10. Là người ôn thi, tôi muốn câu điểm liệt có nhãn "Điểm liệt" nổi bật khi ôn, để biết câu nào tuyệt đối không được sai.
11. Là người ôn thi, tôi muốn đáp án giữ đúng thứ tự A/B/C/D như bộ đề gốc, để các mẹo dựa trên vị trí ("chọn ý 1", "chọn 4") vẫn đúng.
12. Là người ôn thi, tôi muốn chuyển câu trước/sau và nhảy đến một câu theo số, để linh hoạt khi ôn.
13. Là người ôn thi, tôi muốn bấm vào hình để phóng to, để nhìn rõ biển báo và sa hình trên điện thoại.

### Thi thử

14. Là người ôn thi, tôi muốn tạo một đề thi thử 30 câu theo đúng phân bổ chương của đề thật (I: 8, điểm liệt: 1, II: 1, III: 1, IV: 1, V: 9, VI: 9), để luyện sát với kỳ thi.
15. Là người ôn thi, tôi muốn mỗi đề có đúng 1 câu điểm liệt, bốc từ 60 câu điểm liệt, và 29 câu còn lại không phải câu điểm liệt, để giống đề thật.
16. Là người ôn thi, tôi muốn câu trong đề xếp theo thứ tự chương, để giống đề thật.
17. Là người ôn thi, tôi muốn có đồng hồ đếm ngược 20 phút, hết giờ thì tự nộp bài, để quen áp lực thời gian.
18. Là người ôn thi, tôi muốn trong lúc thi không thấy mẹo, đáp án hay nhãn điểm liệt, để thi thử phản ánh đúng thực lực.
19. Là người ôn thi, tôi muốn chuyển qua lại giữa các câu trong đề và thấy câu nào chưa làm, để phân bổ thời gian.
20. Là người ôn thi, tôi muốn nộp bài sớm (có xác nhận), để không phải chờ hết giờ.
21. Là người ôn thi, tôi muốn kết quả ghi rõ ĐẠT/TRƯỢT: đạt khi đúng ≥ 27/30 và không sai câu điểm liệt, để biết mình đã đủ sức thi chưa.
22. Là người ôn thi, tôi muốn kết quả ghi rõ khi tôi trượt vì sai câu điểm liệt, dù đủ điểm, để không chủ quan.
23. Là người ôn thi, tôi muốn câu bỏ trống được tính là sai, để giống cách chấm thật.
24. Là người ôn thi, tôi muốn xem lại từng câu sau khi nộp: đáp án tôi chọn, đáp án đúng, giải thích và mẹo, để học từ đề vừa thi.
25. Là người ôn thi, tôi muốn các câu tôi làm sai trong thi thử được đưa vào danh sách câu sai, để ôn lại sau.

### Ôn câu sai

26. Là người ôn thi, tôi muốn có danh sách các câu tôi đã trả lời sai (từ cả chế độ ôn lẫn thi thử), để ôn đúng chỗ yếu.
27. Là người ôn thi, tôi muốn một câu chỉ ra khỏi danh sách câu sai khi tôi trả lời đúng 2 lần liên tiếp, để loại trừ trường hợp đúng do may.
28. Là người ôn thi, tôi muốn trả lời sai lại một câu đang trong danh sách thì bộ đếm đúng liên tiếp về 0, để luật "2 lần liên tiếp" có nghĩa.
29. Là người ôn thi, tôi muốn thấy số câu còn trong danh sách câu sai, để biết còn bao nhiêu việc.

### Học theo mẹo

30. Là người ôn thi, tôi muốn xem danh sách tất cả mẹo, để ôn lại hệ thống mẹo.
31. Là người ôn thi, tôi muốn chọn một mẹo và xem tất cả câu nó áp dụng, để luyện nhận diện mẹo.
32. Là người ôn thi, tôi muốn mỗi mẹo hiển thị tên, quy tắc và các ngoại lệ (kèm số câu), để biết khi nào không được áp dụng.
33. Là người ôn thi, tôi muốn các câu ngoại lệ của một mẹo được đánh dấu rõ khi tôi làm câu đó, để không áp dụng mẹo sai chỗ.
34. Là người ôn thi, tôi muốn mẹo có độ tin cậy thấp (ví dụ "ưu tiên giảm tốc độ") mang nhãn "độ tin cậy thấp, chỉ dùng khi không còn mẹo nào khác", để không áp dụng máy móc.
35. Là người ôn thi, tôi muốn câu mà mẹo không phân biệt được đáp án (ví dụ #31) có cảnh báo "mẹo không phân biệt được, đọc kỹ đáp án", để không chọn bừa.
36. Là người ôn thi, tôi muốn một câu khớp nhiều mẹo thì thấy đủ các mẹo, kèm mẹo được ưu tiên khi chúng mâu thuẫn (ví dụ "cả 3 ý" thắng "không được"), để biết áp dụng mẹo nào.
37. Là người ôn thi, tôi muốn chương V và VI có tab "Mẹo chương này" chứa các mẹo phải nhìn hình (biển báo, vạch kẻ, sa hình), để ôn được cả những mẹo chưa gắn vào từng câu.
38. Là người ôn thi, tôi muốn mẹo trong app được viết lại rõ ràng nhưng giữ nguyên ý của tôi, để dễ đọc hơn ghi chú gốc.

### Tiến độ

39. Là người ôn thi, tôi muốn xem tiến độ từng chương (đã làm, đúng, sai / tổng số câu), để biết chương nào cần ôn thêm.
40. Là người ôn thi, tôi muốn xem tỉ lệ thuộc 60 câu điểm liệt, để biết mình đã an toàn chưa.
41. Là người ôn thi, tôi muốn xem lịch sử điểm các lần thi thử (ngày, điểm, đạt/trượt), để thấy mình tiến bộ.
42. Là người ôn thi, tôi muốn tiến độ tự lưu sau mỗi câu, để không mất khi đóng tab.
43. Là người ôn thi, tôi muốn xuất toàn bộ tiến độ ra file JSON, để sao lưu.
44. Là người ôn thi, tôi muốn nhập lại file JSON đã xuất, để khôi phục trên trình duyệt hoặc máy khác.
45. Là người ôn thi, tôi muốn được báo lỗi rõ ràng khi nhập file không hợp lệ, và tiến độ hiện tại không bị ghi đè, để không mất dữ liệu.
46. Là người ôn thi, tôi muốn xóa (reset) tiến độ có xác nhận, để ôn lại từ đầu khi cần.

### Nền tảng

47. Là người ôn thi, tôi muốn app chạy offline sau lần mở đầu tiên (PWA), để ôn ở bất cứ đâu.
48. Là người ôn thi, tôi muốn cài app lên màn hình chính điện thoại, để mở nhanh như app thật.
49. Là người ôn thi, tôi muốn giao diện dùng tốt cả trên điện thoại và máy tính, để ôn trên thiết bị nào cũng được.
50. Là người ôn thi, tôi muốn có dark mode tự đổi theo hệ thống, để ôn buổi tối không chói mắt.
51. Là người ôn thi, tôi muốn toàn bộ giao diện bằng tiếng Việt, để dùng tự nhiên.

### Chất lượng mẹo (người duy trì)

52. Là người duy trì mẹo, tôi muốn bước build báo lỗi khi một mẹo chỉ ra đáp án sai ở câu không được khai báo là ngoại lệ, để mẹo sai không lọt vào app.
53. Là người duy trì mẹo, tôi muốn bước build báo lỗi khi một ngoại lệ khai báo thực ra mẹo vẫn đúng, hoặc tham chiếu id câu không tồn tại, để dữ liệu mẹo luôn sạch.
54. Là người duy trì mẹo, tôi muốn được duyệt bản mẹo đã viết lại và danh sách câu áp dụng trước khi đưa vào app, để chắc nội dung đúng ý mình.
55. Là người duy trì mẹo, tôi muốn các chỗ sửa trong `mẹo.txt` / `điểm-liệt.txt` được đánh dấu `[sửa]`, để biết chỗ nào đã đổi so với ghi chú cũ.
56. Là người duy trì, tôi muốn cấu trúc đề thi (số câu, thời gian, điểm đạt, phân bổ chương) nằm trong một file config, để đổi nhanh khi quy định thay đổi.

## Implementation Decisions

### Kiến trúc tổng thể

- Static web app bằng Vite + React + TypeScript, có PWA (service worker cache app, data và toàn bộ hình). Không backend, không đăng nhập, chỉ một người dùng.
- `git init` tại thư mục project. Code app nằm ở thư mục gốc. `data/` (JSON/CSV/hình gốc) và hai file mẹo `.txt` là **dữ liệu nguồn**, không bị app sửa.
- Ba khối:
  1. **Data build pipeline**: script chạy lúc build, chuyển dữ liệu nguồn thành `questions.json` (gọn, chỉ giữ field app cần) và `tips.json` (đã kiểm chứng), copy hình vào public assets.
  2. **`study-engine`**: module TypeScript thuần, không phụ thuộc React hay trình duyệt. Chứa **toàn bộ** logic nghiệp vụ.
  3. **UI React**: chỉ hiển thị và gọi engine, không chứa logic nghiệp vụ.

### Dữ liệu câu hỏi

- Nguồn: `600-cau-hoi-GPLX-hang-B.json` (600 câu). Field app cần: `id`, `category` → map thành mã chương I–VI, `isPointDeduction`, `question`, `options` (a–d, 2 đến 4 phương án), `correctAnswer`, `explanation`, `image`.
- Field `image` là URL ngoài. Pipeline đổi thành tên file local trong `data/hinh/` (đuôi `.webp`). 318 câu có hình dùng 317 file, vì #426 và #427 dùng chung `c426.webp`.
- Phân bổ hiện có: chương I 180, II 25, III 58, IV 37, V 185, VI 115. 60 câu điểm liệt.
- Thứ tự đáp án **không bao giờ xáo trộn**, vì nhiều mẹo dựa vào vị trí đáp án.

### Cấu trúc đề thi (config)

- Theo Thông tư 12/2025/TT-BCA và Công văn 2262/CSGT-P5, áp dụng đến 28/02/2027: 30 câu, 20 phút, đạt ≥ 27 câu và không sai câu điểm liệt.
- Phân bổ: I 8, điểm liệt 1, II 1, III 1, IV 1, V 9, VI 9.
- Mọi con số trên nằm trong một object config duy nhất mà engine đọc. Không hard-code rải rác.
- Từ 01/03/2027 (Thông tư 108/2026: 50 câu, 33 phút, đạt 45) **không** nằm trong phạm vi spec này, vì sẽ đi kèm bộ câu hỏi mới.

### Mô hình mẹo (`tips.json`)

Mỗi mẹo có:

- `id`, `title` (tên ngắn), `rule` (quy tắc, viết lại rõ ràng từ ghi chú gốc), `source` (file gốc: `mẹo.txt` / `điểm-liệt.txt`).
- `scope`: `question` (gắn vào từng câu) hoặc `chapter` (mẹo phải nhìn hình, chỉ hiển thị ở tab "Mẹo chương này" của chương V/VI, kèm mã chương).
- `confidence`: `normal` | `low`.
- Với mẹo `scope: question`:
  - `appliesTo`: danh sách câu mẹo áp dụng **và cho đúng đáp án**. Mỗi phần tử gồm id câu và đáp án mà mẹo chỉ ra. Với mẹo dạng sự thật (niên hạn, tốc độ...) thì đáp án chính là đáp án đúng.
  - `exceptions`: danh sách câu mẹo khớp nhưng cho sai đáp án. Mỗi phần tử gồm id câu, đáp án đúng và lý do ngắn.
  - `ambiguous`: danh sách câu mẹo khớp nhiều đáp án, không phân biệt được.
- `priority` (tùy chọn): khi một câu khớp nhiều mẹo cho kết quả khác nhau, mẹo có `priority` cao hơn được đánh dấu là mẹo nên theo (ví dụ "cả 3 ý" > "không được").
- Danh sách `appliesTo`/`exceptions`/`ambiguous` được **tạo một lần bằng script** (dựa trên `meo-check.py`, bằng cách so khớp từ khóa trong câu hỏi/đáp án), được người dùng **duyệt**, rồi lưu **cố định** trong dữ liệu nguồn của mẹo. App **không** so khớp từ khóa lúc chạy.
- Dữ liệu nguồn của mẹo (bản có cấu trúc mà người dùng duyệt và chỉnh) là một file riêng trong repo. Pipeline đọc file này, kiểm chứng, rồi sinh `tips.json`. Hai file `.txt` là ghi chú gốc để người dùng đọc, pipeline không parse chúng.

### Các sửa đổi mẹo đã chốt (từ đối chiếu, xem `meo-check.md`)

- "Quan sát → ý dài": thêm ngoại lệ #216, #217, #247, #259 (giữ ngoại lệ có sẵn #253 đường nhánh → đường chính).
- "Không được → chọn": thêm ngoại lệ #261, #270, #484. Ghi chú: khi có đáp án "Cả ba/hai ý" thì mẹo "cả 3 ý" ưu tiên hơn. #81, #110, #273 là câu mơ hồ.
- "Ý x và ý y → chọn": thêm ngoại lệ #229 (giữ ngoại lệ có sẵn #232 nhiên liệu).
- "Ưu tiên chọn giảm tốc độ": `confidence: low`, ngoại lệ #56, #220, #235, #247, #248, #257, #280, #285, #419, #578.
- "Công an đi thẳng → 1": thêm ngoại lệ #489. **Đáp án trong data là chuẩn.** Lúc build, xem hình `c489.webp` để ghi lý do ngoại lệ.
- Điểm liệt #66: sửa "chọn 3" thành "chọn 4" ("Ý 1 và ý 2" là đáp án d).
- Câu mơ hồ đã biết: #31 ("bị nghiêm cấm"), #216 ("giảm tốc + bên phải"), #212 và #226 ("về số thấp"), #532 ("xe nào vi phạm"), #208 ("bóp khóa hãm" có ở cả 3 đáp án).
- Mẹo không áp dụng câu nào trong bộ đề (ví dụ "B1 → xe 3 bánh") hoặc khó hiểu (ví dụ "tư thế lái → 10h") thì giữ trong file `.txt` nhưng **không đưa vào app**, và báo lại cho người dùng lúc duyệt.
- Hai file `.txt` gốc được sửa tại chỗ theo các mục trên, mỗi chỗ đánh dấu `[sửa]`.
- Mẹo phải nhìn hình (hình dạng/màu biển, cấm nhỏ/lớn, hướng cấm, vạch vàng/trắng, vạch mũi tên, đèn) → `scope: chapter` (V hoặc VI), chưa gắn vào từng câu.

### Interface của `study-engine`

Engine nhận các phụ thuộc từ ngoài: dữ liệu câu hỏi, dữ liệu mẹo, exam config, một **storage adapter** (interface get/set dữ liệu tiến độ; app dùng adapter localStorage, test dùng adapter in-memory), một **RNG** (hàm sinh số ngẫu nhiên có seed được; test truyền RNG cố định), và **clock** (để tính thời gian thi; test truyền clock giả). Các thao tác công khai:

- **Lấy danh sách câu** theo bộ lọc: chương, điểm liệt, câu sai, câu thuộc một mẹo. Thứ tự: theo số câu, hoặc ngẫu nhiên (dùng RNG).
- **Ghi nhận câu trả lời** cho một câu (từ chế độ ôn hoặc thi thử): cập nhật thống kê và danh sách câu sai. Luật câu sai: trả lời sai → vào danh sách, bộ đếm đúng liên tiếp = 0. Trả lời đúng khi đang trong danh sách → bộ đếm +1; đạt 2 → ra khỏi danh sách.
- **Vị trí đang làm dở** của mỗi bộ lọc ôn: đọc/ghi.
- **Tạo đề thi thử** từ exam config + RNG: 1 câu từ nhóm điểm liệt, các câu còn lại theo phân bổ chương, chỉ lấy câu không phải điểm liệt, không trùng câu, xếp theo chương.
- **Chấm đề**: nhận đề + câu trả lời (câu bỏ trống tính sai). Trả về số câu đúng, đạt/trượt, cờ "trượt vì sai câu điểm liệt", và chi tiết từng câu. Lưu kết quả vào lịch sử thi thử. Ghi nhận các câu vào thống kê và danh sách câu sai.
- **Lấy mẹo của một câu**: trả về các mẹo áp dụng, mỗi mẹo kèm trạng thái của câu (`applies` / `exception` / `ambiguous`), độ tin cậy, và cờ "mẹo nên theo" khi các mẹo mâu thuẫn.
- **Lấy mẹo cấp chương** (cho tab "Mẹo chương này").
- **Thống kê tiến độ**: theo chương (đã làm / đúng / sai / tổng), tỉ lệ thuộc 60 câu điểm liệt ("đã thuộc" = câu đã làm, lần trả lời gần nhất đúng và không nằm trong danh sách câu sai), số câu trong danh sách câu sai, lịch sử thi thử.
- **Xuất tiến độ**: một object JSON có `version` schema. **Nhập tiến độ**: validate toàn bộ trước, nếu không hợp lệ thì trả lỗi và không đổi dữ liệu hiện tại; hợp lệ thì thay thế. **Reset tiến độ**.

### UI

- Màn hình: trang chủ (chọn chế độ + tóm tắt tiến độ), ôn câu hỏi (dùng chung cho chương / điểm liệt / câu sai / theo mẹo), thi thử (làm bài + đồng hồ + lưới câu), kết quả thi thử + xem lại, danh sách mẹo / chi tiết mẹo, tiến độ, cài đặt (xuất/nhập/reset).
- Chế độ ôn: chọn đáp án → hiện đúng/sai, giải thích, mẹo. Có nút "Xem mẹo" trước khi trả lời. Có nhãn "Điểm liệt".
- Chế độ thi: không hiện mẹo, đáp án, nhãn điểm liệt. Hết giờ → tự nộp. Nộp sớm → hỏi xác nhận.
- Hình bấm vào thì phóng to (lightbox, có zoom trên mobile).
- Responsive mobile và desktop. Dark mode theo `prefers-color-scheme`. Toàn bộ text tiếng Việt.

## Testing Decisions

- Một test tốt chỉ kiểm tra **hành vi nhìn thấy từ bên ngoài** qua interface công khai của seam, không kiểm tra chi tiết cài đặt bên trong. Refactor bên trong không được làm hỏng test.
- **Seam 1: `study-engine`** là nơi chứa gần như toàn bộ test. Test dùng storage adapter in-memory, RNG có seed và clock giả, chạy bằng Vitest. Cần cover:
  - Tạo đề: đúng 30 câu, đúng phân bổ chương, đúng 1 câu điểm liệt, không trùng, 29 câu kia không phải câu điểm liệt, xếp theo chương, cùng seed thì cùng đề.
  - Chấm đề: 27/30 đạt, 26/30 trượt, 30/30 nhưng sai câu điểm liệt thì trượt kèm cờ, câu bỏ trống tính sai.
  - Luật câu sai: sai → vào danh sách; đúng 1 lần → còn; đúng 2 lần liên tiếp → ra; đúng–sai–đúng → còn.
  - Mẹo của câu: trạng thái applies / exception / ambiguous, mẹo `low` confidence, ưu tiên khi các mẹo mâu thuẫn (ví dụ #261).
  - Thống kê theo chương và tỉ lệ thuộc điểm liệt.
  - Xuất → nhập ra lại đúng trạng thái. Nhập file hỏng → báo lỗi, trạng thái cũ giữ nguyên.
  - Vị trí đang làm dở được nhớ.
- **Seam 2: data build pipeline**: test kiểm tra **output** sinh ra từ dữ liệu thật:
  - `questions.json` có đủ 600 câu, đúng số câu mỗi chương, 60 câu điểm liệt, mọi câu có hình đều có file hình.
  - Với mỗi mẹo: mọi id câu tồn tại; với mỗi câu `appliesTo`, đáp án mẹo chỉ ra = đáp án đúng; với mỗi `exception`, đáp án mẹo chỉ ra ≠ đáp án đúng; không id nào vừa nằm trong `appliesTo` vừa nằm trong `exceptions`.
  - Đây là cơ chế giữ cho mẹo luôn đúng sau mỗi lần sửa: pipeline **fail build** nếu kiểm chứng thất bại.
- **UI**: không viết unit test, không làm e2e ở bản đầu tiên.
- **Prior art**: chưa có. Đây là project mới. `meo-check.py` (đối chiếu mẹo một lần) là tham khảo cho logic so khớp, không phải test.

## Out of Scope

- Cấu trúc đề và bộ câu hỏi từ 01/03/2027 (Thông tư 108/2026), các hạng khác ngoài B.
- Gắn mẹo phải nhìn hình vào từng câu (chương V/VI). Bản đầu chỉ có ở mức chương.
- Đăng nhập, nhiều người dùng, đồng bộ qua server/cloud.
- Deploy công khai. Chạy local là đủ; có thể deploy Vercel/GitHub Pages sau.
- Thi sa hình/thực hành, mô phỏng tình huống (video).
- E2E test và unit test cho UI.
- So khớp mẹo bằng từ khóa lúc chạy.

## Further Notes

- Báo cáo đối chiếu mẹo đầy đủ: `.scratch/on-thi-gplx-b/meo-check.md`. Script đối chiếu: `.scratch/on-thi-gplx-b/meo-check.py`.
- Độ phủ mẹo hiện tại: khoảng 40% của 600 câu có ít nhất một mẹo (chương V chỉ 20/185, chương VI 25/115). Gộp hai file mẹo thì cover đủ 60/60 câu điểm liệt (#197 được cover bởi mẹo "bị nghiêm cấm" trong `mẹo.txt`).
- Nguồn cấu trúc đề: Thông tư 12/2025/TT-BCA, Công văn 2262/CSGT-P5. Thông tin 2027 lấy từ bài tóm tắt Thông tư 108/2026/TT-BCA, chưa đối chiếu phụ lục gốc.
- Người dùng cần duyệt hai thứ trước khi coi là xong: (1) bản viết lại câu chữ của từng mẹo, (2) danh sách câu áp dụng / ngoại lệ của từng mẹo.
