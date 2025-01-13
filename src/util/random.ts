import RNG from "@gouvernathor/rng";

export function generateSeed(rng = new RNG()) {
    return Array.from({ length: 22 },
      () => rng.randRange(36).toString(36)
    ).join('');
  }
