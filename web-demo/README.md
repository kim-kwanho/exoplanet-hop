# 웹 시각화 확장 (교육용 인터랙티브 데모)

주제 B 필수 제출물과 별개인 확장입니다. 과제 본편(외계행성 호스트 전체 카탈로그 분석)과 **데이터·결과를 섞어 쓰지 않습니다.**  
상세 설계는 [interstellar-route-demo-plan.md](./interstellar-route-demo-plan.md)를 봅니다.  
Cursor 리셋 후 구현 인수인계(스펙·카피·프롬프트): [prebuild-handoff.md](./prebuild-handoff.md)

## 한 문장

Dijkstra가 별을 확정하고 k-d 트리가 반경 X 이웃을 찾는 과정을 3D에서 단계 재생하는 교육용 웹 데모. 실제 우주선 항법이 아닙니다.

## 확정 결정 요약

| 항목 | 결정 |
|---|---|
| 데이터 | MVP = 합성 항성(B) → v1 = 호스트 subset(C) |
| 태양계 | 그래프 데모 제외. 인트로 거리 단위 설명만 |
| 실시간 | 정적 좌표 + 클라이언트 계산. 단계 재생이 “실시간” |
| 화면 | 처음부터 3D (R3F + drei) |
| 스택 | Vite + React + TypeScript + Zustand |
| 배포 | Vercel 정적 |
| 출발지 | 지구 고정 |
| 기착 | 출발 호스트 기준 (지구 0, 그 외 1년, 목적지 기착 없음) |
| v1 subset | 과제 최단경로(HD 199509) + 경로 주변 이웃 보강 |
| 동률 | 노드 id 오름차순 |

## 과제 본편과의 관계

- 본편 목적지 HD 199509, X=15광년, 0.1c, 기착 1년 정의는 공유합니다.
- 데모 subset·합성 데이터의 경로는 본편 수치와 다를 수 있으므로 UI에 고지합니다.
- 원래 개요의 “태양계 한정 웹”은 교육 스케일 때문에 B→C로 바꿨습니다.

## 구현 순서

1. [prebuild-handoff.md](./prebuild-handoff.md)의 **프롬프트 1** 스캐폴딩
2. **프롬프트 2** 알고리즘 단계 시각화 + 섹션 G 테스트
3. MVP 완료 후 v1 subset
4. PLAN §10 프롬프트 (3) 배포

## 예정 폴더 (스캐폴딩 후)

```
web-demo/
  interstellar-route-demo-plan.md
  README.md
  src/core/      # units, kdtree, dijkstra (순수 TS)
  src/data/      # 정적 JSON
  src/ui/        # 패널, 캔버스, 컨트롤
  src/store/     # Zustand
```
