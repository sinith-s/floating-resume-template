// Exact critically damped spring: continuous velocity, no oscillation, and
// identical settling at different frame rates for a stationary target.
export function glideStep(position: number, velocity: number, target: number, delta: number) {
  const dt = Math.min(Math.max(delta, 0), .05);
  const rate = 5;
  const offset = position - target;
  const impulse = velocity + rate * offset;
  const decay = Math.exp(-rate * dt);
  return {
    position: target + (offset + impulse * dt) * decay,
    velocity: (velocity - rate * impulse * dt) * decay,
  };
}

export function wheelTravel(delta: number, mode: number, viewportHeight: number) {
  const pixels = delta * (mode === 1 ? 16 : mode === 2 ? viewportHeight : 1);
  return 160 * Math.tanh(pixels / 160) * .075;
}
