import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { FileSpreadsheet } from 'lucide-react';

const DataCard = ({ dataset, isSelected, onSelect, onView, onDelete }) => {
  return (
    <Card className={`relative p-6 transition-all h-max ${isSelected ? 'ring-2 ring-(--color-primary) border-transparent' : 'hover:border-(--color-primary)/50'}`}>
      {isSelected && (
        <div className="absolute top-4 right-4">
          <Badge label="Selected Data" variant="primary" />
        </div>
      )}
      <div className="flex flex-col items-start gap-4">
        <div className="p-3 bg-(--color-muted) dark:bg-[#112D4E] rounded-lg text-(--color-primary) dark:text-white border border-transparent dark:border-[#3F72AF]/50">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-lg text-(--color-dark) dark:text-white mb-1 break-all">{dataset.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 break-all">{dataset.fileName} • Uploaded {dataset.uploadedAt}</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-[#112D4E] border dark:border-[#3F72AF]/30 text-gray-600 dark:text-gray-300 rounded-md">
              {dataset.rowCount} Rows
            </span>
            <span className="text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-[#112D4E] border dark:border-[#3F72AF]/30 text-gray-600 dark:text-gray-300 rounded-md">
              {dataset.columns?.length || 0} Columns
            </span>
          </div>

          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-(--color-muted) dark:border-[#3F72AF]/30">
            {!isSelected && (
              <Button size="md" variant="ghost" onClick={() => onSelect(dataset)}>Set as Primary</Button>
            )}
            <Button size="md" className="flex-1" variant="secondary" onClick={() => onView(dataset)}>View Data</Button>
            <Button size="md" className="flex-1" variant="danger" onClick={() => onDelete(dataset)}>Delete</Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DataCard;
