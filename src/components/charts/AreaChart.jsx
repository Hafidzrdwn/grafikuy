import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { useResizeObserver } from '@/hooks/useResizeObserver';

const AreaChart = ({ data, formatConfig }) => {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null); 
  const [wrapperRef, dimensions] = useResizeObserver();

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current || dimensions.width === 0) return;

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const { width, height: hookHeight } = dimensions;
    const height = Math.max(hookHeight, 350);

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`);

    svg.selectAll("*").remove(); 

    const parsedData = data.map(d => ({
      date: new Date(d.date),
      value: Number(d.value)
    })).sort((a, b) => a.date - b.date);

    const x = d3.scaleTime()
      .domain(d3.extent(parsedData, d => d.date))
      .range([margin.left, width - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(parsedData, d => d.value) || 10])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient")
      .attr("id", "area-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    gradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#3F72AF") 
      .attr("stop-opacity", 0.6);

    gradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#3F72AF")
      .attr("stop-opacity", 0.0);

    const xAxisGenerator = d3.axisBottom(x).ticks(5);

    if (formatConfig === 'year') {
      xAxisGenerator.tickFormat(d3.timeFormat("%Y"));
    } else if (formatConfig === 'month') {
      xAxisGenerator.tickFormat(d3.timeFormat("%b %Y"));
    } else {
      xAxisGenerator.tickFormat(d3.timeFormat("%b %d"));
    }

    const xAxis = svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`) 
      .call(xAxisGenerator)
      .attr('color', 'currentColor')
      .attr('class', 'text-gray-500 dark:text-gray-400 font-sans');

    xAxis.select('.domain').attr('stroke', 'currentColor').attr('stroke-opacity', 0.2);
    xAxis.selectAll('line').attr('stroke', 'currentColor').attr('stroke-opacity', 0.2);

    const yAxis = svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .attr('color', 'currentColor')
      .attr('class', 'text-gray-500 dark:text-gray-400 font-sans');

    yAxis.select('.domain').attr('stroke', 'currentColor').attr('stroke-opacity', 0.2);
    yAxis.selectAll('line').attr('stroke', 'currentColor').attr('stroke-opacity', 0.2);

    svg.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(${margin.left},0)`)
      .attr('color', 'currentColor')
      .style('stroke-opacity', 0.1)
      .call(d3.axisLeft(y).tickSize(-width + margin.left + margin.right).tickFormat(''))
      .select('.domain').remove();

    const area = d3.area()
      .curve(d3.curveMonotoneX)
      .x(d => x(d.date))
      .y0(y(0)) 
      .y1(d => y(d.value));

    const line = d3.line()
      .curve(d3.curveMonotoneX)
      .x(d => x(d.date))
      .y(d => y(d.value));

    svg.append('path')
      .datum(parsedData)
      .attr('fill', 'url(#area-gradient)')
      .attr('d', area);

    svg.append('path')
      .datum(parsedData)
      .attr('fill', 'none')
      .attr('stroke', 'var(--color-primary)') 
      .attr('stroke-width', 3)
      .attr('d', line);

    const tooltip = d3.select(tooltipRef.current)
      .style("opacity", 0)
      .style("position", "fixed")
      .style("z-index", "9999")
      .style("background", "white")
      .style("border", "1px solid #ccc")
      .style("border-radius", "6px")
      .style("padding", "8px 12px")
      .style("pointer-events", "none")
      .style("font-size", "12px")
      .style("box-shadow", "0 4px 12px rgb(0 0 0 / 0.15)");

    const points = svg.selectAll('.point')
      .data(parsedData)
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.value))
      .attr('r', 4)
      .attr('fill', '#fff')
      .attr('stroke', 'var(--color-primary)')
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer');

    points.on('mouseover', function(event, d) {
      d3.select(this)
        .transition().duration(200)
        .attr('r', 6)
        .attr('fill', 'var(--color-primary)');

      tooltip.transition().duration(200).style('opacity', 0.95);
      
      let dateLabel = '';
      if (formatConfig === 'month') {
        dateLabel = d3.timeFormat("%B %Y")(d.date);
      } else if (formatConfig === 'year') {
        dateLabel = d3.timeFormat("%Y")(d.date);
      } else {
        dateLabel = d3.timeFormat("%B %d, %Y")(d.date);
      }

      const compactFormat = new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(d.value);

      tooltip.html(`
        <div class="font-semibold mb-1 text-gray-900">${dateLabel}</div>
        <div class="text-xs text-gray-500">Number of Visitors: <span class="font-bold text-gray-900">${compactFormat}</span></div>
      `);

      setTimeout(() => {
        const tooltipWidth = tooltip.node().offsetWidth;
        const xPosition = event.clientX + 15 + tooltipWidth > window.innerWidth
            ? event.clientX - tooltipWidth - 15
            : event.clientX + 15;
        tooltip.style("left", xPosition + "px").style("top", event.clientY - 28 + "px");
      }, 0);
    })
    .on('mousemove', function(event) {
      const tooltipWidth = tooltip.node().offsetWidth;
      const xPosition = event.clientX + 15 + tooltipWidth > window.innerWidth
          ? event.clientX - tooltipWidth - 15
          : event.clientX + 15;
      tooltip.style("left", xPosition + "px").style("top", event.clientY - 28 + "px");
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition().duration(200)
        .attr('r', 4)
        .attr('fill', '#fff');

      tooltip.transition().duration(400).style('opacity', 0);
    });
    
    return () => {
      svg.selectAll("*").remove();
      d3.select(tooltipRef.current).style('opacity', 0);
    };
  }, [data, formatConfig, dimensions]); 

  return (
    <div ref={wrapperRef} className="w-full flex-1 min-h-[350px] relative">
      <svg ref={svgRef} className="w-full h-full text-gray-700 dark:text-gray-300 block" />
      <div ref={tooltipRef} className="dark:text-gray-800" />
    </div>
  );
};

export default AreaChart;