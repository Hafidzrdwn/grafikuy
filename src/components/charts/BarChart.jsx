import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const BarChart = ({ data, orientation = 'vertical' }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!data || !svgRef.current) return;
    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: orientation === 'horizontal' ? 100 : 50 };

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

    const g = svg.append('g');

    if (orientation === 'vertical') {
      const x = d3.scaleBand()
        .domain(data.map(d => d.label))
        .range([margin.left, width - margin.right])
        .padding(0.2);

      const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)]).nice()
        .range([height - margin.bottom, margin.top]);

      g.selectAll('rect')
        .data(data)
        .join('rect')
        .attr('x', d => x(d.label))
        .attr('y', d => y(d.value))
        .attr('height', d => y(0) - y(d.value))
        .attr('width', x.bandwidth())
        .attr('fill', 'var(--color-primary)')
        .attr('rx', 4)
        .on('mouseover', (event, d) => {
          tooltip.transition().duration(200).style('opacity', .9);
          tooltip.html(`<strong>${d.label}</strong><br/>Value: ${d.value}`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', () => tooltip.transition().duration(500).style('opacity', 0));

      svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
        .attr('color', 'currentColor');

      svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5))
        .attr('color', 'currentColor');

    } else {
      // Horizontal
      const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value)]).nice()
        .range([margin.left, width - margin.right]);

      const y = d3.scaleBand()
        .domain(data.map(d => d.label))
        .range([margin.top, height - margin.bottom])
        .padding(0.2);

      g.selectAll('rect')
        .data(data)
        .join('rect')
        .attr('x', x(0))
        .attr('y', d => y(d.label))
        .attr('width', d => x(d.value) - x(0))
        .attr('height', y.bandwidth())
        .attr('fill', 'var(--color-primary)')
        .attr('rx', 4)
        .on('mouseover', (event, d) => {
          tooltip.transition().duration(200).style('opacity', .9);
          tooltip.html(`<strong>${d.label}</strong><br/>Value: ${d.value}`)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', () => tooltip.transition().duration(500).style('opacity', 0));

      svg.append('g')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(5))
        .attr('color', 'currentColor');

      svg.append('g')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickSizeOuter(0))
        .attr('color', 'currentColor');
    }

    return () => {
      svg.selectAll('*').remove();
      d3.select(tooltipRef.current).style('opacity', 0);
    };
  }, [data, orientation]);

  return (
    <div className="relative w-full h-full">
      <svg ref={svgRef} className="w-full h-full text-gray-700 dark:text-gray-300" />
      <div ref={tooltipRef} className="dark:text-gray-800" />
    </div>
  );
};

export default BarChart;
