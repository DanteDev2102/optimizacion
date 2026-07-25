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

function evaluateVector(latex, xk) {
  const ctx = getContext(xk);
  Object.keys(ctx).forEach(key => {
    ce.assign(key, ctx[key]);
  });

  if (latex.includes('\\begin{bmatrix}') || latex.includes('\\begin{pmatrix}')) {
    const content = latex.match(/\\begin{[bp]matrix}([\s\S]*?)\\end{[bp]matrix}/)?.[1] || '';
    const items = content.includes('\\\\') ? content.split('\\\\') : content.split('&');
    return items.filter(item => item.trim() !== '').map(item => {
      const e = ce.parse(item.trim());
      const val = e.evaluate();
      return parseFloat(val.numericValue?.toString() || '0');
    });
  }

  const parts = latex.split(',').map(s => s.trim());
  return parts.map(part => {
    const e = ce.parse(part);
    const val = e.evaluate();
    return parseFloat(val.numericValue?.toString() || '0');
  });
}

const grad = "\\begin{bmatrix} 4x_1 - 2x_2 + 6x_1^2 + 4x_1^3 \\\\ 2x_2 - 2x_1 \\end{bmatrix}";
const xk = [1, 2];

console.log("evaluated:", evaluateVector(grad, xk));
