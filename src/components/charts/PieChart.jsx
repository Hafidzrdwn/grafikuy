import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const PieChart = ({ data }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!data || !svgRef.current) return;
    const width = 500;
    const height = 300;
    const radius = Math.min(width, height) / 2 - 20;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`);
    
    svg.selectAll('*').remove();

    const tooltip = d3.select(tooltipRef.current)
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'white')
      .style('border', '1px solid #ccc')
      .style('border-radius', '4px')
      .style('padding', '8px')
      .style('pointer-events', 'none')
      .style('font-size', '12px')
      .style('box-shadow', '0 4px 6px -1px rgb(0 0 0 / 0.1)');

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.id))
      .range(['#3F72AF', '#112D4E', '#93c5fd', '#bfdbfe', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8']);

    const pie = d3.pie().value(d => d.value).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.6).outerRadius(radius); // Inner radius makes it a Donut
    
    const total = d3.sum(data, d => d.value);

    // Center Text
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.2em')
      .style('font-size', '14px')
      .style('fill', 'currentColor')
      .text('Total');

    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('fill', 'currentColor')
      .text(new Intl.NumberFormat('en-US', { notation: 'compact' }).format(total));

    const arcs = g.selectAll('arc')
      .data(pie(data))
      .enter()
      .append('g');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.id))
      .attr('stroke', 'var(--color-bg)')
      .style('stroke-width', '2px')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).style('opacity', 0.8);
        tooltip.transition().duration(200).style('opacity', .9);
        const percent = ((d.data.value / total) * 100).toFixed(1);
        tooltip.html(`<strong>${d.data.label}</strong><br/>Value: ${d.data.value}<br/>Share: ${percent}%`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget).style('opacity', 1);
        tooltip.transition().duration(500).style('opacity', 0);
      });

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 120}, 20)`);

    const legendItems = legend.selectAll('g')
      .data(data.slice(0, 8)) // Show max 8 legends
      .enter()
      .append('g')
      .attr('transform', (d, i) => `translate(0, ${i * 20})`);

    legendItems.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', d => color(d.id));

    legendItems.append('text')
      .attr('x', 20)
      .attr('y', 10)
      .text(d => d.label.length > 12 ? d.label.substring(0, 10) + '...' : d.label)
      .style('font-size', '12px')
      .style('fill', 'currentColor');

    return () => {
      svg.selectAll('*').remove();
      d3.select(tooltipRef.current).style('opacity', 0);
    };
  }, [data]);

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full text-gray-700 dark:text-gray-300" />
      <div ref={tooltipRef} className="dark:text-gray-800" />
    </div>
  );
};

export default PieChart;
