'use client';

import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

interface BarChartProps {
  data: { date: string; completed: number }[];
  todayDate?: string;
  maxHabits?: number;
}

export function D3BarChart({ data, todayDate, maxHabits }: BarChartProps) {
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
      .domain([0, maxHabits || d3.max(data, d => d.completed) || 0])
      .nice()
      .range([innerHeight, 0]);

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

    // Add bars
    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.date) || 0)
      .attr('y', d => y(d.completed))
      .attr('width', x.bandwidth())
      .attr('height', d => innerHeight - y(d.completed))
      .attr('fill', d => todayDate && d.date === todayDate ? '#ef4444' : '#333') // Red for today (only when viewing current week), background color for others
      .attr('rx', 4); // Rounded corners

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .tickSize(-innerWidth)
        .tickFormat(() => ''))
      .selectAll('line')
      .style('stroke', '#656565')
      .style('stroke-dasharray', '2,2');

    g.selectAll('.domain')
      .style('stroke', '#ffffff');


  }, [data, dimensions, todayDate, maxHabits]);

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full" />
    </div>
  );
}
