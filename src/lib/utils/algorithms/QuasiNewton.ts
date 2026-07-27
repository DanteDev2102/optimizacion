import type { IOptimizer, IOptimizationProblem, OptimizationConfig, OptimizationResult, IterationResult } from "../core/interfaces";
import { backtrackingLineSearch } from "./LineSearch";
import { vectorNorm } from "../core/algebra";
import { multiply, add, subtract, identity, transpose, squeeze } from "mathjs";

export class BFGSOptimizer implements IOptimizer {
  optimize(
    problem: IOptimizationProblem,
    x0: number[],
    config: OptimizationConfig
  ): OptimizationResult {
    const { maxIterations, tolerance, toleranceX, stepSize, c1, c2 } = config;
    
    if (!problem.gradient) {
      throw new Error("BFGS requires an analytical gradient function.");
    }

    let xk = [...x0];
    const n = xk.length;
    
    // Initial inverse Hessian approximation: H0 = I (keep plain arrays for mathjs operations)
    let Hk = (identity(n) as any).toArray() as number[][];
    
    const iterations: IterationResult[] = [];
    let funcEvals = 0;

    for (let i = 0; i < maxIterations; i++) {
      const fxk = problem.objective(xk);
      funcEvals++;

      const gk = problem.gradient(xk);
      const normG = vectorNorm(gk);
      
      if (normG < tolerance) {
        return {
          solution: xk,
          iterations,
          functionEvaluations: funcEvals,
          exitCondition: "TOLERANCE_MET"
        };
      }

      // pk = -Hk * gk
      let pkMat = multiply(multiply(Hk, -1), gk);
      let pk = Array.isArray(pkMat) && Array.isArray(pkMat[0]) 
             ? (squeeze(pkMat) as number[]) 
             : (pkMat as unknown as number[]);
      if (!Array.isArray(pk)) pk = [pk];

      let alpha = stepSize || 1.0; 
      const strategy = config.lineSearchStrategy || config.lineSearchMethod || "zoom";

      if (strategy === "constant") {
        alpha = stepSize || 1.0;
      } else {
        const useWolfe = strategy === "zoom";
        const method = strategy === "zoom" ? "zoom" : "backtracking";
        const rho = config.contractionFactor ?? 0.5;

        const lineSearchResult = backtrackingLineSearch(
          problem.objective,
          problem.gradient,
          xk,
          pk,
          stepSize || 1.0,
          c1 ?? 1e-4,
          c2 ?? 0.9,
          rho,
          useWolfe,
          method
        );
        
        alpha = lineSearchResult.alpha;
        funcEvals += lineSearchResult.functionEvaluations;
      }

      const step = multiply(pk, alpha);
      const xkNext = add(xk, step) as number[];
      const gkNext = problem.gradient(xkNext);
      
      // Secant equation variables
      const sk = subtract(xkNext, xk) as number[];
      const yk = subtract(gkNext, gk) as number[];

      iterations.push({
        iteration: i,
        xk: [...xk],
        fxk,
        grad: gk,
        hessian: Hk, // Note: For BFGS we output the INVERSE hessian approx or Hk
        pk,
        stepSize: alpha,
        xkNext: [...xkNext],
        normGrad: normG
      });

      // BFGS Update formula
      // rho_k = 1 / (yk^T sk)
      let yk_sk = 0;
      for (let j=0; j<n; j++) yk_sk += yk[j] * sk[j];
      
      if (yk_sk > 1e-10) {
        const rho = 1.0 / yk_sk;
        const I = identity(n) as number[][];
        
        // Convert to 2D arrays for mathjs matrix mult
        const sk2D = sk.map(val => [val]); 
        const yk2D = yk.map(val => [val]);
        const skT = transpose(sk2D);
        const ykT = transpose(yk2D);
        
        // V_k = I - rho_k * yk * sk^T 
        // wait, the standard formula for H update:
        // H_{k+1} = (I - rho * sk * yk^T) Hk (I - rho * yk * sk^T) + rho * sk * sk^T
        
        const term1 = multiply(multiply(sk2D, ykT), rho); // rho * sk * yk^T
        const term2 = multiply(multiply(yk2D, skT), rho); // rho * yk * sk^T
        
        const left = subtract(I, term1) as number[][];
        const right = subtract(I, term2) as number[][];
        
        const H_left_right = multiply(multiply(left, Hk), right) as number[][];
        const last_term = multiply(multiply(sk2D, skT), rho) as number[][];
        
        Hk = add(H_left_right, last_term) as number[][];
      }

      
      if (toleranceX !== undefined && vectorNorm(sk) < toleranceX) {
        return {
          solution: xkNext,
          iterations,
          functionEvaluations: funcEvals,
          exitCondition: "TOLERANCE_MET"
        };
      }

      xk = xkNext;
    }

    return {
      solution: xk,
      iterations,
      functionEvaluations: funcEvals,
      exitCondition: "MAX_ITERATIONS"
    };
  }
}

