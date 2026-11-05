# 성간 도약 경로 탐색 교육용 3D 웹 데모 사전 설계서 (수정본)

> Cursor 리셋 후 구현용 인수인계 문서. plan과 함께 본다: `interstellar-route-demo-plan.md`  
> 최종 정리: 2026-11-05 (Gemini 초안 → 피드백 반영)

### 변경 요약 (핵심 6개)

- 기본 항행 속도 `speedC = 0.1` (비행시간 = 거리 / 0.1). UI 시연 배속은 별개.
- 스키마: Body / metadata / scenario 필수 필드 규격화. `spectral_type` 등은 선택.
- k-d 트리에서 `kind === "earth"` 제외. 첫 질의는 원점 `(0,0,0)`.
- v1: HD 199509 경로 + 주변 이웃 보강, 약 200~500개. “태양계 인근 100개” 삭제.
- Anti-pattern은 `금지:` 표기.
- Cursor 프롬프트: Tailwind 선택, `src/core|data|ui|store`, MVP `X=8` vs 본편 `X=15` 고지.

---

## A. 합성 데이터셋 스펙 (MVP)

### 1. JSON 스키마

지구는 `kind: "earth"`이며 **k-d 트리 색인에서 제외**한다.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "InterstellarDataset",
  "type": "object",
  "required": ["metadata", "scenario", "bodies"],
  "properties": {
    "metadata": {
      "type": "object",
      "required": [
        "name", "source", "retrievedAt", "citation", "frame",
        "unit", "isSynthetic", "seed", "starCount", "bounds"
      ],
      "properties": {
        "name": { "type": "string" },
        "source": { "type": "string" },
        "retrievedAt": { "type": "string" },
        "citation": { "type": "string" },
        "frame": { "type": "string", "enum": ["icrs", "galactic", "local_cartesian"] },
        "unit": { "type": "string", "enum": ["ly"] },
        "isSynthetic": { "type": "boolean" },
        "seed": { "type": "integer" },
        "starCount": { "type": "integer", "minimum": 80, "maximum": 150 },
        "bounds": {
          "type": "object",
          "required": ["min", "max"],
          "properties": {
            "min": { "type": "array", "items": { "type": "number" }, "minItems": 3, "maxItems": 3 },
            "max": { "type": "array", "items": { "type": "number" }, "minItems": 3, "maxItems": 3 }
          }
        }
      }
    },
    "scenario": {
      "type": "object",
      "required": ["datasetId", "startId", "destId", "X", "speedC", "stopYr"],
      "properties": {
        "datasetId": { "type": "string" },
        "startId": { "type": "string" },
        "destId": { "type": "string" },
        "X": { "type": "number", "minimum": 1.0 },
        "speedC": { "type": "number", "default": 0.1 },
        "stopYr": { "type": "number", "default": 1.0 }
      }
    },
    "bodies": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "name", "pos", "kind", "datasetId"],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "pos": { "type": "array", "items": { "type": "number" }, "minItems": 3, "maxItems": 3 },
          "kind": { "type": "string", "enum": ["earth", "host", "synthetic"] },
          "datasetId": { "type": "string" },
          "spectral_type": { "type": "string" },
          "has_habitable_candidate": { "type": "boolean" }
        }
      }
    }
  }
}
```

### 2. 별 개수, 시드, 지구 배제

- 별 개수: 기본 100개 내외 (`80 ≤ N ≤ 150`)
- 시드: `seed = 42` (결정론적 PRNG)
- 좌표: 지구 `[0,0,0]` 중심 ly, `local_cartesian`
- k-d 트리: `kind !== "earth"`만 인덱싱
- 최초 1회: 원점 `(0,0,0)`에서 반경 X 이웃 질의

### 3. 연결 보장 (Assert)

프리셋 `X_preset = 8.0 ly`

1. 백본: 지구→목적지 중간 징검다리, 인접 거리 ≤ `0.75 × X` (= 6.0 ly)
2. 나머지 항성 시드 기반 배치
3. Assert:
   - `radiusQuery([0,0,0], X).length >= 2`
   - `dijkstra(...).reached === true`
   - `giantComponentRatio(X) >= 0.85`

### 4. 예시 JSON (축소본)

```json
{
  "metadata": {
    "name": "Synthetic Cluster 100",
    "source": "deterministic-generator",
    "retrievedAt": "2026-11-05T00:00:00Z",
    "citation": "Algorithm Education Demo Benchmark",
    "frame": "local_cartesian",
    "unit": "ly",
    "isSynthetic": true,
    "seed": 42,
    "starCount": 8,
    "bounds": { "min": [-3.0, -2.0, -2.0], "max": [20.0, 8.0, 4.0] }
  },
  "scenario": {
    "datasetId": "syn-cluster-mvp",
    "startId": "earth_sol",
    "destId": "syn_dest_01",
    "X": 8.0,
    "speedC": 0.1,
    "stopYr": 1.0
  },
  "bodies": [
    { "id": "earth_sol", "name": "Earth (지구 - 출발점)", "pos": [0.0, 0.0, 0.0], "kind": "earth", "datasetId": "syn-cluster-mvp" },
    { "id": "syn_001_prox", "name": "Centauri-A", "pos": [3.0, 0.0, 0.0], "kind": "synthetic", "datasetId": "syn-cluster-mvp", "spectral_type": "G" },
    { "id": "syn_002_bern", "name": "Barnard-B", "pos": [2.0, 4.0, 0.0], "kind": "synthetic", "datasetId": "syn-cluster-mvp", "spectral_type": "M" },
    { "id": "syn_003_sirius", "name": "Sirius-C", "pos": [5.5, 0.0, 0.0], "kind": "synthetic", "datasetId": "syn-cluster-mvp", "spectral_type": "A" },
    { "id": "syn_004_ross", "name": "Ross-D", "pos": [5.0, 5.0, 1.0], "kind": "synthetic", "datasetId": "syn-cluster-mvp", "spectral_type": "M" },
    { "id": "syn_005_vega", "name": "Vega-E", "pos": [11.0, 2.0, 1.0], "kind": "synthetic", "datasetId": "syn-cluster-mvp", "spectral_type": "A" },
    { "id": "syn_006_altair", "name": "Altair-F", "pos": [12.0, 6.0, 0.0], "kind": "synthetic", "datasetId": "syn-cluster-mvp", "spectral_type": "F" },
    { "id": "syn_dest_01", "name": "Gliese-Target (목적지)", "pos": [16.5, 3.0, 1.0], "kind": "synthetic", "datasetId": "syn-cluster-mvp", "spectral_type": "M", "has_habitable_candidate": true }
  ]
}
```

---

## B. 이벤트 로그 샘플

### 파라미터

- `speedC = 0.1` → 비행시간 = 거리 × 10년
- 기착: 지구 0, 일반 항성 출발 1.0년
- `X = 8.0 ly`
- 동률: 노드 id 오름차순

### 시퀀스 (발췌)

`ready → pop → settle → query → relax* → … → done`

핵심 수식 예:

- Earth → Centauri-A (3.0 ly): `0 + 0 + 3.0/0.1 = 30.0년`
- Centauri-A → Sirius-C (2.5 ly): `30.0 + 1.0 + 2.5/0.1 = 56.0년`

### 직관 고지

> 다음에 탐색할 별은 현재 별의 최근접 이웃이 아니다.  
> 전역 후보 중 **누적 도착 시간 dist가 가장 짧은 별**을 큐에서 꺼낸다.

---

## C. UI 카피 초안

### 상시 배지

`[교육용 데모]` 정적 3D 단순화 모델(기본 0.1c, X=8 ly). 과제 본편(전체 탐색, 기본 X=15 ly)과 결과가 다를 수 있습니다.

### About (요약)

교육용 k-d + Dijkstra 단계 재생. 정적 좌표. 기본 0.1c, 중간 기착 1년. 지구는 트리 제외·원점 첫 질의. 합성/subset은 본편과 다를 수 있음. AI는 경로를 추론하지 않음.

### 단계 템플릿

- ready / pop / settle / query / relax(갱신·생략) / done / unreachable — plan B절·위 Gemini 수정본과 동일 톤 유지.

### v1 고지

지구 도달 가능 성분 + HD 199509 경로 + 주변 이웃 보강, 약 200~500개. 본편과 다를 수 있음.

---

## D. 3D 가독성

| 상태 | 색 | 비고 |
|---|---|---|
| 지구 | `#00E5FF` | 트리 제외 |
| 목적지 | `#FF1744` | |
| 미방문 | `#4A5568` α0.4 | |
| 큐 대기 | `#FFD600` | |
| 현재 활성 | 라임/화이트 | |
| 질의 이웃 | `#00B0FF` | |
| 확정 | `#00E676` | |
| 최종 경로 | `#FFEA00` | |
| 반경 구 | cyan wire, α0.08 | 현재 u 중심만 |

