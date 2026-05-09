import { createContext, useState } from 'react';
import { mockDatasets } from '../utils/mockData';

export const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [datasets, setDatasets] = useState(mockDatasets);
  const [selectedDataset, setSelectedDataset] = useState(null);

  return (
    <DataContext.Provider value={{ datasets, setDatasets, selectedDataset, setSelectedDataset }}>
      {children}
    </DataContext.Provider>
  );
};
