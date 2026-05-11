import { createContext } from 'react';
import { useDatasets } from '../hooks/useDatasets';
import { useSelectedData } from '../hooks/useSelectedData';
import { setSelectedDatasetId as setFirebaseSelectedDatasetId } from '../services/firebase';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { datasets, loading: datasetsLoading, error: datasetsError } = useDatasets();
  const { selectedDataset, parsedData, schema, loading: selectedLoading, error: selectedError } = useSelectedData(datasets);

  const setSelectedDatasetId = async (id) => {
    await setFirebaseSelectedDatasetId(id);
  };

  return (
    <DataContext.Provider value={{
      datasets,
      selectedDataset,
      parsedData,
      schema,
      setSelectedDatasetId,
      loading: datasetsLoading || selectedLoading,
      error: datasetsError || selectedError
    }}>
      {children}
    </DataContext.Provider>
  );
};
