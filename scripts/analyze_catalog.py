"""Prepare NASA PSCompPars host coordinates and measure the X=15 ly graph.

Uses only Python's standard library. Run from the repository root:
    python scripts/analyze_catalog.py
"""

from __future__ import annotations

import csv
import heapq
import json
import math
from collections import defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data" / "raw" / "pscomppars_2026-11-05.csv"
OUT = ROOT / "data" / "processed"
PC_TO_LY = 3.2615637771674333
MAX_HOP_LY = 15.0
CRUISE_SPEED_C = 0.1  # c = 1 light-year per Julian year
STOP_YEARS = 1.0


def number(value: str | None) -> float | None:
    if value is None or not value.strip():
        return None
    try:
        result = float(value)
    except ValueError:
        return None
    return result if math.isfinite(result) else None


def read_hosts() -> tuple[list[dict], dict]:
    grouped: dict[str, list[dict]] = defaultdict(list)
    rows = 0
    with SOURCE.open("r", encoding="utf-8-sig", newline="") as stream:
        reader = csv.DictReader(stream)
        required = {"hostname", "pl_name", "ra", "dec", "sy_dist", "sy_disterr1", "sy_disterr2"}
        missing_columns = required - set(reader.fieldnames or [])
        if missing_columns:
            raise ValueError(f"CSV missing expected columns: {sorted(missing_columns)}")
        for row in reader:
            rows += 1
            host = (row.get("hostname") or "").strip()
            if host:
                grouped[host].append(row)

    inconsistent = []
    missing_location = []
    hosts = []
    for host, records in grouped.items():
        signatures = {
            (r.get("ra", "").strip(), r.get("dec", "").strip(), r.get("sy_dist", "").strip())
            for r in records
        }
        if len(signatures) > 1:
            inconsistent.append({"hostname": host, "values": sorted(signatures)})
            continue
        ra = number(records[0].get("ra"))
        dec = number(records[0].get("dec"))
        dist_pc = number(records[0].get("sy_dist"))
        if ra is None or dec is None or dist_pc is None or dist_pc < 0:
            missing_location.append(host)
            continue
        ra_rad = math.radians(ra)
        dec_rad = math.radians(dec)
        dist_ly = dist_pc * PC_TO_LY
        cos_dec = math.cos(dec_rad)
        hosts.append({
            "hostname": host,
            "pl_name_example": records[0].get("pl_name", ""),
            "ra_deg": ra,
            "dec_deg": dec,
            "sy_dist_pc": dist_pc,
            "sy_disterr1_pc": number(records[0].get("sy_disterr1")),
            "sy_disterr2_pc": number(records[0].get("sy_disterr2")),
            "x_ly": dist_ly * cos_dec * math.cos(ra_rad),
            "y_ly": dist_ly * cos_dec * math.sin(ra_rad),
            "z_ly": dist_ly * math.sin(dec_rad),
            "distance_earth_ly": dist_ly,
            "planet_rows": len(records),
        })
    if inconsistent:
        sample = json.dumps(inconsistent[:10], ensure_ascii=False)
        raise ValueError(f"Host coordinates/distances conflict; do not average. Examples: {sample}")
    hosts.sort(key=lambda item: item["hostname"])
    return hosts, {
        "source_rows": rows,
        "unique_hosts": len(grouped),
        "missing_location_hosts": sorted(missing_location),
        "valid_hosts": len(hosts),
    }


def build_graph(hosts: list[dict]):
    cell_width = MAX_HOP_LY
    buckets: dict[tuple[int, int, int], list[int]] = defaultdict(list)
    adjacency: list[list[tuple[int, float]]] = [[] for _ in hosts]
    edges = []
    for i, star in enumerate(hosts):
        cell = tuple(math.floor(star[axis] / cell_width) for axis in ("x_ly", "y_ly", "z_ly"))
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                for dz in (-1, 0, 1):
                    neighbor_cell = (cell[0] + dx, cell[1] + dy, cell[2] + dz)
                    for j in buckets.get(neighbor_cell, ()):
                        other = hosts[j]
                        ddx = star["x_ly"] - other["x_ly"]
                        ddy = star["y_ly"] - other["y_ly"]
                        ddz = star["z_ly"] - other["z_ly"]
                        distance = math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz)
                        if distance <= MAX_HOP_LY:
                            adjacency[i].append((j, distance))
                            adjacency[j].append((i, distance))
                            edges.append((i, j, distance))
        buckets[cell].append(i)
    earth_neighbors = [i for i, star in enumerate(hosts) if star["distance_earth_ly"] <= MAX_HOP_LY]
    return adjacency, edges, earth_neighbors


