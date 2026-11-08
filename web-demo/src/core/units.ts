export type Vec3 = [number, number, number]

export const PC_TO_LY = 3.261563777

export function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
}

export function travelYears(distLy: number, speedC: number): number {
  return distLy / speedC
}

export function pcToLy(pc: number): number {
  return pc * PC_TO_LY
}
