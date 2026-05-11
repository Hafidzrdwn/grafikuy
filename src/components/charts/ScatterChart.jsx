import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const ScatterChart = ({ data }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!data || !svgRef.current) return;
    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

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

    const xExtent = d3.extent(data, d => d.x);
    const yExtent = d3.extent(data, d => d.y);

    const x = d3.scaleLinear()
      .domain([Math.min(0, xExtent[0]), xExtent[1] * 1.1]).nice()
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([Math.min(0, yExtent[0]), yExtent[1] * 1.1]).nice()
      .range([height - margin.bottom, margin.top]);

    svg.append('g')
      .selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', d => x(d.x))
      .attr('cy', d => y(d.y))
      .attr('r', 4)
      .attr('fill', 'var(--color-primary)')
      .attr('opacity', 0.6)
      .attr('stroke', 'var(--color-primary)')
      .attr('stroke-opacity', 0.3)
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).attr('r', 7).attr('opacity', 1);
        tooltip.transition().duration(200).style('opacity', .9);
        const xFormatted = new Intl.NumberFormat().format(d.x);
        const yFormatted = new Intl.NumberFormat().format(d.y);
        tooltip.html(`<strong>${d.category || 'Data Point'}</strong><br/>X: ${xFormatted}<br/>Y: ${yFormatted}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget).attr('r', 4).attr('opacity', 0.6);
        tooltip.transition().duration(500).style('opacity', 0);
      });

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(6))
      .attr('color', 'currentColor');

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', 'currentColor');

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

export default ScatterChart;
