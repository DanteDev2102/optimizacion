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

function parseInitialPoint(latex) {
  if (latex.includes('\\begin{bmatrix}') || latex.includes('\\begin{pmatrix}')) {
    const content = latex.match(/\\begin{[bp]matrix}([\s\S]*?)\\end{[bp]matrix}/)?.[1] || '';
    const items = content.includes('\\\\') ? content.split('\\\\') : content.split('&');
    return items.filter(item => item.trim() !== '').map(item => {
      const e = ce.parse(item.trim());
      const val = e.evaluate();
      return Number(val.valueOf() ?? 0);
    });
  }
  const clean = latex.replace(/\\left\\[/g, '').replace(/\\right\\]/g, '').replace(/\\begin{[bp]matrix}/, '').replace(/\\end{[bp]matrix}/, '').replace(/\\\\/, ',');
  const parts = clean.split(',').map(s => s.trim());
  return parts.filter(p => p !== '').map(part => {
    const val = ce.parse(part).evaluate();
    return Number(val.valueOf() ?? 0);
  });
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
      return Number(val.valueOf() ?? 0);
    });
  }
  return [];
}

const x0Latex = "\\begin{bmatrix} 1 \\\\ 2 \\end{bmatrix}";
const gradLatex = "\\begin{bmatrix} 4x_1 - 2x_2 + 6x_1^2 + 4x_1^3 \\\\ 2x_2 - 2x_1 \\end{bmatrix}";

const xk = parseInitialPoint(x0Latex);
console.log("xk:", xk);

const grad = evaluateVector(gradLatex, xk);
console.log("grad:", grad);
