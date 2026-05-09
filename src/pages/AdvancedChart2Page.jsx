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
import * as echarts from 'echarts';

const AdvancedChart2Page = () => {
  const { selectedDataset, parsedData, schema, loading } = useContext(DataContext);
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => res.json())
      .then(data => {
        fetch('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson')
          .then(res => res.json())
          .then(geoJson => {
            echarts.registerMap('world', geoJson);
            setGeoData(geoJson);
          });
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedDataset) {
      setConfig(selectedDataset.advancedChart2Config || null);
    }
  }, [selectedDataset]);

  const handleSaveConfig = async (newConfig) => {
    setConfig(newConfig);
    if (selectedDataset?.id) {
      try {
        await updateDatasetConfig(selectedDataset.id, newConfig, 'advancedChart2Config');
      } catch (e) {
        console.error("Failed to save config", e);
      }
    }
  };

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const isConfigured = config && config.geoCol && config.valCol;

  const isCompatible = () => {
    if (!schema) return false;
    if (!isConfigured) return true;
    const colNames = schema.columns.map(c => c.name);
    return colNames.includes(config.geoCol) && colNames.includes(config.valCol);
  };

  const filteredData = parsedData ? applyFilters(parsedData, filters) : [];

  const buildMapData = () => {
    if (!isConfigured || !filteredData || filteredData.length === 0) return [];

    const dataMap = new Map();
    filteredData.forEach(row => {
      const loc = String(row[config.geoCol]).trim();
      const val = Number(row[config.valCol]) || 0;
      if (!dataMap.has(loc)) {
        dataMap.set(loc, { sum: 0, count: 0 });
      }
      const current = dataMap.get(loc);
      current.sum += val;
      current.count += 1;
    });

    return Array.from(dataMap.entries()).map(([name, stats]) => {
      const agg = config.aggType || 'sum';
      let finalVal = stats.sum;
      if (agg === 'avg') finalVal = stats.sum / stats.count;
      else if (agg === 'count') finalVal = stats.count;
      return { name, value: finalVal };
    });
  };

  const mapData = buildMapData();
  const maxVal = mapData.length > 0 ? Math.max(...mapData.map(d => d.value)) : 100;

  const option = {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      showDelay: 0,
      transitionDuration: 0.2,
      formatter: function(params) {
        if (!params.value && params.value !== 0) return params.name;
        const aggLabel = config.aggType === 'avg' ? 'Average' : config.aggType === 'count' ? 'Count' : 'Total';
        const formattedVal = new Intl.NumberFormat().format(params.value);
        return `<strong>${params.name}</strong><br/>${aggLabel} of ${config.valCol}: ${formattedVal}`;
      }
    },
    visualMap: {
      left: 'right',
      min: 0,
      max: maxVal,
      inRange: {
        color: ['#E0F2FE', '#3F72AF', '#112D4E']
      },
      text: ['High', 'Low'],
      calculable: true
    },
    series: [
      {
        name: 'Map Value',
        type: 'map',
        roam: true,
        map: 'world',
        emphasis: {
          label: { show: true }
        },
        data: mapData
      }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <PageTitle title="Choropleth Map" />
          <p className="text-gray-500 dark:text-gray-400">View geographical distribution using Apache ECharts.</p>
        </div>
        {selectedDataset && (
          <Button variant={isEditing ? "primary" : "secondary"} onClick={() => setIsEditing(!isEditing)}>
            <Settings2 className="w-4 h-4 mr-2" />
            {isEditing ? "Close Builder" : "Edit Chart"}
          </Button>
        )}
      </div>

      {!loading && selectedDataset && (
        <FilterBar 
          schemaFilters={selectedDataset.dashboardConfig?.filters || []} 
          parsedData={parsedData}
          filters={filters} 
          onFilterChange={handleFilterChange} 
          onReset={() => setFilters({})}
        />
      )}
      
      {isEditing && selectedDataset && (
        <AdvancedBuilderPanel 
          config={config} 
          onSave={handleSaveConfig} 
          onClose={() => setIsEditing(false)}
          columns={schema?.columns?.map(c => c.name) || []}
          chartType="map"
        />
      )}

      {loading || (!geoData && selectedDataset) ? (
        <div className="h-64 flex items-center justify-center"><Spinner /></div>
      ) : !selectedDataset ? (
        <EmptyState title="No Dataset Selected" description="Please set a primary dataset in Data Management first." />
      ) : !isCompatible() ? (
        <EmptyState title="Incompatible Data Mapping" description="The selected columns do not exist in the current dataset schema." />
      ) : !isConfigured ? (
        <EmptyState title="Build Your Advanced Chart" description="Your chart is empty. Click 'Edit Chart' to map geographical data." />
      ) : (
        <>
          <Card className="w-full min-h-[500px] p-0 relative">
            <ReactECharts option={option} style={{ height: '600px', width: '100%' }} />
          </Card>
          <InsightAccordion insight="Map visualization matches country names from data with the world geojson feature properties." />
        </>
      )}
    </div>
  );
};

export default AdvancedChart2Page;
