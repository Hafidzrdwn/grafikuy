import Card from '@/components/ui/Card';

const StatCard = ({ stat }) => {
  return (
    <Card className="flex flex-col">
      <span className="text-sm text-gray-500 dark:text-gray-200 font-medium mb-2">{stat.label}</span>
      <div className="flex items-end justify-between">
        <div className="flex items-baseline">
          <span className="text-2xl font-bold text-(--color-dark) dark:text-white">{stat.value}</span>
          {stat.unit && <span className="ml-1 text-sm text-gray-500 dark:text-gray-200">{stat.unit}</span>}
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
