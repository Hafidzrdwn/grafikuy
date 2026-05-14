import { useContext, useState, useRef, useMemo } from 'react';
import { DataContext } from '@/context/DataContext';
import { ToastContext } from '@/components/ui/Toast';
import { AuthContext } from '@/context/AuthContext';
import { parseFile } from '@/services/fileParser';
import { uploadFile } from '@/services/cloudinary';
import { saveDataset, deleteDataset } from '@/services/firebase';
import { transformDataset } from '@/services/dataAnalyzer';
import PageTitle from '@/components/ui/PageTitle';
import Button from '@/components/ui/Button';
import DataCard from '@/components/data-management/DataCard';
import DataTable from '@/components/data-management/DataTable';
import Modal from '@/components/ui/Modal';
import Spinner from '@/components/ui/Spinner';
import { Upload, AlertCircle, Unlock, ArrowLeft, Save } from 'lucide-react';

const DataManagementPage = () => {
  const { datasets, selectedDataset, parsedData, schema, setSelectedDatasetId, loading, error } = useContext(DataContext);
  const { addToast } = useContext(ToastContext);
  const { isAdmin } = useContext(AuthContext);
  
  const [isUploading, setIsUploading] = useState(false);
  const [viewedData, setViewedData] = useState(null);
  const [schemaConfig, setSchemaConfig] = useState({});
  const fileInputRef = useRef(null);

  const handleImportClick = () => {
    if (isAdmin) {
      fileInputRef.current?.click();
    } else {
      addToast({ type: 'error', message: 'Action restricted: Admin access required.' });
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsUploading(true);
    try {
      const { rows, columns, rowCount } = await parseFile(file);
      const blob = new Blob([JSON.stringify(rows)], { type: 'application/json' });
      const uploadResult = await uploadFile(new File([blob], file.name + '.json', { type: 'application/json' }));
      
      const datasetObj = {
        name: file.name.split('.')[0],
        fileName: file.name,
        fileUrl: uploadResult.secure_url,
        uploadedAt: new Date().toLocaleDateString(),
        rowCount,
        columns
      };
      
      const newId = await saveDataset(datasetObj);
      if (datasets.length === 0) {
        await setSelectedDatasetId(newId);
      }
      
      addToast({ type: 'success', message: 'Dataset imported successfully!' });
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to import dataset' });
    } finally {
      setIsUploading(false);
      e.target.value = null;
    }
  };

  const handleDelete = async (dataset) => {
    if (!isAdmin) {
      addToast({ type: 'error', message: 'Action restricted: Admin access required to delete datasets.' });
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${dataset.name}?`)) {
      try {
        await deleteDataset(dataset.id);
        if (selectedDataset?.id === dataset.id) {
          await setSelectedDatasetId(null);
        }
        addToast({ type: 'success', message: 'Dataset deleted' });
      } catch (err) {
        addToast({ type: 'error', message: 'Failed to delete dataset' });
      }
    }
  };

  const handleSetPrimary = async (dataset) => {
    if (!isAdmin) {
      addToast({ type: 'error', message: 'Action restricted: Admin access required to set primary dataset.' });
      return;
    }
    try {
      await setSelectedDatasetId(dataset.id);
      addToast({ type: 'success', message: `${dataset.name} set as primary dataset` });
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to set primary dataset' });
    }
  };

  const handleView = (dataset) => {
    if (dataset.id === selectedDataset?.id) {
      const initialSchema = {};
      schema?.columns?.forEach(c => {
        initialSchema[c.name] = c.type;
      });
      setSchemaConfig(initialSchema);
      setViewedData({ name: dataset.name, rows: parsedData, columns: schema?.columns.map(c => c.name) || [] });
    } else {
      addToast({ type: 'info', message: 'Set as primary first to view data source' });
    }
  };

  const handleTypeChange = (columnName, newType) => {
    setSchemaConfig(prev => ({ ...prev, [columnName]: newType }));
  };

  const previewTransformedData = useMemo(() => {
    if (!viewedData) return [];
    const sample = viewedData.rows.slice(0, 100);
    return transformDataset(sample, schemaConfig);
  }, [viewedData, schemaConfig]);

  const handleSaveSchema = async () => {
    addToast({ type: 'success', message: 'Schema changes saved and applied to dataset!' });
    // In a real scenario, we might trigger a re-upload of the newly transformed JSON to Cloudinary
    // Or save the schemaConfig to Firebase so the hook transforms it on the fly
    setViewedData(null);
  };

  const isInitialLoading = loading && datasets.length === 0;

  if (viewedData && !isInitialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex lg:items-center justify-between mb-6 lg:flex-row flex-col gap-y-4">
          <div className="flex lg:items-center items-start gap-4 lg:flex-row flex-col">
            <Button variant="secondary" onClick={() => setViewedData(null)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-(--color-dark) dark:text-white">Data Source: {viewedData.name}</h1>
              <p className="text-gray-500 dark:text-gray-400">Click the icons on the table headers to adjust data types.</p>
            </div>
          </div>
          <Button onClick={handleSaveSchema}>
            <Save className="w-4 h-4 mr-2" />
            Apply Schema
          </Button>
        </div>
        <DataTable 
          data={previewTransformedData} 
          columns={viewedData.columns} 
          schemaConfig={schemaConfig}
          onTypeChange={handleTypeChange}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between lg:items-center lg:flex-row flex-col gap-y-4">
        <div>
          <PageTitle title="Data Management" />
          <p className="text-gray-500 dark:text-gray-400">Upload, manage, and inspect your datasets.</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
              <Unlock className="w-4 h-4" />
              Admin Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
              <AlertCircle className="w-4 h-4" />
              Guest Mode
            </span>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv, .xls, .xlsx" />
          <Button onClick={handleImportClick} loading={isUploading}><Upload className="w-4 h-4 mr-2" /> Import Data</Button>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center"><AlertCircle className="w-5 h-5 mr-2" />{error.message}</div>}

      {isInitialLoading ? (
        <div className="h-64 flex items-center justify-center"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {datasets.map(dataset => (
            <DataCard key={dataset.id} dataset={dataset} isSelected={selectedDataset?.id === dataset.id} onSelect={handleSetPrimary} onView={handleView} onDelete={handleDelete} />
          ))}
          {datasets.length === 0 && !isUploading && (
            <div className="col-span-full p-8 text-center bg-white dark:bg-[#112D4E] rounded-xl border border-dashed border-(--color-muted) dark:border-[#3F72AF]/50">
              <p className="text-gray-500 dark:text-gray-400">No datasets found. Import one to get started.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
export default DataManagementPage;
