import { ComputeEngine } from "@cortex-js/compute-engine";
import type { IOptimizationProblem, OptimizationConfig, OptimizationResult } from "./core/interfaces";
import { GradientDescentOptimizer } from "./algorithms/GradientDescent";
import { NewtonOptimizer } from "./algorithms/Newton";
import { BFGSOptimizer } from "./algorithms/QuasiNewton";
import { GeneticAlgorithmOptimizer } from "./algorithms/GeneticAlgorithm";
import { checkKKT } from "./algorithms/Constraints";

const ce = new ComputeEngine();

function getContext(xk: number[]): Record<string, number> {
  const context: Record<string, number> = {};
  xk.forEach((val, i) => {
    context[`x_${i + 1}`] = val;
    context[`x_{${i + 1}}`] = val;
    context[`x${i + 1}`] = val;
  });
  return context;
}

function splitCommaDelimitedItems(value: string): string[] {
  return value
    .trim()
    .replace(/^\[|\]$/g, "")
    .split(/\s*,\s*/)
    .map(item => item.trim())
    .filter(item => item.length > 0);
}

function parseBracketedVector(value: string): string[] | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
    return null;
  }
  const items = splitCommaDelimitedItems(trimmed);
  return items.length > 1 ? items : null;
}

function parseBracketedMatrix(value: string): string[][] | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("[[") || !trimmed.endsWith("]]")) {
    return null;
  }
  const inner = trimmed.slice(1, -1).trim();
  const rowStrings = inner.split(/\],\s*\[/).map(row => row.replace(/^\[|\]$/g, "").trim());
  const rows = rowStrings.map(row => splitCommaDelimitedItems(row));
  if (rows.every(r => r.length > 0)) {
    return rows;
  }
  return null;
}

function expandBracketedGradientCell(matrix: string[][]): string[][] {
  if (matrix.length === 1 && matrix[0].length === 1) {
    const expanded = parseBracketedVector(matrix[0][0]);
    if (expanded) {
      return [expanded];
    }
  }
  return matrix;
}

function expandBracketedHessianCell(matrix: string[][]): string[][] {
  if (matrix.length === 1 && matrix[0].length === 1) {
    const expanded = parseBracketedMatrix(matrix[0][0]);
    if (expanded) {
      return expanded;
    }
  }
  return matrix;
}

export function parseObjective(latex: string): (x: number[]) => number {
  if (!latex) throw new Error("Objective function is required.");
  const expr = ce.parse(latex);
  return (x: number[]) => {
    const ctx = getContext(x);
    const val = expr.subs(ctx).evaluate();
    return Number(val.valueOf() ?? 0);
  };
}

function parseExpressionList(expressions: string[]): any[] {
  return expressions.map(expr => {
    try {
      return ce.parse(expr);
    } catch (err: any) {
      throw new Error(`Expresión inválida en el gradiente: "${expr}". ${err?.message ?? "Error de parseo."}`);
    }
  });
}

export function parseVectorFunction(stringVec: string[][]): (x: number[]) => number[] {
  // stringVec is nx1 (or 1xn)
  const expanded = expandBracketedGradientCell(stringVec);
  const flat = expanded.flat();
  const exprs = parseExpressionList(flat);
  return (x: number[]) => {
    const ctx = getContext(x);
    return exprs.map(expr => {
      const val = expr.subs(ctx).evaluate();
      return Number(val.valueOf() ?? 0);
    });
  };
}

