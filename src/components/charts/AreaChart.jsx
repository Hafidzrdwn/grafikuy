import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const AreaChart = ({ data, formatConfig }) => {
  const svgRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current || !wrapperRef.current) return;

    d3.select(svgRef.current).selectAll("*").remove();

    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const width = wrapperRef.current.clientWidth - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const parsedData = data.map(d => ({
      date: new Date(d.date),
      value: Number(d.value)
    })).sort((a, b) => a.date - b.date);

    const x = d3.scaleTime()
      .domain(d3.extent(parsedData, d => d.date))
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(parsedData, d => d.value) || 10])
      .nice()
      .range([height, 0]);

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
      .attr('transform', `translate(0,${height})`)
      .call(xAxisGenerator)
      .attr('class', 'text-gray-500 dark:text-gray-400 font-sans');

    xAxis.select('.domain').attr('stroke', '#ccc');
    xAxis.selectAll('line').attr('stroke', '#ccc');

    const yAxis = svg.append('g')
      .call(d3.axisLeft(y).ticks(5))
      .attr('class', 'text-gray-500 dark:text-gray-400 font-sans');

    yAxis.select('.domain').attr('stroke', '#ccc');
    yAxis.selectAll('line').attr('stroke', '#ccc');

    svg.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(d3.axisLeft(y).tickSize(-width).tickFormat(''))
      .selectAll('line')
      .attr('stroke', '#3F72AF');

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
      .attr('stroke', '#112D4E')
      .attr('stroke-width', 3)
      .attr('d', line);

    const tooltip = d3.select('body').append('div')
      .attr('class', 'absolute hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg p-2 rounded text-sm z-50 pointer-events-none text-gray-800 dark:text-gray-200')
      .style('opacity', 0);

    const points = svg.selectAll('.point')
      .data(parsedData)
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.value))
      .attr('r', 4)
      .attr('fill', '#fff')
      .attr('stroke', '#112D4E')
      .attr('stroke-width', 2)
      .attr('cursor', 'pointer');

    points.on('mouseover', function(event, d) {
      d3.select(this)
        .transition().duration(200)
        .attr('r', 6)
        .attr('fill', '#3F72AF');

      tooltip.classed('hidden', false).transition().duration(200).style('opacity', 1);
      
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
        <div class="font-semibold mb-1">${dateLabel}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Number of Visitors: <span class="font-bold text-gray-900 dark:text-white">${compactFormat}</span></div>
      `);
    })
    .on('mousemove', function(event) {
      tooltip
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 28) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition().duration(200)
        .attr('r', 4)
        .attr('fill', '#fff');

      tooltip.transition().duration(500).style('opacity', 0).on('end', function() {
        d3.select(this).classed('hidden', true);
      });
    });

    const handleResize = () => {
      d3.select(svgRef.current).selectAll("*").remove();
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      d3.selectAll('.absolute').remove(); 
      window.removeEventListener('resize', handleResize);
    };
  }, [data, formatConfig]); 

  return (
    <div ref={wrapperRef} className="w-full h-full relative">
      <svg ref={svgRef} className="w-full overflow-visible" />
    </div>
  );
};

export default AreaChart;