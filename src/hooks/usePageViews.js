import { useState, useEffect } from 'react';
import { incrementPageView, subscribeToPageViews } from '../services/firebase';

export const usePageViews = (pageKey) => {
  const [views, setViews] = useState(null);

  useEffect(() => {
    const sessionKey = `visited_${pageKey}`;

    if (!sessionStorage.getItem(sessionKey)) {
      incrementPageView(pageKey).then(() => {
        sessionStorage.setItem(sessionKey, 'true');
      });
    }

    const unsubscribe = subscribeToPageViews(pageKey, (currentViews) => {
      setViews(currentViews);
    });

    return () => {
      unsubscribe();
    };
  }, [pageKey]);

  return views;
};