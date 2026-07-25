import type { IOptimizer, IOptimizationProblem, OptimizationConfig, OptimizationResult, IterationResult } from "../core/interfaces";
import { getPenalizedObjective } from "./Constraints";

export class GeneticAlgorithmOptimizer implements IOptimizer {
  optimize(
    problem: IOptimizationProblem,
    x0: number[],
    config: OptimizationConfig
  ): OptimizationResult {
    const popSize = config.populationSize || 50;
    const generations = config.generations || 100;
    const n = x0.length;

    // Use penalized objective if constraints exist
    const objective = getPenalizedObjective(
      problem.objective, 
      1000, 
      problem.equalityConstraints, 
      problem.inequalityConstraints
    );

    let population = this.initializePopulation(popSize, x0, 2.0);
    const iterations: IterationResult[] = [];
    let funcEvals = 0;
    let bestX = [...x0];
    let bestFitness = Infinity;

    for (let gen = 0; gen < generations; gen++) {
      // Evaluate fitness
      const fitnessScores = population.map(ind => {
        funcEvals++;
        return objective(ind);
      });

      // Find best in generation
      let minFitness = Infinity;
      let minIdx = -1;
      for (let i = 0; i < popSize; i++) {
        if (fitnessScores[i] < minFitness) {
          minFitness = fitnessScores[i];
          minIdx = i;
        }
      }

      if (minFitness < bestFitness) {
        bestFitness = minFitness;
        bestX = [...population[minIdx]];
      }

      iterations.push({
        iteration: gen,
        xk: [...bestX],
        fxk: bestFitness
      });

      // Selection (Tournament)
      const parents = this.tournamentSelection(population, fitnessScores, popSize);

      // Crossover (BLX-alpha) and Mutation
      const nextPopulation = [];
      // Elitism: keep best
      nextPopulation.push([...bestX]);

      while (nextPopulation.length < popSize) {
        const p1 = parents[Math.floor(Math.random() * parents.length)];
        const p2 = parents[Math.floor(Math.random() * parents.length)];
        
        let child = this.crossoverBLX(p1, p2, 0.5);
        child = this.mutateGaussian(child, 0.1, 0.5); // Mut rate, variance
        
        nextPopulation.push(child);
      }

      population = nextPopulation;
    }

    return {
      solution: bestX,
      iterations,
      functionEvaluations: funcEvals,
      exitCondition: "MAX_ITERATIONS"
    };
  }

  private initializePopulation(size: number, center: number[], spread: number): number[][] {
    const pop = [];
    const n = center.length;
    for (let i = 0; i < size; i++) {
      const ind = [];
      for (let j = 0; j < n; j++) {
        // Random around center
        ind.push(center[j] + (Math.random() * 2 - 1) * spread);
      }
      pop.push(ind);
    }
    // ensure center is in pop
    pop[0] = [...center];
    return pop;
  }

  private tournamentSelection(pop: number[][], scores: number[], numToSelect: number): number[][] {
    const selected = [];
    const tournamentSize = 3;
    for (let i = 0; i < numToSelect; i++) {
      let bestIdx = Math.floor(Math.random() * pop.length);
      for (let j = 1; j < tournamentSize; j++) {
        const idx = Math.floor(Math.random() * pop.length);
        if (scores[idx] < scores[bestIdx]) {
          bestIdx = idx;
        }
      }
      selected.push([...pop[bestIdx]]);
    }
    return selected;
  }

  private crossoverBLX(p1: number[], p2: number[], alpha: number): number[] {
    const child = [];
    for (let i = 0; i < p1.length; i++) {
      const min = Math.min(p1[i], p2[i]);
      const max = Math.max(p1[i], p2[i]);
      const range = max - min;
      const lower = min - alpha * range;
      const upper = max + alpha * range;
      child.push(lower + Math.random() * (upper - lower));
    }
    return child;
  }

  private mutateGaussian(ind: number[], rate: number, sigma: number): number[] {
    const mutated = [...ind];
    for (let i = 0; i < mutated.length; i++) {
      if (Math.random() < rate) {
        mutated[i] += this.randomGaussian(0, sigma);
      }
    }
    return mutated;
  }

  private randomGaussian(mean: number, stdDev: number): number {
    let u1 = 0, u2 = 0;
    while (u1 === 0) u1 = Math.random(); 
    while (u2 === 0) u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }
}
