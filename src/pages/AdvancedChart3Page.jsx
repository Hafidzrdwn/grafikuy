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

const AdvancedChart3Page = () => {
  const { selectedDataset, parsedData, schema, loading } = useContext(DataContext);
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    if (selectedDataset) {
      setConfig(selectedDataset.advancedChart3Config || null);
    }
  }, [selectedDataset]);

  const handleSaveConfig = async (newConfig) => {
    setConfig(newConfig);
    if (selectedDataset?.id) {
      try {
        await updateDatasetConfig(selectedDataset.id, { ...selectedDataset.dashboardConfig, advancedChart3Config: newConfig }, 'advancedChart3Config');
      } catch (e) {
        console.error("Failed to save config", e);
      }
    }
  };

  const isConfigured = config && config.dimensions && config.dimensions.length >= 2 && config.dimensions.every(d => d !== '');

  const isCompatible = () => {
    if (!schema) return false;
    if (!isConfigured) return true; // Still compatible for building
    // Check if the configured columns exist in schema
    const colNames = schema.columns.map(c => c.name);
    return config.dimensions.every(dim => colNames.includes(dim));
  };

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const filteredData = parsedData ? applyFilters(parsedData, filters) : [];

  const graphData = isConfigured && filteredData ? flatToGraph(filteredData, config.dimensions, config.weightCol, config.aggType) : { nodes: [], links: [] };

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: function (params) {
        if (params.dataType === 'node') {
          return `Level (${params.data.category}): ${params.data.name}<br/>Weight: ${params.data.value}`;
        } else {
          return `${params.data.source} > ${params.data.target}<br/>Weight: ${params.data.value}`;
        }
      }
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: graphData.nodes,
        links: graphData.links,
        roam: true,
        label: {
          show: true,
          position: 'right',
          formatter: '{b}'
        },
        force: {
          repulsion: 100,
          edgeLength: 50
        },
        itemStyle: {
          color: function(params) {
            // Pick a color based on category/level
            const levels = config.dimensions || [];
            const idx = levels.indexOf(params.data.category);
            const colors = ['#3F72AF', '#112D4E', '#80C4E9', '#96C9F4', '#5A96E3'];
            return colors[idx % colors.length] || '#112D4E';
          }
        },
        lineStyle: {
          color: 'source',
          curveness: 0.3
        }
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <PageTitle title="Force Directed Graph" />
          <p className="text-gray-500 dark:text-gray-400">Visualize complex network relationships using Apache ECharts.</p>
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
          <Card className="w-full min-h-[500px] p-0 relative">
            <ReactECharts option={option} style={{ height: '600px', width: '100%' }} />
          </Card>
          <InsightAccordion insight={`Network graph mapping ${graphData.nodes.length} unique nodes and ${graphData.links.length} connections.`} />
        </>
      )}
    </div>
  );
};

export default AdvancedChart3Page;
