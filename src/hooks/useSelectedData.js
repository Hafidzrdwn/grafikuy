import { useState, useEffect } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { analyzeSchema } from '../services/dataAnalyzer';

export const useSelectedData = (datasets) => {
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [schema, setSchema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const db = getDatabase();
    const configRef = ref(db, 'config/selectedDatasetId');
    
    const unsubscribe = onValue(configRef, async (snapshot) => {
      setLoading(true);
      const id = snapshot.exists() ? snapshot.val() : null;
      if (!id) {
        setSelectedDataset(null);
        setParsedData([]);
        setSchema(null);
        setLoading(false);
        return;
      }

      const dataset = datasets.find(d => d.id === id);
      if (!dataset) {
        if (datasets.length > 0) {
          setSelectedDataset(null);
          setLoading(false);
        }
        return;
      }

      setSelectedDataset(dataset);
      try {
        const response = await fetch(dataset.fileUrl);
        if (!response.ok) throw new Error("Failed to fetch dataset file");
        
        const jsonData = await response.json();
        setParsedData(jsonData);
        setSchema(analyzeSchema(jsonData));
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [datasets]);

  return { selectedDataset, parsedData, schema, loading, error };
};
