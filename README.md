<p align="center">
  <img src="assets/logo.png" alt="EXOPLANET HOP" width="560">
</p>

<p align="center">
  한 번에 제한된 거리만 도약할 수 있을 때<br>
  <strong>지구에서 목적지 별까지, 총 이동 시간이 가장 짧은 경로</strong>를 찾는다.
</p>

<p align="center">
  <a href="https://exoplanet-hop-web.kim-kwanho.workers.dev"><img src="https://img.shields.io/badge/%EC%9B%B9%20%EB%8D%B0%EB%AA%A8%20%EC%97%B4%EA%B8%B0-07090d?style=for-the-badge" alt="웹 데모 열기"></a>
</p>

<p align="center">
  <img src="assets/web-ready.png" alt="배포된 앱의 탐색 대기 화면. 지구와 목적지 Dest-A 사이에 직선거리 안내선이 있다." width="880">
</p>

<p align="center"><sub>기본 화면 · 합성 항성 100개 · 도약 8광년 · 목적지 Dest-A</sub></p>

확인된 외계행성 호스트 별을 3차원 좌표의 정점으로 두고, 도약 가능한 이웃만 이어 그래프를 만든다. 다익스트라는 누적 시간이 가장 짧은 별을 확정하고, k-d 트리는 그 별에서 반경 X 안의 다음 후보를 찾는다.

> 이 저장소의 시간은 설정한 그래프의 비용이다. 중력, 상대론, 별의 고유운동, 가속과 감속은 계산하지 않으며 실제 우주선 비행 시간이 아니다.