export class DFPOptimizer implements IOptimizer {
  optimize(
    problem: IOptimizationProblem,
    x0: number[],
    config: OptimizationConfig
  ): OptimizationResult {
    const { maxIterations, tolerance, toleranceX, c1, c2 } = config;
    
    if (!problem.gradient) {
      throw new Error("DFP requires an analytical gradient function.");
    }

    let xk = [...x0];
    const n = xk.length;
    
    // Initial inverse hessian approximation: H0 = I
    let Hk = (identity(n) as any).toArray() as number[][];
    
    const iterations: IterationResult[] = [];
    let funcEvals = 0;

    for (let i = 0; i < maxIterations; i++) {
      const fxk = problem.objective(xk);
      funcEvals++;

      const gk = problem.gradient(xk);
      const normG = vectorNorm(gk);
      
      if (normG < tolerance) {
        return {
          solution: xk,
          iterations,
          functionEvaluations: funcEvals,
          exitCondition: "TOLERANCE_MET"
        };
      }

      // pk = -Hk * gk
      const pkMat = multiply(multiply(Hk, -1), gk) as unknown;
      let pk: number[] = [];
      if (Array.isArray(pkMat)) {
        pk = pkMat.flat(Infinity) as number[];
      } else if (pkMat && typeof pkMat === "object" && "valueOf" in (pkMat as object)) {
        const value = (pkMat as { valueOf: () => unknown }).valueOf();
        if (Array.isArray(value)) {
          pk = value.flat(Infinity) as number[];
        } else {
          pk = [Number(value)];
        }
      } else {
        pk = [Number(pkMat)];
      }

      // Line search (Wolfe conditions are highly recommended for Quasi-Newton)
      let alpha = 1.0; 
      const lineSearchResult = backtrackingLineSearch(
        problem.objective,
        problem.gradient,
        xk,
        pk,
        alpha,
        c1,
        c2,
        0.5,
        true // Strong Wolfe condition
      );
      
      alpha = lineSearchResult.alpha;
      funcEvals += lineSearchResult.functionEvaluations;

      const step = multiply(pk, alpha);
      const xkNext = add(xk, step) as number[];
      const gkNext = problem.gradient(xkNext);
      
      // Secant equation variables
      const sk = subtract(xkNext, xk) as number[];
      const yk = subtract(gkNext, gk) as number[];

      iterations.push({
        iteration: i,
        xk: [...xk],
        fxk,
        grad: gk,
        hessian: Hk, // Note: For DFP we output the INVERSE hessian approx or Hk
        pk,
        stepSize: alpha,
        xkNext: [...xkNext],
        normGrad: normG
      });

      // DFP Update formula for Inverse Hessian
      let yk_sk = 0;
      for (let j=0; j<n; j++) yk_sk += yk[j] * sk[j];
      
      if (yk_sk > 1e-10) {
        const sk2D = sk.map(val => [val]); 
        const yk2D = yk.map(val => [val]);
        const skT = transpose(sk2D);
        const ykT = transpose(yk2D);
        
        // term1 = (sk * sk^T) / (yk^T * sk)
        const term1 = multiply(multiply(sk2D, skT), 1.0 / yk_sk) as number[][];
        
        // term2 = (Hk * yk * yk^T * Hk) / (yk^T * Hk * yk)
        const Hk_yk = multiply(Hk, yk2D); // (n x n) * (n x 1) -> (n x 1)
        const ykT_Hk = multiply(ykT, Hk); // (1 x n) * (n x n) -> (1 x n)
        
        const numerator2 = multiply(Hk_yk, ykT_Hk) as number[][]; // (n x 1) * (1 x n) -> (n x n)
        
        // denominator2 is scalar: yk^T * Hk * yk
        const denRes = multiply(ykT, Hk_yk);
        const denominator2 = denRes && typeof (denRes as any).valueOf === 'function' 
            ? (denRes as any).valueOf()[0][0] 
            : (denRes as number[][])[0][0];
        
        if (denominator2 > 1e-10) {
           const term2 = multiply(numerator2, 1.0 / denominator2) as number[][];
           Hk = add(subtract(Hk, term2), term1) as number[][];
        }
      }

      
      if (toleranceX !== undefined && vectorNorm(sk) < toleranceX) {
        return {
          solution: xkNext,
          iterations,
          functionEvaluations: funcEvals,
          exitCondition: "TOLERANCE_MET"
        };
      }

      xk = xkNext;
    }

    return {
      solution: xk,
      iterations,
      functionEvaluations: funcEvals,
      exitCondition: "MAX_ITERATIONS"
    };
  }
}

