import { useState, useMemo } from 'react';
import Card from '../ui/Card';
import Pagination from '../ui/Pagination';

const DataTable = ({ columns, data }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-[#112D4E] dark:text-gray-300 border-b border-(--color-muted) dark:border-[#3F72AF]/30">
            <tr>
              {columns.map(col => (
                <th key={col} onClick={() => handleSort(col)} className="px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-[#3F72AF]/20 select-none transition-colors">
                  <div className="flex items-center gap-1">
                    {col}
                    {sortConfig.key === col && (
                      <span className="text-(--color-primary) dark:text-[#DBE2EF]">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr key={idx} className="bg-white dark:bg-transparent border-b border-(--color-muted) dark:border-[#3F72AF]/30 hover:bg-gray-50 dark:hover:bg-[#3F72AF]/10 transition-colors">
                {columns.map(col => (
                  <td key={col} className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-200">
                    {row[col]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      )}
    </Card>
  );
};

export default DataTable;
