// src/components/dashboard/FilterBar.jsx
import Button from '../ui/Button';
import Card from '../ui/Card';

const FilterBar = ({ schemaFilters, parsedData, filters, onFilterChange, onReset }) => {
  if (!schemaFilters || schemaFilters.length === 0) return null;

  return (
    <Card className="mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        {schemaFilters.filter(f => f.type === 'select').map(f => (
          <div key={f.column} className="flex-1 w-full">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{f.column}</label>
            <select 
              className="w-full p-2 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white border-gray-300"
              onChange={(e) => onFilterChange(f.column, e.target.value)}
              value={filters[f.column] || ''}
            >
              <option value="">All {f.column}</option>
              {Array.from(new Set(parsedData.map(r => r[f.column]))).map(val => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
          </div>
        ))}
        
        <div className="w-full md:w-auto">
          <Button variant="secondary" size="md" className="w-full" onClick={onReset}>Reset Filters</Button>
        </div>
      </div>
    </Card>
  );
};

export default FilterBar;
