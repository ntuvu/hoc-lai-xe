# Kiểm tra mẹo vs bộ 600 câu GPLX hạng B

Nguồn: `data/600-cau-hoi-GPLX-hang-B.json`, `mẹo.txt`, `điểm-liệt.txt`. Script: `check.py`, kết quả thô: `out.json` (cùng thư mục scratchpad).
Quy ước: "ý 1/2/3/4" = a/b/c/d. "Áp dụng" = số câu mẹo khớp được (sau khi loại các ngoại lệ đã ghi). "Mơ hồ" = mẹo khớp nhiều hơn 1 đáp án, nên không chọn được.

## 0. Số liệu chung
- Có 318 câu hasImage. **Không thiếu file ảnh nào** trong `hinh/`. Thư mục có 317 file vì #426 và #427 dùng chung `c426.webp`.
- 60 câu điểm liệt. `điểm-liệt.txt` cover **59/60** câu. Câu duy nhất không có mẹo riêng là **#197** (bỏ trốn sau tai nạn → "Bị nghiêm cấm"), nhưng mẹo M1 của `mẹo.txt` ("bị nghiêm cấm – chọn luôn") giải đúng câu này. Gộp cả hai file thì cover 60/60.
- Coverage (số câu bị ít nhất 1 mẹo chạm tới): **237/600 = 39,5%** nếu hiểu mỗi mẹo theo nghĩa chính. Nếu tính cả các cách hiểu nới rộng thì là 325/600 = 54%.
  - Theo chương: I 125/180, II 6/25, III 40/58, IV 21/37, **V (biển báo) 20/185**, **VI (sa hình) 25/115**.
  - Chương V và VI gần như không được cover, vì các mẹo ở hai chương này phải nhìn ảnh mới dùng được.

## 1. Mẹo cơ học – mẹo.txt

