import json, re, os, sys
DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../data/', '600-cau-hoi-GPLX-hang-B.json')
Q = json.load(open(DATA))
D = {x['id']: x for x in Q}
low = lambda s: s.lower()
touched = {}  # tip -> set(ids)
results = []  # (tip, applies, correct, wrong_list, ambiguous_list, note)

def short(i, n=70):
    s = D[i]['question']
    return s if len(s) <= n else s[:n] + '…'

def mech(name, pred, note='', exceptions=None):
    """pred(q) -> None (not applicable) | key | 'AMB:<keys>'"""
    exceptions = exceptions or {}  # label -> predicate(q)
    app, ok, wrong, amb, exc_hit = [], [], [], [], {k: [] for k in exceptions}
    for q in Q:
        p = pred(q)
        if p is None:
            continue
        exc = [k for k, f in exceptions.items() if f(q)]
        for k in exc:
            exc_hit[k].append(q['id'])
        if exc:
            continue
        app.append(q['id'])
        if isinstance(p, str) and p.startswith('AMB'):
            amb.append((q['id'], p[4:]))
        elif p == q['correctAnswer']:
            ok.append(q['id'])
        else:
            wrong.append((q['id'], p))
    touched[name] = set(app) | {i for v in exc_hit.values() for i in v}
    results.append(dict(tip=name, n=len(app), ok=len(ok), wrong=wrong, amb=amb,
                        exc=exc_hit, note=note, okids=ok))

def opts_matching(q, f):
    return [k for k, v in q['options'].items() if f(low(v))]

def pick_unique(q, f):
    m = opts_matching(q, f)
    if not m:
        return None
    if len(m) == 1:
        return m[0]
    return 'AMB:' + ','.join(m)

# ---------- mẹo.txt ----------
nghiemcam = lambda v: re.search(r'(?<!không )bị nghiêm cấm', v) is not None
mech('M1 đáp án "bị nghiêm cấm" → chọn', lambda q: pick_unique(q, nghiemcam))

mech('M2 đáp án "giảm tốc độ" + "bên phải" → chọn',
     lambda q: pick_unique(q, lambda v: 'giảm tốc độ' in v and 'bên phải' in v))
mech('M2b (nới) "giảm tốc" + "phải" (gồm "rẽ phải") → chọn',
     lambda q: pick_unique(q, lambda v: 'giảm tốc' in v and 'phải' in v))

def longest(q):
    ks = sorted(q['options'], key=lambda k: -len(q['options'][k]))
    return ks[0]
def quansat_A(q):
    if any(low(v).startswith('quan sát') for v in q['options'].values()):
        return longest(q)
def quansat_B(q):
    m = opts_matching(q, lambda v: 'quan sát' in v)
    if len(m) >= 2:
        return longest(q)
def quansat_C(q):  # >=2 options with quan sát, pick longest among them
    m = opts_matching(q, lambda v: 'quan sát' in v)
    if len(m) >= 2:
        return max(m, key=lambda k: len(q['options'][k]))
exc_nhanh = {'ngoại lệ "đường nhánh → đường chính"': lambda q: 'đường nhánh' in low(q['question'])}
mech('M3a "quan sát": có đáp án mở đầu "Quan sát" → chọn đáp án dài nhất', quansat_A, exceptions=exc_nhanh)
mech('M3b "quan sát": ≥2 đáp án chứa "quan sát" → chọn đáp án dài nhất (cả câu)', quansat_B, exceptions=exc_nhanh)
mech('M3c "quan sát": ≥2 đáp án chứa "quan sát" → chọn dài nhất trong các đáp án có "quan sát"', quansat_C, exceptions=exc_nhanh)

