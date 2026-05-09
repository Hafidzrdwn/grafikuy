import { useContext } from 'react';
import { DataContext } from '../context/DataContext';
import PageTitle from '../components/ui/PageTitle';
import EmptyState from '../components/ui/EmptyState';
import Alert from '../components/ui/Alert';
import FilterBar from '../components/dashboard/FilterBar';
import StatCard from '../components/dashboard/StatCard';
import ChartGrid from '../components/dashboard/ChartGrid';
import Card from '../components/ui/Card';
import InsightAccordion from '../components/dashboard/InsightAccordion';
import BarChart from '../components/charts/BarChart';
import LineChart from '../components/charts/LineChart';
import PieChart from '../components/charts/PieChart';
import ScatterChart from '../components/charts/ScatterChart';
import { mockStats, mockChartData } from '../utils/mockData';
import { useNavigate } from 'react-router-dom';

const DashboardPage = () => {
  const { selectedDataset } = useContext(DataContext);
  const navigate = useNavigate();

  if (!selectedDataset) {
    return (
      <>
        <PageTitle title="Dashboard" />
        <div className="mt-12">
          <EmptyState 
            title="No Data Selected"
            description="Please select a dataset from the Data Management page to view insights."
            action={{ label: 'Go to Data Management', onClick: () => navigate('/data-management') }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageTitle title="Dashboard" />
      <Alert type="info" message="Explore advanced charts in the sidebar for deeper analysis." />
      
      <FilterBar />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {mockStats.map((stat, i) => (
          <StatCard key={i} stat={stat} />
        ))}
      </div>

      <ChartGrid>
        <Card>
          <h3 className="font-semibold text-lg mb-4 text-(--color-dark) dark:text-white">Revenue by Month</h3>
          <BarChart data={mockChartData.bar} />
          <InsightAccordion insight="Revenue peaked in May. Consider analyzing marketing activities during that period." />
        </Card>
        
        <Card>
          <h3 className="font-semibold text-lg mb-4 text-(--color-dark) dark:text-white">Active Users Trend</h3>
          <LineChart data={mockChartData.line} />
          <InsightAccordion insight="Steady growth observed in Q2. Retargeting campaigns might be working well." />
        </Card>
        
        <Card>
          <h3 className="font-semibold text-lg mb-4 text-(--color-dark) dark:text-white">Sales by Category</h3>
          <PieChart data={mockChartData.pie} />
          <InsightAccordion insight="Electronics dominate the sales volume. Consider cross-selling strategies." />
        </Card>
        
        <Card>
          <h3 className="font-semibold text-lg mb-4 text-(--color-dark) dark:text-white">Correlation (Mock)</h3>
          <ScatterChart data={mockChartData.scatter} />
          <InsightAccordion insight="There is a moderate positive correlation between X and Y variables in the dataset." />
        </Card>
      </ChartGrid>
    </>
  );
};

export default DashboardPage;
