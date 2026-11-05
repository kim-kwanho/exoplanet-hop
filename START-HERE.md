# 과제 현재 상태

## 진행 완료: 보고서 0~5장

주제 배경과 가설, 현실-그래프 대응 및 가정, 두 경로 탐색 방식 비교, 기본·결합 의사코드, 시간·공간복잡도, 실제 카탈로그 대입, 6단계 동작 그림을 [최종 보고서](report/final-report.md)에 정리했다.

비교 대상은 (1) 가능한 별 간선을 모두 먼저 구성하는 방식과 (2) k-d 트리 반경 질의로 이웃을 늦게 찾는 방식이다. 둘 다 같은 최단 시간 문제를 푼다.

## 확정한 모형

- 데이터: NASA Exoplanet Archive `pscomppars`, 2026-11-05
- `N=4,819` (좌표·거리 누락 28개 제외)
- `X=15 ly`, `0.1c`, 출발 호스트 기착 `1년` (지구·목적지 제외)
- 목적지: 지구 연결 성분에서 가장 먼 `HD 199509`
- 기준 그래프: 간선 585, 초기 이웃 17, 도달 가능 132
- 최단 경로: 호스트 12곳, 모형 총시간 약 `1,509.5325년`

## 해석 범위

경로 수치는 명시적으로 구성한 기준 그래프에서 계산했다. 결합 의사코드의 k-d 트리 구현·실행시간 측정은 하지 않았으므로, k-d 성능 우위를 실험으로 입증했다고 쓰지 않는다.

## 주요 경로

| 용도 | 경로 |
|---|---|
| 보고서 본문 | `report/final-report.md` |
| 단계 다이어그램 | `report/diagrams/diagram-step-*.png` |
| 방식 비교 그림 | `report/diagrams/algorithm-comparison.svg` |
| 수치·출처 | `notes/numbers.md` |
| 연결망·경로 | `notes/graph_15ly.md` |
| 복잡도 메모 | `notes/complexity.md` |
| 재현 스크립트 | `scripts/analyze_catalog.py` |
| 원본 스냅샷 | `data/raw/pscomppars_2026-11-05.csv` |
| 웹 데모 plan | `web-demo/interstellar-route-demo-plan.md` |

남은 일: 보고서 6장(웹)·최종 PDF 편집, `web-demo` MVP 구현.
