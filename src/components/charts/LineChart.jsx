import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const LineChart = ({ data }) => {
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
      .style('position', 'fixed')
      .style('z-index', '9999')
      .style('background', 'white')
      .style('border', '1px solid #ccc')
      .style('border-radius', '6px')
      .style('padding', '8px 12px')
      .style('pointer-events', 'none')
      .style('font-size', '12px')
      .style('box-shadow', '0 4px 12px rgb(0 0 0 / 0.15)');

    const x = d3.scalePoint()
      .domain(data.map(d => d.label))
      .range([margin.left, width - margin.right])
      .padding(0.5);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => Number(d.value))]).nice()
      .range([height - margin.bottom, margin.top]);

    const line = d3.line()
      .x(d => x(d.label))
      .y(d => y(Number(d.value)))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-primary)')
      .attr('stroke-width', 2)
      .attr('d', line);

    svg.selectAll('.dot')
      .data(data)
      .join('circle')
      .attr('cx', d => x(d.label))
      .attr('cy', d => y(Number(d.value)))
      .attr('r', 5)
      .attr('fill', 'var(--color-primary)')
      .attr('stroke', 'var(--color-bg)')
      .attr('stroke-width', 2)
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).attr('r', 8).attr('fill', 'var(--color-accent)');
        const formatted = new Intl.NumberFormat().format(Number(d.value));
        tooltip.transition().duration(200).style('opacity', .95);
        tooltip.html(`<strong>${d.label}</strong><br/>Value: ${formatted}`)
          .style('left', (event.clientX + 12) + 'px')
          .style('top', (event.clientY - 28) + 'px');
      })
      .on('mousemove', (event) => {
        tooltip.style('left', (event.clientX + 12) + 'px').style('top', (event.clientY - 28) + 'px');
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget).attr('r', 5).attr('fill', 'var(--color-primary)');
        tooltip.transition().duration(400).style('opacity', 0);
      });

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
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

export default LineChart;
