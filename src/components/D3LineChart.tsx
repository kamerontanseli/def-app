'use client';

import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

interface LineChartProps {
  data: { date: string; average: number }[];
}

export function D3LineChart({ data }: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: width || 400, height: 300 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0) return;

    // Map a score to a traffic-light color
    const getTrafficLightColor = (score: number) => {
      if (score <= 2) return '#dc2626'; // red-600
      if (score <= 5) return '#ea580c'; // orange-600
      if (score <= 7) return '#eab308'; // yellow-500
      return '#16a34a'; // green-600
    };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    const margin = { top: 20, right: 30, bottom: 60, left: 40 };
    const innerWidth = dimensions.width - margin.left - margin.right;
    const innerHeight = dimensions.height - margin.top - margin.bottom;

    const x = d3.scaleBand()
      .domain(data.map(d => d.date))
      .range([0, innerWidth])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([1, 10])
      .range([innerHeight, 0]);

    const line = d3.line<{ date: string; average: number }>()
      .x(d => (x(d.date) || 0) + x.bandwidth() / 2)
      .y(d => y(d.average))
      .curve(d3.curveMonotoneX);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('fill', '#ffffff')
      .style('font-size', '12px')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-45)');

    // Add Y axis
    g.append('g')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .style('fill', '#ffffff')
      .style('font-size', '12px');

    
    g.selectAll('.tick line')
      .style('stroke', '#ffffff');

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .tickSize(-innerWidth)
        .tickFormat(() => ''))
      .selectAll('line')
      .style('stroke', '#656565')
      .style('stroke-dasharray', '2,2');

    // Add the line as colored segments between consecutive points
    const segments = data.length > 1
      ? data.slice(1).map((d, i) => ({ from: data[i], to: d }))
      : [];

    g.append('g')
      .selectAll('path')
      .data(segments)
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', (d) => getTrafficLightColor(d.to.average))
      .attr('stroke-width', 3)
      .attr('d', d => line([d.from, d.to]) ?? null);

    // Add dots, colored per point value
    g.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => (x(d.date) || 0) + x.bandwidth() / 2)
      .attr('cy', d => y(d.average))
      .attr('r', 5)
      .attr('fill', d => getTrafficLightColor(d.average));

    g.selectAll('.domain')
      .style('stroke', '#ffffff');

  }, [data, dimensions]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full" />
    </div>
  );
}
