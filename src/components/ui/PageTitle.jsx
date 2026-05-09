import { useEffect } from 'react';

const PageTitle = ({ title }) => {
  useEffect(() => {
    document.title = `${title} | Grafikuy`;
  }, [title]);

  return (
    <h1 className="text-2xl font-bold text-(--color-dark) dark:text-white mb-3">
      {title}
    </h1>
  );
};

export default PageTitle;
