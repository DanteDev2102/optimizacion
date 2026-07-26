import { add, multiply } from "mathjs";

export type LineSearchMethod = "backtracking" | "zoom";

/**
 * Line search using Armijo and optional Strong Wolfe conditions.
 * Supports classic backtracking and a zoom/interpolation-based search.
 */
export function backtrackingLineSearch(
  f: (x: number[]) => number,
  gradF: (x: number[]) => number[],
  xk: number[],
  pk: number[],
  alphaInit: number = 1.0,
  c1: number = 1e-4,
  c2: number = 0.9,
  rho: number = 0.5,
  useWolfe: boolean = false,
  lineSearchMethod: LineSearchMethod = "backtracking",
  maxIters: number = 50,
  maxZoomIters: number = 50
): { alpha: number; functionEvaluations: number } {
  const dot = (a: number[], b: number[]) => {
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result += a[i] * b[i];
    }
    return result;
  };

  const phi0 = f(xk);
  const gk = gradF(xk);
  const derPhi0 = dot(gk, pk);

  let funcEvals = 1;
  if (derPhi0 >= 0) {
    return { alpha: 0, functionEvaluations: funcEvals };
  }

  const makePoint = (alpha: number) => {
    const step = multiply(pk, alpha);
    const xNext = add(xk, step) as number[];
    const fxNext = f(xNext);
    funcEvals++;
    const gradNext = gradF(xNext);
    const deriv = dot(gradNext, pk);
    return { xNext, fxNext, deriv };
  };

  const armijoSatisfied = (fxNext: number, alpha: number) =>
    fxNext <= phi0 + c1 * alpha * derPhi0;

  const strongWolfeSatisfied = (deriv: number) =>
    Math.abs(deriv) <= -c2 * derPhi0;

  const cubicInterpolation = (
    alphaLo: number,
    alphaHi: number,
    phiLo: number,
    phiHi: number,
    derPhiLo: number,
    derPhiHi: number
  ) => {
    const delta = alphaHi - alphaLo;
    if (delta === 0) {
      return alphaLo;
    }

    const mid = alphaLo + delta * 0.5;
    const d1 =
      derPhiLo + derPhiHi - 3 * ((phiLo - phiHi) / delta);
    const d2sq = d1 * d1 - derPhiLo * derPhiHi;
    if (!isFinite(d1) || d2sq < 0) {
      return mid;
    }

    const d2 = Math.sqrt(d2sq);
    const alpha =
      alphaHi -
      (delta * (derPhiHi + d2 - d1)) /
        (derPhiHi - derPhiLo + 2 * d2);

    if (
      !isFinite(alpha) ||
      alpha <= Math.min(alphaLo, alphaHi) ||
      alpha >= Math.max(alphaLo, alphaHi)
    ) {
      return mid;
    }

    return alpha;
  };

  const zoom = (
    alphaLo: number,
    alphaHi: number,
    phiLo: number,
    derPhiLo: number,
    phiHi: number
  ) => {
    let aLo = alphaLo;
    let aHi = alphaHi;
    let phiAlo = phiLo;
    let derPhiAlo = derPhiLo;
    let phiAhi = phiHi;
    let derPhiAhi = 0;

    if (aHi !== 0) {
      const hiPoint = makePoint(aHi);
      phiAhi = hiPoint.fxNext;
      derPhiAhi = hiPoint.deriv;
    }

    for (let i = 0; i < maxZoomIters; i++) {
      const alpha = cubicInterpolation(
        aLo,
        aHi,
        phiAlo,
        phiAhi,
        derPhiAlo,
        derPhiAhi
      );

      const point = makePoint(alpha);
      const phi = point.fxNext;
      const derPhi = point.deriv;

      if (
        phi > phi0 + c1 * alpha * derPhi0 ||
        phi >= phiAlo
      ) {
        aHi = alpha;
        phiAhi = phi;
        derPhiAhi = derPhi;
      } else {
        if (strongWolfeSatisfied(derPhi)) {
          return alpha;
        }
        if (derPhi * (aHi - aLo) >= 0) {
          aHi = aLo;
          phiAhi = phiAlo;
          derPhiAhi = derPhiAlo;
        }
        aLo = alpha;
        phiAlo = phi;
        derPhiAlo = derPhi;
      }
    }

    return (aLo + aHi) * 0.5;
  };

  if (lineSearchMethod === "zoom" && useWolfe) {
    let alphaPrev = 0;
    let phiPrev = phi0;
    let alpha = alphaInit;

    for (let i = 0; i < maxIters; i++) {
      const point = makePoint(alpha);
      const phi = point.fxNext;
      const derPhi = point.deriv;

      if (
        phi > phi0 + c1 * alpha * derPhi0 ||
        (i > 0 && phi >= phiPrev)
      ) {
        const alphaZoom = zoom(alphaPrev, alpha, phiPrev, derPhi0, phi);
        return { alpha: alphaZoom, functionEvaluations: funcEvals };
      }

      if (strongWolfeSatisfied(derPhi)) {
        return { alpha, functionEvaluations: funcEvals };
      }

      if (derPhi >= 0) {
        const alphaZoom = zoom(alpha, alphaPrev, phi, derPhi, phiPrev);
        return { alpha: alphaZoom, functionEvaluations: funcEvals };
      }

      alphaPrev = alpha;
      phiPrev = phi;
      alpha = Math.max(alpha * 2, alpha + 0.1);
    }

    return { alpha: alphaInit, functionEvaluations: funcEvals };
  }

  let alpha = alphaInit;
  for (let i = 0; i < maxIters; i++) {
    const point = makePoint(alpha);
    if (!armijoSatisfied(point.fxNext, alpha)) {
      alpha *= rho;
      continue;
    }
    if (useWolfe && !strongWolfeSatisfied(point.deriv)) {
      alpha *= rho;
      continue;
    }
    return { alpha, functionEvaluations: funcEvals };
  }

  return { alpha: alphaInit, functionEvaluations: funcEvals };
}

export const lineSearch = backtrackingLineSearch;