ca3 = lambda v: re.match(r'cả (ba|3) ý', v) is not None
exc_ca3 = {
    'vạch kẻ đường là gì': lambda q: 'vạch kẻ đường là gì' in low(q['question']),
    'người đủ 16': lambda q: 'đủ 16' in low(q['question']),
    'bị nghiêm cấm → đe dọa': lambda q: 'nghiêm cấm' in low(q['question']) and any('đe dọa' in low(v) or 'đe doạ' in low(v) for v in q['options'].values()),
    'có ngọn lửa → bình tĩnh': lambda q: 'ngọn lửa' in low(q['question']),
}
mech('M4 đáp án "Cả ba ý trên" → chọn', lambda q: pick_unique(q, ca3), exceptions=exc_ca3)
ca3x = lambda v: re.match(r'cả (ba|3|bốn|4) (biển|vạch|xe|hướng)', v) is not None
mech('M4x (mở rộng, không có trong mẹo) "Cả ba biển/vạch/xe/hướng" → chọn', lambda q: pick_unique(q, ca3x),
     note='Chỉ để tham khảo: mẹo chỉ nói "cả 3 ý".')

kd = lambda v: 'không được' in v
exc_kd = {
    'CSGT không phát tín hiệu ưu tiên': lambda q: 'không phát tín hiệu ưu tiên' in low(q['question']),
    'GPLX bị trừ điểm (phục hồi)': lambda q: 'phục hồi' in low(q['question']),
    'biển số 1 xe tải được đi vào không': lambda q: 'biển số 1' in low(q['question']) and 'đi vào' in low(q['question']),
    'làn đường dành riêng – chuyển làn': lambda q: 'dành riêng' in low(q['question']) and 'chuyển' in low(q['question']),
}
mech('M5 đáp án có "không được" → chọn', lambda q: pick_unique(q, kd), exceptions=exc_kd)

y12 = lambda v: re.match(r'ý \d và ý \d', v) is not None
mech('M6 đáp án dạng "Ý x và ý y" → chọn', lambda q: pick_unique(q, y12),
     exceptions={'nhiên liệu giảm ô nhiễm': lambda q: 'nhiên liệu' in low(q['question']) and 'ô nhiễm' in low(q['question'])})
ca2 = lambda v: re.match(r'cả (hai|2) ý', v) is not None
mech('M6alt (nếu hiểu "ý" = "Cả hai ý trên") → chọn', lambda q: pick_unique(q, ca2),
     exceptions={'nhiên liệu giảm ô nhiễm': lambda q: 'nhiên liệu' in low(q['question']) and 'ô nhiễm' in low(q['question'])})

# M19 Ưu tiên chọn giảm tốc độ
mech('M19 "Ưu tiên chọn giảm tốc độ": đúng 1 đáp án chứa "giảm tốc" → chọn',
     lambda q: (lambda m: m[0] if len(m) == 1 else None)(opts_matching(q, lambda v: 'giảm tốc' in v)))

# M18 số thấp
kw18 = ['lên dốc', 'xuống dốc', 'ổ gà', 'ngập nước', 'trơn', 'lầy lội', 'đường xấu']
def so_thap(q):
    if not any(k in low(q['question']) for k in kw18):
        return None
    return pick_unique(q, lambda v: 'số thấp' in v or 'số một' in v or 'số 1' in v or 'số l' in v)
mech('M18 lên/xuống dốc, ổ gà, ngập nước, trơn → đáp án "về số thấp"', so_thap)

# M24 sa hình: vi phạm + mũi tên -> đáp án không có xe con
CH6 = 'Chương VI'
def vipham(q):
    if CH6 not in q['category'] or 'vi phạm' not in low(q['question']) or 'mũi tên' not in low(q['question']):
        return None
    return pick_unique(q, lambda v: 'xe con' not in v and not v.startswith('cả') and not v.startswith('không'))
mech('M24 sa hình "xe nào vi phạm" (theo mũi tên) → đáp án không có xe con', vipham)
def vipham_all(q):
    if CH6 not in q['category'] or 'vi phạm' not in low(q['question']) or 'kéo' in low(q['question']):
        return None
    if not any('xe' in low(v) for v in q['options'].values()):
        return None
    return pick_unique(q, lambda v: 'xe con' not in v and not v.startswith('cả') and not v.startswith('không'))
mech('M24x (nới) mọi câu sa hình hỏi "vi phạm" (trừ xe kéo) → đáp án không có xe con', vipham_all)