def summarize(hosts: list[dict], counts: dict) -> dict:
    adjacency, edges, earth_neighbors = build_graph(hosts)
    seen = set(earth_neighbors)
    queue = deque(earth_neighbors)
    while queue:
        u = queue.popleft()
        for v, _ in adjacency[u]:
            if v not in seen:
                seen.add(v)
                queue.append(v)

    distances = [math.inf] * len(hosts)
    previous: list[int | None] = [None] * len(hosts)
    heap = []
    for i in earth_neighbors:
        travel = hosts[i]["distance_earth_ly"] / CRUISE_SPEED_C
        distances[i] = travel
        heapq.heappush(heap, (travel, i))
    settled = set()
    while heap:
        cost, u = heapq.heappop(heap)
        if cost != distances[u] or u in settled:
            continue
        settled.add(u)
        # Leaving a host star incurs its one-year stopover; Earth has no stopover.
        for v, distance in adjacency[u]:
            proposal = cost + distance / CRUISE_SPEED_C + STOP_YEARS
            if proposal < distances[v]:
                distances[v] = proposal
                previous[v] = u
                heapq.heappush(heap, (proposal, v))

    farthest_idx = max(seen, key=lambda i: hosts[i]["distance_earth_ly"]) if seen else None
    farthest_route = []
    if farthest_idx is not None:
        cursor: int | None = farthest_idx
        while cursor is not None:
            farthest_route.append(cursor)
            cursor = previous[cursor]
        farthest_route.reverse()

    route_legs = []
    route_distance = 0.0
    route_stopovers = 0
    if farthest_route:
        first = farthest_route[0]
        distance = hosts[first]["distance_earth_ly"]
        route_distance += distance
        route_legs.append({
            "from": "Earth",
            "to": hosts[first]["hostname"],
            "distance_ly": distance,
            "cruise_time_years": distance / CRUISE_SPEED_C,
            "stopover_at_departure_years": 0.0,
        })
        for u, v in zip(farthest_route, farthest_route[1:]):
            a, b = hosts[u], hosts[v]
            dx, dy, dz = a["x_ly"] - b["x_ly"], a["y_ly"] - b["y_ly"], a["z_ly"] - b["z_ly"]
            distance = math.sqrt(dx * dx + dy * dy + dz * dz)
            route_distance += distance
            route_stopovers += 1
            route_legs.append({
                "from": a["hostname"],
                "to": b["hostname"],
                "distance_ly": distance,
                "cruise_time_years": distance / CRUISE_SPEED_C,
                "stopover_at_departure_years": STOP_YEARS,
            })

    minimum_star_distance = min((s["distance_earth_ly"] for s in hosts), default=None)
    pairs_upper = len(hosts) * (len(hosts) - 1) // 2
    return {
        **counts,
        "query_date_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "max_hop_ly": MAX_HOP_LY,
        "cruise_speed_c": CRUISE_SPEED_C,
        "stopover_years": STOP_YEARS,
        "pc_to_ly": PC_TO_LY,
        "host_pair_distance_checks_upper_bound": pairs_upper,
        "feasible_host_host_edges": len(edges),
        "feasible_edges_inside_earth_component": sum(1 for i, j, _ in edges if i in seen and j in seen),
        "earth_initial_neighbors": len(earth_neighbors),
        "earth_initial_neighbor_names": [hosts[i]["hostname"] for i in earth_neighbors],
        "reachable_host_count_from_earth": len(seen),
        "reachable_fraction_of_valid_hosts": len(seen) / len(hosts) if hosts else 0,
        "farthest_reachable_host": hosts[farthest_idx]["hostname"] if farthest_idx is not None else None,
        "farthest_reachable_distance_from_earth_ly": hosts[farthest_idx]["distance_earth_ly"] if farthest_idx is not None else None,
        "farthest_reachable_shortest_time_years": distances[farthest_idx] if farthest_idx is not None else None,
        "farthest_reachable_shortest_route": [hosts[i]["hostname"] for i in farthest_route],
        "farthest_reachable_shortest_route_host_stopovers": max(0, len(farthest_route) - 1),
        "farthest_reachable_shortest_route_total_distance_ly": route_distance,
        "farthest_reachable_shortest_route_cruise_time_years": route_distance / CRUISE_SPEED_C if farthest_route else None,
        "farthest_reachable_shortest_route_stopover_years": route_stopovers * STOP_YEARS,
        "farthest_reachable_shortest_route_legs": route_legs,
        "closest_valid_host": hosts[min(range(len(hosts)), key=lambda i: hosts[i]["distance_earth_ly"])] ["hostname"] if hosts else None,
        "closest_valid_host_distance_ly": minimum_star_distance,
        "unreachable_destination_policy": "Do not report a shortest path if the chosen target is outside the Earth-reachable component.",
    }, adjacency, edges


def write_csv(path: Path, rows: list[dict], fields: list[str]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(f"Expected downloaded source CSV at {SOURCE}")
    OUT.mkdir(parents=True, exist_ok=True)
    hosts, counts = read_hosts()
    summary, _, edges = summarize(hosts, counts)
    write_csv(OUT / "host_coordinates.csv", hosts, list(hosts[0].keys()))
    edge_rows = [{
        "host_a": hosts[i]["hostname"],
        "host_b": hosts[j]["hostname"],
        "distance_ly": f"{distance:.9f}",
        "cruise_time_years": f"{distance / CRUISE_SPEED_C:.9f}",
    } for i, j, distance in edges]
    write_csv(OUT / "feasible_edges_x15ly.csv", edge_rows, ["host_a", "host_b", "distance_ly", "cruise_time_years"])
    (OUT / "summary_x15ly.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    route_rows = summary["farthest_reachable_shortest_route_legs"]
    if route_rows:
        write_csv(OUT / "farthest_reachable_route.csv", route_rows, [
            "from", "to", "distance_ly", "cruise_time_years", "stopover_at_departure_years"
        ])
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
