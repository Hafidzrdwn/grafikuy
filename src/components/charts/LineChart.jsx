import { useRef, useEffect } from "react";
import * as d3 from "d3";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { formatValue } from "@/services/aggregationEngine";

const LineChart = ({ data, formatConfig = {} }) => {
  const [wrapperRef, dimensions] = useResizeObserver();
  const svgRef = useRef();
  const tooltipRef = useRef();

  const constraintDataCount = 7;

  useEffect(() => {
    if (!data || !svgRef.current || dimensions.width === 0) return;
    const { width, height: hookHeight } = dimensions;
    const height = Math.max(hookHeight, 350);
    const margin = {
      top: 20,
      right: 30,
      bottom: data.length > constraintDataCount ? 55 : 20,
      left: 50,
    };

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`);

    svg.selectAll("*").remove();

    const tooltip = d3
      .select(tooltipRef.current)
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

    const x = d3
      .scalePoint()
      .domain(data.map((d) => d.label))
      .range([margin.left, width - margin.right])
      .padding(0.5);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => Number(d.value))])
      .nice()
      .range([height - margin.bottom, margin.top]);
    
    const maxVal = d3.max(data, (d) => Number(d.value));
    const minVal = d3.min(data, (d) => Number(d.value));

    const { xAxisFormat = 'none', yAxisFormat = 'none', tooltipFormat = 'none' } = formatConfig;
    const fmtLabel = (v) => formatValue(v, xAxisFormat);
    const fmtValue = (v) => yAxisFormat !== 'none' ? formatValue(v, yAxisFormat) : d3.format("~s")(v);
    const fmtTooltip = (v) => tooltipFormat !== 'none' ? formatValue(v, tooltipFormat) : new Intl.NumberFormat('id-ID').format(Number(v));

    const line = d3
      .line()
      .x((d) => x(d.label))
      .y((d) => y(Number(d.value)))
      .curve(d3.curveMonotoneX);

    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "var(--color-primary)")
      .attr("stroke-width", 2)
      .attr("d", line);
    
    svg.selectAll(".drop-line")
      .data(data)
      .join("line")
      .attr("class", "drop-line")
      .attr("x1", (d) => x(d.label))
      .attr("x2", (d) => x(d.label))
      .attr("y1", (d) => y(Number(d.value)))
      .attr("y2", height - margin.bottom)
      .attr("stroke", "var(--color-primary)")
      .attr("stroke-opacity", 0.3)
      .attr("stroke-dasharray", "4,4")
      .attr("stroke-width", 1.5);

    svg
      .selectAll(".dot")
      .data(data)
      .join("circle")
      .attr("cx", (d) => x(d.label))
      .attr("cy", (d) => y(Number(d.value)))
      .attr("r", (d) => (Number(d.value) === maxVal || Number(d.value) === minVal) ? 7 : 5)
      .attr("fill", (d) => {
        const val = Number(d.value);
        if (val === maxVal) return "#10B981";
        if (val === minVal) return "#EF4444";
        return "var(--color-primary)";
      })
      .attr("stroke", "var(--color-bg)")
      .attr("stroke-width", 2)
      .on("mouseover", (event, d) => {
        const val = Number(d.value);
        let hoverColor = "var(--color-primary)";
        if (val === maxVal) hoverColor = "#059669"; 
        if (val === minVal) hoverColor = "#DC2626";

        d3.select(event.currentTarget).attr("r", 9).attr("fill", hoverColor);
        
        const formatted = fmtTooltip(val);
        tooltip.transition().duration(200).style("opacity", 0.95);
        tooltip.html(`<strong>${fmtLabel(d.label)}</strong><br/>Value: ${formatted}`);

        const tooltipWidth = tooltip.node().offsetWidth;
        const xPosition = event.clientX + 12 + tooltipWidth > window.innerWidth
            ? event.clientX - tooltipWidth - 12
            : event.clientX + 12;

        tooltip.style("left", xPosition + "px").style("top", event.clientY - 28 + "px");
      })
      .on("mousemove", (event) => {
        const tooltipWidth = tooltip.node().offsetWidth;
        const xPosition =
          event.clientX + 12 + tooltipWidth > window.innerWidth
            ? event.clientX - tooltipWidth - 12
            : event.clientX + 12;

        tooltip
          .style("left", xPosition + "px")
          .style("top", event.clientY - 28 + "px");
      })
      .on("mouseout", (event, d) => {
        const val = Number(d.value);
        let defaultColor = "var(--color-primary)";
        if (val === maxVal) defaultColor = "#10B981";
        if (val === minVal) defaultColor = "#EF4444";

        d3.select(event.currentTarget)
          .attr("r", (val === maxVal || val === minVal) ? 7 : 5)
          .attr("fill", defaultColor);
          
        tooltip.transition().duration(400).style("opacity", 0);
      });

    const xAxis = svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).tickSizeOuter(0).tickFormat(fmtLabel))
      .attr("color", "currentColor");

    if (data.length > constraintDataCount) {
      xAxis
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-65)");
    }

    const dynamicTickCount = Math.max(3, Math.floor(height / 40));

    svg
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(dynamicTickCount).tickFormat(fmtValue))
      .attr("color", "currentColor");

    return () => {
      svg.selectAll("*").remove();
      d3.select(tooltipRef.current).style("opacity", 0);
    };
  }, [data, dimensions]);

  return (
    <div className="flex flex-col w-full h-full">
      {/* AREA GRAFIK D3 */}
      <div ref={wrapperRef} className="relative w-full flex-1 min-h-[250px]">
        <svg
          ref={svgRef}
          className="w-full h-full text-gray-700 dark:text-gray-300 block"
        />
        <div ref={tooltipRef} className="dark:text-gray-800" />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 pb-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800/50 mt-2">
        
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-(--color-primary) ring-2 ring-(--color-primary)/20"></span>
          <span>Normal</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] ring-2 ring-[#10B981]/20"></span>
          <span>Tertinggi</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] ring-2 ring-[#EF4444]/20"></span>
          <span>Terendah</span>
        </div>
      </div>
    </div>
  );
};

export default LineChart;
