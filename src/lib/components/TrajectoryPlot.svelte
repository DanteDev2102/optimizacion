<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { parseObjective } from "$lib/utils/optimization";

  let Plotly: any = null;

  interface TrajectoryPlotProps {
    points: number[][];
    iterationPoints?: number[][];
    highlightPoint?: number[] | null;
    objective?: string | null;
    equalityConstraints?: string[];
    inequalityConstraints?: string[];
    dimensions?: number;
    width?: number;
    height?: number;
  }

  let props: TrajectoryPlotProps = $props();

  let points = $derived(props.points ?? []);
  let iterationPoints = $derived(props.iterationPoints ?? []);
  let highlightPoint = $derived(props.highlightPoint ?? null);
  let objective = $derived(props.objective ?? null);
  let equalityConstraints = $derived(props.equalityConstraints ?? []);
  let inequalityConstraints = $derived(props.inequalityConstraints ?? []);
  let dimensions = $derived(props.dimensions ?? 2);
  let width = $derived(props.width ?? 480);
  let height = $derived(props.height ?? 320);

  let plotElement: HTMLDivElement | null = $state(null);

  function normalizePoints(input: number[][]): number[][] {
    if (!Array.isArray(input)) return [];
    return input
      .filter((point) => Array.isArray(point) && point.every((value) => Number.isFinite(Number(value))))
      .map((point) => point.map((value) => Number(value)));
  }

  function linspace(start: number, end: number, count: number): number[] {
    const step = count <= 1 ? 0 : (end - start) / (count - 1);
    return Array.from({ length: count }, (_, index) => start + step * index);
  }

  function buildBounds(values: number[][]): { xMin: number; xMax: number; yMin: number; yMax: number } {
    const numericPoints = normalizePoints(values);
    if (numericPoints.length === 0) return { xMin: -1, xMax: 1, yMin: -1, yMax: 1 };

    const xs = numericPoints.map((point) => point[0] ?? 0);
    const ys = numericPoints.map((point) => point[1] ?? 0);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const spanX = xMax - xMin || 1;
    const spanY = yMax - yMin || 1;
    const padX = Math.max(1, spanX * 0.25);
    const padY = Math.max(1, spanY * 0.25);

    return {
      xMin: xMin - padX,
      xMax: xMax + padX,
      yMin: yMin - padY,
      yMax: yMax + padY,
    };
  }

  function evaluateObjectiveAt(x: number[], objectiveExpression: string | null) {
    if (!objectiveExpression) return 0;
    try {
      const expr = parseObjective(objectiveExpression);
      return expr(x);
    } catch {
      return 0;
    }
  }

  function evaluateConstraintMask(gridX: number[], gridY: number[], eqConsts: string[], ineqConsts: string[]) {
    if (eqConsts.length === 0 && ineqConsts.length === 0) return null;

    return gridX.map((xValue) =>
      gridY.map((yValue) => {
        const point = [xValue, yValue];
        const eqOk = eqConsts.every((constraint: string) => {
          const value = evaluateObjectiveAt(point, constraint);
          return Math.abs(value) <= 1e-4;
        });
        const ineqOk = ineqConsts.every((constraint: string) => {
          const value = evaluateObjectiveAt(point, constraint);
          return value <= 1e-4;
        });
        return eqOk && ineqOk ? 1 : 0;
      })
    );
  }

  function evaluateConstraintValues(gridX: number[], gridY: number[], constraintExpression: string | null) {
    if (!constraintExpression) return [];
    return gridX.map((xValue) =>
      gridY.map((yValue) => evaluateObjectiveAt([xValue, yValue], constraintExpression))
    );
  }

  function buildConstraintCurvePoints(
    gridX: number[],
    gridY: number[],
    constraintExpression: string | null,
    objectiveExpression: string | null,
    zOffset: number = 0.05
  ): { xs: (number | null)[]; ys: (number | null)[]; zs: (number | null)[] } {
    if (!constraintExpression) return { xs: [], ys: [], zs: [] };

    const values = evaluateConstraintValues(gridX, gridY, constraintExpression);
    const segmentPoints: Array<[{ x: number; y: number; z: number }, { x: number; y: number; z: number }]> = [];
    const scalarVal = (i: number, j: number) => values[i][j];

    for (let i = 0; i < gridX.length - 1; i++) {
      for (let j = 0; j < gridY.length - 1; j++) {
        const x0 = gridX[i], x1 = gridX[i + 1];
        const y0 = gridY[j], y1 = gridY[j + 1];
        const v00 = scalarVal(i, j);
        const v10 = scalarVal(i + 1, j);
        const v01 = scalarVal(i, j + 1);
        const v11 = scalarVal(i + 1, j + 1);

        const edgeIntersects: Array<{ x: number; y: number }> = [];

        // Bottom edge (v00 -> v10)
        if ((v00 >= 0 && v10 <= 0) || (v00 <= 0 && v10 >= 0)) {
          const denom = Math.abs(v00) + Math.abs(v10);
          const t = denom < 1e-12 ? 0.5 : Math.abs(v00) / denom;
          edgeIntersects.push({ x: x0 + t * (x1 - x0), y: y0 });
        }
        // Right edge (v10 -> v11)
        if ((v10 >= 0 && v11 <= 0) || (v10 <= 0 && v11 >= 0)) {
          const denom = Math.abs(v10) + Math.abs(v11);
          const t = denom < 1e-12 ? 0.5 : Math.abs(v10) / denom;
          edgeIntersects.push({ x: x1, y: y0 + t * (y1 - y0) });
        }
        // Top edge (v01 -> v11)
        if ((v01 >= 0 && v11 <= 0) || (v01 <= 0 && v11 >= 0)) {
          const denom = Math.abs(v01) + Math.abs(v11);
          const t = denom < 1e-12 ? 0.5 : Math.abs(v01) / denom;
          edgeIntersects.push({ x: x0 + t * (x1 - x0), y: y1 });
        }
        // Left edge (v00 -> v01)
        if ((v00 >= 0 && v01 <= 0) || (v00 <= 0 && v01 >= 0)) {
          const denom = Math.abs(v00) + Math.abs(v01);
          const t = denom < 1e-12 ? 0.5 : Math.abs(v00) / denom;
          edgeIntersects.push({ x: x0, y: y0 + t * (y1 - y0) });
        }

        if (edgeIntersects.length >= 2) {
          const p1 = edgeIntersects[0];
          const p2 = edgeIntersects[1];
          const z1 = evaluateObjectiveAt([p1.x, p1.y], objectiveExpression) + zOffset;
          const z2 = evaluateObjectiveAt([p2.x, p2.y], objectiveExpression) + zOffset;
          segmentPoints.push([
            { x: p1.x, y: p1.y, z: z1 },
            { x: p2.x, y: p2.y, z: z2 }
          ]);
        }
      }
    }

    // Connect segments into single lists with NaN breaks for clean Plotly line plotting
    const xs: (number | null)[] = [];
    const ys: (number | null)[] = [];
    const zs: (number | null)[] = [];

    segmentPoints.forEach(([p1, p2]) => {
      xs.push(p1.x, p2.x, null);
      ys.push(p1.y, p2.y, null);
      zs.push(p1.z, p2.z, null);
    });

    return { xs, ys, zs };
  }

  function drawPlot() {
    if (!plotElement || !Plotly) return;

    const numericPoints = normalizePoints(points as number[][]);
    const numericIterationPoints = normalizePoints(iterationPoints as number[][]);
    const numericHighlightPoint = normalizePoints(highlightPoint ? [highlightPoint] : []);

    if (numericPoints.length === 0 && numericIterationPoints.length === 0 && numericHighlightPoint.length === 0) {
      Plotly.purge(plotElement);
      return;
    }

    const is1D = dimensions <= 1 || numericPoints.every((point) => point.length <= 1);

    if (is1D) {
      const sourcePoints = numericPoints.length > 0 ? numericPoints : numericIterationPoints;
      const xs = sourcePoints.map((point) => point[0] ?? 0);
      const ys = xs.map((xValue) => evaluateObjectiveAt([xValue], objective));
      const traces = [
        {
          x: xs,
          y: ys,
          type: "scatter" as const,
          mode: "lines+markers" as const,
          name: "Trayectoria",
          line: { color: "#14b8a6", width: 3 },
          marker: { color: "#60a5fa", size: 6 },
        },
        {
          x: numericIterationPoints.map((point) => point[0] ?? 0),
          y: numericIterationPoints.map((point) => evaluateObjectiveAt([point[0] ?? 0], objective)),
          type: "scatter" as const,
          mode: "markers" as const,
          name: "Puntos de iteración",
          marker: { color: "#22d3ee", size: 7 },
        },
      ];

      if (numericHighlightPoint.length > 0) {
        const highlight = numericHighlightPoint[0];
        traces.push({
          x: [highlight[0] ?? 0],
          y: [evaluateObjectiveAt([highlight[0] ?? 0], objective)],
          type: "scatter" as const,
          mode: "markers" as const,
          name: "Óptimo",
          marker: { color: "#f43f5e", size: 10 },
        });
      }

      if (sourcePoints.length > 0) {
        const startPoint = sourcePoints[0];
        const endPoint = numericHighlightPoint[0] ?? sourcePoints[sourcePoints.length - 1];
        traces.push({
          x: [startPoint[0] ?? 0],
          y: [evaluateObjectiveAt([startPoint[0] ?? 0], objective)],
          type: "scatter" as const,
          mode: "markers" as const,
          name: "Inicio",
          marker: { color: "#fb7185", size: 10 },
        });
        traces.push({
          x: [endPoint[0] ?? 0],
          y: [evaluateObjectiveAt([endPoint[0] ?? 0], objective)],
          type: "scatter" as const,
          mode: "markers" as const,
          name: "Fin",
          marker: { color: "#fbbf24", size: 10 },
        });
      }

      const layout = {
        margin: { l: 40, r: 16, t: 20, b: 40 },
        paper_bgcolor: "rgba(0,0,0,0)",
        plot_bgcolor: "rgba(0,0,0,0)",
        font: { color: "#e2e8f0" },
        xaxis: { title: { text: "x" }, zeroline: false },
        yaxis: { title: { text: "f(x)" }, zeroline: false },
        showlegend: true,
        legend: { bgcolor: "rgba(0,0,0,0.2)" },
      };

      Plotly.newPlot(plotElement, traces as any, layout as any, { responsive: true });
      return;
    }

    const allBoundsPoints = [
      ...numericPoints,
      ...numericIterationPoints,
      ...numericHighlightPoint,
    ];
    const { xMin, xMax, yMin, yMax } = buildBounds(allBoundsPoints);
    const gridX = linspace(xMin, xMax, 50);
    const gridY = linspace(yMin, yMax, 50);
    const zValues = gridX.map((xValue) => gridY.map((yValue) => evaluateObjectiveAt([xValue, yValue], objective)));
    
    // Find absolute z-min to project flat on the bottom floor of the 3D scene
    let zMinFloor = Infinity;
    for (let r of zValues) {
      for (let val of r) {
        if (val < zMinFloor) zMinFloor = val;
      }
    }
    if (!Number.isFinite(zMinFloor)) zMinFloor = 0;
    // Lower slightly below min z for visual clarity
    zMinFloor = zMinFloor - Math.abs(zMinFloor) * 0.05 - 0.5;

    const eqConstraints = (equalityConstraints as string[]).filter((constraint: string) => constraint?.trim());
    const ineqConstraints = (inequalityConstraints as string[]).filter((constraint: string) => constraint?.trim());
    const feasibleMask = evaluateConstraintMask(gridX, gridY, eqConstraints, ineqConstraints);

    const traces: any[] = [
      {
        x: gridX,
        y: gridY,
        z: zValues,
        type: "surface" as const,
        colorscale: [[0, "#1e293b"], [0.5, "#6366f1"], [1, "#14b8a6"]],
        showscale: false,
        opacity: 0.88,
        name: "f(x, y)",
      },
    ];

    if (feasibleMask) {
      // Create a flat region at the floor zMinFloor in the XY plane
      const regionZ = gridX.map((xVal, i) =>
        gridY.map((yVal, j) => (feasibleMask[i][j] ? zMinFloor : NaN))
      );
      traces.push({
        x: gridX,
        y: gridY,
        z: regionZ,
        type: "surface" as const,
        colorscale: [[0, "rgba(34,197,94,0.45)"], [1, "rgba(34,197,94,0.45)"]],
        showscale: false,
        opacity: 0.85,
        name: "Región factible (plano xy)",
        hoverinfo: "skip",
      });
    }

    eqConstraints.forEach((constraint, index) => {
      const curve = buildConstraintCurvePoints(gridX, gridY, constraint, objective, 0);

      if (curve.xs.length > 0) {
        traces.push({
          x: curve.xs,
          y: curve.ys,
          z: curve.xs.map((v) => (v !== null ? zMinFloor + 0.01 : null)),
          type: "scatter3d" as const,
          mode: "lines" as const,
          name: `h${index + 1}(x)=0`,
          line: { color: "#f59e0b", width: 6 },
        });
      }
    });

    ineqConstraints.forEach((constraint, index) => {
      const curve = buildConstraintCurvePoints(gridX, gridY, constraint, objective, 0);

      if (curve.xs.length > 0) {
        traces.push({
          x: curve.xs,
          y: curve.ys,
          z: curve.xs.map((v) => (v !== null ? zMinFloor + 0.01 : null)),
          type: "scatter3d" as const,
          mode: "lines" as const,
          name: `g${index + 1}(x)=0`,
          line: { color: "#38bdf8", width: 5, dash: "dash" },
        });
      }
    });

    if (numericPoints.length > 0) {
      traces.push({
        x: numericPoints.map((point) => point[0] ?? 0),
        y: numericPoints.map((point) => point[1] ?? 0),
        z: numericPoints.map((point) => evaluateObjectiveAt([point[0] ?? 0, point[1] ?? 0], objective)),
        type: "scatter3d" as const,
        mode: "lines" as const,
        name: "Trayectoria",
        line: { color: "#34d399", width: 4 },
      });
    }

    if (numericIterationPoints.length > 0) {
      traces.push({
        x: numericIterationPoints.map((point) => point[0] ?? 0),
        y: numericIterationPoints.map((point) => point[1] ?? 0),
        z: numericIterationPoints.map((point) => evaluateObjectiveAt([point[0] ?? 0, point[1] ?? 0], objective)),
        type: "scatter3d" as const,
        mode: "markers" as const,
        name: "Puntos de iteración",
        marker: { size: 5, color: "#22d3ee" },
      });
    }

    if (numericHighlightPoint.length > 0) {
      const highlight = numericHighlightPoint[0];
      traces.push({
        x: [highlight[0] ?? 0],
        y: [highlight[1] ?? 0],
        z: [evaluateObjectiveAt([highlight[0] ?? 0, highlight[1] ?? 0], objective)],
        type: "scatter3d" as const,
        mode: "markers" as const,
        name: "Óptimo",
        marker: { size: 10, color: "#f43f5e" },
      });
    }

    if (numericPoints.length > 0) {
      const start = numericPoints[0];
      const end = numericPoints[numericPoints.length - 1];
      traces.push({
        x: [start[0] ?? 0],
        y: [start[1] ?? 0],
        z: [evaluateObjectiveAt([start[0] ?? 0, start[1] ?? 0], objective)],
        type: "scatter3d" as const,
        mode: "markers" as const,
        name: "Inicio",
        marker: { size: 8, color: "#fb7185" },
      });
      traces.push({
        x: [end[0] ?? 0],
        y: [end[1] ?? 0],
        z: [evaluateObjectiveAt([end[0] ?? 0, end[1] ?? 0], objective)],
        type: "scatter3d" as const,
        mode: "markers" as const,
        name: "Fin",
        marker: { size: 8, color: "#fbbf24" },
      });
    }

    const layout = {
      margin: { l: 20, r: 20, t: 20, b: 20 },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: "#e2e8f0" },
      showlegend: true,
      legend: { bgcolor: "rgba(0,0,0,0.2)" },
      scene: {
        xaxis: { title: { text: "x₁" }, backgroundcolor: "rgba(0,0,0,0)" },
        yaxis: { title: { text: "x₂" }, backgroundcolor: "rgba(0,0,0,0)" },
        zaxis: { title: { text: "f(x₁, x₂)" }, backgroundcolor: "rgba(0,0,0,0)" },
      },
    };

    Plotly.newPlot(plotElement, traces as any, layout as any, { responsive: true });
  }

  $effect(() => {
    if (plotElement) {
      drawPlot();
    }
  });

  onMount(async () => {
    if (typeof window !== "undefined") {
      const module = await import("plotly.js-dist-min");
      Plotly = module.default ?? module;
      drawPlot();
    }
  });

  onDestroy(() => {
    if (plotElement && Plotly) {
      Plotly.purge(plotElement);
    }
  });
</script>

<div class="w-full bg-[#1e2638] rounded-3xl p-4 flex flex-col gap-2 shadow-inner items-center justify-center border border-white/5">
  <div class="w-full text-left flex items-center justify-between">
    <span class="text-xs font-bold uppercase tracking-wider text-teal-400">Optimization Trajectory</span>
  </div>
  <div bind:this={plotElement} style={`width: ${width}px; height: ${height}px; max-width: 100%;`} class="rounded-2xl"></div>
</div>
