import { useContext, useState, useRef, useMemo } from 'react';
import { DataContext } from '../context/DataContext';
import { ToastContext } from '../components/ui/Toast';
import { useImportPassword } from '../hooks/useImportPassword';
import { parseFile } from '../services/fileParser';
import { uploadFile } from '../services/cloudinary';
import { saveDataset, deleteDataset } from '../services/firebase';
import { transformDataset } from '../services/dataAnalyzer';
import PageTitle from '../components/ui/PageTitle';
import Button from '../components/ui/Button';
import DataCard from '../components/data-management/DataCard';
import DataTable from '../components/data-management/DataTable';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { Upload, AlertCircle, Unlock, ArrowLeft, Save } from 'lucide-react';

const DataManagementPage = () => {
  const { datasets, selectedDataset, parsedData, schema, setSelectedDatasetId, loading, error } = useContext(DataContext);
  const { addToast } = useContext(ToastContext);
  const { isAuthorized, promptPassword, verifyPassword, error: passwordError, checkAccess, setPromptPassword } = useImportPassword();
  
  const [isUploading, setIsUploading] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const [viewedData, setViewedData] = useState(null);
  const [schemaConfig, setSchemaConfig] = useState({});
  const fileInputRef = useRef(null);

  const executeSecureAction = (actionCallback) => {
    if (checkAccess()) {
      actionCallback();
    } else {
      setPendingAction(() => actionCallback);
    }
  };

  const handleImportClick = () => {
    executeSecureAction(() => fileInputRef.current?.click());
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const success = await verifyPassword(passwordInput);
    if (success) {
      setPasswordInput('');
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }
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
    executeSecureAction(async () => {
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
    });
  };

  const handleSetPrimary = async (dataset) => {
    executeSecureAction(async () => {
      try {
        await setSelectedDatasetId(dataset.id);
        addToast({ type: 'success', message: `${dataset.name} set as primary dataset` });
      } catch (err) {
        addToast({ type: 'error', message: 'Failed to set primary dataset' });
      }
    });
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
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
      <div className="flex justify-between items-center">
        <div>
          <PageTitle title="Data Management" />
          <p className="text-gray-500 dark:text-gray-400">Upload, manage, and inspect your datasets.</p>
        </div>
        <div className="flex items-center gap-3">
          {isAuthorized && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
              <Unlock className="w-4 h-4" />
              Admin Verified
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

      <Modal isOpen={promptPassword} onClose={() => {
        setPromptPassword(false)
        setPasswordInput('')
      }} title="Security Authorization">
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">Enter system password to authorize import.</p>
          <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full px-4 py-2 border text-(--color-dark) dark:text-white rounded-lg focus:ring-2 focus:ring-(--color-primary) dark:bg-gray-800 dark:border-gray-700" required />
          {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="ghost" onClick={() => {
              setPromptPassword(false);
              setPasswordInput('');
              setPendingAction(null);
            }}>Cancel</Button>
            <Button type="submit">Verify</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
export default DataManagementPage;
