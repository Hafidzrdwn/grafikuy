import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const BarChart = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || !svgRef.current) return;
    const width = 400;
    const height = 250;
    const margin = { top: 20, right: 20, bottom: 30, left: 40 };

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`);
    
    svg.selectAll('*').remove();

    const x = d3.scaleBand()
      .domain(data.map(d => d.label))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value)]).nice()
      .range([height - margin.bottom, margin.top]);

    svg.append('g')
      .attr('fill', 'var(--color-primary)')
      .selectAll('rect')
      .data(data)
      .join('rect')
      .attr('x', d => x(d.label))
      .attr('y', d => y(d.value))
      .attr('height', d => y(0) - y(d.value))
      .attr('width', x.bandwidth())
      .attr('rx', 4);

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .attr('color', 'var(--color-dark)');

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', 'var(--color-dark)');

    return () => svg.selectAll('*').remove();
  }, [data]);

  return <svg ref={svgRef} className="w-full h-auto text-(--color-dark) dark:text-(--color-light)" />;
};

export default BarChart;
