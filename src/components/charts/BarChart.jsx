import { useRef, useEffect } from "react";
import * as d3 from "d3";
import { useResizeObserver } from "@/hooks/useResizeObserver";
import { formatValue } from "@/services/aggregationEngine";

const BarChart = ({ data, orientation = "vertical", formatConfig = {} }) => {
  const [wrapperRef, dimensions] = useResizeObserver();
  const svgRef = useRef();
  const tooltipRef = useRef();

  const constraintDataCount = 7;

  useEffect(() => {
    if (!data || !svgRef.current || dimensions.width === 0) return;
    const { width, height: hookHeight } = dimensions;
    const height = hookHeight > 0 ? hookHeight : 350;
    const margin = {
      top: 10,
      right: 30,
      bottom: (data.length > constraintDataCount && orientation === "vertical") ? 65 : 20,
      left: orientation === "horizontal" ? 80 : 50,
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

    const maxVal = d3.max(data, (d) => Number(d.value));
    const minVal = d3.min(data, (d) => Number(d.value));

    const gridGroup = svg.append("g").attr("class", "grid-lines");
    const g = svg.append("g");

    const { xAxisFormat = 'none', yAxisFormat = 'none', tooltipFormat = 'none' } = formatConfig;
    const fmtLabel = (v) => formatValue(v, xAxisFormat);
    const fmtValue = (v) => yAxisFormat !== 'none' ? formatValue(v, yAxisFormat) : d3.format("~s")(v);
    const fmtTooltip = (v) => tooltipFormat !== 'none' ? formatValue(v, tooltipFormat) : new Intl.NumberFormat('id-ID').format(Number(v));

    if (orientation === "vertical") {
      const x = d3
        .scaleBand()
        .domain(data.map((d) => d.label))
        .range([margin.left, width - margin.right])
        .padding(0.2);

      const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => Number(d.value))])
        .nice()
        .range([height - margin.bottom, margin.top]);
      
      gridGroup
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(6).tickSize(-width + margin.left + margin.right).tickFormat(""))
        .attr("color", "currentColor")
        .style("stroke-opacity", 0.1)
        .select(".domain").remove();

      g.selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", (d) => x(d.label))
        .attr("y", (d) => y(Number(d.value)))
        .attr("height", (d) => Math.max(0, y(0) - y(Number(d.value))))
        .attr("width", x.bandwidth())
        .attr("fill", (d) => {
          const val = Number(d.value);
          if (val === maxVal) return "#10B981";
          if (val === minVal) return "#EF4444"; 
          return "var(--color-primary)";        
        })
        .attr("rx", 4)
        .on("mouseover", (event, d) => {
          const val = Number(d.value);
          let hoverColor = "var(--color-primary)";
          if (val === maxVal) hoverColor = "#059669"; 
          if (val === minVal) hoverColor = "#DC2626";

          d3.select(event.currentTarget).style("opacity", 0.8).attr("fill", hoverColor);
          const formatted = fmtTooltip(val);
          tooltip.transition().duration(200).style("opacity", 0.95);
          tooltip.html(`<strong>${fmtLabel(d.label)}</strong><br/>Value: ${formatted}`);

          setTimeout(() => {
            const tooltipWidth = tooltip.node().offsetWidth;
            const xPosition = event.clientX + 12 + tooltipWidth > window.innerWidth
              ? event.clientX - tooltipWidth - 12
              : event.clientX + 12;
            tooltip.style("left", xPosition + "px").style("top", event.clientY - 28 + "px");
          }, 0);
        })
        .on("mousemove", (event) => {
          const tooltipWidth = tooltip.node().offsetWidth;
          const xPosition = event.clientX + 12 + tooltipWidth > window.innerWidth
            ? event.clientX - tooltipWidth - 12
            : event.clientX + 12;
          tooltip.style("left", xPosition + "px").style("top", event.clientY - 28 + "px");
        })
        .on("mouseout", (event, d) => {
          const val = Number(d.value);
          let defaultColor = "var(--color-primary)";
          if (val === maxVal) defaultColor = "#10B981";
          if (val === minVal) defaultColor = "#EF4444";

          d3.select(event.currentTarget).style("opacity", 1).attr("fill", defaultColor);
          tooltip.transition().duration(400).style("opacity", 0);
        });

      const xAxisVertical = svg
        .append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickSizeOuter(0).tickFormat(fmtLabel))
        .attr("color", "currentColor");

      if (data.length > constraintDataCount) {
        xAxisVertical
          .selectAll("text")
          .style("text-anchor", "end")
          .attr("dx", "-.8em")
          .attr("dy", ".15em")
          .attr("transform", "rotate(-65)");
      }

      svg
        .append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(6).tickFormat(fmtValue))
        .attr("color", "currentColor");
      
    } else {
      const x = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => Number(d.value))])
        .nice()
        .range([margin.left, width - margin.right]);

      const y = d3
        .scaleBand()
        .domain(data.map((d) => d.label))
        .range([margin.top, height - margin.bottom])
        .padding(0.2);
      
      gridGroup
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(6).tickSize(-height + margin.top + margin.bottom).tickFormat(""))
        .attr("color", "currentColor")
        .style("stroke-opacity", 0.1)
        .select(".domain").remove();

      g.selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", x(0))
        .attr("y", (d) => y(d.label))
        .attr("width", (d) => Math.max(0, x(Number(d.value)) - x(0)))
        .attr("height", y.bandwidth())
        .attr("fill", (d) => {
          const val = Number(d.value);
          if (val === maxVal) return "#10B981"; 
          if (val === minVal) return "#EF4444"; 
          return "var(--color-primary)";
        })
        .attr("rx", 4)
        .on("mouseover", (event, d) => {
          const val = Number(d.value);
          let hoverColor = "var(--color-primary)";
          if (val === maxVal) hoverColor = "#059669"; 
          if (val === minVal) hoverColor = "#DC2626";

          d3.select(event.currentTarget).style("opacity", 0.8).attr("fill", hoverColor);
          const formatted = fmtTooltip(val);
          tooltip.transition().duration(200).style("opacity", 0.95);
          tooltip.html(`<strong>${fmtLabel(d.label)}</strong><br/>Value: ${formatted}`);

          setTimeout(() => {
            const tooltipWidth = tooltip.node().offsetWidth;
            const xPosition = event.clientX + 12 + tooltipWidth > window.innerWidth
              ? event.clientX - tooltipWidth - 12
              : event.clientX + 12;
            tooltip.style("left", xPosition + "px").style("top", event.clientY - 28 + "px");
          }, 0);
        })
        .on("mousemove", (event) => {
          const tooltipWidth = tooltip.node().offsetWidth;
          const xPosition = event.clientX + 12 + tooltipWidth > window.innerWidth
            ? event.clientX - tooltipWidth - 12
            : event.clientX + 12;
          tooltip.style("left", xPosition + "px").style("top", event.clientY - 28 + "px");
        })
        .on("mouseout", (event, d) => {
          const val = Number(d.value);
          let defaultColor = "var(--color-primary)";
          if (val === maxVal) defaultColor = "#10B981";
          if (val === minVal) defaultColor = "#EF4444";

          d3.select(event.currentTarget).style("opacity", 1).attr("fill", defaultColor);
          tooltip.transition().duration(400).style("opacity", 0);
        });

      svg
        .append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(6).tickFormat(fmtValue))
        .attr("color", "currentColor");

      svg
        .append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickSizeOuter(0).tickFormat(fmtLabel))
        .attr("color", "currentColor");
    }

    return () => {
      svg.selectAll("*").remove();
      d3.select(tooltipRef.current).style("opacity", 0);
    };
  }, [data, orientation, dimensions]);

  return (
    <div className="flex flex-col w-full h-full">
      <div ref={wrapperRef} className="relative w-full flex-1 min-h-87.5">
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

export default BarChart;
