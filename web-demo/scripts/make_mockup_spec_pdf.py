from pathlib import Path

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

base = Path(__file__).resolve().parents[1]
out = base / "docs" / "web-demo-mockup-spec-1page.pdf"
out.parent.mkdir(parents=True, exist_ok=True)

pdfmetrics.registerFont(TTFont("Malgun", r"C:\Windows\Fonts\malgun.ttf"))
pdfmetrics.registerFont(TTFont("MalgunBold", r"C:\Windows\Fonts\malgunbd.ttf"))

W, H = landscape(A4)
c = canvas.Canvas(str(out), pagesize=landscape(A4))

c.setFillColorRGB(0.07, 0.09, 0.12)
c.rect(0, 0, W, H, fill=1, stroke=0)

c.setFillColorRGB(0.12, 0.16, 0.22)
c.rect(0, H - 18 * mm, W, 18 * mm, fill=1, stroke=0)
c.setFillColorRGB(0.0, 0.90, 1.0)
c.circle(12 * mm, H - 9 * mm, 2.2 * mm, fill=1, stroke=0)
c.setFillColorRGB(0.95, 0.97, 1.0)
c.setFont("MalgunBold", 14)
c.drawString(18 * mm, H - 8 * mm, "EXOPLANET HOP — 목업·명세 (1페이지)")
c.setFont("Malgun", 8)
c.setFillColorRGB(0.65, 0.75, 0.85)
c.drawRightString(W - 10 * mm, H - 7.5 * mm, "exoplanet-hop/web-demo  ·  v3  ·  2026-11-08")

img1_path = base / "docs" / "mockups" / "v3" / "web-demo-v3-ready.jpg"
img2_path = base / "docs" / "mockups" / "v3" / "web-demo-v3-query.jpg"

img1 = ImageReader(str(img1_path))
img2 = ImageReader(str(img2_path))
img_w = 118 * mm
img_h = 62 * mm
left = 8 * mm
top_y = H - 22 * mm - img_h
gap = 4 * mm

c.setFillColorRGB(0.15, 0.2, 0.28)
c.roundRect(left - 1 * mm, top_y - 1 * mm, img_w + 2 * mm, img_h + 8 * mm, 2 * mm, fill=1, stroke=0)
c.setFillColorRGB(0.85, 0.92, 1.0)
c.setFont("MalgunBold", 8)
c.drawString(left, top_y + img_h + 2 * mm, "① ready — 대기 / 경로 설정")
c.drawImage(img1, left, top_y, width=img_w, height=img_h, preserveAspectRatio=True, anchor="c")

c.setFillColorRGB(0.15, 0.2, 0.28)
c.roundRect(left + img_w + gap - 1 * mm, top_y - 1 * mm, img_w + 2 * mm, img_h + 8 * mm, 2 * mm, fill=1, stroke=0)
c.setFillColorRGB(0.85, 0.92, 1.0)
c.setFont("MalgunBold", 8)
c.drawString(left + img_w + gap, top_y + img_h + 2 * mm, "② query — 반경 X 이웃 탐색")
c.drawImage(img2, left + img_w + gap, top_y, width=img_w, height=img_h, preserveAspectRatio=True, anchor="c")

spec_y = 8 * mm
spec_h = top_y - 6 * mm - spec_y
col_gap = 2 * mm
col_w = (W - 16 * mm - 3 * col_gap) / 4
cols = [
    (8 * mm, "레이아웃"),
    (8 * mm + col_w + col_gap, "확정 스펙"),
    (8 * mm + 2 * (col_w + col_gap), "3D 모션 (참고 UX)"),
    (8 * mm + 3 * (col_w + col_gap), "색·상태 / 금지"),
]

for x, _ in cols:
    c.setFillColorRGB(0.12, 0.16, 0.22)
    c.roundRect(x, spec_y, col_w, spec_h, 2 * mm, fill=1, stroke=0)

c.setFillColorRGB(0.0, 0.90, 1.0)
for x, title in cols:
    c.setFont("MalgunBold", 8)
    c.drawString(x + 2.5 * mm, spec_y + spec_h - 5.5 * mm, title)

body = [
    [
        "· 풀블리드 3D + 플로팅 UI",
        "· 헤더: EXOPLANET HOP + 데이터 필",
        "  (합성 N · 0.1c · X N ly)",
        "· 좌: 접이식 경로 설정 패널",
        "· 우: 인스펙터 + 아이콘 레일",
        "· 하단: Eyes식 원형 재생 컨트롤",
        "· 상시 배지=데이터 필만",
        "· 출처·시드는 About/푸터만",
        "· 시점 초기화 (R) 필수",
    ],
    [
        "· Vite + React + TS + Zustand + R3F",
        "· 합성 항성 ~100 (시드 고정)",
        "· 기본 X=8 ly / speedC=0.1 / 기착 1년",
        "· 지구=가상출발, k-d에서 earth 제외",
        "· 첫 질의: 원점 (0,0,0) 반경 X",
        "· 이벤트 로그 선생성 후 인덱스 재생",
        "· 배포: Vercel 정적",
        "· 그래프=점·반경구·경로선",
        "· v3: intro/ready/query/done/",
        "      unreachable/mobile",
    ],
    [
        "참고: NASA Eyes(카메라·레이어 UX)",
        "      Sketchfab(인트로 비주얼만)",
        "· OrbitControls 자유 회전/줌",
        "· pop/settle/query: 현재 별 lerp",
        "  (화면 밖일 때만 · 텔레포트 금지)",
        "· query: 구 fade-in → 이웃 pulse",
        "· relax: 완화 간선 잠깐 표시",
        "· done: 최종 경로 순차 연결(금색)",
        "· 미니 태양계=인트로만",
        "  (탐색 화면과 모드 분리)",
    ],
    [
        "· 지구 #00E5FF · 목적지 #FF1744",
        "· 미방문 회색 · 큐 대기 #FFD600",
        "· 현재 활성 라임 · 이웃 #00B0FF",
        "· 확정 #00E676 · 경로 #FFEA00",
        "· 반경 구: 현재 별 중심 반투명만",
        "금지: 전별 라벨 / k-d 분할면",
        "금지: 무거운 그림자·성운",
        "금지: 실시간 궤도·천체력 시뮬",
        "상태: ready→pop→settle→",
        "      query→relax*→done",
    ],
]

c.setFillColorRGB(0.82, 0.88, 0.95)
c.setFont("Malgun", 6.4)
for (x, _), lines in zip(cols, body):
    yy = spec_y + spec_h - 10 * mm
    for line in lines:
        c.drawString(x + 2.2 * mm, yy, line)
        yy -= 3.15 * mm

c.setFillColorRGB(0.55, 0.62, 0.70)
c.setFont("Malgun", 6.2)
c.drawString(
    8 * mm,
    3.2 * mm,
    "참고: docs/mockups/v3 · docs/prebuild-handoff.md · 3D모션=Eyes UX/Sketchfab 인트로 · 배지=데이터 필",
)

c.showPage()
c.save()
print(out)
print("bytes", out.stat().st_size)
