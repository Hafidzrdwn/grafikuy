// src/components/dashboard/StatCard.jsx
import Card from '../ui/Card';
import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ stat }) => {
  const isUp = stat.trend === 'up';
  return (
    <Card className="flex flex-col">
      <span className="text-sm text-gray-500 dark:text-gray-200 font-medium mb-2">{stat.label}</span>
      <div className="flex items-end justify-between">
        <div className="flex items-baseline">
          <span className="text-2xl font-bold text-(--color-dark) dark:text-white">{stat.value}</span>
          {stat.unit && <span className="ml-1 text-sm text-gray-500 dark:text-gray-200">{stat.unit}</span>}
        </div>
        <div className={`flex items-center text-sm font-medium ${isUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {isUp ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
          {stat.trendValue}
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
