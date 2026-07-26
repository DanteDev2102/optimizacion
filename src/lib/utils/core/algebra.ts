import { eigs, identity, add, multiply, norm, subtract, squeeze } from "mathjs";

/**
 * Checks if a matrix is positive definite by examining its eigenvalues.
 */
export function isPositiveDefinite(matrix: number[][]): boolean {
  try {
    const eigRes = eigs(matrix);
    // math.eigs returns { values: [...], vectors: [...] }
    const values = eigRes.values as number[];
    for (const val of values) {
      if (val <= 1e-6) {
        return false; // Not positive definite (or very close to singular)
      }
    }
    return true;
  } catch (e) {
    // If eigs fails, assume it's not PD
    return false;
  }
}

/**
 * Modifies the Hessian to ensure it is positive definite.
 * H_mod = H + tau * I
 */
export function getModifiedHessian(hessian: number[][]): number[][] {
  try {
    const eigRes = eigs(hessian);
    const values = eigRes.values as number[];
    const minEig = Math.min(...values);

    if (minEig > 1e-6) {
      return hessian; // Already PD
    }

    const n = hessian.length;
    const tau = Math.abs(minEig) + 1e-3; // Shift by min eigenvalue + small delta
    const id = identity(n) as number[][];
    const shiftMatrix = multiply(id, tau) as number[][];
    
    return add(hessian, shiftMatrix) as number[][];
  } catch (e) {
    // Fallback if eigs fails, just add a relatively large scalar to diagonal
    const n = hessian.length;
    const id = identity(n) as number[][];
    const shiftMatrix = multiply(id, 1.0) as number[][];
    return add(hessian, shiftMatrix) as number[][];
  }
}

/**
 * Computes vector norm
 */
export function vectorNorm(v: number[]): number {
  const result = norm(v) as unknown;
  return typeof result === "number" ? result : Number(squeeze(result as any));
}