export function parseMatrixFunction(stringMat: string[][]): (x: number[]) => number[][] {
  const expanded = expandBracketedHessianCell(stringMat);
  const exprs = expanded.map(row => row.map(s => ce.parse(s)));
  return (x: number[]) => {
    const ctx = getContext(x);
    return exprs.map(row => row.map(expr => {
      const val = expr.subs(ctx).evaluate();
      return Number(val.valueOf() ?? 0);
    }));
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function validateGradientOutput(output: unknown, expectedLength: number): void {
  if (!Array.isArray(output)) {
    throw new Error(`El gradiente analítico debe ser un vector, pero se obtuvo ${typeof output}.`);
  }
  if (output.length !== expectedLength) {
    throw new Error(`El gradiente analítico debe tener longitud ${expectedLength}, pero devolvió ${output.length}.`);
  }
  output.forEach((value, index) => {
    if (!isFiniteNumber(value)) {
      throw new Error(`El gradiente analítico contiene un valor no numérico en la posición ${index + 1}: ${String(value)}.`);
    }
  });
}

function approximateGradient(f: (x: number[]) => number, x: number[]): number[] {
  const h = 1e-6;
  const base = f(x);
  const grad: number[] = [];
  for (let i = 0; i < x.length; i++) {
    const xPlus = [...x];
    const xMinus = [...x];
    xPlus[i] += h;
    xMinus[i] -= h;
    const fPlus = f(xPlus);
    const fMinus = f(xMinus);
    grad.push((fPlus - fMinus) / (2 * h));
  }
  return grad;
}

function validateGradientMatchesObjective(
  gradient: (x: number[]) => number[],
  objective: (x: number[]) => number,
  x0: number[],
  tolerance: number = 1e-2
): void {
  const numericGradient = approximateGradient(objective, x0);
  const analyticGradient = gradient(x0);
  const differences = analyticGradient.map((value, index) => Math.abs(value - numericGradient[index]));
  if (!differences.every(isFiniteNumber)) {
    throw new Error("No se pudo validar el gradiente numérico en el punto inicial.");
  }
  const maxDiff = Math.max(...differences);
  if (maxDiff > tolerance) {
    const detail = differences.map((diff, index) => `∂${index + 1}: ${diff.toExponential(2)}`).join(", ");
    throw new Error(`El gradiente no coincide con el gradiente numérico aproximado en x₀ (dif. máxima ${maxDiff.toFixed(6)}). ${detail}`);
  }
}

function validateObjectiveOutput(output: unknown): void {
  if (!isFiniteNumber(output)) {
    throw new Error(`La función objetivo debe devolver un número finito, pero devolvió ${String(output)}.`);
  }
}

export function runOptimization(
  algorithm: "gradient" | "newton" | "bfgs" | "dfp" | "lbfgs" | "ga",
  objectiveLatex: string,
  gradientMat: string[][] | null,
  hessianMat: string[][] | null,
  x0Mat: string[][],
  config: OptimizationConfig,
  eqConstraints: string[] = [],
  ineqConstraints: string[] = []
): OptimizationResult {
  
  const problem: IOptimizationProblem = {
    objective: parseObjective(objectiveLatex),
  };

  // Parse Constraints
  if (eqConstraints.length > 0) {
    problem.equalityConstraints = eqConstraints.filter(c => c.trim() !== "").map(c => {
      try { return parseObjective(c); } catch { throw new Error(`Invalid Equality Constraint: ${c}`); }
    });
  }
  if (ineqConstraints.length > 0) {
    problem.inequalityConstraints = ineqConstraints.filter(c => c.trim() !== "").map(c => {
      try { return parseObjective(c); } catch { throw new Error(`Invalid Inequality Constraint: ${c}`); }
    });
  }

  const hasConstraints = (problem.equalityConstraints && problem.equalityConstraints.length > 0) || 
                         (problem.inequalityConstraints && problem.inequalityConstraints.length > 0);

  if (algorithm !== 'ga' && hasConstraints) {
    throw new Error("Constraints are only supported using the Penalty Method in the Genetic Algorithm (GA) right now. Analytical methods (Newton/BFGS/Gradient) require unconstrained formulations.");
  }

  if (algorithm === "newton" || algorithm === "bfgs" || algorithm === "dfp" || algorithm === "lbfgs" || algorithm === "gradient") {
    if (!gradientMat || gradientMat.length === 0 || gradientMat[0].length === 0 || gradientMat[0][0] === "") {
      throw new Error(`The ${algorithm.toUpperCase()} algorithm requires the Gradient vector to be provided.`);
    }
    problem.gradient = parseVectorFunction(gradientMat);
  }

  if (algorithm === "newton") {
    if (!hessianMat || hessianMat.length === 0 || hessianMat[0].length === 0 || hessianMat[0][0] === "") {
      throw new Error("Newton's method requires the Hessian matrix to be provided.");
    }
    problem.hessian = parseMatrixFunction(hessianMat);
  }

  // Parse Initial point x0
  // Handle if x0 is Nx1 or 1xN, and allow bracketed vector syntax like [1, 2]
  let x0Str = x0Mat.flat();
  if (x0Str.length === 1) {
    const bracketed = parseBracketedVector(x0Str[0]);
    if (bracketed) {
      x0Str = bracketed;
    }
  }

  let x0 = x0Str.map(s => {
    const expr = ce.parse(s);
    return Number(expr.evaluate().valueOf() ?? 0);
  });

  // Validate gradient correctness at the initial point before any optimization.
  if (problem.gradient) {
    try {
      const gradAtX0 = problem.gradient(x0);
      validateGradientOutput(gradAtX0, x0.length);
      validateGradientMatchesObjective(problem.gradient, problem.objective, x0, config.tolerance || 1e-2);
    } catch (err: any) {
      throw new Error(`Gradiente inválido: ${err.message}`);
    }
  }

  let optimizer;
  switch (algorithm) {
    case "gradient":
      optimizer = new GradientDescentOptimizer();
      break;
    case "newton":
      optimizer = new NewtonOptimizer();
      break;
    case "bfgs":
      optimizer = new BFGSOptimizer();
      break;
    case "dfp":
      throw new Error("DFP algorithm is pending backend integration.");
    case "lbfgs":
      throw new Error("L-BFGS algorithm is pending backend integration.");
    case "ga":
      optimizer = new GeneticAlgorithmOptimizer();
      break;
    default:
      throw new Error("Unknown algorithm selected.");
  }

  const result = optimizer.optimize(problem, x0, config);

  // Check KKT Conditions at the solution
  if (problem.gradient && result.solution) {
    const kkt = checkKKT(
      result.solution,
      problem.gradient(result.solution),
      problem.equalityConstraints,
      problem.inequalityConstraints,
      config.tolerance
    );
    result.isFeasible = kkt.isFeasible;
    // Map to the new detailed structure if possible, for now we map what we have from checkKKT
    // In the future, checkKKT will return the full detailed structure.
    result.kktAnalysis = {
      isFeasible: kkt.isFeasible,
      stationarity: kkt.violations.filter(v => v.toLowerCase().includes('stationarity')).length === 0,
      complementarity: kkt.violations.filter(v => v.toLowerCase().includes('complementarity')).length === 0,
      lagrangeMultipliersEq: [], // Pending backend 
      lagrangeMultipliersIneq: [], // Pending backend
      violations: kkt.violations
    };
  }

  return result;
}
