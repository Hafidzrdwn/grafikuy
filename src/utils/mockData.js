export const mockDatasets = [
  { id: '1', name: 'Global Sales 2025', fileName: 'sales_2025.csv', fileUrl: '#', uploadedAt: '2025-10-01', rowCount: 50, columns: ['date', 'product', 'category', 'region', 'revenue', 'quantity'] },
  { id: '2', name: 'User Demographics', fileName: 'users_q3.xlsx', fileUrl: '#', uploadedAt: '2025-10-05', rowCount: 1200, columns: ['id', 'age', 'gender', 'location', 'active'] },
  { id: '3', name: 'Website Traffic', fileName: 'traffic.csv', fileUrl: '#', uploadedAt: '2025-10-10', rowCount: 850, columns: ['date', 'visitors', 'bounce_rate', 'source'] },
];

export const mockTableRows = Array.from({ length: 50 }).map((_, i) => ({
  date: `2025-10-${String((i % 30) + 1).padStart(2, '0')}`,
  product: `Product ${String.fromCharCode(65 + (i % 5))}`,
  category: ['Electronics', 'Clothing', 'Home', 'Toys'][i % 4],
  region: ['North', 'South', 'East', 'West'][i % 4],
  revenue: Math.floor(Math.random() * 5000) + 100,
  quantity: Math.floor(Math.random() * 50) + 1,
}));

export const mockStats = [
  { label: 'Total Revenue', value: '$124,500', unit: '', trend: 'up', trendValue: '+12%' },
  { label: 'Avg Order Value', value: '$240', unit: '', trend: 'up', trendValue: '+5%' },
  { label: 'Active Users', value: '45.2K', unit: '', trend: 'down', trendValue: '-2%' },
  { label: 'Conversion Rate', value: '3.8', unit: '%', trend: 'up', trendValue: '+0.5%' },
];

export const mockChartData = {
  bar: [
    { label: 'Jan', value: 30 }, { label: 'Feb', value: 50 }, { label: 'Mar', value: 70 },
    { label: 'Apr', value: 40 }, { label: 'May', value: 90 }, { label: 'Jun', value: 60 }
  ],
  line: [
    { date: '2025-01-01', value: 10 }, { date: '2025-02-01', value: 15 },
    { date: '2025-03-01', value: 12 }, { date: '2025-04-01', value: 20 },
    { date: '2025-05-01', value: 18 }, { date: '2025-06-01', value: 25 }
  ],
  pie: [
    { name: 'Electronics', value: 400 }, { name: 'Clothing', value: 300 },
    { name: 'Home', value: 200 }, { name: 'Toys', value: 100 }
  ],
  scatter: Array.from({ length: 40 }).map(() => ({
    x: Math.floor(Math.random() * 100),
    y: Math.floor(Math.random() * 100),
    r: Math.floor(Math.random() * 10) + 5
  }))
};
