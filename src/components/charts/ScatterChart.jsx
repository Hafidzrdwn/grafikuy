import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { formatValue } from '@/services/aggregationEngine';

const ScatterChart = ({ data, formatConfig = {} }) => {
  const [wrapperRef, dimensions] = useResizeObserver();
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current || dimensions.width === 0) return;
    
    const { width, height: hookHeight } = dimensions;
    const height = Math.max(hookHeight, 300); 
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

    const colorScale = d3.scaleOrdinal(d3.schemeTableau10);

    const gridGroup = svg.append('g').attr('class', 'grid-lines');

    gridGroup.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickSize(-width + margin.left + margin.right).tickFormat(""))
      .attr('color', 'currentColor')
      .style('stroke-opacity', 0.08)
      .select('.domain').remove();

    gridGroup.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(6).tickSize(-height + margin.top + margin.bottom).tickFormat(""))
      .attr('color', 'currentColor')
      .style('stroke-opacity', 0.08)
      .select('.domain').remove();

    const avgX = d3.mean(data, d => d.x);
    const avgY = d3.mean(data, d => d.y);

    const meanLinesGroup = svg.append('g').attr('class', 'mean-lines');

    meanLinesGroup.append('line')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', y(avgY))
      .attr('y2', y(avgY))
      .attr('stroke', 'var(--color-primary)')
      .attr('stroke-dasharray', '5,5')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 1.5);

    meanLinesGroup.append('line')
      .attr('x1', x(avgX))
      .attr('x2', x(avgX))
      .attr('y1', margin.top)
      .attr('y2', height - margin.bottom)
      .attr('stroke', 'var(--color-primary)')
      .attr('stroke-dasharray', '5,5')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 1.5);

    svg.append('g')
      .selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', d => x(d.x))
      .attr('cy', d => y(d.y))
      .attr('r', 6) 
      .attr('fill', d => d.category && d.category !== 'Data Point' ? colorScale(d.category) : 'var(--color-primary)')
      .attr('opacity', 0.8)
      .attr('stroke', 'var(--color-bg)')
      .attr('stroke-width', 1)
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget)
          .attr('r', 10) 
          .attr('opacity', 1)
          .attr('stroke-width', 2);
          
        const { tooltipFormat = 'none' } = formatConfig;
        const fmtTooltipVal = (v) => tooltipFormat !== 'none' ? formatValue(v, tooltipFormat) : new Intl.NumberFormat('id-ID').format(Number(v));
        const xFormatted = fmtTooltipVal(d.x);
        const yFormatted = fmtTooltipVal(d.y);
        tooltip.transition().duration(200).style('opacity', .95);
        tooltip.html(`<strong>${d.category || 'Data Point'}</strong><br/>X: ${xFormatted}<br/>Y: ${yFormatted}`);

        setTimeout(() => {
          const tooltipWidth = tooltip.node().offsetWidth;
          const xPosition = event.clientX + 12 + tooltipWidth > window.innerWidth
            ? event.clientX - tooltipWidth - 12
            : event.clientX + 12;
          tooltip.style('left', xPosition + 'px').style('top', (event.clientY - 28) + 'px');
        }, 0);
      })
      .on('mousemove', (event) => {
        const tooltipWidth = tooltip.node().offsetWidth;
        const xPosition = event.clientX + 12 + tooltipWidth > window.innerWidth
          ? event.clientX - tooltipWidth - 12
          : event.clientX + 12;
        tooltip.style('left', xPosition + 'px').style('top', (event.clientY - 28) + 'px');
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget)
          .attr('r', 6)
          .attr('opacity', 0.8)
          .attr('stroke-width', 1);
        tooltip.transition().duration(400).style('opacity', 0);
      });

    const { xAxisFormat = 'none', yAxisFormat = 'none' } = formatConfig;
    const fmtX = (v) => xAxisFormat !== 'none' ? formatValue(v, xAxisFormat) : d3.format("~s")(v);
    const fmtY = (v) => yAxisFormat !== 'none' ? formatValue(v, yAxisFormat) : d3.format("~s")(v);

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(fmtX))
      .attr('color', 'currentColor');

    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5).tickFormat(fmtY))
      .attr('color', 'currentColor');

    return () => {
      svg.selectAll('*').remove();
      d3.select(tooltipRef.current).style('opacity', 0);
    };
  }, [data, dimensions]);

  return (
    <div ref={wrapperRef} className="relative w-full flex-1 min-h-[300px]">
      <svg ref={svgRef} className="w-full h-full text-gray-700 dark:text-gray-300 block" />
      <div ref={tooltipRef} className="dark:text-gray-800" />
    </div>
  );
};

export default ScatterChart;