"""시드 42 합성 항성 100개. 백본 간격 6.2 ly, 나머지 최소 간격 4.5 ly."""
import json
import random
from pathlib import Path

SEED = 42
COUNT = 100
STEP = 6.2
MIN_GAP = 4.5
rng = random.Random(SEED)


def dist(a, b):
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) ** 0.5


bodies = [{
    "id": "earth_sol",
    "name": "지구",
    "pos": [0.0, 0.0, 0.0],
    "kind": "earth",
    "datasetId": "synthetic-42",
}]

pos = [0.0, 0.0, 0.0]
for i in range(1, 8):
    pos = [
        round(pos[0] + STEP, 4),
        round(pos[1] + rng.uniform(-1.0, 1.0), 4),
        round(pos[2] + rng.uniform(-1.0, 1.0), 4),
    ]
    bodies.append({
        "id": f"s{i:03d}",
        "name": f"S{i:03d}",
        "pos": pos,
        "kind": "synthetic",
        "datasetId": "synthetic-42",
    })

dest_pos = [
    round(pos[0] + STEP, 4),
    round(pos[1] + rng.uniform(-1.0, 1.0), 4),
    round(pos[2] + rng.uniform(-1.0, 1.0), 4),
]
bodies.append({
    "id": "dest_a",
    "name": "Dest-A",
    "pos": dest_pos,
    "kind": "synthetic",
    "datasetId": "synthetic-42",
})

n = 9
guard = 0
while len(bodies) < COUNT and guard < 200000:
    guard += 1
    p = [
        round(rng.uniform(-12, dest_pos[0] + 12), 4),
        round(rng.uniform(-24, 24), 4),
        round(rng.uniform(-24, 24), 4),
    ]
    if any(dist(p, b["pos"]) < MIN_GAP for b in bodies):
        continue
    n += 1
    bodies.append({
        "id": f"s{n:03d}",
        "name": f"S{n:03d}",
        "pos": p,
        "kind": "synthetic",
        "datasetId": "synthetic-42",
    })

if len(bodies) != COUNT:
    raise SystemExit(f"only {len(bodies)} stars")

xs = [b["pos"][0] for b in bodies]
ys = [b["pos"][1] for b in bodies]
zs = [b["pos"][2] for b in bodies]
doc = {
    "metadata": {
        "name": "합성 항성 (시드 42)",
        "source": "synthetic",
        "retrievedAt": "2026-11-08",
        "citation": "절차적 생성. 실측 카탈로그가 아닙니다.",
        "frame": "local_cartesian",
        "unit": "ly",
        "isSynthetic": True,
        "seed": SEED,
        "starCount": COUNT,
        "bounds": {
            "min": [min(xs), min(ys), min(zs)],
            "max": [max(xs), max(ys), max(zs)],
        },
    },
    "scenario": {
        "datasetId": "synthetic-42",
        "startId": "earth_sol",
        "destId": "dest_a",
        "X": 8.0,
        "speedC": 0.1,
        "stopYr": 1.0,
    },
    "bodies": bodies,
}

out = Path(__file__).resolve().parents[1] / "src" / "data" / "synthetic-stars.json"
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
print(out, "stars", len(bodies))