| 보고 싶은 것 | 어디 |
|---|---|
| 비용이 어떻게 정해지는지 | [모형](#모형) |
| 왜 다익스트라와 k-d 트리인지 | [탐색](#탐색) |
| 2026-11-05 카탈로그에서 나온 경로 | [카탈로그 경로](#카탈로그-경로) |
| 배포된 3D 앱을 로컬에서 돌리는 법 | [실행](#실행) |
| 수치·가정·복잡도 원문 | [notes/](notes/README.md) |

## 모형

한 번에 갈 수 있는 거리는 X로 막혀 있다. 목적지까지의 직선이 곧 경로가 되지 않고, 중간 별에 들러 여러 번 도약한다.

전이 `u → v`의 비용은 년 단위다. 속도 0.1c는 `0.1 ly/year`로 쓴다.

```text
cost(u, v) = distance(u, v) / 0.1  +  layover(u)

layover(지구)   = 0
layover(호스트) = 1년
```

목적지에 도착하면 탐색을 끝내므로, 목적지에서의 기착은 더하지 않는다. 호스트 사이 연결 여부는 양방향이 같다. 지구에서 첫 도약만 기착이 없어 비용이 다르다. 모든 비용이 0 이상이므로 다익스트라를 쓴다.

좌표는 NASA `pscomppars`의 `ra`, `dec`, `sy_dist`다. `sy_dist`는 파섹이라 IAU 정의로 광년으로 바꾼 뒤, 적경·적위를 직교좌표로 놓는다.

```text
x = r cos(dec) cos(ra)
y = r cos(dec) sin(ra)
z = r sin(dec)
```

같은 `hostname`의 좌표가 어긋나면 평균 내지 않고 분석을 멈춘다. 이번 추출본에서는 그런 경우가 0건이다.

| | 카탈로그 분석 | 웹 데모 기본값 |
|---|---|---|
| 정점 | 좌표가 있는 호스트 4,819개. 지구는 원점의 가상 출발점 | 시드 42로 만든 합성 항성 100개 |
| 간선 | 3차원 직선거리 ≤ 15광년 | 직선거리 ≤ 8광년 |
| 속도 | 0.1c | 같음. 화면에서 0.05c–0.5c |
| 기착 | 호스트에서 떠날 때 1년 | 같음. 화면에서 0–5년 |
| 목적지 | 도달 가능한 별 중 지구에서 가장 먼 HD 199509 | Dest-A |

두 결과는 비용 규칙만 공유한다. 기본 샌드박스의 시간과 1,509.533년을 같은 측정으로 비교하지 않는다. 실측 호스트 300개와 HD 199509는 앱 안의 별도 프리셋이다.

## 탐색

간선 목록을 미리 만들지 않는다. 다익스트라가 별을 하나 확정할 때마다, 그 별에서 k-d 반경 질의로 X 안의 이웃만 꺼낸다.

```mermaid
flowchart LR
  S["지구에서 반경 질의"] --> H["누적 시간이 가장 짧은 미확정 별"]
  H --> D{"목적지인가"}
  D -->|예| P["직전 별로 경로 복원"]
  D -->|아니오| Q["그 별에서 반경 X 질의"]
  Q --> R["이웃으로 완화 후 다시 힙"]
  R --> H
```

k-d 반경 질의가 X 안의 이웃을 빠짐없이 돌려주면, 별 쌍을 모두 검사해 간선을 만든 뒤 같은 최단 경로를 푸는 방식과 경로가 같다. 이 저장소는 그 실행 시간을 재어 우열을 단정하지 않는다.

X = 15광년에서 호스트 쌍 상한은 11,608,971개이고, 실제로 거리 안에 드는 호스트 간선은 585개다. 지연 질의의 의미는 “전수 저장이 메모리에 불가능하다”가 아니다. 전체 쌍을 비교하는 대신, 도달 가능한 성분에서 가까운 이웃만 본다는 점이다. 식과 이 규모에 대입한 값은 [notes/complexity.md](notes/complexity.md)에 있다. 웹 데모의 k-d 구축은 재귀마다 정렬하므로 `Θ(N log² N)`이고, 보고서 의사코드의 선형 시간 선택 구축 `Θ(N log N)`과 같은 측정이 아니다.

## 카탈로그 경로

2026-11-05 NASA Exoplanet Archive `pscomppars`에서 `hostname`, `ra`, `dec`, `sy_dist`를 받았다. 6,451행을 호스트 이름으로 묶어 4,847개가 되었고, 좌표나 거리가 없는 28개를 빼 `N = 4,819`다. 환산은 `1 pc = 3.2615637771674333 ly`다.

지구에서 바로 닿는 별은 17개이고, 그 연결을 따라가면 132개 호스트에 도달한다. 그 가운데 지구와 직선거리가 가장 먼 별을 목적지로 골랐다. HD 199509, 약 79.274광년이다. 천문학적으로 특별한 대상이라는 뜻은 아니다. 성분이 132개뿐이라, 그 바깥 별에는 이 모형에서 경로가 없다.

| 호스트 | 기착 | 도약 거리 | 총 시간 |
|---|---:|---:|---:|
| 12곳 | 11회 | 149.853광년 | **1,509.533년** |

순항은 약 1,498.533년이고, 기착 11년을 더했다. 꺾인 경로가 직선보다 긴 이유는 한 도약이 15광년을 넘을 수 없기 때문이다.

<p align="center">
Earth → Ross 128 → GJ 393 → GJ 357 → GJ 367 → L 98-59 → COCONUTS-2 A<br>
→ LHS 475 → HD 222237 → LHS 3844 → GJ 3021 → nu Oct A → HD 199509
</p>

구간표와 집계는 스크립트를 다시 돌리면 `data/processed/`에 생긴다. 해석은 [notes/graph_15ly.md](notes/graph_15ly.md), 확인된 숫자만 모은 표는 [notes/numbers.md](notes/numbers.md)다.

## 화면

앱은 탐색을 먼저 계산하고, 그 기록을 단계로 재생한다. 청록색 그물은 현재 별 주변의 도약 반경이고, 그 안의 별만 다음 후보가 된다.

<p align="center">
  <img src="assets/web-play.png" alt="반경 이웃을 탐색하는 장면. 지구 근처에 도약 반경 그물과 후보 별 S001, S002가 보인다." width="880">
</p>

<p align="center"><sub>재생을 멈춘 장면 · 그물 안이 이번 도약의 후보</sub></p>

[라이브](https://exoplanet-hop-web.kim-kwanho.workers.dev)에서 드래그로 시점을 돌리고, 재생으로 확정 순서를 따라간다. 패널에서 데이터(합성 샌드박스 / 호스트 프리셋), 목적지, 도약 X, 속도, 기착을 바꾼 뒤 다시 계산한다. 인트로의 「작동 원리 보기」가 같은 비용 규칙을 화면 안에서 설명한다.

## 실행

Python은 표준 라이브러리만 쓴다. 원본은 `data/raw/pscomppars_2026-11-05.csv`다. 저장소 루트에서 실행하면 `data/processed/`에 좌표, 15광년 간선, 경로 구간이 다시 생긴다. 이 산출물과 `report/`의 보고서·PDF는 Git에 올리지 않는다.

```bash
python scripts/analyze_catalog.py
```

웹 데모는 [web-demo](web-demo/README.md)에서 실행한다. 배포는 Vite 빌드를 Cloudflare Workers Static Assets로 올린다.

```bash
cd web-demo
npm install
npm test
npm run dev
```

| 명령 | 하는 일 |
|---|---|
| `npm test` | 시뮬레이터 단위 테스트 |
| `npm run dev` | 로컬 개발 서버 |
| `npm run build` | 타입 검사 후 `dist/` 생성 |
| `npm run data` | 합성 항성 JSON 재생성 |
| `npm run hosts` | 호스트 프리셋 JSON 재생성 |
| `npx wrangler deploy` | `dist/`를 Workers에 배포 |

## 저장소

```
exoplanet-hop/
  assets/           README 로고와 배포 화면
  notes/            수치, 가정, 복잡도, 현실-알고리즘 대응
  scripts/          카탈로그 분석
  data/raw/         2026-11-05 CSV
  data/processed/   분석 산출물, Git 무시
  web-demo/         3D 재생 앱
  report/           보고서와 제출 PDF, 로컬 전용
```

| 메모 | 내용 |
|---|---|
| [notes/correspondence.md](notes/correspondence.md) | 현실 요소와 정점·간선·비용의 대응 |
| [notes/assumptions.md](notes/assumptions.md) | 고유운동, 오차, 기착을 뺀 이유 |
| [notes/complexity.md](notes/complexity.md) | 시간·공간 식과 15광년 규모 대입 |
| [notes/graph_15ly.md](notes/graph_15ly.md) | 연결 성분과 HD 199509 경로 |
| [notes/numbers.md](notes/numbers.md) | 출처가 있는 수치만 |

## 한계

- 지도는 발견된 호스트만이다. 행성이 여러 개여도 `hostname` 하나이고, 행성이 없는 별은 없다.
- 위치는 추출 시각에 고정한다. 고유운동과 은하 회전은 넣지 않는다.
- 도약은 3차원 직선이다. 중력, 상대론, 가속·감속은 없다.
- `sy_dist` 오차는 경로 계산에서 무시한다. 오차를 넣으면 15광년 경계의 간선이 달라질 수 있다.
- 0.1c와 기착 1년은 시간 계산용 가정이다. 실현된 추진 성능이 아니다.
- X = 15광년은 이 추출본에서 지구 쪽 성분 132개를 만든 기준값이다. 성간 항행 한계를 측정한 값이 아니다.

## 참고

- NASA Exoplanet Archive. `pscomppars`, 2026-11-05 추출. [TAP 질의](https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=SELECT%20hostname%2C%20pl_name%2C%20ra%2C%20dec%2C%20sy_dist%2C%20sy_disterr1%2C%20sy_disterr2%20FROM%20pscomppars&format=csv), [열 정의](https://exoplanetarchive.ipac.caltech.edu/docs/API_PS_columns.html).
- Dijkstra, E. W. “A Note on Two Problems in Connexion with Graphs.” *Numerische Mathematik* 1 (1959): 269–271. [DOI: 10.1007/BF01386390](https://doi.org/10.1007/BF01386390). 간선 가중치가 0 이상일 때의 최단 경로.
- Bentley, Jon Louis. “Multidimensional Binary Search Trees Used for Associative Searching.” *Communications of the ACM* 18, no. 9 (1975): 509–517. [DOI: 10.1145/361002.361007](https://doi.org/10.1145/361002.361007). k-d 트리.
- International Astronomical Union. “Resolution B2 (2012).” [PDF](https://www.iau.org/static/resolutions/IAU2012_English.pdf). 천문 단위.
- International Astronomical Union. “Resolution B2 (2015).” [PDF](https://www.iau.org/static/resolutions/IAU2015_English.pdf). 파섹은 648000/π au.
