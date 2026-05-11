import { useContext, useEffect, useState, useRef } from 'react';
import { DataContext } from '../context/DataContext';
import * as d3 from 'd3';
import PageTitle from '../components/ui/PageTitle';
import Card from '../components/ui/Card';
import InsightAccordion from '../components/dashboard/InsightAccordion';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import AdvancedBuilderPanel from '../components/dashboard/AdvancedBuilderPanel';
import FilterBar from '../components/dashboard/FilterBar';
import Button from '../components/ui/Button';
import { Settings2 } from 'lucide-react';
import { updateDatasetConfig } from '../services/firebase';
import { flatToGraph, applyFilters } from '../services/aggregationEngine';

const AdvancedChart3Page = () => {
  const { selectedDataset, parsedData, schema, loading } = useContext(DataContext);
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState(null);
  const [filters, setFilters] = useState({});
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (selectedDataset) {
      setConfig(selectedDataset.advancedChart3Config || null);
    }
  }, [selectedDataset]);

  const handleSaveConfig = async (newConfig) => {
    setConfig(newConfig);
    if (selectedDataset?.id) {
      try {
        await updateDatasetConfig(selectedDataset.id, newConfig, 'advancedChart3Config');
      } catch (e) {
        console.error("Failed to save config", e);
      }
    }
  };

  const isConfigured = config && config.dimensions && config.dimensions.length >= 2 && config.dimensions.every(d => d !== '');

  const isCompatible = () => {
    if (!schema) return false;
    if (!isConfigured) return true;
    const colNames = schema.columns.map(c => c.name);
    return config.dimensions.every(dim => colNames.includes(dim));
  };

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const filteredData = parsedData ? applyFilters(parsedData, filters) : [];

  const rawGraphData = isConfigured && filteredData ? flatToGraph(filteredData, config.dimensions, config.weightCol, config.aggType) : { nodes: [], links: [] };

  const maxNodes = config?.maxNodes || 200;
  const graphData = {
    nodes: rawGraphData.nodes.slice(0, maxNodes),
    links: rawGraphData.links.filter(l => {
      const nodeIds = new Set(rawGraphData.nodes.slice(0, maxNodes).map(n => n.id));
      return nodeIds.has(l.source) && nodeIds.has(l.target);
    })
  };

  useEffect(() => {
    if (!isConfigured || !svgRef.current || graphData.nodes.length === 0) return;

    const width = 800, height = 600;
    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height])
      .style('width', '100%')
      .style('height', 'auto');
    svg.selectAll('*').remove();

    const tooltip = d3.select(tooltipRef.current)
      .style('opacity', 0)
      .style('position', 'fixed')
      .style('z-index', '9999')
      .style('background', 'white')
      .style('border', '1px solid #ccc')
      .style('border-radius', '6px')
      .style('padding', '10px 14px')
      .style('pointer-events', 'none')
      .style('font-size', '12px')
      .style('box-shadow', '0 4px 12px rgb(0 0 0 / 0.15)')
      .style('color', '#333');

    const levels = config.dimensions || [];
    const colors = ['#3F72AF', '#112D4E', '#80C4E9', '#96C9F4', '#5A96E3'];

    const nodes = graphData.nodes.map(n => ({ ...n }));
    const links = graphData.links.map(l => ({ source: l.source, target: l.target, value: l.value }));

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id).distance(60))
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => d.symbolSize / 2 + 5));

    const g = svg.append('g');
    svg.call(d3.zoom().scaleExtent([0.3, 5]).on('zoom', e => g.attr('transform', e.transform)));

    const link = g.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.4)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', d => Math.max(1, Math.min(d.value / 100, 4)));

    const node = g.append('g')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', d => Math.max(4, d.symbolSize / 3))
      .attr('fill', d => {
        const idx = levels.indexOf(d.category);
        return colors[idx % colors.length] || '#112D4E';
      })
      .call(d3.drag()
        .on('start', e => { if (!e.active) simulation.alphaTarget(0.3).restart(); e.subject.fx = e.subject.x; e.subject.fy = e.subject.y; })
        .on('drag', e => { e.subject.fx = e.x; e.subject.fy = e.y; })
        .on('end', e => { if (!e.active) simulation.alphaTarget(0); e.subject.fx = null; e.subject.fy = null; }))
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).attr('r', Math.max(6, d.symbolSize / 2));
        const val = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(d.value);
        tooltip.transition().duration(200).style('opacity', 0.95);
        tooltip.html(`<strong>${d.name}</strong><br/>Level: ${d.category}<br/>Weight: ${val}`)
          .style('left', (event.clientX + 14) + 'px')
          .style('top', (event.clientY - 30) + 'px');
      })
      .on('mousemove', (event) => {
        tooltip.style('left', (event.clientX + 14) + 'px').style('top', (event.clientY - 30) + 'px');
      })
      .on('mouseout', (event, d) => {
        d3.select(event.currentTarget).attr('r', Math.max(4, d.symbolSize / 3));
        tooltip.transition().duration(400).style('opacity', 0);
      });

    node.append('title').text(d => d.name);

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
      node
        .attr('cx', d => d.x).attr('cy', d => d.y);
    });

    return () => { simulation.stop(); svg.selectAll('*').remove(); d3.select(tooltipRef.current).style('opacity', 0); };
  }, [graphData, isConfigured, config]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between md:items-center md:flex-row flex-col gap-y-4">
        <div>
          <PageTitle title="Force Directed Graph" />
          <p className="text-gray-500 dark:text-gray-400">Visualize complex network relationships using D3.js.</p>
        </div>
        {selectedDataset && (
          <Button variant={isEditing ? "primary" : "secondary"} onClick={() => setIsEditing(!isEditing)}>
            <Settings2 className="w-4 h-4 mr-2" />
            {isEditing ? "Close Builder" : "Edit Chart"}
          </Button>
        )}
      </div>
      
      {isEditing && selectedDataset && (
        <AdvancedBuilderPanel 
          config={config} 
          onSave={handleSaveConfig} 
          onClose={() => setIsEditing(false)}
          columns={schema?.columns?.map(c => c.name) || []} 
        />
      )}

      {!loading && selectedDataset && (
        <FilterBar 
          schemaFilters={selectedDataset.dashboardConfig?.filters || []} 
          parsedData={parsedData}
          filters={filters} 
          onFilterChange={handleFilterChange} 
          onReset={() => setFilters({})}
        />
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center"><Spinner /></div>
      ) : !selectedDataset ? (
        <EmptyState title="No Dataset Selected" description="Please set a primary dataset in Data Management first." />
      ) : !isCompatible() ? (
        <EmptyState title="Incompatible Data Mapping" description="The selected columns do not exist in the current dataset schema." />
      ) : !isConfigured ? (
        <EmptyState title="Build Your Advanced Chart" description="Your chart is empty. Click 'Edit Chart' to define hierarchy levels." />
      ) : (
        <>
          <Card className="w-full min-h-125 p-0 relative">
            <div className="relative w-full h-full">
              <svg ref={svgRef} className="w-full h-full min-h-150" />
              <div ref={tooltipRef} className="dark:text-gray-800" />
            </div>
          </Card>
          <InsightAccordion insight={`Network graph mapping ${graphData.nodes.length} unique nodes and ${graphData.links.length} connections. Drag nodes to interact.`} />
        </>
      )}
    </div>
  );
};

export default AdvancedChart3Page;