def keonhau(q):
    if CH6 not in q['category'] or 'kéo' not in low(q['question']):
        return None
    return pick_unique(q, lambda v: v.startswith('không đúng') or v.startswith('vi phạm'))
mech('M25 xe kéo nhau → "Không đúng"/"Vi phạm"', keonhau)

def qs_cc(q):
    if CH6 not in q['category']:
        return None
    if any('quân sự' in low(v) or 'chữa cháy' in low(v) for v in q['options'].values()):
        return 'b'
mech('M27 sa hình có xe quân sự/chữa cháy trong đáp án → chọn ý 2', qs_cc)

def ca_4huong(q):
    if CH6 not in q['category'] or len(q['options']) != 4:
        return None
    if any('công an' in low(v) for v in q['options'].values()):
        return 'AMB:cần ảnh (thẳng→a, rẽ→d)'
mech('M26 công an đi thẳng chọn 1, rẽ chọn 4 (4 xe 4 hướng)', ca_4huong,
     note='Cần biết hướng xe công an trong ảnh – xem phần ghi chú.')

# Speed rules (ngoài đông dân cư)
def speed_rule(q):
    t = low(q['question'])
    if 'ngoài khu vực đông dân cư' not in t:
        return None
    m = re.search(r'là (\d+) km/h', t)
    if not m:
        return None
    sp = int(m.group(1))
    table = {90: 'a', 80: 'b', 70: 'c', 60: 'd'} if 'đường đôi' in t else {80: 'a', 70: 'b', 60: 'c', 50: 'd'}
    return table.get(sp, 'AMB:speed?')
mech('M12b tốc độ ngoài ĐDC: đôi 90/80/70/60, 2 chiều 80/70/60/50 → ý 1/2/3/4', speed_rule)

def kc_minus25(q):
    t = low(q['question'])
    if 'khoảng cách an toàn' not in t or 'tối thiểu là bao nhiêu' not in t:
        return None
    nums = [int(x) for x in re.findall(r'(\d+) km/h', t)]
    if not nums:
        return None
    target = max(nums) - 25
    best = min(q['options'], key=lambda k: abs(int(re.match(r'(\d+)', q['options'][k]).group(1)) - target))
    return best
mech('M13c khoảng cách: (số lớn − 25) → đáp án gần nhất', kc_minus25)
def kc_100(q):
    t = low(q['question'])
    if 'khoảng cách an toàn' in t and '100 km/h' in t:
        return 'c'
mech('M13a khoảng cách: câu hỏi có số 100 → chọn 3', kc_100)
def kc_60(q):
    t = low(q['question'])
    if 'khoảng cách an toàn' in t and '60 km/h' in t:
        m = opts_matching(q, lambda v: v.startswith('cả hai ý'))
        return m[0] if m else 'a'
mech('M13b khoảng cách: có số 60 → "cả 2 ý trên", không có thì ý 1', kc_60)

