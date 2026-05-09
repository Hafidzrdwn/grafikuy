const ChartGrid = ({ children }) => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
      {children}
    </div>
  );
};

export default ChartGrid;
