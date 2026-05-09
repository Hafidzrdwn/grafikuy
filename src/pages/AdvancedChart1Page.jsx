import PageTitle from '../components/ui/PageTitle';
import Card from '../components/ui/Card';
import InsightAccordion from '../components/dashboard/InsightAccordion';

const AdvancedChart1Page = () => {
  return (
    <>
      <PageTitle title="Radial Tidy Tree" />
      <Card className="min-h-[400px] flex flex-col">
        <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
          <span className="text-gray-400">Chart will render here</span>
        </div>
        <InsightAccordion insight="Hierarchical data visualization will help identify relationship depths." />
      </Card>
    </>
  );
};

export default AdvancedChart1Page;
