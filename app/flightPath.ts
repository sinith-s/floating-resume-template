export const LOOP_LENGTH = 600;

type Stop = { z: number; x: number; y: number; focusX: number; focusY: number };
type Waypoint = { phase: number; x: number; y: number };

// Reach each board before its close-up, hold the viewing lane while it passes,
// then travel to the next altitude. The final home segment closes the loop.
export function createFlightPath(stations: Stop[]) {
  const points: Waypoint[] = [{ phase: 0, x: 0, y: .35 }];
  for (const station of stations) {
    const position = { x: station.x - station.focusX, y: station.y - station.focusY };
    points.push({ phase: -station.z - 35, ...position });
    points.push({ phase: -station.z + 8, ...position });
  }
  points.push({ phase: 525, x: 0, y: .35 }, { phase: LOOP_LENGTH, x: 0, y: .35 });

  return (distance: number) => {
    const phase = ((distance % LOOP_LENGTH) + LOOP_LENGTH) % LOOP_LENGTH;
    const next = points.findIndex(point => point.phase > phase);
    const a = points[next - 1];
    const b = points[next];
    const t = (phase - a.phase) / (b.phase - a.phase);
    // Quintic easing gives zero velocity and acceleration at reading stops.
    const ease = t * t * t * (t * (t * 6 - 15) + 10);
    return { x: a.x + (b.x - a.x) * ease, y: a.y + (b.y - a.y) * ease };
  };
}
