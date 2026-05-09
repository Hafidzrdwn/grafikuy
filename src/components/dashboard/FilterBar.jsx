import Button from '../ui/Button';
import Card from '../ui/Card';

const FilterBar = () => {
  return (
    <Card className="mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
          <select className="w-full p-2 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white border-gray-300">
            <option>All Categories</option>
            <option>Electronics</option>
            <option>Clothing</option>
          </select>
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Region</label>
          <select className="w-full p-2 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white border-gray-300">
            <option>All Regions</option>
            <option>North</option>
            <option>South</option>
          </select>
        </div>
        <div className="flex-2 w-full flex gap-2">
          <div className="w-1/2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
            <input type="date" className="w-full p-2 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white border-gray-300" />
          </div>
          <div className="w-1/2">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">End Date</label>
            <input type="date" className="w-full p-2 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white border-gray-300" />
          </div>
        </div>
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Min Revenue</label>
          <input type="number" placeholder="0" className="w-full p-2 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white border-gray-300" />
        </div>
        <div className="w-full md:w-auto">
          <Button variant="secondary" size="md" className="w-full">Reset Filters</Button>
        </div>
      </div>
    </Card>
  );
};

export default FilterBar;
