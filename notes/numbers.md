# 숫자

확인된 값만 적는다. 제미나이 본문에서 URL이 추출되지 않은 수는 아래 보류 목록에만 둔다.

## 확인

| 항목 | 값 | 단위 | 확인 날짜 | 출처 |
|---|---|---|---|---|
| `ra`, `dec` | 십진수도 | degree | 2026-11-02 | [PS 열 정의](https://exoplanetarchive.ipac.caltech.edu/docs/API_PS_columns.html) |
| `sy_dist` | 행성계까지 거리 | pc | 2026-11-02 | 같은 문서 |
| `sy_disterr1`, `sy_disterr2` | 거리의 양·음 오차 | pc | 2026-11-02 | 같은 문서 |
| `hostname` | 문헌에서 가장 흔한 호스트 이름 | 문자열 | 2026-11-02 | 같은 문서 |
| `ps` | 행성×논문마다 한 행. `default_flag=1`이면 행성당 기본 한 행 | | 2026-11-02 | 같은 문서 |
| `pscomppars` | 행성당 한 행. 빈칸을 다른 값으로 채울 수 있음 | | 2026-11-02 | 같은 문서 |

## 1단계 집계 (2026-11-02)

표는 `pscomppars`. 쿼리는 `SELECT hostname, pl_name, ra, dec, sy_dist, sy_disterr1, sy_disterr2 FROM pscomppars`. 받은 시각은 2026-11-02 16:17:05 KST. HTTP 200, 555,740바이트.

요청 주소: [TAP sync](https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=SELECT%20hostname%2C%20pl_name%2C%20ra%2C%20dec%2C%20sy_dist%2C%20sy_disterr1%2C%20sy_disterr2%20FROM%20pscomppars&format=csv)

| 항목 | 값 | 단위 | 확인 |
|---|---|---|---|
| 행 수 | 6,451 | 행 | 위 쿼리. `pl_name` 고유 개수도 6,451 |
| 첫 화면 Confirmed Planets | 6,451 | 개 | [첫 화면](https://exoplanetarchive.ipac.caltech.edu/index.html)을 2026-11-02에 받음. 화면이 스스로 적은 날짜는 10/15/2026. 링크는 `ps` 표 |
| `ps`에서 `default_flag=1`인 행 | 6,451 | 행 | 같은 날 `SELECT COUNT(*) AS n FROM ps WHERE default_flag=1` |
| `hostname` 고유 수 | 4,847 | 개 | 위 `pscomppars` 파일 |
| 같은 이름인데 `ra`, `dec`, `sy_dist`가 다른 경우 | 0 | 건 | 이 파일에서만 확인. 평균 내지 않음 |
| `sy_dist`가 빈 호스트 | 28 | 개 | 아래 목록. 4,847 − 28 = 4,819 |
| 거리가 있는 호스트 수 | 4,819 | 개 | 과제에서 별 노드로 쓰는 수. 지구는 이 수에 없음 |
| 가장 가까운 호스트 | Proxima Cen, 1.30119000 | pc | `ra` 217.3934657 degree, `dec` −62.6761821 degree. `sy_disterr1` 0.00034000 pc, `sy_disterr2` −0.00035000 pc. 이 이름의 행성 행은 Proxima Cen b, Proxima Cen d |

거리가 비어 빠져 나간 28개 호스트: 2MASS J11011926-7732383, CD-35 2722 B, CFHTWIR-Oph 98 A, G 268-110, Kepler-1676, Kepler-1737, Kepler-1756, Kepler-1760, Kepler-1795, Kepler-1813, Kepler-1855, Kepler-1910, Kepler-1945, Kepler-1964, Kepler-1984, Kepler-1985, Luhman 16 A, M62H, MXB 1658-298, OGLE-2016-BLG-1227L, OGLE-2017-BLG-1140L, PSR B1620-26, SPECULOOS-3, TOI-2977, TOI-3540 A, V2376 Ori, WISE J033605.05-014350.4, mu2 Sco.

제미나이 창에는 Pro 높음으로 같은 집계를 보냈으나, 답이 끝나기 전에 화면이 잠겼다. 위의 수는 제미나이 문장이 아니라 위 TAP 응답이다.

## 보류 (보고서에는 있으나 이 추출본에 URL이 없음)

| 항목 | 보고서의 값 | 이유 |
|---|---|---|
| 확인 행성 수 | 6,445 | 기준일 2026-10-08이라고만 적힘. 페이지 URL 없음 |
| 호스트 수 | 4,834~4,842 | 같은 이유. 이후 계산은 이 값을 확정 N으로 쓰지 않음 |
| 프록시마 센타우리 거리 | 1.30 pc, 약 4.24 ly | 아카이브 행 출처 없음 |
| 50 pc 이내 인접 항성계 | 약 359, 시선속도 행성의 2/3 | 문헌 URL 없음 |
| 성간 통신 네트워크 논문 | 제목 "A. Interstellar Dynamics..." | 제목이 잘렸고 URL 없음 |

## 보고서의 계산 오류

N을 4,842로 두면 최대 간선 수는 4,842×4,841/2 = 11,720,061이다. 보고서는 11,720,403으로 적었다. N 자체가 보류이므로 이 곱은 과제 숫자로 쓰지 않는다.
