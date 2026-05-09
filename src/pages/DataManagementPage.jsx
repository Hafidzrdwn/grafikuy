import { useContext, useState } from 'react';
import { DataContext } from '../context/DataContext';
import PageTitle from '../components/ui/PageTitle';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import DataCard from '../components/data-management/DataCard';
import DataTable from '../components/data-management/DataTable';
import { mockTableRows } from '../utils/mockData';
import { useToast } from '../hooks/useToast';

const DataManagementPage = () => {
  const { datasets, setDatasets, selectedDataset, setSelectedDataset } = useContext(DataContext);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewingDataset, setViewingDataset] = useState(null);
  const { addToast } = useToast();

  const handleSetPrimary = (dataset) => {
    setSelectedDataset(dataset);
    addToast({ type: 'success', message: `${dataset.name} set as primary dataset.` });
  };

  const handleDelete = (dataset) => {
    setDatasets(prev => prev.filter(d => d.id !== dataset.id));
    if (selectedDataset?.id === dataset.id) setSelectedDataset(null);
    setDeleteConfirm(null);
    addToast({ type: 'info', message: 'Dataset deleted successfully.' });
  };

  if (viewingDataset) {
    return (
      <>
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setViewingDataset(null)}>
            ← Back
          </Button>
          <h1 className="text-xl font-bold dark:text-white">{viewingDataset.name} Data</h1>
        </div>
        <DataTable columns={viewingDataset.columns || []} data={mockTableRows} />
      </>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <PageTitle title="Data Management" />
        <Button onClick={() => setIsImportOpen(true)}>Import Data</Button>
      </div>

      {datasets.length === 0 ? (
        <EmptyState title="No Datasets" description="You haven't uploaded any data yet." action={{ label: 'Import Data', onClick: () => setIsImportOpen(true) }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {datasets.map(dataset => (
            <DataCard 
              key={dataset.id}
              dataset={dataset}
              isSelected={selectedDataset?.id === dataset.id}
              onSelect={handleSetPrimary}
              onView={setViewingDataset}
              onDelete={setDeleteConfirm}
            />
          ))}
        </div>
      )}

      <Modal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="Import Data">
        <div className="p-4 flex justify-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          Upload feature will be implemented in Step 3.
        </div>
        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={() => setIsImportOpen(false)}>Close</Button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Deletion">
        <p className="mb-6 text-(--color-dark)">Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => handleDelete(deleteConfirm)}>Delete</Button>
        </div>
      </Modal>
    </>
  );
};

export default DataManagementPage;
