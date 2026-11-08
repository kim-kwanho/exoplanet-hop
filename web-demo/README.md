# EXOPLANET HOP — 성간 도약 경로 3D 웹 앱

주제 B 필수 제출물과 별개인 확장입니다. 과제 본편(외계행성 호스트 전체 카탈로그 분석)과 **데이터·결과를 섞어 쓰지 않습니다.**  
상세 설계는 [docs/interstellar-route-demo-plan.md](./docs/interstellar-route-demo-plan.md)를 봅니다.  
인수인계(스펙·카피·프롬프트): [docs/prebuild-handoff.md](./docs/prebuild-handoff.md)  
제품화 고도화 명세: [docs/production-hardening-spec.md](./docs/production-hardening-spec.md)  
목업·명세 1페이지 PDF: [docs/web-demo-mockup-spec-1page.pdf](./docs/web-demo-mockup-spec-1page.pdf)  
목업 이미지(v3): `docs/mockups/v3/` · 이전 시안은 `docs/mockups/archive/`

## 한 문장

Dijkstra가 별을 확정하고 k-d 트리가 반경 X 이웃을 찾는 과정을 3D에서 단계 재생하는 웹 앱. 실제 우주선 항법이 아닙니다.

## 현재 상태

3D 앱과 단계 재생이 구현되어 있고, 합성 샌드박스가 기본 진입 화면이다. 현재 작업 범위는 [고도화 명세](./docs/production-hardening-spec.md)에 정한 화면 마감이다. 배포, 데이터 교체, 알고리즘 비용 변경은 현재 범위에 포함되지 않는다. 구현 복잡도와 보고서의 이론 분석을 비교할 때는 [복잡도 메모](../notes/complexity.md)의 구분을 따른다.

## 확정 결정 요약

| 항목 | 결정 |
|---|---|
| 데이터 | MVP = 합성 항성(B) → v1 = 호스트 subset(C) |
| 태양계 | 그래프 데모 제외. 인트로 거리 단위 설명만 |
| 실시간 | 정적 좌표 + 클라이언트 계산. 단계 재생이 “실시간” |
| 화면 | 처음부터 3D (R3F + drei) |
| UI 배지 | 데이터 필: `합성 항성 N · 0.1c · X N ly` (About/푸터에 출처·시드) |
| 3D 모션 | NASA Eyes식 카메라·레이어 UX / Sketchfab는 인트로만. 그래프=점·구·경로선 (궤도 시뮬 제외) |
| 스택 | Vite + React + TypeScript + Zustand |
| 배포 | Vercel 정적 |
| 출발지 | 지구 고정 |
| 기착 | 출발 호스트 기준 (지구 0, 그 외 1년, 목적지 기착 없음) |
| v1 subset | 과제 최단경로(HD 199509) + 경로 주변 이웃 보강 |
| 동률 | 노드 id 오름차순 |

## 과제 본편과의 관계

- 본편 목적지 HD 199509, X=15광년, 0.1c, 기착 1년 정의는 공유합니다.
- subset·합성 데이터의 경로는 본편 수치와 다를 수 있으므로 About·푸터에 출처와 파라미터만 표기합니다.
- 원래 개요의 “태양계 한정 웹”은 교육 스케일 때문에 B→C로 바꿨습니다.

## 확인 순서

고도화 완료 여부는 인트로, 탐색 시작, 반경 질의, 최종 경로 재생, 카메라 수동 조작 후 초기화 상태를 확인한다. 기본 샌드박스와 비용 규칙이 유지되는지도 함께 확인한다. 구체 기준은 [고도화 명세](./docs/production-hardening-spec.md)에 있다.

## 폴더

```
web-demo/
  README.md
  index.html package.json vite.config.ts
  src/           # core, data, store, ui
  scripts/       # 합성 데이터·목업 PDF
  docs/
    interstellar-route-demo-plan.md
    prebuild-handoff.md
    web-demo-mockup-spec-1page.pdf
    mockups/v3/       # 현재 목업
    mockups/archive/  # v1·v2
    mockups/ref/      # Eyes·Sketchfab 참고
```
