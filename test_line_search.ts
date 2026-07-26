import assert from "assert";
import { backtrackingLineSearch } from "./src/lib/utils/algorithms/LineSearch.ts";

const c1 = 1e-4;
const c2 = 0.9;
const rho = 0.5;
const maxIters = 50;
const maxZoomIters = 50;

function approxEqual(value: number, expected: number, tol = 1e-6) {
  return Math.abs(value - expected) <= tol;
}

function quadraticTest() {
  const f = (x: number[]) => {
    const dx = x[0] - 1;
    return dx * dx;
  };
  const grad = (x: number[]) => [2 * (x[0] - 1)];

  const x0 = [0];
  const g0 = grad(x0);
  const p = [ -g0[0] ];
  const derPhi0 = g0[0] * p[0];

  const result = backtrackingLineSearch(
    f,
    grad,
    x0,
    p,
    1.0,
    c1,
    c2,
    rho,
    true,
    "zoom",
    maxIters,
    maxZoomIters
  );

  const alpha = result.alpha;
  const xNew = [x0[0] + alpha * p[0]];
  const phi0 = f(x0);
  const phiNew = f(xNew);
  const derPhiNew = grad(xNew)[0] * p[0];

  assert(alpha > 0, "Alpha must be positive");
  assert(approxEqual(alpha, 0.5, 1e-5), `Expected alpha approximately 0.5, got ${alpha}`);
  assert(phiNew < phi0, "Objective must decrease");
  assert(
    phiNew <= phi0 + c1 * alpha * derPhi0,
    "Armijo condition should hold"
  );
  assert(
    Math.abs(derPhiNew) <= -c2 * derPhi0,
    "Strong Wolfe curvature condition should hold"
  );
  console.log("quadraticTest passed: alpha=", alpha.toFixed(8));
}

function rosenbrockTest() {
  const f = (x: number[]) => {
    const [x1, x2] = x;
    return 100 * (x2 - x1 * x1) ** 2 + (1 - x1) ** 2;
  };
  const grad = (x: number[]) => {
    const [x1, x2] = x;
    return [
      -400 * x1 * (x2 - x1 * x1) - 2 * (1 - x1),
      200 * (x2 - x1 * x1),
    ];
  };

  const x0 = [-1.2, 1.0];
  const g0 = grad(x0);
  const p = g0.map((v) => -v);
  const derPhi0 = g0[0] * p[0] + g0[1] * p[1];

  const result = backtrackingLineSearch(
    f,
    grad,
    x0,
    p,
    1.0,
    c1,
    c2,
    rho,
    true,
    "zoom",
    maxIters,
    maxZoomIters
  );

  const alpha = result.alpha;
  const xNew = [x0[0] + alpha * p[0], x0[1] + alpha * p[1]];
  const phi0 = f(x0);
  const phiNew = f(xNew);
  const derPhiNew = grad(xNew)[0] * p[0] + grad(xNew)[1] * p[1];

  assert(alpha > 0, "Alpha must be positive");
  assert(phiNew < phi0, "Objective must decrease");
  assert(
    phiNew <= phi0 + c1 * alpha * derPhi0,
    "Armijo condition should hold"
  );
  assert(
    Math.abs(derPhiNew) <= -c2 * derPhi0,
    "Strong Wolfe curvature condition should hold"
  );
  console.log("rosenbrockTest passed: alpha=", alpha.toFixed(8));
}

function convexQuadratic2DTest() {
  const f = (x: number[]) => 0.5 * (x[0] ** 2 + x[1] ** 2);
  const grad = (x: number[]) => [x[0], x[1]];

  const x0 = [1.0, 2.0];
  const g0 = grad(x0);
  const p = g0.map((v) => -v);
  const derPhi0 = g0[0] * p[0] + g0[1] * p[1];

  const result = backtrackingLineSearch(
    f,
    grad,
    x0,
    p,
    1.0,
    c1,
    c2,
    rho,
    true,
    "zoom",
    maxIters,
    maxZoomIters
  );

  const alpha = result.alpha;
  const xNew = [x0[0] + alpha * p[0], x0[1] + alpha * p[1]];
  const phi0 = f(x0);
  const phiNew = f(xNew);
  const derPhiNew = grad(xNew)[0] * p[0] + grad(xNew)[1] * p[1];

  assert(alpha > 0, "Alpha must be positive");
  assert(approxEqual(alpha, 1.0, 1e-5), `Expected alpha approximately 1.0, got ${alpha}`);
  assert(phiNew < phi0, "Objective must decrease");
  assert(
    phiNew <= phi0 + c1 * alpha * derPhi0,
    "Armijo condition should hold"
  );
  assert(
    Math.abs(derPhiNew) <= -c2 * derPhi0,
    "Strong Wolfe curvature condition should hold"
  );
  console.log("convexQuadratic2DTest passed: alpha=", alpha.toFixed(8));
}

function himmelblauTest() {
  const f = (x: number[]) => {
    const [x1, x2] = x;
    return (x1 * x1 + x2 - 11) ** 2 + (x1 + x2 * x2 - 7) ** 2;
  };
  const grad = (x: number[]) => {
    const [x1, x2] = x;
    const a = x1 * x1 + x2 - 11;
    const b = x1 + x2 * x2 - 7;
    return [2 * a * x1 + 2 * b, 2 * a + 4 * b * x2];
  };

  const x0 = [-0.5, 1.5];
  const g0 = grad(x0);
  const p = g0.map((v) => -v);
  const derPhi0 = g0[0] * p[0] + g0[1] * p[1];

  const result = backtrackingLineSearch(
    f,
    grad,
    x0,
    p,
    1.0,
    c1,
    c2,
    rho,
    true,
    "zoom",
    maxIters,
    maxZoomIters
  );

  const alpha = result.alpha;
  const xNew = [x0[0] + alpha * p[0], x0[1] + alpha * p[1]];
  const phi0 = f(x0);
  const phiNew = f(xNew);
  const derPhiNew = grad(xNew)[0] * p[0] + grad(xNew)[1] * p[1];

  assert(alpha > 0, "Alpha must be positive");
  assert(phiNew < phi0, "Objective must decrease");
  assert(
    phiNew <= phi0 + c1 * alpha * derPhi0,
    "Armijo condition should hold"
  );
  assert(
    Math.abs(derPhiNew) <= -c2 * derPhi0,
    "Strong Wolfe curvature condition should hold"
  );
  console.log("himmelblauTest passed: alpha=", alpha.toFixed(8));
}

function runAll() {
  quadraticTest();
  rosenbrockTest();
  convexQuadratic2DTest();
  himmelblauTest();
  console.log("All line-search tests passed.");
}

runAll();