export class LBFGSOptimizer implements IOptimizer {
  optimize(
    problem: IOptimizationProblem,
    x0: number[],
    config: OptimizationConfig
  ): OptimizationResult {
    // default m = 5
    const { maxIterations, tolerance, toleranceX, c1, c2, m = 5 } = config;
    
    if (!problem.gradient) {
      throw new Error("L-BFGS requires an analytical gradient function.");
    }

    let xk = [...x0];
    const n = xk.length;
    
    // Arrays to store history
    const S: number[][] = [];
    const Y: number[][] = [];
    const Rho: number[] = [];
    
    const iterations: IterationResult[] = [];
    let funcEvals = 0;

    for (let iter = 0; iter < maxIterations; iter++) {
      const fxk = problem.objective(xk);
      funcEvals++;

      const gk = problem.gradient(xk);
      const normG = vectorNorm(gk);
      
      if (normG < tolerance) {
        return {
          solution: xk,
          iterations,
          functionEvaluations: funcEvals,
          exitCondition: "TOLERANCE_MET"
        };
      }

      // Compute direction pk using two-loop recursion
      let q = [...gk];
      const alphas: number[] = [];
      const historySize = S.length;
      
      // Loop 1 (backwards)
      for (let i = historySize - 1; i >= 0; i--) {
        const rho_i = Rho[i];
        let s_q = 0;
        for (let j = 0; j < n; j++) s_q += S[i][j] * q[j];
        const alpha = rho_i * s_q;
        alphas.unshift(alpha); // Push at the beginning to match index in Loop 2
        
        for (let j = 0; j < n; j++) {
           q[j] = q[j] - alpha * Y[i][j];
        }
      }
      
      // Initial Hessian approximation scaling
      let gamma = 1.0;
      if (historySize > 0) {
         const y_last = Y[historySize - 1];
         const s_last = S[historySize - 1];
         let y_y = 0;
         let s_y = 0;
         for (let j = 0; j < n; j++) {
            y_y += y_last[j] * y_last[j];
            s_y += s_last[j] * y_last[j];
         }
         if (y_y > 1e-10) {
            gamma = s_y / y_y;
         }
      }
      
      let z = q.map(val => val * gamma);
      
      // Loop 2 (forwards)
      for (let i = 0; i < historySize; i++) {
         const rho_i = Rho[i];
         let y_z = 0;
         for (let j = 0; j < n; j++) y_z += Y[i][j] * z[j];
         const beta = rho_i * y_z;
         const alpha = alphas[i];
         
         for (let j = 0; j < n; j++) {
            z[j] = z[j] + S[i][j] * (alpha - beta);
         }
      }
      
      // pk = -z
      const pk = z.map(val => -val);

      // Line search
      let alpha_step = 1.0; 
      const lineSearchResult = backtrackingLineSearch(
        problem.objective,
        problem.gradient,
        xk,
        pk,
        alpha_step,
        c1,
        c2,
        0.5,
        true // Strong Wolfe condition
      );
      
      alpha_step = lineSearchResult.alpha;
      funcEvals += lineSearchResult.functionEvaluations;

      // Update xk
      const step = pk.map(val => val * alpha_step);
      const xkNext = xk.map((val, idx) => val + step[idx]);
      const gkNext = problem.gradient(xkNext);
      
      const sk = xkNext.map((val, idx) => val - xk[idx]);
      const yk = gkNext.map((val, idx) => val - gk[idx]);

      iterations.push({
        iteration: iter,
        xk: [...xk],
        fxk,
        grad: gk,
        pk,
        stepSize: alpha_step,
        xkNext: [...xkNext],
        normGrad: normG
      });

      // Update history
      let yk_sk = 0;
      for (let j=0; j<n; j++) yk_sk += yk[j] * sk[j];
      
      if (yk_sk > 1e-10) {
         if (S.length >= m) {
            S.shift();
            Y.shift();
            Rho.shift();
         }
         S.push(sk);
         Y.push(yk);
         Rho.push(1.0 / yk_sk);
      }

      
      if (toleranceX !== undefined && vectorNorm(sk) < toleranceX) {
        return {
          solution: xkNext,
          iterations,
          functionEvaluations: funcEvals,
          exitCondition: "TOLERANCE_MET"
        };
      }

      xk = xkNext;
    }

    return {
      solution: xk,
      iterations,
      functionEvaluations: funcEvals,
      exitCondition: "MAX_ITERATIONS"
    };
  }
}


