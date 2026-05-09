import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const PieChart = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || !svgRef.current) return;
    const width = 400;
    const height = 250;
    const radius = Math.min(width, height) / 2 - 10;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`);
    
    svg.selectAll('*').remove();

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.name))
      .range(['#3F72AF', '#112D4E', '#93c5fd', '#bfdbfe', '#60a5fa']);

    const pie = d3.pie().value(d => d.value);
    const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius);

    const arcs = g.selectAll('arc')
      .data(pie(data))
      .enter()
      .append('g');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.name))
      .attr('stroke', 'currentColor')
      .style('stroke-width', '2px');

    return () => svg.selectAll('*').remove();
  }, [data]);

  return <svg ref={svgRef} className="w-full h-auto text-(--color-dark) dark:text-(--color-light)" />;
};

export default PieChart;
