# EXOPLANET HOP — 성간 도약 경로 3D 웹 앱

주제 B 필수 제출물과 별개인 확장입니다. 과제 본편(외계행성 호스트 전체 카탈로그 분석)과 **데이터·결과를 섞어 쓰지 않습니다.**

## 한 문장

Dijkstra가 별을 확정하고 k-d 트리가 반경 X 이웃을 찾는 과정을 3D에서 단계 재생하는 웹 앱. 실제 우주선 항법이 아닙니다.

## 실행·배포

| 구분 | 주소 / 명령 |
|---|---|
| 라이브 | [https://exoplanet-hop-web.kim-kwanho.workers.dev](https://exoplanet-hop-web.kim-kwanho.workers.dev) |
| 로컬 | `npm install` → `npm run dev` |
| 빌드 | `npm run build` |
| 배포 | `npx wrangler deploy` (Vite `dist/` → Cloudflare Workers Static Assets) |

구현 복잡도와 보고서의 이론 분석을 비교할 때는 [복잡도 메모](../notes/complexity.md)의 구분을 따른다. 과거 기획·목업은 [docs/](./docs/README.md) 아카이브를 본다.

## 확정 결정 요약

| 항목 | 결정 |
|---|---|
| 데이터 | 기본 = 합성 항성 · 선택 프리셋 = 호스트 subset |
| 태양계 | 그래프 데모 제외. 인트로 거리 단위 설명만 |
| 실시간 | 정적 좌표 + 클라이언트 계산. 단계 재생 |
| 화면 | 3D (R3F + drei) |
| 스택 | Vite + React + TypeScript + Zustand |
| 배포 | Cloudflare Workers Static Assets |
| 출발지 | 지구 고정 |
| 기착 | 출발 호스트 기준 (지구 0, 그 외 1년, 목적지 기착 없음) |
| subset | 과제 최단경로(HD 199509) + 경로 주변 이웃 보강 |
| 동률 | 노드 id 오름차순 |

## 과제 본편과의 관계

- 본편 목적지 HD 199509, X=15광년, 0.1c, 기착 1년 정의는 공유합니다.
- 합성 샌드박스 기본값은 X=8광년이며, 본편 수치와 다른 별도 결과입니다.
- subset·합성 데이터의 경로는 About·푸터에 출처와 파라미터만 표기합니다.

## 폴더

```
web-demo/
  README.md
  index.html  package.json  vite.config.ts  wrangler.jsonc
  src/           # core, data, store, ui
  public/        # earth.jpg 등 정적 자산
  scripts/       # 합성·호스트 데이터 생성
  docs/          # 인덱스 + archive/ (기획·목업)
```
