// src/pages/AdvancedChart1Page.jsx
import { useContext, useEffect, useRef, useMemo } from 'react';
import { DataContext } from '../context/DataContext';
import * as d3 from 'd3';
import PageTitle from '../components/ui/PageTitle';
import Card from '../components/ui/Card';
import InsightAccordion from '../components/dashboard/InsightAccordion';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';

const AdvancedChart1Page = () => {
  const { parsedData, schema, loading } = useContext(DataContext);
  const svgRef = useRef();

  const isCompatible = useMemo(() => {
    if (!schema) return false;
    const catCols = schema.columns.filter(c => c.type === 'string' && schema.stats[c.name].uniqueCount > 1);
    return catCols.length >= 2;
  }, [schema]);

  useEffect(() => {
    if (!isCompatible || !parsedData || parsedData.length === 0) return;
    const width = 800, height = 800, cx = width / 2, cy = height / 2, radius = Math.min(width, height) / 2 - 80;
    const catCols = schema.columns.filter(c => c.type === 'string');
    const hierarchyData = { name: "Root", children: [] };
    const groupMap = d3.group(parsedData, d => d[catCols[0].name], d => d[catCols[1].name]);
    
    for (const [key1, value1] of groupMap.entries()) {
      const children1 = [];
      for (const [key2, value2] of value1.entries()) children1.push({ name: String(key2), value: value2.length });
      hierarchyData.children.push({ name: String(key1), children: children1 });
    }

    const root = d3.hierarchy(hierarchyData).sort((a, b) => d3.ascending(a.data.name, b.data.name));
    d3.cluster().size([2 * Math.PI, radius])(root);

    const svg = d3.select(svgRef.current).attr("viewBox", [-cx, -cy, width, height]).style("width", "100%").style("height", "auto").style("font", "10px sans-serif");
    svg.selectAll('*').remove();

    const g = svg.append("g");
    svg.call(d3.zoom().on("zoom", e => g.attr("transform", e.transform)));

    g.append("g").attr("fill", "none").attr("stroke", "#555").attr("stroke-opacity", 0.4).attr("stroke-width", 1.5)
      .selectAll("path").data(root.links()).join("path").attr("d", d3.linkRadial().angle(d => d.x).radius(d => d.y));

    const node = g.append("g").attr("stroke-linejoin", "round").attr("stroke-width", 3)
      .selectAll("g").data(root.descendants()).join("g").attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`);

    node.append("circle").attr("fill", d => d.children ? "#555" : "#999").attr("r", 2.5);
    node.append("text").attr("dy", "0.31em").attr("x", d => d.x < Math.PI === !d.children ? 6 : -6)
      .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end").attr("transform", d => d.x >= Math.PI ? "rotate(180)" : null)
      .text(d => d.data.name).clone(true).lower().attr("stroke", "white");

    return () => svg.selectAll('*').remove();
  }, [parsedData, isCompatible, schema]);

  return (
    <div className="space-y-6">
      <PageTitle title="Radial Tidy Tree" />
      
      {loading ? (
        <div className="h-64 flex items-center justify-center"><Spinner /></div>
      ) : !isCompatible ? (
        <EmptyState title="Incompatible Dataset" description="This chart requires at least 2 categorical (string) columns." />
      ) : (
        <>
          <Card className="w-full flex justify-center overflow-hidden min-h-[600px] p-0 relative">
            <svg ref={svgRef} className="w-full h-full max-h-[800px]"></svg>
          </Card>
          <InsightAccordion insight="Radial trees efficiently display hierarchical relationships, radiating outward from a central root node." />
        </>
      )}
    </div>
  );
};
export default AdvancedChart1Page;