# ---------- fact checks: (tip, qid, expected-key or substring of correct option) ----------
FACTS = [
 ('M7 cơ giới / thô sơ / XMCD', [(8, 'b'), (9, 'a'), (10, 'c')]),
 ('M8 Dừng xe = tạm thời, Đỗ xe = không giới hạn, "dừng đỗ → ý 2"', [(14, 'tạm thời'), (15, 'không giới hạn'), (14, 'b'), (15, 'b')]),
 ('M9 Người điều khiển GT = CSGT; giơ 1 tay → 3, dang 2 tay → 4; sa hình có CSGT → 3', [(13, 'cảnh sát giao thông'), (37, 'c'), (36, 'd'), (528, 'c')]),
 ('M10 Độ tuổi: C1 → 1, D2 → 2, còn lại → 3', [(118, 'a'), (122, 'b'), (119, 'c'), (120, 'c'), (121, 'c')]),
 ('M11 Hạng GPLX (16 tuổi gắn máy, A1, A, B, C1, C, D1, D2, D, BE, CE, DE)', [(123, 'gắn máy'), (124, 'b'), (125, 'a'), (126, 'c'), (127, 'c'), (128, '7.500'), (129, 'c'), (130, '16 chỗ'), (131, 'c'), (132, 'd'), (133, 'hạng b kéo'), (134, 'hạng c kéo'), (135, 'hạng d kéo')]),
 ('M12a Tốc độ trong ĐDC: gắn máy 40; xe khác 2 chiều 50, đôi 60', [(144, '40'), (145, '60'), (146, '50'), (147, 'a'), (148, 'a')]),
 ('M14 Làn trái cơ giới/nhanh, làn phải thô sơ/chậm', [(43, 'bên phải'), (44, 'bên trái'), (79, 'b')]),
 ('M15 Vòng xuyến: có biển nhường trái, không biển nhường phải', [(92, 'bên trái'), (93, 'bên phải')]),
 ('M16 Còi từ 5h–22h', [(49, '05 giờ đến 22')]),
 ('M16 Dừng cách lề 0,25 m', [(60, '0,25')]),
 ('M16 Đỗ cách xe ngược chiều 20 m', [(61, '20 mét')]),
 ('M16 Phục hồi 12 điểm', [(140, '12 điểm'), (141, '12 điểm')]),
 ('M16 Lái liên tục 4h', [(171, '4 giờ')]),
 ('M16 Làm việc 1 ngày 10h', [(172, '10 giờ')]),
 ('M16 Điều chỉnh ghế → số 0 (N/P)', [(238, 'số 0')]),
 ('M16 Niên hạn xe chở người (>8 chỗ) 20 năm', [(278, '20 năm')]),
 ('M16 Niên hạn xe tải 25 năm', [(277, '25 năm')]),
 ('M17 Hàng nguy hiểm/quá khổ → "trường hợp cần thiết"', [(176, 'trường hợp cần thiết'), (179, 'trường hợp cần thiết')]),
 ('M17 Đường sắt → dừng lại bên phải', [(99, 'bên phải'), (100, 'bên phải')]),
 ('M20 nhả phanh đỗ → bóp khóa hãm', [(208, 'bóp khóa hãm')]),
 ('M20 khởi hành → đạp ly hợp', [(209, 'đạp ly hợp')]),
 ('M20 kính chắn gió → kính an toàn', [(268, 'kính an toàn')]),
 ('M20 diesel → tạp chất', [(272, 'tạp chất')]),
 ('M20 dây an toàn → giữ chặt', [(293, 'giữ chặt'), (274, 'giữ chặt')]),
 ('M20 4 kỳ → 4 hành trình', [(275, '4 (bốn) hành trình')]),
 ('M20 bôi trơn → dầu bôi trơn', [(276, 'dầu bôi trơn')]),
 ('M20 động cơ → nhiệt thành cơ', [(279, 'nhiệt năng được biến đổi thành cơ năng')]),
 ('M20 truyền lực → truyền mômen', [(280, 'truyền mô men')]),
 ('M20 ly hợp → truyền hoặc ngắt', [(281, 'truyền hoặc ngắt')]),
 ('M20 hộp số → chuyển động lùi', [(282, 'chuyển động lùi')]),
 ('M20 hệ thống lái → thay đổi hướng', [(283, 'thay đổi hướng')]),
 ('M20 hệ thống phanh → giảm tốc độ', [(284, 'giảm tốc độ')]),
 ('M20 ắc quy → tích trữ điện', [(291, 'tích trữ')]),
 ('M20 máy phát → phát điện', [(292, 'phát điện')]),
 ('M21 Biển tam giác → nguy hiểm → giảm tốc', [(163, 'nguy hiểm')]),
 ('M22 chiều dài → biển 2 mũi tên (S.501), khoảng cách → không (S.502)', [(352, 'a'), (353, 'b'), (347, 'chiều dài')]),
 ('M22 dốc: xuống = biển 1, lên = biển 2 (theo bộ đề)', [(415, 'a'), (416, 'b')]),
 ('M22 "1 gồ 2 gà" (ổ gà / gồ giảm tốc)', [(419, 'ổ gà'), (420, 'gồ')]),
 ('M23 câu có "và" → ý 2, không "và" → ý 3 (cặp biển tốc độ theo làn)', [(426, 'b'), (427, 'c')]),
 ('M25 xe kéo nhau → không đúng/vi phạm', [(510, 'không đúng'), (515, 'vi phạm'), (518, 'không đúng')]),
 # điểm-liệt.txt
 ('L1 không cấm xe đạp quốc lộ; cấm rải vật sắc nhọn', [(19, 'rải vật sắc nhọn')]),
 ('L2 4 loại giấy tờ phải mang', [(138, 'd')]),
 ('L3 Niên hạn: >9 chỗ 20 năm, tải 25 năm', [(278, '20 năm'), (277, '25 năm'), (20, 'c')]),
 ('L4 Đua xe: được cấp phép; trái phép xử lý tùy mức độ', [(21, 'cấp phép'), (22, 'tùy theo mức độ')]),
 ('L5 Ma túy → phạt tiền + tước GPLX', [(23, 'c')]),
 ('L6 Có cồn → cấm, phạt tiền + tước; cấm người điều khiển mọi loại xe (ý 1)', [(24, 'bị nghiêm cấm'), (25, 'c'), (26, 'a')]),
 ('L7 Cấm giao xe cho người chưa đủ tuổi/không GPLX/hết 12 điểm (chọn 4)', [(27, 'd')]),
 ('L8 Lạng lách + xúc phạm đe dọa (chọn 3: cả 2)', [(28, 'c')]),
 ('L9 mất trật tự, cản trở → cấm', [(30, 'c')]),
 ('L10 cấm lạng lách đánh võng rú ga', [(32, 'lạng lách')]),
 ('L11 quan sát → giảm tốc → dừng (ý dài)', [(34, 'b'), (90, 'a'), (167, 'b'), (253, 'a')]),
 ('L12 TH giảm tốc đường hẹp/cầu cống/mưa (chọn 4)', [(35, 'd')]),
 ('L13 đường cong / cầu hẹp 1 làn: không được vượt', [(47, 'không được phép vượt'), (53, 'a')]),
 ('L14 vượt xe: đèn hoặc còi', [(48, 'đèn chiếu sáng phía trước hoặc còi')]),
 ('L15 cấm dùng tay cầm điện thoại', [(52, 'điện thoại')]),
 ('L16 không quay đầu ở phần đường người đi bộ', [(55, 'a')]),
 ('L17 không lùi: 1 chiều, giao nhau, tầm nhìn che khuất (chọn 4)', [(58, 'd')]),
 ('L18 không được đẩy, kéo xe khác', [(63, 'không được phép'), (67, 'không được phép'), (74, 'không được phép')]),
 ('L19 cấm buông 2 tay', [(64, 'buông cả hai tay'), (65, 'buông cả hai tay'), (70, 'd')]),
 ('L20 người được chở không: cồng kềnh, bám kéo đẩy (chọn 3: ý 1+2)', [(66, 'ý 1 và ý 2'), (66, 'c')]),
 ('L21 đội mũ + cài quai (chọn 1)', [(68, 'a')]),
 ('L22 không: dàn hàng ngang, dùng ô', [(71, 'c'), (72, 'dàn hàng ngang'), (73, 'không được sử dụng')]),
 ('L23 lùi xe: quan sát sau + 2 bên', [(85, 'hai bên và phía sau')]),
 ('L24 tầm nhìn che: không lùi', [(86, 'không được lùi')]),
 ('L25 tránh xe: giảm tốc + đi bên phải', [(87, 'a')]),
 ('L26 tránh ngược chiều: gần chỗ tránh/xuống dốc nhường lên dốc (chọn 4)', [(88, 'd'), (89, 'nhường đường cho xe lên dốc')]),
 ('L27 đường cong: quan sát, giảm tốc', [(90, 'a')]),
 ('L28 đường không ưu tiên: nhường đường ưu tiên/đường chính', [(91, 'c')]),
 ('L29 vòng xuyến nhường trái, không vòng xuyến nhường phải', [(92, 'b'), (93, 'a')]),
 ('L30 không tín hiệu ưu tiên được vượt; có tín hiệu không được vượt', [(97, 'c'), (98, 'a')]),
 ('L31 đường sắt dừng: hiệu lệnh, đèn đỏ, chắn (chọn 4)', [(102, 'd')]),
 ('L32 nhập làn cao tốc (chọn 4)', [(117, 'd')]),
 ('L33 biển tam giác giảm tốc', [(163, 'a')]),
 ('L34 giảm tốc: vạch đi bộ, giao nhau, trường học (cả 3)', [(165, 'd')]),
 ('L35 gặp xe buýt: quan sát giảm tốc', [(167, 'b')]),
 ('L36 gặp người đi bộ: giảm tốc', [(198, 'a')]),
 ('L37 xuống dốc (xe tay ga): giữ tay ga, phanh trước + sau', [(206, 'a')]),
 ('L38 đường vòng: quan sát + giảm tốc', [(215, 'a')]),
 ('L39 đường trơn: không đánh lái ngoặt + phanh gấp', [(226, 'không đánh lái ngoặt')]),
 ('L40 mở cửa: quan sát + mở hé', [(234, 'mở hé')]),
 ('L41 trời mưa: bật đèn + giảm tốc', [(245, 'a')]),
 ('L42 lùi xe: trái + phải + sau', [(246, 'a')]),
 ('L43 xuống dốc: về số thấp', [(252, 'số thấp')]),
 ('L44 nhánh → chính: quan sát + giảm tốc', [(253, 'a')]),
 ('L45 dùng điện thoại: giảm tốc + dừng xe', [(254, 'dừng xe')]),
 ('L46 không nên: chỉ dùng phanh trước', [(255, 'chỉ sử dụng phanh trước')]),
 ('L47 tay ga: tăng từ từ, giảm nhanh', [(260, 'tăng ga từ từ, giảm ga thật nhanh')]),
]
fact_rows = []
for tip, items in FACTS:
    ok, bad = [], []
    for qid, exp in items:
        q = D[qid]
        ca = q['correctAnswer']
        if len(exp) == 1 and exp in 'abcd':
            good = (ca == exp)
        else:
            good = exp.lower() in low(q['options'][ca])
            # must also be unique to correct option to count as "tip answers it"
            others = [k for k, v in q['options'].items() if k != ca and exp.lower() in low(v)]
            if good and others:
                good = 'AMB'
        (ok if good is True else bad).append((qid, exp, good))
        touched.setdefault(tip, set()).add(qid)
    fact_rows.append(dict(tip=tip, n=len(items), ok=len(ok), bad=bad))

