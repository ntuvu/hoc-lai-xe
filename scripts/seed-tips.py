"""Sinh dữ liệu nguồn mẹo có cấu trúc `data/meo.json` — CHẠY MỘT LẦN.

Dựa trên logic so khớp của `.scratch/on-thi-gplx-b/meo-check.py`. Sau khi sinh, `data/meo.json`
là dữ liệu nguồn được người dùng duyệt/chỉnh tay; app và pipeline KHÔNG so khớp từ khóa lúc chạy.
Pipeline (`scripts/build-tips.ts`) kiểm chứng lại file này với đáp án và fail build nếu sai.

Chạy:  python3 -I scripts/seed-tips.py            (ghi đè data/meo.json)
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
Q = json.load(open(os.path.join(ROOT, 'data', '600-cau-hoi-GPLX-hang-B.json'), encoding='utf8'))
D = {x['id']: x for x in Q}
low = str.lower
CH6 = 'Chương VI'

TIPS = []
FACT_ERRORS = []


def opts_matching(q, f):
    return [k for k, v in q['options'].items() if f(low(v))]


def pick_unique(q, f):
    m = opts_matching(q, f)
    if not m:
        return None
    return m[0] if len(m) == 1 else ('AMB', m)


def longest_among(q, keys):
    return max(keys, key=lambda k: len(q['options'][k]))


def mech(tid, title, rule, pred, *, source='mẹo.txt', exceptions=None, ambiguous_notes=None,
         confidence='normal', priority=None, only=None, skip=()):
    """Áp `pred` cho 600 câu. Câu khớp được xếp vào appliesTo / exceptions / ambiguous.

    `exceptions`: {id: lý do}. Mọi câu mẹo cho sai mà không khai báo ngoại lệ → lỗi (dừng script).
    """
    exceptions = dict(exceptions or {})
    ambiguous_notes = ambiguous_notes or {}
    applies, exc, amb = [], [], []
    for q in Q:
        if only and q['id'] not in only:
            continue
        if q['id'] in skip:
            continue
        p = pred(q)
        if p is None:
            continue
        ca = q['correctAnswer']
        if isinstance(p, tuple):
            amb.append({'id': q['id'], 'candidates': p[1],
                        'note': ambiguous_notes.get(q['id'], 'Mẹo khớp nhiều đáp án, đọc kỹ từng đáp án.')})
            continue
        if q['id'] in exceptions:
            if p == ca:
                sys.exit(f'{tid}: #{q["id"]} khai báo ngoại lệ nhưng mẹo vẫn đúng')
            exc.append({'id': q['id'], 'tipAnswer': p, 'correctAnswer': ca, 'reason': exceptions.pop(q['id'])})
        elif p == ca:
            applies.append({'id': q['id'], 'answer': p})
        else:
            sys.exit(f'{tid}: #{q["id"]} mẹo chỉ {p} nhưng đúng là {ca}, chưa khai báo ngoại lệ')
    if exceptions:
        sys.exit(f'{tid}: ngoại lệ khai báo nhưng mẹo không khớp: {sorted(exceptions)}')
    add(tid, title, rule, source, applies, exc, amb, confidence, priority)


def facts(tid, title, rule, items, *, source='mẹo.txt', priority=None):
    """Mẹo dạng sự thật: (id, 'a'|'b'|... hoặc chuỗi con chỉ có ở đáp án đúng)."""
    applies = []
    for qid, exp in items:
        q = D[qid]
        ca = q['correctAnswer']
        if len(exp) == 1 and exp in 'abcd':
            ok = ca == exp
        else:
            hits = opts_matching(q, lambda v: exp.lower() in v)
            ok = hits == [ca]
        if not ok:
            FACT_ERRORS.append(f'{tid}: #{qid} kỳ vọng "{exp}" không khớp duy nhất đáp án đúng {ca}')
        if all(a['id'] != qid for a in applies):
            applies.append({'id': qid, 'answer': ca})
    add(tid, title, rule, source, applies, [], [], 'normal', priority)


def add(tid, title, rule, source, applies, exc, amb, confidence, priority):
    tip = {'id': tid, 'title': title, 'rule': rule, 'source': source, 'scope': 'question',
           'confidence': confidence}
    if priority is not None:
        tip['priority'] = priority
    tip['appliesTo'] = sorted(applies, key=lambda x: x['id'])
    tip['exceptions'] = sorted(exc, key=lambda x: x['id'])
    tip['ambiguous'] = sorted(amb, key=lambda x: x['id'])
    TIPS.append(tip)


def chapter(tid, title, rule, ch, source='mẹo.txt'):
    TIPS.append({'id': tid, 'title': title, 'rule': rule, 'source': source, 'scope': 'chapter',
                 'chapter': ch, 'confidence': 'normal'})


# ======================= mẹo.txt — mẹo cơ học =======================
mech('bi-nghiem-cam', '"Bị nghiêm cấm" → chọn',
     'Đáp án nào có cụm "bị nghiêm cấm" thì chọn luôn (loại "Không bị nghiêm cấm"). '
     'Nếu có cả "Bị nghiêm cấm." và "Bị nghiêm cấm tùy trường hợp" thì chọn đáp án ngắn, không kèm điều kiện.',
     lambda q: pick_unique(q, lambda v: re.search(r'(?<!không )bị nghiêm cấm', v) is not None),
     ambiguous_notes={31: 'Có cả "Bị nghiêm cấm." và "Bị nghiêm cấm tùy trường hợp": chọn đáp án ngắn, không kèm điều kiện.'})

mech('giam-toc-ben-phai', '"Giảm tốc độ" + "bên phải" → chọn',
     'Đáp án có cả "giảm tốc độ" và "bên phải" thì chọn luôn (thường là câu tránh xe, nhường đường).',
     lambda q: pick_unique(q, lambda v: 'giảm tốc độ' in v and 'bên phải' in v),
     ambiguous_notes={216: 'Câu rẽ phải: hai đáp án đều có "giảm tốc độ" và "bên phải". Chọn đáp án có tín hiệu từ xa, đi sát bên phải.'})


def quan_sat(q):
    m = opts_matching(q, lambda v: 'quan sát' in v)
    if len(m) >= 2:
        return longest_among(q, m)


mech('quan-sat-y-dai', '"Quan sát" → chọn ý dài',
     'Khi có ít nhất 2 đáp án chứa "quan sát", chọn đáp án dài nhất trong số đó. '
     'Chỉ 1 đáp án có "quan sát" thì không dùng mẹo này.',
     quan_sat,
     exceptions={
         216: 'Rẽ phải: chọn đáp án bật tín hiệu từ xa, giảm tốc, đi sát bên phải (không phải ý dài nhất).',
         217: 'Rẽ trái: chọn đáp án bật tín hiệu, giảm tốc, quan sát bên trái rồi đổi sang làn trái.',
         247: 'Đáp án đúng là "Cả hai ý trên" (mẹo "cả hai/ba ý" thắng).',
         253: 'Đường nhánh ra đường chính: chọn "Quan sát, giảm tốc độ, phát tín hiệu, nhường đường..." (ngoại lệ có sẵn trong ghi chú).',
         259: 'Gương chiếu hậu dùng để quan sát phía SAU (bên trái và bên phải), không phải phía trước.',
     })


def ca_ba_y(q):
    return pick_unique(q, lambda v: re.match(r'cả (ba|3) ý', v) is not None)


mech('ca-ba-y', '"Cả ba ý trên" → chọn',
     'Đáp án "Cả ba ý trên" thì chọn luôn. Khi câu có đáp án "Cả ba/hai ý" thì mẹo này được ưu tiên hơn mẹo "không được". '
     'Chỉ áp cho "cả ba Ý", không mở rộng sang "cả ba biển/vạch/xe/hướng".',
     ca_ba_y, priority=2,
     exceptions={
         5: 'Vạch kẻ đường là gì → chọn "Là vạch chỉ sự phân chia làn đường...".',
         123: 'Người đủ 16 tuổi → chọn "Xe gắn máy".',
         170: 'Bị nghiêm cấm trong vận tải hành khách → chọn đáp án "Đe dọa, xúc phạm..." (câu dài nhất).',
         204: 'Thấy ngọn lửa, khói từ xe → chọn "Bình tĩnh, đưa xe sát vào lề...".',
     })

mech('khong-duoc', '"Không được" → chọn',
     'Đáp án có cụm "không được" thì chọn luôn, trừ một số câu ngoại lệ. '
     'Khi câu có đáp án "Cả ba/hai ý" thì ưu tiên mẹo "cả 3 ý".',
     lambda q: pick_unique(q, lambda v: 'không được' in v), priority=1,
     exceptions={
         97: 'Xe CSGT không phát tín hiệu ưu tiên → "Được vượt khi bảo đảm an toàn".',
         140: 'GPLX chưa bị trừ hết điểm → "Được phục hồi đủ 12 điểm".',
         341: 'Biển số 1 (cấm đầu kéo rơ-moóc), xe tải → "Được đi vào".',
         461: 'Làn đường dành riêng cho từng loại xe → "Được phép chuyển sang làn khác".',
         261: 'Cụm "không được" nằm trong một ý con; đáp án đúng là "Cả ba ý trên".',
         270: 'Cụm "không được" nằm trong một ý con; đáp án đúng là "Cả hai ý trên".',
         484: 'Câu vạch kẻ: vạch hình thoi báo hiệu sắp đến vạch đi bộ qua đường.',
     },
     ambiguous_notes={
         81: 'Nhiều đáp án cùng có "không được". Chọn: giảm tốc, tín hiệu rẽ phải, đi sát bên phải.',
         110: 'Nhiều đáp án cùng có "không được". Chọn: giảm tốc, tín hiệu rẽ phải, đi sát bên phải.',
         273: 'Cả hai ý đều có "không được" → chọn "Cả hai ý trên".',
     })

mech('y-x-va-y-y', '"Ý x và ý y" → chọn',
     'Đáp án dạng "Ý 1 và ý 2", "Ý 2 và ý 3"... thì chọn luôn. Mẹo áp cho dạng "Ý x và ý y", KHÔNG phải "Cả hai ý trên".',
     lambda q: pick_unique(q, lambda v: re.match(r'ý \d và ý \d', v) is not None),
     exceptions={
         232: 'Nhiên liệu giảm ô nhiễm → "Xăng sinh học và khí sinh học" (ngoại lệ có sẵn trong ghi chú).',
         229: 'Đèn báo hình chiếc xe mở cửa → "Cửa xe đóng chưa chặt".',
     })


def giam_toc(q):
    m = opts_matching(q, lambda v: 'giảm tốc' in v)
    return m[0] if len(m) == 1 else None


mech('uu-tien-giam-toc', 'Ưu tiên chọn "giảm tốc độ"',
     'Nếu đúng 1 đáp án có "giảm tốc" thì nghiêng về đáp án đó. Mẹo yếu (sai khoảng 1/3 số câu): '
     'chỉ dùng khi không còn mẹo nào khác.',
     giam_toc, confidence='low', priority=0,
     exceptions={
         56: 'Đáp án đúng không phải đáp án "giảm tốc".',
         220: 'Đáp án đúng không phải đáp án "giảm tốc".',
         235: 'Đáp án đúng không phải đáp án "giảm tốc".',
         247: 'Đáp án đúng là "Cả hai ý trên".',
         248: 'Đáp án đúng không phải đáp án "giảm tốc".',
         257: 'Đáp án đúng không phải đáp án "giảm tốc".',
         280: 'Câu cấu tạo xe: công dụng hệ thống truyền lực là truyền mô men.',
         285: 'Đáp án đúng không phải đáp án "giảm tốc".',
         419: 'Biển ổ gà: "1 gồ 2 gà" → biển 1 là ổ gà.',
         578: 'Đáp án đúng không phải đáp án "giảm tốc".',
     })

KW_SO_THAP = ['lên dốc', 'xuống dốc', 'ổ gà', 'ngập nước', 'trơn', 'lầy lội', 'đường xấu']
mech('ve-so-thap', 'Đường khó đi → "về số thấp"',
     'Lên dốc, xuống dốc, đường ổ gà, ngập nước, trơn (đường khó đi) → chọn đáp án "về số thấp" (số 1, 2, L).',
     lambda q: pick_unique(q, lambda v: 'số thấp' in v or 'số một' in v or 'số 1' in v or 'số l' in v)
     if any(k in low(q['question']) for k in KW_SO_THAP) else None,
     ambiguous_notes={
         212: 'Hai đáp án đều có "số thấp": chọn đáp án "về số thấp TỪ CHÂN DỐC".',
         226: 'Hai đáp án đều có "số thấp": chọn đáp án "KHÔNG đánh lái ngoặt, không phanh gấp".',
     })


def vi_pham(q):
    t = low(q['question'])
    if CH6 not in q['category'] or 'vi phạm' not in t or 'mũi tên' not in t:
        return None
    return pick_unique(q, lambda v: 'xe con' not in v and not v.startswith('cả') and not v.startswith('không'))


mech('sa-hinh-vi-pham-xe-con', 'Sa hình "xe nào vi phạm" (theo mũi tên) → đáp án không có xe con',
     'Câu sa hình hỏi xe nào vi phạm theo hướng mũi tên: chọn đáp án không có xe con.',
     vi_pham,
     ambiguous_notes={532: 'Không đáp án nào có xe con; câu này dùng mẹo xe chữa cháy/quân sự → ý 2.'})


def keo_nhau(q):
    if CH6 not in q['category'] or 'kéo' not in low(q['question']):
        return None
    return pick_unique(q, lambda v: v.startswith('không đúng') or v.startswith('vi phạm'))


mech('xe-keo-nhau', 'Sa hình xe kéo nhau → "Không đúng / Vi phạm"',
     'Câu sa hình có xe kéo xe khác → chọn "Không đúng" hoặc "Vi phạm".', keo_nhau)

mech('xe-quan-su-chua-chay', 'Sa hình có xe quân sự / chữa cháy → ý 2',
     'Câu sa hình có đáp án nhắc đến xe quân sự hoặc xe chữa cháy → chọn ý 2.',
     lambda q: 'b' if CH6 in q['category'] and any('quân sự' in low(v) or 'chữa cháy' in low(v) for v in q['options'].values()) else None)

mech('cong-an-di-thang', 'Sa hình công an đi thẳng → ý 1',
     'Câu thứ tự xe có xe công an, 4 xe ở 4 hướng: xe công an đi thẳng → chọn ý 1, rẽ → chọn ý 4. '
     'Phải nhìn hình xem có đường ưu tiên không.',
     lambda q: 'a' if CH6 in q['category'] and len(q['options']) == 4
     and any('công an' in low(v) for v in q['options'].values()) else None,
     exceptions={489: 'Trong hình, xe tải đi trên đường ưu tiên nên được đi ngay sau xe công an '
                      '(thứ tự: công an → xe tải → xe khách → xe con).'})


def toc_do_ngoai(q):
    t = low(q['question'])
    if 'ngoài khu vực đông dân cư' not in t:
        return None
    m = re.search(r'là (\d+) km/h', t)
    if not m:
        return None
    table = {90: 'a', 80: 'b', 70: 'c', 60: 'd'} if 'đường đôi' in t else {80: 'a', 70: 'b', 60: 'c', 50: 'd'}
    return table.get(int(m.group(1)))


mech('toc-do-ngoai-do-thi', 'Tốc độ ngoài khu đông dân cư: 9-1, 8-2, 7-3, 6-4',
     'Đường đôi luôn nhanh hơn đường 2 chiều 10 km/h. Đường đôi: 90 → ý 1, 80 → ý 2, 70 → ý 3, 60 → ý 4. '
     'Đường 2 chiều: 80 → ý 1, 70 → ý 2, 60 → ý 3, 50 → ý 4.', toc_do_ngoai)


def kc_100(q):
    t = low(q['question'])
    if 'khoảng cách an toàn' in t and '100 km/h' in t:
        return 'c'


def kc_60(q):
    t = low(q['question'])
    if 'khoảng cách an toàn' in t and '60 km/h' in t and '100 km/h' not in t:
        m = opts_matching(q, lambda v: v.startswith('cả hai ý'))
        return m[0] if m else 'a'


def kc_minus25(q):
    t = low(q['question'])
    if 'khoảng cách an toàn' not in t or 'tối thiểu là bao nhiêu' not in t:
        return None
    nums = [int(x) for x in re.findall(r'(\d+) km/h', t)]
    if not nums or 100 in nums or 60 in nums:
        return None
    target = max(nums) - 25
    return min(q['options'], key=lambda k: abs(int(re.match(r'(\d+)', q['options'][k]).group(1)) - target))


def khoang_cach(q):
    return kc_100(q) or kc_60(q) or kc_minus25(q)


mech('khoang-cach-an-toan', 'Khoảng cách an toàn',
     'Câu hỏi có số 100 → chọn ý 3. Có số 60 → chọn "Cả hai ý trên", không có thì chọn ý 1. '
     'Còn lại: lấy tốc độ lớn nhất trừ 25, chọn đáp án bằng hoặc gần bằng.', khoang_cach)

# ======================= mẹo.txt — mẹo dạng sự thật =======================
facts('phuong-tien-co-gioi-tho-so', 'Phương tiện: cơ giới / thô sơ / xe máy chuyên dùng',
      'Phương tiện giao thông đường bộ gồm cơ giới, thô sơ, xe máy chuyên dùng. Hỏi cơ giới thì bỏ 2 loại kia; hỏi thô sơ thì bỏ 2 loại kia.',
      [(8, 'b'), (9, 'a'), (10, 'c')])
facts('dung-do-xe', 'Dừng xe = tạm thời, đỗ xe = không giới hạn',
      'Dừng xe là đứng yên tạm thời; đỗ xe là đứng yên không giới hạn thời gian. Câu định nghĩa dừng/đỗ → chọn ý 2.',
      [(14, 'tạm thời'), (15, 'không giới hạn')])
facts('csgt', 'Cảnh sát giao thông: giơ 1 tay → 3, dang 2 tay → 4',
      'Người điều khiển giao thông là CSGT. Phần chữ: giơ 1 tay thẳng đứng → chọn ý 3; dang 2 tay → chọn ý 4. '
      'Sa hình có CSGT → chọn ý 3.',
      [(13, 'cảnh sát giao thông'), (37, 'c'), (36, 'd'), (528, 'c')])
facts('do-tuoi-gplx', 'Độ tuổi GPLX: C1 → 1, D2 → 2, còn lại → 3',
      'Câu hỏi độ tuổi tối thiểu: hạng C1 chọn ý 1, D2 chọn ý 2, các hạng còn lại chọn ý 3.',
      [(118, 'a'), (122, 'b'), (119, 'c'), (120, 'c'), (121, 'c')])
facts('hang-gplx', 'Hạng GPLX',
      'Đủ 16 tuổi chưa có GPLX → xe gắn máy. A1 → mô tô đến 125 cm³; A → trên 125 cm³; B → ô tô đến 8 chỗ, tải đến 3,5 tấn; '
      'C1 → tải đến 7,5 tấn; C → tải trên 7,5 tấn; D1 → đến 16 chỗ; D2 → đến 29 chỗ; D → trên 29 chỗ; '
      'BE/CE/DE → hạng B/C/D kéo rơ-moóc. Với C1, D1 đọc kỹ con số vì đáp án sai cũng chứa số tương tự.',
      [(123, 'gắn máy'), (124, 'b'), (125, 'a'), (126, 'c'), (127, 'c'), (128, 'b'), (129, 'c'), (130, 'b'),
       (131, 'c'), (132, 'd'), (133, 'hạng b kéo'), (134, 'hạng c kéo'), (135, 'hạng d kéo')])
facts('toc-do-trong-do-thi', 'Tốc độ trong khu đông dân cư: 40 / 50 / 60',
      'Xe mô tô, xe gắn máy → 40 km/h. Các loại xe khác (trừ xe 4 bánh gắn động cơ): đường 2 chiều 50 km/h, đường đôi 60 km/h.',
      [(144, '40'), (145, '60'), (146, '50'), (147, 'a'), (148, 'a')])
facts('lan-trai-lan-phai', 'Làn trái: nhanh, làn phải: chậm',
      'Làn bên trái dành cho xe cơ giới, chạy nhanh; làn bên phải dành cho xe thô sơ, xe chạy chậm.',
      [(43, 'bên phải'), (44, 'bên trái'), (79, 'b')])
facts('vong-xuyen', 'Vòng xuyến: có biển nhường trái, không biển nhường phải',
      'Nơi có biển báo vòng xuyến → nhường xe bên trái. Không có vòng xuyến → nhường xe bên phải. Nhớ: "có trái, không phải".',
      [(92, 'bên trái'), (93, 'bên phải')])
facts('con-so-nhanh', 'Các con số chọn nhanh',
      'Dùng còi từ 5 giờ đến 22 giờ; dừng xe cách lề tối đa 0,25 m; đỗ cách xe ngược chiều 20 m; phục hồi đủ 12 điểm; '
      'lái liên tục tối đa 4 giờ; làm việc tối đa 10 giờ/ngày; điều chỉnh ghế khi tay số ở số 0.',
      [(49, '05 giờ đến 22'), (60, '0,25'), (61, '20 mét'), (140, '12 điểm'), (141, '12 điểm'),
       (171, '4 giờ'), (172, '10 giờ'), (238, 'số 0')])
facts('nien-han', 'Niên hạn: chở người 20 năm, tải 25 năm',
      'Xe chở người trên 8 chỗ (không kể ghế lái) → 20 năm. Xe tải → 25 năm. Xe đến 8 chỗ không có niên hạn.',
      [(278, '20 năm'), (277, '25 năm'), (20, 'c')], source='mẹo.txt, điểm-liệt.txt')
facts('truong-hop-can-thiet', 'Hàng nguy hiểm, quá khổ → "trường hợp cần thiết"',
      'Câu về chở hàng nguy hiểm, hàng siêu trường siêu trọng → chọn đáp án có "trường hợp cần thiết".',
      [(176, 'trường hợp cần thiết'), (179, 'trường hợp cần thiết')])
facts('duong-sat-ben-phai', 'Xe hỏng trên đường sắt → bên phải',
      'Câu về xe gặp sự cố/dừng ở chỗ giao với đường sắt → chọn đáp án có "bên phải".',
      [(99, 'bên phải'), (100, 'bên phải')])
facts('cau-tao-xe', 'Cấu tạo xe: từ khóa',
      'Nhả phanh tay → bóp khóa hãm (đáp án MỞ ĐẦU bằng bóp khóa hãm); khởi hành → đạp ly hợp hết hành trình; '
      'kính chắn gió → kính an toàn; diesel → tạp chất; dây an toàn → giữ chặt; động cơ 4 kỳ → 4 hành trình; '
      'bôi trơn → dầu bôi trơn; động cơ → nhiệt năng thành cơ năng; truyền lực → truyền mô men; ly hợp → truyền hoặc ngắt; '
      'hộp số → chuyển động lùi; hệ thống lái → thay đổi hướng; phanh → giảm tốc độ; ắc quy → tích trữ điện; máy phát → phát điện.',
      [(208, 'b'), (209, 'b'), (268, 'kính an toàn'), (272, 'tạp chất'), (293, 'giữ chặt'),
       (274, 'giữ chặt'), (275, '4 (bốn) hành trình'), (276, 'dầu bôi trơn'),
       (279, 'nhiệt năng được biến đổi thành cơ năng'), (280, 'truyền mô men'), (281, 'truyền hoặc ngắt'),
       (282, 'chuyển động lùi'), (283, 'thay đổi hướng'), (284, 'giảm tốc độ'), (291, 'tích trữ'), (292, 'phát điện')])
facts('bien-chieu-dai-khoang-cach', 'Biển phụ: chiều dài 2 mũi tên, khoảng cách không',
      'Biển phụ chỉ chiều dài đoạn đường nguy hiểm có 2 mũi tên (S.501); biển chỉ khoảng cách đến đối tượng không có 2 mũi tên (S.502).',
      [(352, 'a'), (353, 'b'), (347, 'chiều dài')])
facts('bien-doc', 'Biển dốc: lên 9 xuống 10',
      'Dốc xuống nguy hiểm là biển 1, dốc lên nguy hiểm là biển 2 (nhớ "lên 9 xuống 10").', [(415, 'a'), (416, 'b')])
facts('go-ga', 'Biển ổ gà / gồ giảm tốc: "1 gồ 2 gà"',
      'Nhớ "1 gồ 2 gà": phân biệt biển gồ giảm tốc và biển ổ gà theo câu hỏi.', [(419, 'ổ gà'), (420, 'gồ')])
facts('co-tu-va', 'Biển tốc độ theo làn: có "và" → ý 2, không "và" → ý 3',
      'Câu hỏi có từ "và" → chọn ý 2; không có từ "và" → chọn ý 3.', [(426, 'b'), (427, 'c')])
facts('bien-tam-giac-giam-toc', 'Biển tam giác → nguy hiểm, giảm tốc',
      'Biển tam giác là biển nguy hiểm → giảm tốc độ. Biển vuông (chỉ dẫn) không liên quan tốc độ; '
      'biển tròn hết hạn chế tốc độ tối đa → được chạy nhanh hơn.', [(163, 'a')], source='mẹo.txt, điểm-liệt.txt')

# ======================= điểm-liệt.txt =======================
L = 'điểm-liệt.txt'
facts('dl-xe-dap-dinh', 'Không cấm xe đạp trên quốc lộ; cấm rải đinh',
      'Đi xe đạp trên quốc lộ không bị cấm. Rải đinh, vật sắc nhọn thì bị cấm. Mẹo: ý 1 sai thì ý 3 cũng sai.',
      [(19, 'rải vật sắc nhọn')], source=L)
facts('dl-giay-to', '4 loại giấy tờ phải mang',
      'Giấy phép lái xe, giấy chứng nhận kiểm định, giấy đăng ký xe, bảo hiểm bắt buộc.', [(138, 'd')], source=L)
facts('dl-dua-xe', 'Đua xe: phải được cấp phép',
      'Chỉ được đua xe khi được cấp phép; đua trái phép bị xử lý tùy theo mức độ.',
      [(21, 'cấp phép'), (22, 'tùy theo mức độ')], source=L)
facts('dl-ma-tuy', 'Có ma túy → phạt tiền + tước GPLX', 'Lái xe mà trong cơ thể có ma túy → phạt tiền và tước GPLX.',
      [(23, 'c')], source=L)
facts('dl-co-con', 'Có cồn → cấm lái mọi loại xe',
      'Có nồng độ cồn → bị nghiêm cấm điều khiển mọi loại xe; bị phạt tiền và tước GPLX (cả 2 ý trên). '
      'Mẹo: ý 1 đúng, ý 2 sai thì ý 3 cũng sai.', [(24, 'a'), (25, 'c'), (26, 'a')], source=L)
facts('dl-giao-xe', 'Cấm giao xe cho người không đủ điều kiện → chọn 4',
      'Cấm giao xe cho người chưa đủ tuổi, không có GPLX, GPLX bị trừ hết 12 điểm → chọn 4 (cả 3 ý trên).',
      [(27, 'd')], source=L)
facts('dl-lang-lach', 'Lạng lách, đánh võng, xúc phạm → cấm',
      'Lạng lách, đánh võng, rú ga; xúc phạm, đe dọa, cản trở người khác → đều bị cấm (chọn 3: cả 2 ý trên).',
      [(28, 'c'), (32, 'lạng lách')], source=L)
facts('dl-mat-trat-tu', 'Mất trật tự, cản trở → cấm', 'Các từ khóa "mất trật tự", "cản trở"... là bị cấm.',
      [(30, 'c')], source=L)
facts('dl-quan-sat-giam-toc', 'Quan sát → giảm tốc → dừng lại',
      'Đáp án mở đầu bằng "quan sát", rồi giảm tốc độ, dừng lại bảo đảm an toàn cho người đi bộ... là đáp án đúng (ý dài).',
      [(34, 'b'), (90, 'a'), (167, 'b'), (253, 'a')], source=L)
facts('dl-truong-hop-giam-toc', 'Trường hợp phải giảm tốc → chọn 4',
      'Đường hẹp, cầu cống, trời mưa gió sương mù → giảm tốc (chọn 4: cả 3 ý trên). '
      'Gặp vạch đi bộ, đường giao nhau, khu vực trường học → giảm tốc (cả 3 ý).', [(35, 'd'), (165, 'd')], source=L)
facts('dl-khong-vuot', 'Đường cong, cầu hẹp: không được vượt',
      'Đường cong, cầu hẹp một làn: không được phép vượt ("1 làn 2 tay").', [(47, 'không được phép vượt'), (53, 'a')],
      source=L)
facts('dl-xin-vuot', 'Muốn vượt: báo bằng đèn hoặc còi', 'Muốn vượt xe phải báo hiệu bằng đèn hoặc còi.',
      [(48, 'đèn chiếu sáng phía trước hoặc còi')], source=L)
facts('dl-dien-thoai', 'Cấm dùng tay cầm điện thoại', 'Đang lái xe thì cấm dùng tay cầm và sử dụng điện thoại.',
      [(52, 'điện thoại')], source=L)
facts('dl-quay-dau', 'Không quay đầu ở phần đường người đi bộ', 'Không được quay đầu xe ở phần đường dành cho người đi bộ qua đường.',
      [(55, 'a')], source=L)
facts('dl-khong-lui', 'Không được lùi: 1 chiều, giao nhau, khuất tầm nhìn → chọn 4',
      'Không lùi xe ở đường một chiều, đường bộ giao nhau, nơi tầm nhìn bị che khuất (chọn 4: cả 3 ý trên).',
      [(58, 'd')], source=L)
facts('dl-day-keo', 'Không được đẩy, kéo xe khác', 'Mô tô, gắn máy không được kéo, đẩy xe khác.',
      [(63, 'không được phép'), (67, 'không được phép'), (74, 'không được phép')], source=L)
facts('dl-buong-tay', 'Cấm buông 2 tay', 'Cấm buông cả hai tay khi lái xe ("1 làn 2 tay").',
      [(64, 'buông cả hai tay'), (65, 'buông cả hai tay'), (70, 'd')], source=L)
facts('dl-nguoi-duoc-cho', 'Người được chở: không mang vác cồng kềnh, không bám kéo → chọn 4',
      'Người ngồi sau không được mang vác vật cồng kềnh, không bám, kéo, đẩy xe khác → chọn 4 ("Ý 1 và ý 2").',
      [(66, 'd')], source=L)
facts('dl-mu-bao-hiem', 'Người được chở: đội mũ, cài quai → chọn 1', 'Người được chở phải đội mũ bảo hiểm và cài quai đúng quy cách (chọn 1).',
      [(68, 'a')], source=L)
facts('dl-hang-ngang-o', 'Không đi hàng ngang, không dùng ô', 'Không được đi xe dàn hàng ngang, không được sử dụng ô.',
      [(71, 'c'), (72, 'dàn hàng ngang'), (73, 'không được sử dụng')], source=L)
facts('dl-lui-xe', 'Lùi xe: quan sát sau + 2 bên; khuất tầm nhìn không lùi',
      'Lùi xe phải quan sát hai bên và phía sau (trái, phải, sau). Tầm nhìn bị che khuất thì không được lùi.',
      [(85, 'hai bên và phía sau'), (86, 'không được lùi'), (246, 'a')], source=L)
facts('dl-tranh-xe', 'Tránh xe: giảm tốc + đi bên phải', 'Tránh xe ngược chiều: giảm tốc độ và cho xe đi về bên phải.',
      [(87, 'a')], source=L)
facts('dl-cho-tranh', 'Tránh nhau: gần chỗ tránh vào trước, xuống dốc nhường lên dốc → chọn 4',
      'Xe nào gần chỗ tránh thì vào chỗ tránh; xe xuống dốc nhường xe lên dốc (chọn 4: cả 3 ý).',
      [(88, 'd'), (89, 'nhường đường cho xe lên dốc')], source=L)
facts('dl-duong-cong', 'Đường cong, đường vòng: quan sát + giảm tốc', 'Qua đường cong, đường vòng: quan sát, giảm tốc độ.',
      [(90, 'a'), (215, 'a')], source=L)
facts('dl-duong-khong-uu-tien', 'Đường không ưu tiên: nhường đường ưu tiên/đường chính',
      'Đi trên đường không ưu tiên → nhường xe đi trên đường ưu tiên hoặc đường chính.', [(91, 'c')], source=L)
facts('dl-tin-hieu-uu-tien', 'Tín hiệu ưu tiên: không có → được vượt, có → không được vượt',
      'Xe ưu tiên không phát tín hiệu → được vượt; đang phát tín hiệu ưu tiên → không được vượt.',
      [(97, 'c'), (98, 'a')], source=L)
facts('dl-duong-sat-dung', 'Đường sắt phải dừng: hiệu lệnh, đèn đỏ, chắn → chọn 4',
      'Gặp đường sắt phải dừng khi có hiệu lệnh, đèn đỏ, chắn đường bộ (chọn 4: cả 3 ý).', [(102, 'd')], source=L)
facts('dl-nhap-cao-toc', 'Nhập làn cao tốc → chọn 4',
      'Vào cao tốc: có tín hiệu xin vào, quan sát xe, chạy trên làn tăng tốc (chọn 4: cả 3 ý).', [(117, 'd')], source=L)
facts('dl-xe-buyt-di-bo', 'Gặp xe buýt, người đi bộ: quan sát, giảm tốc',
      'Gặp xe buýt đang dừng đón khách → quan sát, giảm tốc. Gặp người đi bộ → giảm tốc.',
      [(167, 'b'), (198, 'a')], source=L)
facts('dl-xuong-doc-tay-ga', 'Xuống dốc (xe tay ga): giữ tay ga, phanh trước + sau',
      'Xuống dốc bằng xe tay ga: giữ tay ga ở vị trí đóng, dùng cả phanh trước và phanh sau.', [(206, 'a')], source=L)
facts('dl-duong-tron', 'Đường trơn: không đánh lái ngoặt, không phanh gấp', 'Đường trơn: đi chậm, không đánh lái ngoặt, không phanh gấp.',
      [(226, 'không đánh lái ngoặt')], source=L)
facts('dl-mo-cua', 'Mở cửa xe: quan sát + mở hé', 'Mở cửa xe: quan sát rồi mở hé cửa trước.', [(234, 'mở hé')], source=L)
facts('dl-troi-mua', 'Trời mưa: bật đèn + giảm tốc', 'Trời mưa: bật đèn, giảm tốc độ.', [(245, 'a')], source=L)
facts('dl-xuong-doc-so-thap', 'Xuống dốc: về số thấp', 'Xuống dốc dài: về số thấp.', [(252, 'số thấp')], source=L)
facts('dl-nhanh-ra-chinh', 'Từ đường nhánh ra đường chính: quan sát + giảm tốc',
      'Từ đường nhánh ra đường chính: quan sát, giảm tốc, nhường xe trên đường chính.', [(253, 'a')], source=L)
facts('dl-dung-dien-thoai', 'Muốn dùng điện thoại: giảm tốc, dừng xe', 'Muốn nghe/gọi điện thoại: giảm tốc độ và dừng xe ở nơi cho phép.',
      [(254, 'dừng xe')], source=L)
facts('dl-chi-phanh-truoc', 'Không nên chỉ dùng phanh trước', 'Không nên chỉ dùng phanh trước.',
      [(255, 'chỉ sử dụng phanh trước')], source=L)
facts('dl-tay-ga', 'Xe 2 bánh: tăng ga từ từ, giảm ga nhanh', 'Xe 2 bánh: tăng ga từ từ, giảm ga thật nhanh.',
      [(260, 'tăng ga từ từ, giảm ga thật nhanh')], source=L)

# ======================= Mẹo cấp chương (phải nhìn hình) =======================
chapter('ch5-hinh-dang-bien', 'Biển báo: nhận theo hình dạng, màu',
        'Tam giác → nguy hiểm, giảm tốc. Tròn viền đỏ → cấm, không được đi vào. Tròn nền xanh → hiệu lệnh, bắt buộc đi theo. '
        'Vuông/chữ nhật nền xanh → chỉ dẫn. Biển phụ đặt dưới biển chính → giải thích cho biển chính.', 'V')
chapter('ch5-uu-tien', 'Biển ưu tiên / không ưu tiên',
        'Hình thoi, tam giác xuôi → đường ưu tiên. Tam giác ngược → không ưu tiên, phải nhường đường.', 'V')
chapter('ch5-cam-mo-to-o-to', 'Biển cấm mô tô / ô tô / gắn máy',
        'Cấm mô tô và cấm ô tô không cấm lẫn nhau. Cấm mô tô không cấm xe gắn máy. Cấm gắn máy và cấm ô tô không cấm lẫn nhau. '
        'Cấm mô tô thì cấm luôn xe 3 bánh; cấm ô tô thì cấm luôn xe 3 bánh.', 'V')
chapter('ch5-cam-nho-cam-lon', 'Cấm nhỏ thì cấm luôn lớn',
        'Chỉ áp cho ô tô, thứ tự: xe con < xe tải < xe kéo < rơ-moóc. Biển cấm xe nhỏ đồng thời cấm xe lớn hơn; cấm xe lớn thì không cấm xe nhỏ.', 'V')
chapter('ch5-ve-gi-cam-nay', 'Vẽ hướng nào cấm hướng đó', 'Biển vẽ hướng nào thì cấm hướng đó; vẽ xe nào thì cấm xe đó.', 'V')
chapter('ch5-vach', 'Vạch kẻ đường',
        'Vạch mũi tên chỉ hướng nào thì đi theo hướng đó. Vạch vàng → phân chia hai chiều xe chạy; vạch trắng → phân chia làn cùng chiều.', 'V')
chapter('ch6-den', 'Đèn tín hiệu', 'Đèn đỏ phải dừng, đèn xanh được đi.', 'VI')
chapter('ch6-5-buoc', '5 bước giải sa hình',
        'B1: xe đã vào giao lộ trước được đi trước. B2: xe ưu tiên (thứ tự: hỏa – sự – công – thương: chữa cháy, quân sự, công an, cứu thương). '
        'B3: xe trên đường ưu tiên (có biển) đi trước. B4: bên phải trống (không vướng xe) đi trước. '
        'B5: theo hướng đi: rẽ phải > đi thẳng > rẽ trái.', 'VI')

if FACT_ERRORS:
    sys.exit('\n'.join(FACT_ERRORS))
out = os.path.join(ROOT, 'data', 'meo.json')
with open(out, 'w', encoding='utf8') as f:
    json.dump({
        '_note': 'Dữ liệu nguồn mẹo đã kiểm chứng. Sinh một lần bằng scripts/seed-tips.py, sau đó duyệt/chỉnh tay. '
                 'Pipeline (npm run build:data) kiểm chứng lại với đáp án và fail nếu sai.',
        'excluded': [
            {'tip': 'B1 → xe 3 bánh', 'reason': 'Không có câu nào trong bộ 600 câu dùng được mẹo này.'},
            {'tip': 'Lái 1 ngày, tư thế lái → 10h', 'reason': 'Phần "tư thế lái" khó hiểu: câu tư thế lái (#211) không liên quan 10h. Phần "làm việc 10 giờ" đã có trong mẹo "Các con số chọn nhanh".'},
            {'tip': 'Lấy số bánh xe của xe cuối cùng − 1 = đáp án', 'reason': 'Không xác định được mẹo áp cho câu nào.'},
            {'tip': '"Dừng đỗ xe → chọn ý 2" (cho mọi câu dừng/đỗ)', 'reason': 'Chỉ đúng cho 2 câu định nghĩa (#14, #15), đã gộp vào mẹo "Dừng xe = tạm thời, đỗ xe = không giới hạn". Áp cho câu khác sẽ sai (#59, #60, #61).'},
        ],
        'tips': TIPS,
    }, f, ensure_ascii=False, indent=1)
q_tips = [t for t in TIPS if t['scope'] == 'question']
print(f'{len(TIPS)} mẹo ({len(q_tips)} cấp câu) → {out}')
for t in q_tips:
    print(f"  {t['id']}: {len(t['appliesTo'])} áp dụng, {len(t['exceptions'])} ngoại lệ, {len(t['ambiguous'])} mơ hồ")
