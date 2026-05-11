import { useContext, useMemo, useState, useEffect } from 'react';
import { DataContext } from '../context/DataContext';
import PageTitle from '../components/ui/PageTitle';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import FilterBar from '../components/dashboard/FilterBar';
import StatCard from '../components/dashboard/StatCard';
import ChartGrid from '../components/dashboard/ChartGrid';
import Card from '../components/ui/Card';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';
import PieChart from '../components/charts/PieChart';
import ScatterChart from '../components/charts/ScatterChart';
import InsightAccordion from '../components/dashboard/InsightAccordion';
import DashboardBuilderPanel from '../components/dashboard/DashboardBuilderPanel';
import Button from '../components/ui/Button';
import { Settings2 } from 'lucide-react';
import { applyFilters, aggregateData, formatDateValue } from '../services/aggregationEngine';
import { updateDatasetConfig } from '../services/firebase';

const DashboardPage = () => {
  const { selectedDataset, parsedData, schema, loading } = useContext(DataContext);
  const [filters, setFilters] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [dashboardConfig, setDashboardConfig] = useState(null);

  useEffect(() => {
    if (selectedDataset) {
      setDashboardConfig(selectedDataset.dashboardConfig || { filters: [], kpiCards: [], charts: [] });
    }
  }, [selectedDataset]);

  const handleSaveConfig = async (newConfig) => {
    setDashboardConfig(newConfig);
    if (selectedDataset?.id) {
      try {
        await updateDatasetConfig(selectedDataset.id, newConfig);
      } catch (e) {
        console.error("Failed to save config to firebase", e);
      }
    }
  };

  const activeConfig = dashboardConfig || { filters: [], kpiCards: [], charts: [] };

  const filteredData = useMemo(() => {
    if (!parsedData || parsedData.length === 0) return [];
    return applyFilters(parsedData, filters);
  }, [parsedData, filters]);

  const kpis = useMemo(() => {
    if (!activeConfig.kpiCards || filteredData.length === 0) return [];
    return activeConfig.kpiCards.map(kpi => {
      let value = 0;
      if (kpi.aggType === 'countUnique' || kpi.agg === 'countUnique') {
        value = new Set(filteredData.map(r => r[kpi.column])).size;
      } else {
        value = aggregateData(filteredData, null, kpi.column, kpi.aggType || kpi.agg);
      }
      
      let formattedValue = value;
      if (kpi.format === 'raw') {
        formattedValue = Number(value).toFixed(kpi.decimals ?? 0);
      } else {
        formattedValue = new Intl.NumberFormat('en-US', {
          minimumFractionDigits: kpi.decimals ?? 0,
          maximumFractionDigits: kpi.decimals ?? 0,
        }).format(value);
      }
      
      return { 
        label: kpi.label || kpi.column, 
        value: `${kpi.prefix || ''}${formattedValue}`.trim()
      };
    });
  }, [activeConfig.kpiCards, filteredData]);

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const isDataEmpty = !selectedDataset || !parsedData || parsedData.length === 0;

  const renderChart = (chartConfig) => {
    let chartData = [];
    const dim = chartConfig.dimension || chartConfig.xAxis || chartConfig.category;
    const meas = chartConfig.measure || chartConfig.yAxis || chartConfig.value;
    const agg = chartConfig.aggType || 'sum';
    const isHorizontal = chartConfig.orientation === 'horizontal';

    const dateFormat = chartConfig.dateFormat;

    if (chartConfig.type === 'BarChart' || chartConfig.type === 'LineChart') {
      let aggResults = aggregateData(filteredData, dim, meas, agg);
      if (dateFormat && dateFormat !== 'auto') {
        // Re-aggregate with formatted dates
        const formatted = filteredData.map(r => ({ ...r, [`__fmt_${dim}`]: formatDateValue(r[dim], dateFormat) }));
        const fmtDim = `__fmt_${dim}`;
        aggResults = aggregateData(formatted, fmtDim, meas, agg);
        chartData = aggResults.map(r => ({ label: String(r[fmtDim]), value: r[meas] }));
      } else {
        chartData = aggResults.map(r => ({ label: String(r[dim]), value: r[meas] }));
      }
    } else if (chartConfig.type === 'PieChart') {
      let aggResults = aggregateData(filteredData, dim, meas, agg);
      if (dateFormat && dateFormat !== 'auto') {
        const formatted = filteredData.map(r => ({ ...r, [`__fmt_${dim}`]: formatDateValue(r[dim], dateFormat) }));
        const fmtDim = `__fmt_${dim}`;
        aggResults = aggregateData(formatted, fmtDim, meas, agg);
        chartData = aggResults.map(r => ({ id: String(r[fmtDim]), label: String(r[fmtDim]), value: r[meas] }));
      } else {
        chartData = aggResults.map(r => ({ id: String(r[dim]), label: String(r[dim]), value: r[meas] }));
      }
    } else if (chartConfig.type === 'ScatterChart') {
      const detailDim = chartConfig.detailDim;
      if (detailDim) {
        // Aggregate X and Y per detail dimension category
        const grouped = {};
        filteredData.forEach(row => {
          const cat = String(row[detailDim] || '');
          if (!grouped[cat]) grouped[cat] = { xVals: [], yVals: [] };
          grouped[cat].xVals.push(Number(row[dim]) || 0);
          grouped[cat].yVals.push(Number(row[meas]) || 0);
        });
        const xAgg = chartConfig.xAgg || 'avg';
        const yAgg = chartConfig.yAgg || 'sum';
        const aggFn = (arr, type) => {
          const s = arr.reduce((a, b) => a + b, 0);
          return type === 'avg' ? s / arr.length : s;
        };
        chartData = Object.entries(grouped).map(([cat, vals]) => ({
          x: aggFn(vals.xVals, xAgg),
          y: aggFn(vals.yVals, yAgg),
          category: cat
        }));
      } else {
        chartData = filteredData.map(row => ({ 
          x: Number(row[dim]) || 0, 
          y: Number(row[meas]) || 0, 
          category: 'Data Point' 
        }));
      }
    }

    const ChartComp = { 'BarChart': BarChart, 'LineChart': LineChart, 'PieChart': PieChart, 'ScatterChart': ScatterChart }[chartConfig.type];
    if (!ChartComp) return null;

    const title = chartConfig.title || `${meas} by ${dim}`;

    return (
      <Card key={chartConfig.id || chartConfig.type + dim} className="flex flex-col h-[450px]">
        <h3 className="font-semibold text-lg text-(--color-dark) dark:text-white mb-4">{title}</h3>
        <div className="flex-1 relative"><ChartComp data={chartData} orientation={chartConfig.orientation} /></div>
        <InsightAccordion insight={`Displaying ${chartConfig.type === 'ScatterChart' ? 'distribution of' : 'aggregated values for'} ${meas} by ${dim}.`} />
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <PageTitle title="Dashboard" />
          <p className="text-gray-500 dark:text-gray-400">Here's what's happening with your data today.</p>
        </div>
        {!isDataEmpty && (
          <Button variant={isEditing ? "primary" : "secondary"} onClick={() => setIsEditing(!isEditing)}>
            <Settings2 className="w-4 h-4 mr-2" />
            {isEditing ? "Close Builder" : "Edit Dashboard"}
          </Button>
        )}
      </div>

      {isEditing && !isDataEmpty && (
        <DashboardBuilderPanel 
          config={activeConfig} 
          onSave={handleSaveConfig} 
          onClose={() => setIsEditing(false)}
          columns={schema?.columns?.map(c => c.name) || []}
          schema={schema} 
        />
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center"><Spinner /></div>
      ) : isDataEmpty ? (
        <EmptyState title="No Data Available" description="Please go to Data Management and set a dataset as primary to view the dashboard." />
      ) : (!activeConfig.filters?.length && !activeConfig.kpiCards?.length && !activeConfig.charts?.length && !isEditing) ? (
        <EmptyState title="Build Your Dashboard" description="Your dashboard is empty. Click 'Edit Dashboard' to add filters, KPI cards, and charts." />
      ) : (
        <>
          {activeConfig.filters && activeConfig.filters.length > 0 && (
            <FilterBar 
              schemaFilters={activeConfig.filters} 
              parsedData={parsedData} 
              filters={filters} 
              onFilterChange={handleFilterChange} 
              onReset={() => setFilters({})} 
            />
          )}

          {kpis.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">{kpis.map((stat, idx) => <StatCard key={idx} stat={stat} />)}</div>}
          {activeConfig.charts && activeConfig.charts.length > 0 && <ChartGrid>{activeConfig.charts.map(renderChart)}</ChartGrid>}
        </>
      )}
    </div>
  );
};
export default DashboardPage;
