import { useState, useEffect } from 'react';
import { subscribeToDailyViews } from '@/services/firebase';

export const usePageViews = () => {
  const [views, setViews] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeToDailyViews((allViews) => {
      const totalViews = allViews?.total || 0;
      setViews(totalViews);
    });

    return unsubscribe;
  }, []);

  return views;
};