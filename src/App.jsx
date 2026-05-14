import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { DataProvider } from '@/context/DataContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import Layout from '@/components/layout/Layout';

import DashboardPage from '@/pages/DashboardPage';
import DataManagementPage from '@/pages/DataManagementPage';
import PageVisitorsPage from '@/pages/PageVisitorsPage';
import AdvancedChart1Page from '@/pages/AdvancedChart1Page';
import AdvancedChart2Page from '@/pages/AdvancedChart2Page';
import AdvancedChart3Page from '@/pages/AdvancedChart3Page';
import AdvancedChart4Page from '@/pages/AdvancedChart4Page';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <DataProvider>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<DashboardPage />} />
                <Route path="data-management" element={<DataManagementPage />} />
                <Route path="visitors" element={<PageVisitorsPage />} />
                <Route path="chart/radial-tree" element={<AdvancedChart1Page />} />
                <Route path="chart/map" element={<AdvancedChart2Page />} />
                <Route path="chart/force-graph" element={<AdvancedChart3Page />} />
                <Route path="chart/streamgraph" element={<AdvancedChart4Page />} />
              </Route>
            </Routes>
          </ToastProvider>
        </DataProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