# ---------- outputs ----------
out = {'mech': results, 'facts': fact_rows}
cov = set().union(*touched.values())
out['coverage'] = len(cov)
liet = [q['id'] for q in Q if q['isPointDeduction']]
liet_cov = sorted(set(liet) & set().union(*[v for k, v in touched.items() if k.startswith('L')]))
out['liet_cov'] = liet_cov
out['liet_uncov'] = sorted(set(liet) - set(liet_cov))
out['liet_cov_any'] = sorted(set(liet) & cov)
fs = set(os.listdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../data/', 'hinh'))
img = [q for q in Q if q['hasImage']]
out['img_total'] = len(img)
out['img_missing'] = [q['id'] for q in img if not q['image'] or os.path.basename(q['image']) not in fs]
from collections import Counter
c = Counter(os.path.basename(q['image']) for q in img)
out['img_dupes'] = {k: [q['id'] for q in img if os.path.basename(q['image']) == k] for k, v in c.items() if v > 1}
out['img_files'] = len(fs)
json.dump(out, open(sys.argv[1], 'w'), ensure_ascii=False, indent=1, default=list)

core = [k for k in touched if not any(k.startswith(p) for p in ('M4x', 'M6alt', 'M24x', 'M2b', 'M3a', 'M3b', 'M19'))]
cov_core = set().union(*[touched[k] for k in core])
q253 = D[253]
print('253 longest', longest(q253), 'ans', q253['correctAnswer'])
print('coverage_all', len(cov), 'coverage_core', len(cov_core))
by_ch = Counter(D[i]['category'][:10] for i in cov_core); tot = Counter(q['category'][:10] for q in Q)
print({k: f'{by_ch[k]}/{tot[k]}' for k in tot})
