import { useContext, useEffect, useRef, useMemo } from 'react';
import { DataContext } from '../context/DataContext';
import * as d3 from 'd3';
import PageTitle from '../components/ui/PageTitle';
import Card from '../components/ui/Card';
import InsightAccordion from '../components/dashboard/InsightAccordion';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';

const AdvancedChart3Page = () => {
  const { parsedData, schema, loading } = useContext(DataContext);
  const svgRef = useRef();

  const isCompatible = useMemo(() => {
    if (!schema) return false;
    const strCols = schema.columns.filter(c => c.type === 'string');
    return strCols.length >= 2;
  }, [schema]);

  useEffect(() => {
    if (!isCompatible || !parsedData || parsedData.length === 0) return;
    const width = 800, height = 600;
    const svg = d3.select(svgRef.current).attr("viewBox", [0, 0, width, height]).style("width", "100%").style("height", "auto");
    svg.selectAll('*').remove();

    const strCols = schema.columns.filter(c => c.type === 'string');
    const sourceCol = strCols[0].name, targetCol = strCols[1].name;
    const nodesMap = new Map();
    const links = [];

    parsedData.forEach(d => {
      const src = String(d[sourceCol]), tgt = String(d[targetCol]);
      if (!nodesMap.has(src)) nodesMap.set(src, { id: src, group: 1 });
      if (!nodesMap.has(tgt)) nodesMap.set(tgt, { id: tgt, group: 2 });
      links.push({ source: src, target: tgt });
    });

    const nodes = Array.from(nodesMap.values());
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id))
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const g = svg.append("g");
    svg.call(d3.zoom().on("zoom", e => g.attr("transform", e.transform)));

    const link = g.append("g").attr("stroke", "#999").attr("stroke-opacity", 0.6)
      .selectAll("line").data(links).join("line").attr("stroke-width", 1);

    const node = g.append("g").attr("stroke", "#fff").attr("stroke-width", 1.5)
      .selectAll("circle").data(nodes).join("circle").attr("r", 5)
      .attr("fill", d => d.group === 1 ? "#3F72AF" : "#112D4E")
      .call(d3.drag()
        .on("start", e => { if (!e.active) simulation.alphaTarget(0.3).restart(); e.subject.fx = e.subject.x; e.subject.fy = e.subject.y; })
        .on("drag", e => { e.subject.fx = e.x; e.subject.fy = e.y; })
        .on("end", e => { if (!e.active) simulation.alphaTarget(0); e.subject.fx = null; e.subject.fy = null; }));

    node.append("title").text(d => d.id);

    simulation.on("tick", () => {
      link.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("cx", d => d.x).attr("cy", d => d.y);
    });

    return () => { simulation.stop(); svg.selectAll('*').remove(); };
  }, [parsedData, isCompatible, schema]);

  return (
    <div className="space-y-6">
      <PageTitle title="Force Graph" />
      
      {loading ? (
        <div className="h-64 flex items-center justify-center"><Spinner /></div>
      ) : !isCompatible ? (
        <EmptyState title="Incompatible Dataset" description="Requires at least 2 categorical columns to form source-target relationships." />
      ) : (
        <>
          <Card className="w-full min-h-[500px] p-0 relative">
            <svg ref={svgRef} className="w-full h-full min-h-[600px]"></svg>
          </Card>
          <InsightAccordion insight="Drag nodes to interact. Displays network relationships and clusters." />
        </>
      )}
    </div>
  );
};
export default AdvancedChart3Page;
