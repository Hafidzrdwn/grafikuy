import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const LineChart = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || !svgRef.current) return;
    const width = 400;
    const height = 250;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`);
    
    svg.selectAll('*').remove();

    const parsedData = data.map(d => ({ ...d, date: new Date(d.date) }));

    const x = d3.scaleTime()
      .domain(d3.extent(parsedData, d => d.date))
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(parsedData, d => d.value)]).nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(parsedData)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-primary)')
      .attr('stroke-width', 2)
      .attr('d', line);

    svg.selectAll('.dot')
      .data(parsedData)
      .join('circle')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.value))
      .attr('r', 4)
      .attr('fill', 'var(--color-primary)')
      .attr('stroke', 'var(--color-light)');

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5))
      .attr('color', 'var(--color-dark)');

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', 'var(--color-dark)');

    return () => svg.selectAll('*').remove();
  }, [data]);

  return <svg ref={svgRef} className="w-full h-auto text-(--color-dark) dark:text-(--color-light)" />;
};

export default LineChart;
