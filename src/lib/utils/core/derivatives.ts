import { ComputeEngine } from "@cortex-js/compute-engine";

const ce = new ComputeEngine();

/**
 * Calculates the symbolic gradient of a LaTeX objective function with respect to variables x_1, ..., x_n.
 * Returns a 2D string array representing a 1xN row vector of the gradient elements.
 */
export function autoCalculateGradient(objectiveLatex: string, dims: number): string[][] {
  try {
    if (!objectiveLatex || objectiveLatex.trim() === "") {
      return [Array(dims).fill("0")];
    }
    const expr = ce.parse(objectiveLatex);
    const gradRow: string[] = [];
    
    for (let i = 1; i <= dims; i++) {
      const varName = `x_${i}`;
      // Compute derivative with respect to x_i
      const diff = ce.box(['D', expr, varName]).evaluate();
      // Simplify to ensure nice output
      const simplified = diff.simplify();
      // Convert back to LaTeX
      gradRow.push(simplified.latex || "0");
    }
    
    return [gradRow];
  } catch (error) {
    console.error("Error auto-calculating gradient:", error);
    return [Array(dims).fill("0")];
  }
}

/**
 * Calculates the symbolic Hessian matrix of a LaTeX objective function.
 * Returns a 2D string array representing an NxN matrix of second partial derivatives.
 */
export function autoCalculateHessian(objectiveLatex: string, dims: number): string[][] {
  try {
    if (!objectiveLatex || objectiveLatex.trim() === "") {
      return Array(dims).fill(null).map(() => Array(dims).fill("0"));
    }
    const expr = ce.parse(objectiveLatex);
    const hessian: string[][] = [];
    
    for (let i = 1; i <= dims; i++) {
      const row: string[] = [];
      const varNameI = `x_${i}`;
      // First derivative with respect to x_i
      const firstDiff = ce.box(['D', expr, varNameI]).evaluate();
      
      for (let j = 1; j <= dims; j++) {
        const varNameJ = `x_${j}`;
        // Second derivative with respect to x_j
        const secondDiff = ce.box(['D', firstDiff, varNameJ]).evaluate();
        const simplified = secondDiff.simplify();
        row.push(simplified.latex || "0");
      }
      hessian.push(row);
    }
    
    return hessian;
  } catch (error) {
    console.error("Error auto-calculating hessian:", error);
    return Array(dims).fill(null).map(() => Array(dims).fill("0"));
  }
}
