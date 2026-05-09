import { useContext, useEffect, useState } from 'react';
import { DataContext } from '../context/DataContext';
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
import ReactECharts from 'echarts-for-react';

const AdvancedChart1Page = () => {
  const { selectedDataset, parsedData, schema, loading } = useContext(DataContext);
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState(null);
  const [filters, setFilters] = useState({});

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

  // For Radial Tree, ECharts tree requires hierarchical data.
  // We can convert the graph nodes/links into a tree.
  const buildTree = (graph) => {
    if (!graph.nodes || graph.nodes.length === 0) return { name: 'Root', children: [] };
    
    // Find all nodes that are targets
    const targetSet = new Set(graph.links.map(l => l.target));
    // Sources are nodes that are never targets
    let rootNodes = graph.nodes.filter(n => !targetSet.has(n.id));
    
    if (rootNodes.length === 0) {
      // Cyclic graph fallback: just pick the first node
      rootNodes = [graph.nodes[0]];
    }

    const buildChildren = (nodeId, depth) => {
      if (depth > 5) return []; // Prevent infinite recursion in cyclic graphs
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

    const treeData = {
      name: 'Root',
      children: rootNodes.map(n => ({
        name: n.name,
        value: n.value,
        children: buildChildren(n.id, 0)
      }))
    };

    // If there's only one root node, simplify
    if (treeData.children.length === 1) {
      return treeData.children[0];
    }

    return treeData;
  };

  const graphData = isConfigured && filteredData ? flatToGraph(filteredData, config.dimensions, config.weightCol, config.aggType) : { nodes: [], links: [] };
  const treeData = buildTree(graphData);

  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      formatter: function(params) {
        const val = new Intl.NumberFormat('en-US', { notation: 'compact' }).format(params.value);
        return `${params.name}: ${val}`;
      }
    },
    series: [
      {
        type: 'tree',
        data: [treeData],
        top: '5%',
        bottom: '5%',
        left: '5%',
        right: '5%',
        layout: 'radial',
        symbol: 'circle',
        symbolSize: 12,
        initialTreeDepth: -1,
        animationDurationUpdate: 750,
        roam: 'move',
        expandAndCollapse: true,
        label: {
          show: true,
          position: 'right',
          distance: 7,
          formatter: function(params) {
            if (!params.value) return params.name;
            const val = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(params.value);
            return `{name|${params.name}} {val|${val}}`;
          },
          rich: {
            name: { color: '#112D4E', fontSize: 12, fontWeight: 'bold' },
            val: { color: '#3F72AF', fontSize: 11, fontWeight: 'bold' }
          }
        },
        itemStyle: {
          color: '#3F72AF',
          borderColor: '#112D4E',
          borderWidth: 1.5
        },
        lineStyle: {
          color: '#ccc',
          curveness: 0.5,
          width: 1.5
        }
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <PageTitle title="Radial Tree Diagram" />
          <p className="text-gray-500 dark:text-gray-400">Visualize hierarchical structure radiating outward using Apache ECharts.</p>
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
        <EmptyState title="Build Your Advanced Chart" description="Your chart is empty. Click 'Edit Chart' to define source and target nodes." />
      ) : (
        <>
          <Card className="w-full min-h-[700px] p-0 relative overflow-hidden bg-gray-50 dark:bg-gray-900 border-2 dark:border-[#3F72AF]/30">
            <ReactECharts option={option} style={{ height: '700px', width: '100%' }} />
          </Card>
          <InsightAccordion insight="Radial trees efficiently display hierarchical relationships. Use the mouse wheel to zoom in/out, and click and drag to pan around the graph." />
        </>
      )}
    </div>
  );
};

export default AdvancedChart1Page;
