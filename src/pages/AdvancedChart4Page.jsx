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
import { applyFilters } from '../services/aggregationEngine';
import ReactECharts from 'echarts-for-react';

const AdvancedChart4Page = () => {
  const { selectedDataset, parsedData, schema, loading } = useContext(DataContext);
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    if (selectedDataset) {
      setConfig(selectedDataset.advancedChart4Config || null);
    }
  }, [selectedDataset]);

  const handleSaveConfig = async (newConfig) => {
    setConfig(newConfig);
    if (selectedDataset?.id) {
      try {
        await updateDatasetConfig(selectedDataset.id, newConfig, 'advancedChart4Config');
      } catch (e) {
        console.error("Failed to save config", e);
      }
    }
  };

  const isConfigured = config && config.dateCol && config.catCol && config.valCol;

  const isCompatible = () => {
    if (!schema) return false;
    if (!isConfigured) return true;
    const colNames = schema.columns.map(c => c.name);
    return colNames.includes(config.dateCol) && colNames.includes(config.catCol) && colNames.includes(config.valCol);
  };

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const filteredData = parsedData ? applyFilters(parsedData, filters) : [];

  const buildStreamData = () => {
    if (!isConfigured || !filteredData || filteredData.length === 0) return { xAxis: [], series: [], legend: [] };

    // Group by Date, then by Category, summing Value
    const grouped = new Map();
    const categories = new Set();

    filteredData.forEach(row => {
      let dateVal = row[config.dateCol];
      // Format date nicely if needed, or stringify
      if (typeof dateVal === 'number' && dateVal > 40000 && dateVal < 50000) {
        // Excel serial date approximation (if any left over)
        dateVal = new Date((dateVal - 25569) * 86400 * 1000).toISOString().split('T')[0];
      } else if (dateVal instanceof Date) {
        dateVal = dateVal.toISOString().split('T')[0];
      } else {
        dateVal = String(dateVal);
      }

      const catVal = String(row[config.catCol]);
      const val = Number(row[config.valCol]) || 0;

      categories.add(catVal);

      if (!grouped.has(dateVal)) {
        grouped.set(dateVal, new Map());
      }
      const dateMap = grouped.get(dateVal);
      dateMap.set(catVal, (dateMap.get(catVal) || 0) + val);
    });

    const xAxis = Array.from(grouped.keys()).sort();
    const legend = Array.from(categories);
    const series = legend.map(cat => {
      return {
        name: cat,
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: { width: 0 },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8
        },
        emphasis: {
          focus: 'series'
        },
        data: xAxis.map(date => grouped.get(date).get(cat) || 0)
      };
    });

    return { xAxis, series, legend };
  };

  const streamData = buildStreamData();

  const option = {
    color: ['#3F72AF', '#112D4E', '#80C4E9', '#96C9F4', '#5A96E3', '#2A4A7F'],
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: { backgroundColor: '#6a7985' }
      }
    },
    legend: {
      data: streamData.legend,
      top: 10
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: streamData.xAxis
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: streamData.series
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <PageTitle title="Streamgraph" />
          <p className="text-gray-500 dark:text-gray-400">View volume distribution over a continuous axis using ECharts.</p>
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
          chartType="stream"
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
        <EmptyState title="Build Your Advanced Chart" description="Your chart is empty. Click 'Edit Chart' to map your data streams." />
      ) : (
        <>
          <Card className="w-full min-h-[500px] p-0 relative pt-12">
            <ReactECharts option={option} style={{ height: '500px', width: '100%' }} />
          </Card>
          <InsightAccordion insight="Streamgraphs show volume over time stacked symmetrically, ideal for temporal trends." />
        </>
      )}
    </div>
  );
};

export default AdvancedChart4Page;
