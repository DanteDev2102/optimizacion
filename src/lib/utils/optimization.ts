import { ComputeEngine } from "@cortex-js/compute-engine";
import { matrix, multiply, add, subtract, norm, inv, squeeze } from "mathjs";

const ce = new ComputeEngine();

export interface IterationResult {
  iteration: number;
  xk: number[];
  grad: number[];
  hessian?: number[][];
  pk: number[];
  stepSize: number;
  xkNext: number[];
  normGrad: number;
}

// Helper to extract variables x1, x2, ... from a point vector
function getContext(xk: number[]): Record<string, number> {
  const context: Record<string, number> = {};
  xk.forEach((val, i) => {
    context[`x_${i + 1}`] = val;      // e.g. x_1
    context[`x_{${i + 1}}`] = val;    // e.g. x_{1}
    context[`x${i + 1}`] = val;       // e.g. x1
  });
  return context;
}

// Parse a latex string that represents a vector (e.g. "x_1+2, x_2-1" or "\begin{bmatrix} ... \end{bmatrix}")
// and evaluate it at xk
function evaluateVector(latex: string, xk: number[]): number[] {
  const ctx = getContext(xk);

  if (latex.includes('\\begin{bmatrix}') || latex.includes('\\begin{pmatrix}')) {
    const content = latex.match(/\\begin{[bp]matrix}([\s\S]*?)\\end{[bp]matrix}/)?.[1] || '';
    const items = content.includes('\\\\') ? content.split('\\\\') : content.split('&');
    return items.filter(item => item.trim() !== '').map(item => {
      const e = ce.parse(item.trim());
      const val = e.subs(ctx).evaluate();
      return Number(val.valueOf() ?? 0);
    });
  }

  // Fallback: comma separated
  const parts = latex.split(',').map(s => s.trim());
  return parts.filter(p => p !== '').map(part => {
    const e = ce.parse(part);
    const val = e.subs(ctx).evaluate();
    return Number(val.valueOf() ?? 0);
  });
}

function evaluateMatrix(latex: string, xk: number[]): number[][] {
  const ctx = getContext(xk);

  if (latex.includes('\\begin{bmatrix}') || latex.includes('\\begin{pmatrix}')) {
    const content = latex.match(/\\begin{[bp]matrix}([\s\S]*?)\\end{[bp]matrix}/)?.[1] || '';
    const rows = content.split('\\\\').filter(r => r.trim() !== '');
    return rows.map(row => {
      const cols = row.split('&').filter(c => c.trim() !== '');
      return cols.map(col => {
        const e = ce.parse(col.trim());
        const val = e.subs(ctx).evaluate();
        return Number(val.valueOf() ?? 0);
      });
    });
  }

  return [];
}

// Parse initial point, no context needed since it's just numbers
export function parseInitialPoint(latex: string): number[] {
  if (latex.includes('\\begin{bmatrix}') || latex.includes('\\begin{pmatrix}')) {
    const content = latex.match(/\\begin{[bp]matrix}([\s\S]*?)\\end{[bp]matrix}/)?.[1] || '';
    const items = content.includes('\\\\') ? content.split('\\\\') : content.split('&');
    return items.filter(item => item.trim() !== '').map(item => {
      const e = ce.parse(item.trim());
      const val = e.evaluate();
      return Number(val.valueOf() ?? 0);
    });
  }

  // Fallback for comma separated rows or 1D matrix
  const clean = latex.replace(/\\left\[/g, '').replace(/\\right\]/g, '').replace(/\\begin{[bp]matrix}/, '').replace(/\\end{[bp]matrix}/, '').replace(/\\\\/, ',');
  const parts = clean.split(',').map(s => s.trim());
  return parts.filter(p => p !== '').map(part => {
    const e = ce.parse(part);
    const val = e.evaluate();
    return Number(val.valueOf() ?? 0);
  });
}

export function gradientDescent(
  x0Latex: string,
  gradLatex: string,
  tol: number,
  stepSize: number,
  maxIter: number = 100,
): IterationResult[] {
  const iterations: IterationResult[] = [];
  let xk = parseInitialPoint(x0Latex);

  for (let i = 0; i < maxIter; i++) {
    const grad = evaluateVector(gradLatex, xk);
    const normG = Number(squeeze(norm(grad as any)));

    if (isNaN(normG)) {
      throw new Error(`Gradiente se evaluó a NaN en la iteración ${i}.`);
    }

    // Direction pk = -grad
    const pk = multiply(grad, -1) as number[];

    // x_{k+1} = x_k + alpha * pk
    const step = multiply(pk, stepSize);
    const xkNext = add(xk, step) as number[];

    iterations.push({
      iteration: i,
      xk: [...xk],
      grad,
      pk,
      stepSize,
      xkNext: [...xkNext],
      normGrad: normG,
    });

    if (normG < tol) {
      break;
    }

    xk = xkNext;
  }

  return iterations;
}

export function newtonsMethod(
  x0Latex: string,
  gradLatex: string,
  hessLatex: string,
  tol: number,
  stepSize: number,
  maxIter: number = 100,
): IterationResult[] {
  const iterations: IterationResult[] = [];
  let xk = parseInitialPoint(x0Latex);

  for (let i = 0; i < maxIter; i++) {
    const grad = evaluateVector(gradLatex, xk);
    const hess = evaluateMatrix(hessLatex, xk);

    const normG = Number(squeeze(norm(grad as any)));

    if (isNaN(normG)) {
      throw new Error(
        `Gradiente o Hessiana se evaluó a NaN en la iteración ${i}.`,
      );
    }

    // pk = -inv(H) * grad
    let pk: number[];
    try {
      const hessInv = inv(hess);
      const pkMatrix = multiply(multiply(hessInv, -1), grad);
      // Ensure pk is a flat array
      pk =
        Array.isArray(pkMatrix) && Array.isArray(pkMatrix[0])
          ? (squeeze(pkMatrix) as number[])
          : (pkMatrix as unknown as number[]);
      if (!Array.isArray(pk)) {
        pk = [pk]; // handle 1D case
      }
    } catch (e) {
      throw new Error(
        `La matriz Hessiana no es invertible en la iteración ${i}. ${e}`,
      );
    }

    const step = multiply(pk, stepSize);
    const xkNext = add(xk, step) as number[];

    iterations.push({
      iteration: i,
      xk: [...xk],
      grad,
      hessian: hess,
      pk,
      stepSize,
      xkNext: [...xkNext],
      normGrad: normG,
    });

    if (normG < tol) {
      break;
    }

    xk = xkNext;
  }

  return iterations;
}
