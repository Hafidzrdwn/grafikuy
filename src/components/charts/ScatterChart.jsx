import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const ScatterChart = ({ data }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;
    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    const svg = d3.select(svgRef.current)
      .attr('viewBox', `0 0 ${width} ${height}`);
    
    svg.selectAll('*').remove();

    const tooltip = d3.select(tooltipRef.current)
      .style('opacity', 0)
      .style('position', 'fixed')
      .style('z-index', '9999')
      .style('background', 'white')
      .style('border', '1px solid #ccc')
      .style('border-radius', '6px')
      .style('padding', '8px 12px')
      .style('pointer-events', 'none')
      .style('font-size', '12px')
      .style('box-shadow', '0 4px 12px rgb(0 0 0 / 0.15)');

    const xExtent = d3.extent(data, d => d.x);
    const yExtent = d3.extent(data, d => d.y);

    const x = d3.scaleLinear()
      .domain([Math.min(0, xExtent[0] || 0), (xExtent[1] || 1) * 1.1]).nice()
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([Math.min(0, yExtent[0] || 0), (yExtent[1] || 1) * 1.1]).nice()
      .range([height - margin.bottom, margin.top]);

    svg.append('g')
      .selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', d => x(d.x))
      .attr('cy', d => y(d.y))
      .attr('r', 5)
      .attr('fill', 'var(--color-primary)')
      .attr('opacity', 0.7)
      .attr('stroke', 'var(--color-primary)')
      .attr('stroke-opacity', 0.3)
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).attr('r', 8).attr('opacity', 1);
        const xFormatted = new Intl.NumberFormat().format(d.x);
        const yFormatted = new Intl.NumberFormat().format(d.y);
        tooltip.transition().duration(200).style('opacity', .95);
        tooltip.html(`<strong>${d.category || 'Data Point'}</strong><br/>X: ${xFormatted}<br/>Y: ${yFormatted}`)
          .style('left', (event.clientX + 12) + 'px')
          .style('top', (event.clientY - 28) + 'px');
      })
      .on('mousemove', (event) => {
        tooltip.style('left', (event.clientX + 12) + 'px').style('top', (event.clientY - 28) + 'px');
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget).attr('r', 5).attr('opacity', 0.7);
        tooltip.transition().duration(400).style('opacity', 0);
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