| Mẹo | Áp dụng | Đúng | Sai / mơ hồ (id) | Ghi chú |
|---|---|---|---|---|
| M1 "bị nghiêm cấm" → chọn | 3 | 2 | mơ hồ **#31** (b "Bị nghiêm cấm." / c "Bị nghiêm cấm tuỳ trường hợp") | Ở #31 chọn đáp án ngắn, không kèm điều kiện. Phải loại "Không bị nghiêm cấm". |
| M2 "giảm tốc độ" + "bên phải" → chọn | 8 | 7 | mơ hồ **#216** (rẽ phải: a và b đều chứa cả hai cụm) | Đúng là b. Mẹo tốt. |
| M3 "quan sát" → chọn ý dài (cần ≥2 đáp án có "quan sát", chọn dài nhất trong số đó) | 18 | 14 | **#216** (rẽ phải ô tô), **#217** (rẽ trái ô tô), **#247** (lái xe trong khu đông dân cư, đúng là c "Cả hai ý"), **#259** (gương chiếu hậu mô tô, đúng là c, mẹo chọn d) | Ngoại lệ "đường nhánh → đường chính" khớp **#253**: nếu chọn ý dài nhất sẽ ra c, đáp án đúng là a. Ngoại lệ này đúng. |
| M3 (cách hiểu khác: có đáp án mở đầu "Quan sát" → chọn dài nhất) | 19 | 14 | #85, #90 (điểm liệt), #117, #257, #596 | Cách hiểu này kém hơn. #85, #90, #117, #257 đã có mẹo khác cứu (L23, L27, M4). **#596** (sa hình đường sắt) không có mẹo nào cứu. |
| M4 "Cả ba ý trên" → chọn | 25 | **25** | – | 4 ngoại lệ đều khớp đúng câu và đúng đáp án: #5 (b "Là vạch…"), #123 (b xe gắn máy), #170 (c "Đe dọa…"), #204 (a "Bình tĩnh…"). **Mẹo tốt nhất.** |
| (tham khảo) "Cả ba biển/vạch/xe/hướng" | 42 | 3 | 39 câu sai | **Không** được mở rộng M4 sang biển/vạch/sa hình. |
| M5 "không được" → chọn | 28 | 22 | sai **#261**, **#270**, **#484**; mơ hồ #81, #110, #273 | #261 và #270: cụm "không được" nằm trong 1 ý con, đáp án đúng là "Cả ba/hai ý" → cho M4 thắng M5. **#484** (vạch, ảnh): đúng là b "sắp đến vạch đi bộ". #81, #110, #273: nhiều đáp án cùng có "không được". 4 ngoại lệ đều khớp và đúng: #97 c, #140 b, #341 a, #461 a. |
| M6 "Ý x và ý y" → chọn, trừ câu nhiên liệu | 10 | 9 | **#229** (đèn báo cửa xe, đúng là a; d "Ý 2 và ý 3" sai) | Ngoại lệ #232 (đúng là b, xăng sinh học) khớp đúng. |
| (cách hiểu khác của M6: "Cả hai ý trên" → chọn) | 62 | 34 | 28 câu sai (ví dụ #19, #26, #55, #62, #124, #128…) | Nếu "ý" có nghĩa là "cả hai ý" thì mẹo này rất tệ, chỉ đúng 55%. |
| M12b tốc độ ngoài khu đông dân cư (đôi 90/80/70/60, 2 chiều 80/70/60/50 → ý 1–4) | 8 | 8 | – | #149–156 đều đúng. |
| M13 khoảng cách: có 100 → ý 3; (số lớn − 25) → đáp án gần nhất; có 60 → "cả 2 ý", nếu không có thì ý 1 | 2 / 4 / 3 | 2 / 4 / 3 | – | #158–#162 đều đúng. "Có số 100" phải hiểu là số 100 nằm **trong câu hỏi**: #160 có 100 ở đáp án nhưng đúng là a. |
| M18 dốc / ổ gà / ngập nước / trơn → "về số thấp" | 7 | 5 | mơ hồ #212, #226 | Cả hai đáp án ở #212 và #226 đều có "số thấp". Phải nhìn thêm "từ chân dốc" / "không đánh lái ngoặt". |
| M19 "Ưu tiên chọn giảm tốc độ" (hiểu là: đúng 1 đáp án có "giảm tốc" thì chọn) | 32 | 22 | #56, #220, #235, #247, #248, #257, #280, #285, #419, #578 | Chỉ đúng 69%. Phần lớn câu sai có đáp án đúng là "Cả hai/ba ý" hoặc thuộc chương cấu tạo xe. Chỉ nên dùng khi không có mẹo nào khác. |
| M24 sa hình "xe nào vi phạm" (theo mũi tên) → đáp án không có xe con | 7 | 6 | mơ hồ #532 (không đáp án nào có xe con) | Đúng ở #503, #526, #560, #561, #562, #563. Nếu áp cho mọi câu "vi phạm" thì hỏng: #548 sai, 6 câu mơ hồ (#508, #509, #527, #543, #559…). |
| M25 xe kéo nhau → "Không đúng / Vi phạm" | 3 | 3 | – | #510, #515, #518. |
| M27 sa hình có xe quân sự / chữa cháy → ý 2 | 5 | 5 | – | #494, #498, #501, #532, #540. |
| M26 công an đi thẳng → ý 1, rẽ → ý 4 (4 xe, 4 hướng) | 3 | 2 (theo ảnh, độ tin cậy thấp) | **#489** nghi sai | Mô tả ảnh: ở cả 3 câu, xe công an có vẻ đi **thẳng**. #488 a ✓, #536 a ✓, nhưng #489 có đáp án đúng là **d**. Nên xem lại ảnh `c489.webp`. |

## 2. Mẹo dạng sự thật – mẹo.txt (khớp với đáp án đúng)
Tất cả các mẹo sau đều **đúng** với bộ đề:
- **M7** cơ giới / thô sơ: #8 b, #9 a, #10 c.
- **M8** dừng xe = "tạm thời" (#14 b), đỗ xe = "không giới hạn" (#15 b). "Dừng đỗ xe → ý 2" chỉ đúng cho 2 câu định nghĩa này. Nếu áp cho các câu dừng/đỗ khác thì sai: #59 c, #60 a, #61 c.
- **M9** CSGT: #13 b. Giơ 1 tay (thẳng đứng) → ý 3 (#37 c). Dang 2 tay → ý 4 (#36 d). Sa hình có CSGT → ý 3 (#528 c).
- **M10** độ tuổi: #118 (C1) a, #122 (D2) b, #119 / #120 / #121 c.
- **M11** hạng GPLX: #123–#135 đều khớp. Lưu ý #128 (C1) và #130 (D1) phải đọc kỹ con số, vì đáp án sai cũng chứa "7.500" / "16 chỗ". Mẹo "B1 → xe 3 bánh" không có câu nào trong bộ đề (#124 chỉ hỏi A1 không được lái mô tô ba bánh).
- **M12a** tốc độ trong khu đông dân cư: #144 40, #145 60, #146 50, #147 a, #148 a.
- **M14** làn: #43, #44, #79. **M15** vòng xuyến: #92, #93.
- **M16** còi 5h–22h (#49), 0,25 m (#60), 20 m (#61), 12 điểm (#140, #141), 4 giờ (#171), 10 giờ (#172), ghế số 0 (#238), niên hạn chở người 20 năm (#278), xe tải 25 năm (#277). Riêng "tư thế lái → 10h" khó hiểu: câu tư thế lái #211 không liên quan đến 10h.
- **M17** "trường hợp cần thiết": #176 a, #179 a. Đường sắt → "bên phải": #99 a, #100 c.
- **M20** cấu tạo xe: #208, #209, #268, #272, #274, #275, #276, #279–#284, #291, #292, #293 đều đúng. Lưu ý:
  - #208: **cả 3 đáp án đều có "bóp khóa hãm"**, nên từ khóa không phân biệt được. Đáp án đúng là đáp án *mở đầu* bằng "bóp khóa hãm, đẩy về phía trước".
  - #209: phải là "đạp ly hợp hết hành trình", vì đáp án a cũng có "bàn đạp ly hợp".
  - "kính an toàn" xuất hiện cả ở #265 a, nhưng đáp án đúng của #265 là c "Cả hai ý" → để M4/"cả hai" thắng.
- **M21–M23** (biển, có thể kiểm qua phần giải thích): tam giác → giảm tốc (#163 a). Chiều dài = S.501 (#352 a), khoảng cách = S.502 (#353 b), #347 b. Dốc: xuống = biển 1, lên = biển 2 (#415, #416). Ổ gà #419 a, gồ #420 b. "Có từ *và* → ý 2, không có → ý 3" khớp cặp **#426 (b) / #427 (c)**; đây là cách hiểu hợp lý nhất cho mẹo này.

## 3. điểm-liệt.txt
Có 47 nhóm mẹo, ánh xạ tới 59 câu điểm liệt. Tất cả đều khớp với đáp án đúng, trừ 1 lỗi vị trí:
- **L20 (#66)**: mẹo ghi "chọn 3: ý 1 + 2", nhưng trong bộ đề "Ý 1 và ý 2" là **đáp án d (ý 4)**. Đáp án c là "Dùng tay cầm điện thoại", sai. Nội dung mẹo đúng, **số thứ tự sai**.
- L3 "9 chỗ không có niên hạn, >9 chỗ 20 năm": bộ đề ghi "trên 8 chỗ (không kể chỗ người lái)" (#278). Hai cách ghi tương đương nhau nếu tính cả ghế lái, nhưng nên ghi theo đúng chữ trong đề để khỏi nhầm.
- L6 "(chọn ý 1, 2 sai thì 3 cũng sai)" đúng với #26 (a). L1 đúng với #19 (b).
- Câu chưa có mẹo riêng: #197 (đã có M1 cover).

## 4. Mẹo quá mơ hồ, không kiểm cơ học được
- **Biển báo theo hình dạng/màu, "cấm nhỏ đồng thời cấm lớn", "vẽ hướng nào cấm hướng đó", vạch vàng/trắng, vạch mũi tên, đèn đỏ/xanh**: phải nhìn ảnh, chưa kiểm. Nếu muốn kiểm thì cần đọc ảnh các câu #301–#485 và #499–#559.
- **"Lấy số bánh xe của xe cuối cùng − 1 = đáp án"**: không xác định được áp cho câu nào.
- **5 bước giải sa hình**: là quy tắc suy luận, không phải mẹo chọn đáp án. Phần giải thích của bộ đề (#487–#490, #520, #536) dùng đúng thứ tự "xe ưu tiên → đường ưu tiên → bên phải trống → rẽ phải → thẳng → trái", nên quy tắc này nhất quán với bộ đề.
- **"Dừng đỗ xe → ý 2", "tư thế lái → 10h"**: xem mục 2.

## 5. Mẹo tệ nhất / cần sửa
1. **M19 "Ưu tiên chọn giảm tốc độ"**: sai 10/32. Nên ghi rõ là thứ tự ưu tiên thấp nhất.
2. **M3 "quan sát – ý dài"**: sai 4/18 (#216, #217, #247, #259; thêm #596 nếu hiểu theo cách khác). Nên thêm ngoại lệ: rẽ phải #216 → b, rẽ trái #217 → a, gương chiếu hậu #259 → c.
3. **M5 "không được"**: sai #484, cộng 3 câu mơ hồ. Thêm ghi chú: khi có "Cả ba/hai ý" thì M4 được ưu tiên hơn (#261, #270).
4. **M6 "ý"**: thêm ngoại lệ **#229** (đèn báo cửa xe → a). Ghi rõ là mẹo áp cho dạng "Ý x và ý y", không phải "Cả hai ý trên".
5. **L20**: sửa "chọn 3" thành "chọn 4 (Ý 1 và ý 2)".
6. **M26 công an**: kiểm lại #489 (đáp án d) bằng ảnh.
7. Ghi chú thêm vào mẹo: M1 ở #31 phải chọn "Bị nghiêm cấm." (không kèm "tuỳ trường hợp"). M18 ở #212 và #226 phải nhìn thêm chi tiết.
