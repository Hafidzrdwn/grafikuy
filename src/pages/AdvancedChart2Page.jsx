import PageTitle from '../components/ui/PageTitle';
import Card from '../components/ui/Card';
import InsightAccordion from '../components/dashboard/InsightAccordion';

const AdvancedChart2Page = () => {
  return (
    <>
      <PageTitle title="Choropleth Map" />
      <Card className="min-h-[400px] flex flex-col">
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
          <span className="text-gray-400">Chart will render here</span>
        </div>
        <InsightAccordion insight="Geospatial analysis will reveal regional performance disparities." />
      </Card>
    </>
  );
};

export default AdvancedChart2Page;