금지:

- 모든 별 라벨 상시 표시
- k-d 분할면 전역 오버레이
- 무거운 포스트프로세싱/그림자맵

---

## E·프롬프트: 아래 “Cursor 복붙” 섹션 사용

---

## F. MVP TODO

1. Vite+React+TS+R3F+Zustand, 폴더 `core/data/ui/store`
2. synthetic JSON + earth 제외 + X=8 백본 assert
3. `units` / `kdtree` / `dijkstraSimulator` (0.1c, 기착, id 동률, 이벤트 로그)
4. Zustand 파라미터·재생 헤드
5. 3D: 반경 구·하이라이트·경로 선
6. UI: 배지, About, 재생 바, 인스펙터
7. 통과: 스텝 동기화, 0.1c·기착, earth 미삽입, unreachable, `npm run build`

나중에: v1 subset 200~500, Polish

---

## G. 테스트

1. k-d radiusQuery == 브루트포스 (`kind !== earth`)
2. 이벤트 Dijkstra == 전수 간선 Dijkstra (X=8, 0.1c)
3. 손계산: S0–S1–S2, dist(S1)=30, dist(S2)=61, 목적지 기착 없음
4. X 축소 시 unreachable

---

### Cursor 리셋 후 바로 할 일

1. 아래 **프롬프트 1**로 스캐폴딩
2. **프롬프트 2**로 core + 단계 시각화
3. 섹션 G 테스트 통과 확인

