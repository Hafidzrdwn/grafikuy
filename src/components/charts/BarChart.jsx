import { useRef, useEffect } from "react";
import * as d3 from "d3";
import { useResizeObserver } from "@/hooks/useResizeObserver";

const BarChart = ({ data, orientation = "vertical" }) => {
  const [wrapperRef, dimensions] = useResizeObserver();
  const svgRef = useRef();
  const tooltipRef = useRef();

  const constraintDataCount = 7;

  useEffect(() => {
    if (!data || !svgRef.current || dimensions.width === 0) return;
    const { width, height: hookHeight } = dimensions;
    const height = hookHeight > 0 ? hookHeight : 300;
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

    const g = svg.append("g");

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

      g.selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", (d) => x(d.label))
        .attr("y", (d) => y(Number(d.value)))
        .attr("height", (d) => Math.max(0, y(0) - y(Number(d.value))))
        .attr("width", x.bandwidth())
        .attr("fill", "var(--color-primary)")
        .attr("rx", 4)
        .on("mouseover", (event, d) => {
          d3.select(event.currentTarget).style("opacity", 0.8);
          const formatted = new Intl.NumberFormat().format(Number(d.value));
          tooltip.transition().duration(200).style("opacity", 0.95);
          tooltip
            .html(`<strong>${d.label}</strong><br/>Value: ${formatted}`)
            .style("left", event.clientX + 12 + "px")
            .style("top", event.clientY - 28 + "px");
        })
        .on("mousemove", (event) => {
          tooltip
            .style("left", event.clientX + 12 + "px")
            .style("top", event.clientY - 28 + "px");
        })
        .on("mouseout", (event) => {
          d3.select(event.currentTarget).style("opacity", 1);
          tooltip.transition().duration(400).style("opacity", 0);
        });

      const xAxisVertical = svg
        .append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).tickSizeOuter(0))
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
        .call(d3.axisLeft(y).ticks(6, "~s"))
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

      g.selectAll("rect")
        .data(data)
        .join("rect")
        .attr("x", x(0))
        .attr("y", (d) => y(d.label))
        .attr("width", (d) => Math.max(0, x(Number(d.value)) - x(0)))
        .attr("height", y.bandwidth())
        .attr("fill", "var(--color-primary)")
        .attr("rx", 4)
        .on("mouseover", (event, d) => {
          d3.select(event.currentTarget).style("opacity", 0.8);
          const formatted = new Intl.NumberFormat().format(Number(d.value));
          tooltip.transition().duration(200).style("opacity", 0.95);
          tooltip
            .html(`<strong>${d.label}</strong><br/>Value: ${formatted}`)
            .style("left", event.clientX + 12 + "px")
            .style("top", event.clientY - 28 + "px");
        })
        .on("mousemove", (event) => {
          tooltip
            .style("left", event.clientX + 12 + "px")
            .style("top", event.clientY - 28 + "px");
        })
        .on("mouseout", (event) => {
          d3.select(event.currentTarget).style("opacity", 1);
          tooltip.transition().duration(400).style("opacity", 0);
        });

      svg
        .append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(6, "~s"))
        .attr("color", "currentColor");

      svg
        .append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).tickSizeOuter(0))
        .attr("color", "currentColor");
    }

    return () => {
      svg.selectAll("*").remove();
      d3.select(tooltipRef.current).style("opacity", 0);
    };
  }, [data, orientation, dimensions]);

  return (
    <div ref={wrapperRef} className="relative w-full flex-1 min-h-87.5">
      <svg
        ref={svgRef}
        className="w-full h-full text-gray-700 dark:text-gray-300"
      />
      <div ref={tooltipRef} className="dark:text-gray-800" />
    </div>
  );
};

export default BarChart;