export class SR1Optimizer implements IOptimizer {
  optimize(
    problem: IOptimizationProblem,
    x0: number[],
    config: OptimizationConfig
  ): OptimizationResult {
    const { maxIterations, tolerance, toleranceX, stepSize, c1, c2 } = config;
    
    if (!problem.gradient) {
      throw new Error("SR1 requires an analytical gradient function.");
    }

    let xk = [...x0];
    const n = xk.length;
    let Hk = (identity(n) as any).toArray() as number[][];
    
    const iterations: IterationResult[] = [];
    let funcEvals = 0;

    for (let i = 0; i < maxIterations; i++) {
      const fxk = problem.objective(xk);
      funcEvals++;

      const gk = problem.gradient(xk);
      const normG = vectorNorm(gk);
      
      if (normG < tolerance) {
        return { solution: xk, iterations, functionEvaluations: funcEvals, exitCondition: "TOLERANCE_MET" };
      }

      const pkMat = multiply(multiply(Hk, -1), gk) as unknown;
      let pk: number[] = [];
      if (Array.isArray(pkMat)) pk = pkMat.flat(Infinity) as number[];
      else if (pkMat && typeof pkMat === "object" && "valueOf" in (pkMat as any)) {
        const val = (pkMat as any).valueOf();
        if (Array.isArray(val)) pk = val.flat(Infinity) as number[];
        else pk = [Number(val)];
      } else pk = [Number(pkMat)];

      let alpha = stepSize || 1.0; 
      const strategy = config.lineSearchStrategy || config.lineSearchMethod || "zoom";

      if (strategy === "constant") {
        alpha = stepSize || 1.0;
      } else {
        const useWolfe = strategy === "zoom";
        const method = strategy === "zoom" ? "zoom" : "backtracking";
        const rho = config.contractionFactor ?? 0.5;

        const res = backtrackingLineSearch(
          problem.objective, problem.gradient, xk, pk, stepSize || 1.0, c1 ?? 1e-4, c2 ?? 0.9, rho, useWolfe, method
        );
        alpha = res.alpha;
        funcEvals += res.functionEvaluations;
      }

      const step = multiply(pk, alpha);
      const xkNext = add(xk, step) as number[];
      const gkNext = problem.gradient(xkNext);
      
      const sk = subtract(xkNext, xk) as number[];
      const yk = subtract(gkNext, gk) as number[];
      const normStep = vectorNorm(sk);

      iterations.push({
        iteration: i, xk: [...xk], fxk, grad: gk, hessian: Hk, pk, stepSize: alpha, xkNext: [...xkNext], normGrad: normG
      });

      if (toleranceX !== undefined && normStep < toleranceX) {
        return { solution: xkNext, iterations, functionEvaluations: funcEvals, exitCondition: "TOLERANCE_MET" };
      }

      const yk2D = yk.map(val => [val]);
      const sk2D = sk.map(val => [val]);
      const Hk_yk = multiply(Hk, yk2D);
      const diff = subtract(sk2D, Hk_yk) as number[][];
      
      const diffT = transpose(diff);
      const diff_diffT = multiply(diff, diffT) as number[][];
      const denominatorRes = multiply(diffT, yk2D);
      const denominator = denominatorRes && typeof (denominatorRes as any).valueOf === 'function' 
            ? (denominatorRes as any).valueOf()[0][0] 
            : (denominatorRes as number[][])[0][0];

      if (Math.abs(denominator) > 1e-8 * vectorNorm(diff.map(row => row[0])) * vectorNorm(yk)) {
          const updateTerm = multiply(diff_diffT, 1.0 / denominator) as number[][];
          Hk = add(Hk, updateTerm) as number[][];
      }

      xk = xkNext;
    }

    return { solution: xk, iterations, functionEvaluations: funcEvals, exitCondition: "MAX_ITERATIONS" };
  }
}