---

## Cursor 복붙용 프롬프트

### 프롬프트 1 (스캐폴딩)

```markdown
작업 위치: `exoplanet-hop/web-demo/`

당신은 교육용 3D 성간 경로 시각화 웹 데모의 프론트엔드 스캐폴딩 엔지니어입니다.
아래 사양과 확정 제약에 따라 Vite + React + TypeScript + Zustand + Three.js(@react-three/fiber, @react-three/drei) 기반 프로젝트를 구축하세요. (스타일링은 일반 CSS/CSS Modules 또는 Tailwind 중 선택 적용)

설계 문서: `web-demo/interstellar-route-demo-plan.md`, `web-demo/prebuild-handoff.md`를 따른다.

[확정 제약 및 디렉터리 구조]
1. 정적 배포(Vercel 정적 호스팅)를 위한 번들 구조를 구성하세요.
2. 디렉터리 분리 구조:
   - `src/core/`: 순수 TypeScript 알고리즘 및 단위 유틸
   - `src/data/`: 정적 데이터셋 JSON
   - `src/store/`: Zustand 전역 상태 머신
   - `src/ui/`: 3D Canvas 및 2D 컨트롤/패널 컴포넌트
3. 데이터셋 스펙 (`src/data/synthetic-stars.json`):
   - Body 필수 필드: `id, name, pos:[x,y,z], kind: "earth"|"host"|"synthetic", datasetId`
   - Metadata: `name, source, retrievedAt, citation, frame, unit:"ly", isSynthetic, seed, starCount, bounds`
   - Scenario: `datasetId, startId(=earth_sol), destId, X: 8.0, speedC: 0.1, stopYr: 1.0`
   - 별 개수: 100개 내외 (지구 [0,0,0] 포함, 시드 고정).
4. 기본 항행 속도는 0.1c, 기본 X는 8.0ly입니다.

[구현 요구사항]
1. `src/data/synthetic-stars.json`: 확정 제약 스키마에 맞는 100개 항성 데이터 작성. (지구는 `kind: "earth"`, 나머지는 `kind: "synthetic"`, 목적지 포함).
2. `src/ui/canvas/SpaceCanvas.tsx`:
   - `@react-three/fiber`의 `<Canvas>` 및 `OrbitControls` 설정.
   - 배경 우주 환경 및 항성 구체 렌더링. 지구(`#00E5FF`)와 목적지(`#FF1744`) 시각 구별.
