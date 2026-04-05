export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function runIfMotionAllowed(callback) {
  if (prefersReducedMotion()) return;
  callback();
}
