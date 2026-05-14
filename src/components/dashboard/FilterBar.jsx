import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const FilterBar = ({ schemaFilters, parsedData, filters, onFilterChange, onReset }) => {
  if (!schemaFilters || schemaFilters.length === 0) return null;

  return (
    <Card className="mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-end flex-wrap">
        {schemaFilters.map(f => {
          if (f.type === 'date-range' || f.type === 'date') {
            const mode = filters[`${f.column}__mode`] || 'range';
            const handleModeChange = (e) => {
              const newMode = e.target.value;
              onFilterChange(`${f.column}__mode`, newMode);
              onFilterChange(`${f.column}__from`, '');
              onFilterChange(`${f.column}__to`, '');
              onFilterChange(`${f.column}__exact`, '');
            };

            let options = [];
            if (mode !== 'range' && parsedData) {
              const uniqueVals = new Set();
              parsedData.forEach(r => {
                const d = new Date(r[f.column]);
                if (!isNaN(d.getTime())) {
                  if (mode === 'year') uniqueVals.add(d.getFullYear());
                  else if (mode === 'month') uniqueVals.add(d.getMonth() + 1);
                  else if (mode === 'quarter') uniqueVals.add(Math.floor(d.getMonth() / 3) + 1);
                }
              });
              options = Array.from(uniqueVals).sort((a, b) => a - b);
            }

            return (
              <div key={f.column} className="flex-1 w-full min-w-[250px]">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400">{f.column}</label>
                  <select 
                    className="text-xs p-0.5 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-white border-gray-300 bg-transparent"
                    value={mode}
                    onChange={handleModeChange}
                  >
                    <option value="range">Range</option>
                    <option value="year">Year</option>
                    <option value="quarter">Quarter</option>
                    <option value="month">Month</option>
                  </select>
                </div>
                
                {mode === 'range' ? (
                  <div className="flex gap-2">
                    <input 
                      type="date" 
                      className="flex-1 p-2 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white border-gray-300"
                      value={filters[`${f.column}__from`] || ''}
                      onChange={(e) => onFilterChange(`${f.column}__from`, e.target.value)}
                    />
                    <span className="self-center text-xs text-gray-400">to</span>
                    <input 
                      type="date" 
                      className="flex-1 p-2 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white border-gray-300"
                      value={filters[`${f.column}__to`] || ''}
                      onChange={(e) => onFilterChange(`${f.column}__to`, e.target.value)}
                    />
                  </div>
                ) : (
                  <select
                    className="w-full p-2 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white border-gray-300"
                    value={filters[`${f.column}__exact`] || ''}
                    onChange={(e) => onFilterChange(`${f.column}__exact`, e.target.value)}
                  >
                    <option value="">All {mode}s</option>
                    {options.map(val => (
                      <option key={val} value={val}>
                        {mode === 'month' ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][val - 1] :
                         mode === 'quarter' ? `Q${val}` : val}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          }

          return (
            <div key={f.column} className="flex-1 w-full">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{f.column}</label>
              <select 
                className="w-full p-2 text-sm border rounded-md dark:bg-gray-800 dark:border-gray-700 dark:text-white border-gray-300"
                onChange={(e) => onFilterChange(f.column, e.target.value)}
                value={filters[f.column] || ''}
              >
                <option value="">All {f.column}</option>
                {parsedData && Array.from(new Set(parsedData.map(r => r[f.column]))).sort().map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
            </div>
          );
        })}
        
        <div className="w-full md:w-auto">
          <Button variant="secondary" size="md" className="w-full" onClick={onReset}>Reset Filters</Button>
        </div>
      </div>
    </Card>
  );
};

export default FilterBar;
