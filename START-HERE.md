# 과제 현재 상태

## 현재 위치

- 보고서 0~6장 초안과 그림이 작성되어 있다. 최종 PDF 편집과 표지(학번/이름/분반)는 남아 있다.
- 3D 웹 데모는 구현·배포되어 있다.
  - 라이브: [https://exoplanet-hop-web.kim-kwanho.workers.dev](https://exoplanet-hop-web.kim-kwanho.workers.dev)
  - 보고서 §6에 동일 URL을 적었다.
- 합성 데이터 샌드박스(기본, `X=8 ly`)와 실측 호스트 프리셋(`X=15 ly`)을 구분해 설명한다.

## 먼저 처리할 일

1. [최종 보고서](report/final-report.md) 표지 정보를 채운다.
2. 제출용 PDF를 편집한다. 발표에서는 합성 데모와 실측 카탈로그 분석을 별도 결과로 말한다.
3. 복잡도 가정은 [복잡도 메모](notes/complexity.md)와 보고서 이론 의사코드를 기준으로 하고, 웹 데모 구현(`Θ(N log² N)` 구축 등)과 혼동하지 않는다.

## 주요 자료

- 보고서: `report/final-report.md`
- 숫자와 출처: `notes/numbers.md`
- 연결망·최단 경로: `notes/graph_15ly.md`
- 복잡도 분석: `notes/complexity.md`
- 카탈로그 재현 스크립트: `scripts/analyze_catalog.py`
- 웹 데모: `web-demo/` · 과거 고도화 명세: `web-demo/docs/archive/production-hardening-spec.md`
