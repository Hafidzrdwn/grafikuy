import { useContext, useEffect, useState, useRef } from 'react';
import { DataContext } from '@/context/DataContext';
import * as d3 from 'd3';
import PageTitle from '@/components/ui/PageTitle';
import Card from '@/components/ui/Card';
import InsightAccordion from '@/components/dashboard/InsightAccordion';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import AdvancedBuilderPanel from '@/components/dashboard/AdvancedBuilderPanel';
import FilterBar from '@/components/dashboard/FilterBar';
import Button from '@/components/ui/Button';
import { Settings2 } from 'lucide-react';
import { updateDatasetConfig } from '@/services/firebase';
import { flatToGraph, applyFilters } from '@/services/aggregationEngine';

const AdvancedChart1Page = () => {
  const { selectedDataset, parsedData, schema, loading } = useContext(DataContext);
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState(null);
  const [filters, setFilters] = useState({});
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (selectedDataset) {
      setConfig(selectedDataset.advancedChart1Config || null);
    }
  }, [selectedDataset]);

  const handleSaveConfig = async (newConfig) => {
    setConfig(newConfig);
    if (selectedDataset?.id) {
      try {
        await updateDatasetConfig(selectedDataset.id, newConfig, 'advancedChart1Config');
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

  const buildTree = (graph) => {
    if (!graph.nodes || graph.nodes.length === 0) return { name: 'Root', children: [], value: 0 };
    const targetSet = new Set(graph.links.map(l => l.target));
    let rootNodes = graph.nodes.filter(n => !targetSet.has(n.id));
    if (rootNodes.length === 0) rootNodes = [graph.nodes[0]];

    const buildChildren = (nodeId, depth) => {
      if (depth > 5) return [];
      const childrenLinks = graph.links.filter(l => l.source === nodeId);
      return childrenLinks.map(l => {
        const tgtNode = graph.nodes.find(n => n.id === l.target);
        return {
          name: tgtNode ? tgtNode.name : l.target,
          value: l.value,
          children: buildChildren(l.target, depth + 1)
        };
      });
    };

    const sumTreeValues = (node) => {
      if (!node.children || node.children.length === 0) return node.value || 0;
      let total = node.value || 0;
      node.children.forEach(child => { total += sumTreeValues(child); });
      return total;
    };

    const treeData = {
      name: 'All Data',
      children: rootNodes.map(n => ({
        name: n.name,
        value: n.value,
        children: buildChildren(n.id, 0)
      }))
    };

    treeData.value = sumTreeValues(treeData);

    if (treeData.children.length === 1) {
      const single = treeData.children[0];
      single.value = sumTreeValues(single);
      return single;
    }
    return treeData;
  };

  const graphData = isConfigured && filteredData ? flatToGraph(filteredData, config.dimensions, config.weightCol, config.aggType) : { nodes: [], links: [] };
  const treeData = buildTree(graphData);

  useEffect(() => {
    if (!isConfigured || !svgRef.current || graphData.nodes.length === 0) return;
    
    const width = 900, height = 900;
    const cx = width / 2, cy = height / 2;
    const radius = Math.min(width, height) / 2 - 100;

    const svg = d3.select(svgRef.current)
      .attr('viewBox', [-cx, -cy, width, height])
      .style('width', '100%')
      .style('height', 'auto')
      .style('font', '11px sans-serif');
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
      .style('box-shadow', '0 4px 12px rgb(0 0 0 / 0.15)')
      .style('color', '#333');

    const root = d3.hierarchy(treeData).sort((a, b) => d3.ascending(a.data.name, b.data.name));
    d3.cluster().size([2 * Math.PI, radius])(root);

    const g = svg.append('g');
    svg.call(d3.zoom().scaleExtent([0.3, 5]).on('zoom', e => g.attr('transform', e.transform)));

    g.append('g')
      .attr('fill', 'none')
      .attr('stroke', '#3F72AF')
      .attr('stroke-opacity', 0.35)
      .attr('stroke-width', 1.5)
      .selectAll('path')
      .data(root.links())
      .join('path')
      .attr('d', d3.linkRadial().angle(d => d.x).radius(d => d.y));

    const node = g.append('g')
      .attr('stroke-linejoin', 'round')
      .attr('stroke-width', 3)
      .selectAll('g')
      .data(root.descendants())
      .join('g')
      .attr('transform', d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`);

    node.append('circle')
      .attr('fill', d => d.children ? '#3F72AF' : '#112D4E')
      .attr('r', d => d.children ? 5 : 4)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).attr('r', 8).attr('fill', '#5A96E3');
        const val = d.data.value ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(d.data.value) : '';
        tooltip.transition().duration(200).style('opacity', 0.95);
        tooltip.html(`<strong>${d.data.name}</strong>${val ? '<br/>Value: ' + val : ''}`)
          .style('left', (event.clientX + 14) + 'px')
          .style('top', (event.clientY - 30) + 'px');
      })
      .on('mousemove', (event) => {
        tooltip.style('left', (event.clientX + 14) + 'px').style('top', (event.clientY - 30) + 'px');
      })
      .on('mouseout', (event, d) => {
        d3.select(event.currentTarget).attr('r', d.children ? 5 : 4).attr('fill', d.children ? '#3F72AF' : '#112D4E');
        tooltip.transition().duration(400).style('opacity', 0);
      });

    node.append('text')
      .attr('dy', '0.31em')
      .attr('x', d => d.x < Math.PI === !d.children ? 6 : -6)
      .attr('text-anchor', d => d.x < Math.PI === !d.children ? 'start' : 'end')
      .attr('transform', d => d.x >= Math.PI ? 'rotate(180)' : null)
      .text(d => {
        const val = d.data.value ? new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(d.data.value) : '';
        return val ? `${d.data.name} ${val}` : d.data.name;
      })
      .attr('fill', '#112D4E')
      .attr('font-weight', d => d.children ? 'bold' : 'normal')
      .attr('font-size', d => d.depth === 0 ? '14px' : '11px')
      .clone(true).lower().attr('stroke', 'white');

    return () => { svg.selectAll('*').remove(); d3.select(tooltipRef.current).style('opacity', 0); };
  }, [graphData, isConfigured, treeData]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between md:items-center md:flex-row flex-col gap-y-4">
        <div>
          <PageTitle title="Radial Tree Diagram" />
          <p className="text-gray-500 dark:text-gray-400">Visualize hierarchical structure radiating outward using D3.js.</p>
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
          <Card className="w-full min-h-175 p-0 relative overflow-hidden bg-gray-50 dark:bg-gray-900 border-2 dark:border-[#3F72AF]/30">
            <div className="relative w-full h-full">
              <svg ref={svgRef} className="w-full h-full min-h-175" />
              <div ref={tooltipRef} className="dark:text-gray-800" />
            </div>
          </Card>
          <InsightAccordion insight="Radial trees display hierarchical relationships. Use scroll to zoom and drag to pan." />
        </>
      )}
    </div>
  );
};

export default AdvancedChart1Page;
