import { useContext, useMemo, useState } from 'react';
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

const DashboardPage = () => {
  const { selectedDataset, parsedData, schema, loading } = useContext(DataContext);
  const [filters, setFilters] = useState({});

  const filteredData = useMemo(() => {
    if (!parsedData || parsedData.length === 0) return [];
    let data = parsedData;
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '' && value !== null) {
        data = data.filter(row => String(row[key]) === String(value));
      }
    });
    return data;
  }, [parsedData, filters]);

  const kpis = useMemo(() => {
    if (!schema?.suggestedKPIs || filteredData.length === 0) return [];
    return schema.suggestedKPIs.map(kpi => {
      let value = 0;
      if (kpi.agg === 'avg') {
        const sum = filteredData.reduce((acc, row) => acc + (Number(row[kpi.column]) || 0), 0);
        value = (sum / filteredData.length).toFixed(2);
      } else if (kpi.agg === 'countUnique') {
        value = new Set(filteredData.map(r => r[kpi.column])).size;
      }
      return { label: kpi.label, value, trend: 'up', trendValue: '+0%' };
    });
  }, [schema, filteredData]);

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const isDataEmpty = !selectedDataset || !parsedData || parsedData.length === 0;

  const renderChart = (chartConfig) => {
    let chartData = [];
    if (chartConfig.type === 'BarChart' || chartConfig.type === 'LineChart') {
      const agg = {};
      filteredData.forEach(row => {
        const x = row[chartConfig.xAxis];
        const y = Number(row[chartConfig.yAxis]) || 0;
        if (!agg[x]) agg[x] = 0;
        agg[x] += y;
      });
      chartData = Object.keys(agg).map(k => ({ label: String(k), value: agg[k] }));
    } else if (chartConfig.type === 'PieChart') {
      const agg = {};
      filteredData.forEach(row => {
        const cat = row[chartConfig.category];
        const val = Number(row[chartConfig.value]) || 0;
        if (!agg[cat]) agg[cat] = 0;
        agg[cat] += val;
      });
      chartData = Object.keys(agg).map(k => ({ id: String(k), label: String(k), value: agg[k] }));
    } else if (chartConfig.type === 'ScatterChart') {
      chartData = filteredData.map(row => ({ x: Number(row[chartConfig.xAxis]) || 0, y: Number(row[chartConfig.yAxis]) || 0, category: 'Data' }));
    }

    const ChartComp = { 'BarChart': BarChart, 'LineChart': LineChart, 'PieChart': PieChart, 'ScatterChart': ScatterChart }[chartConfig.type];
    if (!ChartComp) return null;

    return (
      <Card key={chartConfig.type + chartConfig.xAxis} className="flex flex-col h-[450px]">
        <h3 className="font-semibold text-lg text-(--color-dark) dark:text-white mb-4">
          {chartConfig.type.replace('Chart', '')} - {chartConfig.yAxis || 'Value'} by {chartConfig.xAxis || chartConfig.category}
        </h3>
        <div className="flex-1 relative"><ChartComp data={chartData} /></div>
        <InsightAccordion insight={`Showing relation between ${chartConfig.xAxis || chartConfig.category} and ${chartConfig.yAxis || chartConfig.value}.`} />
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Dashboard" />
      <p className="text-gray-500 dark:text-gray-400">Here's what's happening with your data today.</p>

      {loading ? (
        <div className="h-64 flex items-center justify-center"><Spinner /></div>
      ) : isDataEmpty ? (
        <EmptyState title="No Data Available" description="Please go to Data Management and set a dataset as primary to view the dashboard." />
      ) : (
        <>
          <FilterBar 
            schemaFilters={schema?.suggestedFilters} 
            parsedData={parsedData} 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            onReset={() => setFilters({})} 
          />

          {kpis.length > 0 && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">{kpis.map((stat, idx) => <StatCard key={idx} stat={stat} />)}</div>}
          {schema?.suggestedCharts?.length > 0 && <ChartGrid>{schema.suggestedCharts.map(renderChart)}</ChartGrid>}
        </>
      )}
    </div>
  );
};
export default DashboardPage;
