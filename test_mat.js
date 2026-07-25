import { ComputeEngine } from '@cortex-js/compute-engine';

const ce = new ComputeEngine();

function getContext(xk) {
  const ctx = {};
  xk.forEach((val, i) => {
    ctx[`x_${i + 1}`] = val;
    ctx[`x${i + 1}`] = val;
  });
  return ctx;
}

function evaluateMatrix(latex, xk) {
  const ctx = getContext(xk);
  Object.keys(ctx).forEach(key => {
    ce.assign(key, ctx[key]);
  });

  if (latex.includes('\\begin{bmatrix}') || latex.includes('\\begin{pmatrix}')) {
    const content = latex.match(/\\begin{[bp]matrix}([\s\S]*?)\\end{[bp]matrix}/)?.[1] || '';
    const rows = content.split('\\\\').filter(r => r.trim() !== '');
    return rows.map(row => {
      const cols = row.split('&').filter(c => c.trim() !== '');
      return cols.map(col => {
        const e = ce.parse(col.trim());
        const val = e.evaluate();
        return parseFloat(val.numericValue?.toString() || '0');
      });
    });
  }
  return [];
}

const hessian = "\\begin{bmatrix} 4 + 12x_1 + 12x_1^2 & -2 \\\\ -2 & 2 \\end{bmatrix}";
const xk = [1, 2];

console.log("evaluated matrix:", evaluateMatrix(hessian, xk));
