<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";

  let {
    points = [],
    width = 400,
    height = 300,
  } = $props<{
    points: [number, number][];
    width?: number;
    height?: number;
  }>();

  let svgElement: SVGSVGElement | null = $state(null);

  // Re-draw when points change
  $effect(() => {
    if (svgElement && points.length > 0) {
      drawPlot();
    }
  });

  function drawPlot() {
    if (!svgElement) return;

    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const xMin = d3.min(points, (d) => d[0]) ?? -10;
    const xMax = d3.max(points, (d) => d[0]) ?? 10;
    const yMin = d3.min(points, (d) => d[1]) ?? -10;
    const yMax = d3.max(points, (d) => d[1]) ?? 10;

    const xPadding = Math.max(1, (xMax - xMin) * 0.1);
    const yPadding = Math.max(1, (yMax - yMin) * 0.1);

    const xScale = d3
      .scaleLinear()
      .domain([xMin - xPadding, xMax + xPadding])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([yMin - yPadding, yMax + yPadding])
      .range([innerHeight, 0]);

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .attr("color", "#475569"); // slate-600

    g.append("g")
      .call(d3.axisLeft(yScale).ticks(5))
      .attr("color", "#475569");

    // Grid
    const addGrid = (scale: d3.ScaleLinear<number, number>, axis: 'x' | 'y') => {
      g.append("g")
        .selectAll("line")
        .data(scale.ticks(5))
        .enter()
        .append("line")
        .attr(axis === 'x' ? "x1" : "y1", (d) => scale(d))
        .attr(axis === 'x' ? "x2" : "y2", (d) => scale(d))
        .attr(axis === 'x' ? "y1" : "x1", 0)
        .attr(axis === 'x' ? "y2" : "x2", axis === 'x' ? innerHeight : innerWidth)
        .attr("stroke", "#334155")
        .attr("stroke-dasharray", "2,2");
    };
    addGrid(xScale, 'x');
    addGrid(yScale, 'y');

    // Line path
    const line = d3
      .line<[number, number]>()
      .x((d) => xScale(d[0]))
      .y((d) => yScale(d[1]))
      .curve(d3.curveLinear);

    g.append("path")
      .datum(points)
      .attr("fill", "none")
      .attr("stroke", "#34d399") // Neon teal
      .attr("stroke-width", 2)
      .attr("d", line);

    // Points
    g.selectAll("circle")
      .data(points)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d[0]))
      .attr("cy", (d) => yScale(d[1]))
      .attr("r", 4)
      .attr("fill", (d, i) =>
        i === 0
          ? "#ef4444" // start: red
          : i === points.length - 1
            ? "#fbbf24" // end: yellow
            : "#60a5fa", // path: blue
      )
      .append("title")
      .text((d, i) => `Iter ${i}: (${d[0].toFixed(4)}, ${d[1].toFixed(4)})`);
  }

  onMount(() => drawPlot());
</script>

<div class="w-full bg-[#1e2638] rounded-3xl p-4 flex flex-col gap-2 shadow-inner items-center justify-center border border-white/5">
  <div class="w-full text-left flex items-center justify-between">
    <span class="text-xs font-bold uppercase tracking-wider text-teal-400">Optimization Trajectory</span>
  </div>
  <svg
    bind:this={svgElement}
    {width}
    {height}
    viewBox="0 0 {width} {height}"
    class="max-w-full h-auto text-sm"
  ></svg>
</div>
