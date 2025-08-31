"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

type SeriesKey = string;

interface GroupedDatum {
  x: string; // category on X (e.g., Day 1, Day 2)
  series: Record<SeriesKey, number>; // values for each series key
}

interface Props {
  data: GroupedDatum[];
  seriesOrder: SeriesKey[]; // order and keys to render
  colors?: Record<SeriesKey, string>;
  height?: number;
  hideLegend?: boolean;
}

export function D3GroupedBarChart({ data, seriesOrder, colors, height = 300, hideLegend = false }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.getBoundingClientRect().width;
        setWidth(w || 400);
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!svgRef.current || width === 0) return;
    const margin = { top: 24, right: 28, bottom: 70, left: 44 };
    const innerWidth = Math.max(0, width - margin.left - margin.right);
    const innerHeight = Math.max(0, height - margin.top - margin.bottom);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x0 = d3
      .scaleBand()
      .domain(data.map((d) => d.x))
      .range([0, innerWidth])
      .padding(0.2);

    const x1 = d3
      .scaleBand()
      .domain(seriesOrder)
      .range([0, x0.bandwidth()])
      .padding(0.1);

    const yMax = d3.max(data, (d) => d3.max(seriesOrder, (k) => d.series[k] || 0)) || 0;
    const y = d3.scaleLinear().domain([0, yMax]).nice().range([innerHeight, 0]);

    const colorScale = (key: SeriesKey) =>
      (colors && colors[key]) ||
      {
        Pushups: "#ef4444", // red-500
        Crunches: "#22c55e", // green-500
        Plank: "#60a5fa", // blue-400
      }[key] || "#6b7280"; // gray-500 fallback

    // Axes
    g.append("g")
      .attr("transform", `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .style("fill", "#ffffff")
      .style("font-size", "12px")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");

    g.append("g")
      .call(d3.axisLeft(y))
      .selectAll("text")
      .style("fill", "#ffffff")
      .style("font-size", "12px");

    // Gridlines
    g.append("g")
      .attr("class", "grid")
      .call(d3.axisLeft(y).tickSize(-innerWidth).tickFormat(() => ""))
      .selectAll("line")
      .style("stroke", "#656565")
      .style("stroke-dasharray", "2,2");

    // Bars
    const groups = g
      .selectAll("g.day")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "day")
      .attr("transform", (d) => `translate(${x0(d.x)},0)`);

    groups
      .selectAll("rect")
      .data((d) => seriesOrder.map((k) => ({ key: k, value: d.series[k] || 0 })))
      .enter()
      .append("rect")
      .attr("x", (d) => x1(d.key) || 0)
      .attr("y", (d) => y(d.value))
      .attr("width", x1.bandwidth())
      .attr("height", (d) => innerHeight - y(d.value))
      .attr("fill", (d) => colorScale(d.key))
      .attr("rx", 3);

    // Legend (SVG). Can be hidden and rendered in HTML instead.
    if (!hideLegend) {
      const legend = svg.append("g").attr("transform", `translate(${margin.left},${8})`);
      const spacing = Math.max(80, Math.min(120, innerWidth / seriesOrder.length - 8));
      const legendItem = legend
        .selectAll("g")
        .data(seriesOrder)
        .enter()
        .append("g")
        .attr("transform", (_d, i) => `translate(${i * spacing},0)`);

      legendItem
        .append("rect")
        .attr("x", 0)
        .attr("y", -12)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", (d) => colorScale(d));

      legendItem
        .append("text")
        .attr("x", 18)
        .attr("y", -2)
        .attr("fill", "#ffffff")
        .style("font-size", "12px")
        .text((d) => d);
    }
  }, [data, seriesOrder, colors, width, height]);

  return (
    <div ref={containerRef} className="w-full">
      <svg ref={svgRef} width={width} height={height} className="w-full h-full" style={{ overflow: 'visible' }} />
    </div>
  );
}
