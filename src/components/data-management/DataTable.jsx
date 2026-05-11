import { useState, useMemo } from 'react';
import Card from '@/components/ui/Card';
import Pagination from '@/components/ui/Pagination';
import { Type, Hash, Calendar, DollarSign, Tag, ChevronDown } from 'lucide-react';

const getTypeIcon = (type) => {
  switch(type) {
    case 'number': return <Hash className="w-3.5 h-3.5" />;
    case 'date': return <Calendar className="w-3.5 h-3.5" />;
    case 'currency': return <DollarSign className="w-3.5 h-3.5" />;
    case 'category': return <Tag className="w-3.5 h-3.5" />;
    case 'string':
    default: return <Type className="w-3.5 h-3.5" />;
  }
};

const DataTable = ({ columns, data, schemaConfig, onTypeChange }) => {
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

  const [openDropdown, setOpenDropdown] = useState(null);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="overflow-x-auto min-h-100">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-[#112D4E] dark:text-gray-300 border-b border-(--color-muted) dark:border-[#3F72AF]/30">
            <tr>
              {columns.map(col => {
                const colType = schemaConfig ? schemaConfig[col] : 'string';
                return (
                  <th key={col} className="px-6 py-3 select-none relative group">
                    <div className="flex items-center gap-2">
                      {schemaConfig && onTypeChange ? (
                        <div className="relative">
                          <button 
                            onClick={() => setOpenDropdown(openDropdown === col ? null : col)}
                            className="flex items-center gap-1 p-1 rounded hover:bg-gray-200 dark:hover:bg-[#3F72AF]/40 text-gray-500 transition-colors"
                            title="Change Data Type"
                          >
                            {getTypeIcon(colType)}
                            <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          
                          {openDropdown === col && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)}></div>
                              <div className="absolute top-full left-0 mt-1 w-36 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20 py-1">
                                {['string', 'number', 'date', 'currency', 'category'].map(type => (
                                  <button
                                    key={type}
                                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${colType === type ? 'text-(--color-primary) font-bold' : 'text-gray-700 dark:text-gray-300'}`}
                                    onClick={() => { onTypeChange(col, type); setOpenDropdown(null); }}
                                  >
                                    {getTypeIcon(type)}
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      ) : null}

                      <div className="flex-1 cursor-pointer hover:text-(--color-primary) transition-colors" onClick={() => handleSort(col)}>
                        {col}
                        {sortConfig.key === col && (
                          <span className="ml-1 text-(--color-primary) dark:text-[#DBE2EF]">
                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr key={idx} className="bg-white dark:bg-transparent border-b border-(--color-muted) dark:border-[#3F72AF]/30 hover:bg-gray-50 dark:hover:bg-[#3F72AF]/10 transition-colors">
                {columns.map(col => (
                  <td key={col} className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-200">
                    {row[col] !== null && row[col] !== undefined ? String(row[col]) : ''}
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
