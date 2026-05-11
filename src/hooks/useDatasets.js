import { useState, useEffect } from 'react';
import { subscribeToDatasets } from '../services/firebase';

export const useDatasets = () => {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const unsubscribe = subscribeToDatasets((data) => {
        setDatasets(data);
        setLoading(false);
      });
      return () => unsubscribe();
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  }, []);

  return { datasets, loading, error };
};