3. `src/ui/TopBar.tsx` & `src/ui/AboutModal.tsx`:
   - "교육용 데모: 정적 좌표 기반(기본 0.1c, X=8ly)이며 과제 본편(기본 X=15ly)과 다를 수 있음" 상시 뱃지 및 About 모달 팝업.
4. `src/store/useSimulationStore.ts`:
   - 시뮬레이션 상태(`ready`, `running`, `paused`, `done`, `unreachable`), 파라미터(X = 8.0 ly, speedC = 0.1, stopYr = 1.0) 인터페이스 정의.

[완료 기준]
- `npm run dev` 실행 시 에러 없이 3D 우주 공간에 항성군이 표시되고 마우스 드래그로 회전/줌이 가능해야 함.
- 상시 고지 배지와 About 모달이 정상 렌더링되어야 함.
애매하면 구현 전 질문하고 가정을 명시해라.
```

### 프롬프트 2 (알고리즘 단계 시각화)

```markdown
작업 위치: `exoplanet-hop/web-demo/`

당신은 k-d 트리 및 다익스트라(Dijkstra) 알고리즘 시각화 전문 엔지니어입니다.
스캐폴딩된 프로젝트 위에 단계별 시뮬레이션 엔진과 3D 반응형 시각화 로직을 구현하세요.
설계 문서: `web-demo/interstellar-route-demo-plan.md`, `web-demo/prebuild-handoff.md`를 따른다.

[핵심 알고리즘 제약]
1. 지구는 가상 출발점입니다:
   - k-d 트리를 구축할 때 `kind === "earth"` 노드는 완전히 제외하고 항성들로만 트리를 빌드합니다.
   - 최초 1회 이웃 질의는 지구 원점 `(0,0,0)`에서 수행합니다.
2. 기착 비용: w(u→v) = distance(u,v)/speedC + (u가 지구가 아니면 stopYr=1.0년, 지구면 0.0년).
   - 기본 speedC = 0.1 (비행시간 = 거리 / 0.1).
3. dist[v]는 v 도착 시각(v 기착 미포함). 목적지가 settle되면 즉시 탐색 종료(목적지 기착 없음).
4. 동률(Tie-breaking) 처리: 우선순위 큐에서 dist가 같으면 노드 id 오름차순으로 pop.
5. 이벤트 시퀀스: ready -> pop -> settle -> query -> relax* -> ... -> done (또는 unreachable).

[구현 요구사항]
1. `src/core/kdtree.ts`:
   - 3차원 점들에 대한 k-d 트리 구축 (`kind !== "earth"` 필터링) 및 `radiusQuery(center, radius)` 구현.
2. `src/core/dijkstraSimulator.ts`:
   - 위 제약을 엄격히 만족하는 사전 이벤트 로그 생성기 구현.
   - 각 이벤트에 UI 수식 breakdown 데이터(layover, flight_time, old_dist, new_dist) 포함.
3. `src/ui/PlaybackControls.tsx`:
   - 이전/다음 단계, 재생/일시정지, 처음으로, 시연 속도 배속 슬라이더, 도약 반경 X 슬라이더 구현.
4. `src/ui/canvas/GraphVisualizer.tsx`:
   - 현재 단계에 따른 노드 색상(미방문/큐대기/확정/이웃), 반경 구체(X), 완화 간선, 최단 경로 네온 라인 렌더링.
   - k-d 트리 분할면은 절대 렌더링하지 말고, 현재 활성 노드 중심의 반경 구체 1개만 표시.
5. `src/ui/InspectorPanel.tsx`:
   - 단계별 한 줄 설명, 실시간 계산식("dist[u] + 기착(u) + 거리/0.1"), 우선순위 큐 현황 테이블.
   - "다음 별 = 현재 이웃 중 최근점이 아님" 안내 문구 상시 노출.

[완료 기준]
- Step Next 클릭 시 노드 상태, 반경 구, 계산 수식이 1:1로 일치하여 변경되어야 함.
- X를 3.0 ly 이하로 줄이고 재생 시 unreachable 상태 및 전용 안내문이 표출되어야 함.
- 테스트: (1) k-d == 브루트포스 (2) 이벤트 Dijkstra == 전수 간선 Dijkstra (3) 손계산 S0-S1-S2에서 30년/61년 (4) X 축소 시 unreachable
  이 `npm run test`로 통과해야 함.
기존 파일은 요청 범위 밖은 건드리지 마. 애매하면 구현 전 질문해라.
```
