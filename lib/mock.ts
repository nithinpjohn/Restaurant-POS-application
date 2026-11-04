// Simulates network latency until a real backend exists.
export const delay = (ms = 700) => new Promise<void>((r) => setTimeout(r, ms))
