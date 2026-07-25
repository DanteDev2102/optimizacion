import { ComputeEngine } from '@cortex-js/compute-engine';

const ce = new ComputeEngine();

const latex = "\\begin{bmatrix} 1 \\\\ 2 \\end{bmatrix}";
const content = latex.match(/\\begin{[bp]matrix}([\s\S]*?)\\end{[bp]matrix}/)?.[1] || '';
const items = content.includes('\\\\') ? content.split('\\\\') : content.split('&');
console.log("items:", items);
const result = items.filter(item => item.trim() !== '').map(item => {
  const e = ce.parse(item.trim());
  const val = e.evaluate();
  return parseFloat(val.numericValue?.toString() || '0');
});
console.log("result:", result);
