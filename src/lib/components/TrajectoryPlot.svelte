<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";

  let {
    points = [],
    width = 400,
    height = 400,
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
    svg.selectAll("*").remove(); // Clear previous drawing

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Find min and max for both dimensions to create scales
    const xMin = d3.min(points, (d) => d[0]) ?? -10;
    const xMax = d3.max(points, (d) => d[0]) ?? 10;
    const yMin = d3.min(points, (d) => d[1]) ?? -10;
    const yMax = d3.max(points, (d) => d[1]) ?? 10;

    // Add padding to domain
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

    // Add axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .attr("color", "hsl(var(--muted-foreground))");

    g.append("g")
      .call(d3.axisLeft(yScale))
      .attr("color", "hsl(var(--muted-foreground))");

    // Add grid
    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(xScale.ticks())
      .enter()
      .append("line")
      .attr("x1", (d) => xScale(d))
      .attr("x2", (d) => xScale(d))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-opacity", 0.5)
      .attr("stroke-dasharray", "2,2");

    g.append("g")
      .attr("class", "grid")
      .selectAll("line")
      .data(yScale.ticks())
      .enter()
      .append("line")
      .attr("y1", (d) => yScale(d))
      .attr("y2", (d) => yScale(d))
      .attr("x1", 0)
      .attr("x2", innerWidth)
      .attr("stroke", "hsl(var(--border))")
      .attr("stroke-opacity", 0.5)
      .attr("stroke-dasharray", "2,2");

    // Add line path
    const line = d3
      .line<[number, number]>()
      .x((d) => xScale(d[0]))
      .y((d) => yScale(d[1]))
      .curve(d3.curveLinear);

    g.append("path")
      .datum(points)
      .attr("fill", "none")
      .attr("stroke", "hsl(var(--primary))")
      .attr("stroke-width", 2)
      .attr("d", line);

    // Add points
    g.selectAll("circle")
      .data(points)
      .enter()
      .append("circle")
      .attr("cx", (d) => xScale(d[0]))
      .attr("cy", (d) => yScale(d[1]))
      .attr("r", 4)
      .attr("fill", (d, i) =>
        i === 0
          ? "#ef4444"
          : i === points.length - 1
            ? "#22c55e"
            : "hsl(var(--primary))",
      ) // Red for start, Green for end
      .append("title")
      .text(
        (d, i) => `Iteración ${i}: (${d[0].toFixed(4)}, ${d[1].toFixed(4)})`,
      );
  }

  onMount(() => {
    drawPlot();
  });
</script>

<div
  class="glass rounded-xl p-4 overflow-hidden flex items-center justify-center"
>
  <svg
    bind:this={svgElement}
    {width}
    {height}
    viewBox="0 0 {width} {height}"
    class="max-w-full h-auto text-sm"
  ></svg>
</div>
