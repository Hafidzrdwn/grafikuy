import PageTitle from '../components/ui/PageTitle';
import Card from '../components/ui/Card';
import InsightAccordion from '../components/dashboard/InsightAccordion';

const AdvancedChart4Page = () => {
  return (
    <>
      <PageTitle title="Streamgraph" />
      <Card className="min-h-[400px] flex flex-col">
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
          <span className="text-gray-400">Chart will render here</span>
        </div>
        <InsightAccordion insight="Time-series volume analysis will highlight seasonal trends across categories." />
      </Card>
    </>
  );
};

export default AdvancedChart4Page;
