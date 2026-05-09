import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const ScatterChart = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || !svgRef.current) return;
    const width = 400;
    const height = 250;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`);
    
    svg.selectAll('*').remove();

    const x = d3.scaleLinear()
      .domain([0, 100])
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, 100])
      .range([height - margin.bottom, margin.top]);

    svg.append('g')
      .selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', d => x(d.x))
      .attr('cy', d => y(d.y))
      .attr('r', d => d.r)
      .attr('fill', 'var(--color-primary)')
      .attr('opacity', 0.7);

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .attr('color', 'var(--color-dark)');

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .attr('color', 'var(--color-dark)');

    return () => svg.selectAll('*').remove();
  }, [data]);

  return <svg ref={svgRef} className="w-full h-auto text-(--color-dark) dark:text-(--color-light)" />;
};

export default ScatterChart;
