import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Plus, Trash2, Settings, Save } from 'lucide-react';

const DashboardBuilderPanel = ({ config, onSave, columns, schema, onClose }) => {
  const [activeTab, setActiveTab] = useState('charts'); // filters, kpis, charts
  const [draftConfig, setDraftConfig] = useState(config || { filters: [], kpiCards: [], charts: [] });

  // Update draft when opened with a new config
  useEffect(() => {
    if (config) {
      setDraftConfig(config);
    }
  }, [config]);

  const getColumnType = (colName) => {
    if (!schema || !schema.columns) return 'string';
    const col = schema.columns.find(c => c.name === colName);
    return col ? col.type : 'string';
  };

  const handleAddFilter = () => {
    const col = columns[0] || '';
    const colType = getColumnType(col);
    const defaultType = colType === 'date' ? 'date-range' : 'select';
    setDraftConfig({
      ...draftConfig,
      filters: [...(draftConfig.filters || []), { column: col, type: defaultType }]
    });
  };

  const handleAddKPI = () => {
    setDraftConfig({
      ...draftConfig,
      kpiCards: [...(draftConfig.kpiCards || []), { 
        id: Date.now().toString(), 
        label: 'New KPI', 
        column: columns[0] || '', 
        aggType: 'sum',
        format: 'commas', 
        decimals: 0,
        prefix: ''
      }]
    });
  };

  const handleAddChart = () => {
    setDraftConfig({
      ...draftConfig,
      charts: [...(draftConfig.charts || []), { 
        id: Date.now().toString(), 
        title: 'New Chart',
        type: 'BarChart', 
        dimension: columns[0] || '', 
        measure: columns[1] || '', 
        aggType: 'sum',
        orientation: 'vertical'
      }]
    });
  };

  const updateItem = (category, index, key, value) => {
    const newItems = [...(draftConfig[category] || [])];
    newItems[index] = { ...newItems[index], [key]: value };
    setDraftConfig({ ...draftConfig, [category]: newItems });
  };

  const removeItem = (category, index) => {
    const newItems = [...(draftConfig[category] || [])];
    newItems.splice(index, 1);
    setDraftConfig({ ...draftConfig, [category]: newItems });
  };

  const handleSave = () => {
    onSave(draftConfig);
    onClose();
  };

  return (
    <Card className="mb-6 border-2 border-[var(--color-primary)] shadow-lg bg-gray-50 dark:bg-[#112D4E]/50">
      <div className="flex items-center justify-between mb-4 border-b pb-4 dark:border-[#3F72AF]/30">
        <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--color-dark)] dark:text-white">
          <Settings className="w-5 h-5 text-[var(--color-primary)]" />
          Dashboard Builder
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
            <button onClick={() => setActiveTab('filters')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'filters' ? 'bg-white text-[var(--color-primary)] shadow-sm dark:bg-gray-700' : 'text-gray-600 dark:text-gray-300'}`}>Filters</button>
            <button onClick={() => setActiveTab('kpis')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'kpis' ? 'bg-white text-[var(--color-primary)] shadow-sm dark:bg-gray-700' : 'text-gray-600 dark:text-gray-300'}`}>KPI Cards</button>
            <button onClick={() => setActiveTab('charts')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'charts' ? 'bg-white text-[var(--color-primary)] shadow-sm dark:bg-gray-700' : 'text-gray-600 dark:text-gray-300'}`}>Charts</button>
          </div>
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
            <Save className="w-4 h-4 mr-2" /> Save & Apply
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {activeTab === 'filters' && (
          <div>
            {draftConfig.filters?.map((f, i) => {
              const colType = getColumnType(f.column);
              return (
                <div key={i} className="flex gap-4 items-center bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-[#3F72AF]/30 mb-2">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Column</label>
                    <select className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" value={f.column} onChange={(e) => {
                      const newColType = getColumnType(e.target.value);
                      const newType = newColType === 'date' ? 'date-range' : 'select';
                      const updated = [...(draftConfig.filters || [])];
                      updated[i] = { ...updated[i], column: e.target.value, type: newType };
                      setDraftConfig({ ...draftConfig, filters: updated });
                    }}>
                      {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Filter Type</label>
                    <select className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" value={f.type} onChange={(e) => updateItem('filters', i, 'type', e.target.value)}>
                      <option value="select">Dropdown (Select)</option>
                      <option value="range">Number Range</option>
                      {colType === 'date' && <option value="date-range">Date Range</option>}
                    </select>
                  </div>
                  <button onClick={() => removeItem('filters', i)} className="p-2 text-red-500 hover:bg-red-50 rounded mt-4"><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })}
            <Button variant="secondary" size="sm" onClick={handleAddFilter}><Plus className="w-4 h-4 mr-1" /> Add Filter</Button>
          </div>
        )}

        {activeTab === 'kpis' && (
          <div>
            {draftConfig.kpiCards?.map((kpi, i) => (
              <div key={i} className="bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-[#3F72AF]/30 mb-2">
                <div className="flex gap-4 items-start">
                  <div className="flex-1 space-y-3">
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-1">Label Title</label>
                        <input type="text" className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" value={kpi.label} onChange={(e) => updateItem('kpiCards', i, 'label', e.target.value)} />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-1">Data Column</label>
                        <select className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" value={kpi.column} onChange={(e) => updateItem('kpiCards', i, 'column', e.target.value)}>
                          {columns.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-1">Aggregation</label>
                        <select className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" value={kpi.aggType || kpi.agg} onChange={(e) => updateItem('kpiCards', i, 'aggType', e.target.value)}>
                          <option value="sum">Sum</option>
                          <option value="avg">Average</option>
                          <option value="count">Count Rows</option>
                          <option value="countUnique">Count Unique</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-4 p-2 bg-gray-50 dark:bg-gray-900 rounded border border-dashed dark:border-gray-700">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-1">Nominal Prefix (Optional)</label>
                        <input type="text" placeholder="e.g. $, Rp" className="w-full p-1.5 border rounded text-xs dark:bg-gray-700 dark:text-white" value={kpi.prefix || ''} onChange={(e) => updateItem('kpiCards', i, 'prefix', e.target.value)} />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-1">Number Format</label>
                        <select className="w-full p-1.5 border rounded text-xs dark:bg-gray-700 dark:text-white" value={kpi.format || 'commas'} onChange={(e) => updateItem('kpiCards', i, 'format', e.target.value)}>
                          <option value="commas">Commas (1,000)</option>
                          <option value="raw">Raw (1000)</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-1">Decimals</label>
                        <select className="w-full p-1.5 border rounded text-xs dark:bg-gray-700 dark:text-white" value={kpi.decimals ?? 0} onChange={(e) => updateItem('kpiCards', i, 'decimals', Number(e.target.value))}>
                          <option value={0}>0 (Whole Number)</option>
                          <option value={1}>1 (e.g. 10.5)</option>
                          <option value={2}>2 (e.g. 10.50)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeItem('kpiCards', i)} className="p-2 text-red-500 hover:bg-red-50 rounded mt-6"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={handleAddKPI}><Plus className="w-4 h-4 mr-1" /> Add KPI Card</Button>
          </div>
        )}

        {activeTab === 'charts' && (
          <div>
            {draftConfig.charts?.map((chart, i) => (
              <div key={i} className="flex gap-4 items-start bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-[#3F72AF]/30 mb-2">
                <div className="flex-1 space-y-3">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 block mb-1">Chart Title</label>
                      <input type="text" className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" placeholder="e.g. Sales by Region" value={chart.title || ''} onChange={(e) => updateItem('charts', i, 'title', e.target.value)} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 block mb-1">Chart Type</label>
                      <select className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" value={chart.type} onChange={(e) => updateItem('charts', i, 'type', e.target.value)}>
                        <option value="BarChart">Bar Chart</option>
                        <option value="LineChart">Line Chart</option>
                        <option value="PieChart">Donut / Pie Chart</option>
                        <option value="ScatterChart">Scatter Chart</option>
                      </select>
                    </div>
                    {chart.type === 'BarChart' && (
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-1">Orientation</label>
                        <select className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" value={chart.orientation || 'vertical'} onChange={(e) => updateItem('charts', i, 'orientation', e.target.value)}>
                          <option value="vertical">Vertical</option>
                          <option value="horizontal">Horizontal</option>
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4 p-2 bg-gray-50 dark:bg-gray-900 rounded border border-dashed dark:border-gray-700">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 block mb-1">{chart.type === 'ScatterChart' ? 'X-Axis (Measure)' : 'Dimension (Group By)'}</label>
                      <select className="w-full p-1.5 border rounded text-sm dark:bg-gray-700 dark:text-white" value={chart.dimension || chart.xAxis || chart.category} onChange={(e) => updateItem('charts', i, 'dimension', e.target.value)}>
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    {chart.type !== 'ScatterChart' && getColumnType(chart.dimension) === 'date' && (
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-1">Date Format</label>
                        <select className="w-full p-1.5 border rounded text-sm dark:bg-gray-700 dark:text-white" value={chart.dateFormat || 'auto'} onChange={(e) => updateItem('charts', i, 'dateFormat', e.target.value)}>
                          <option value="auto">Auto (Raw)</option>
                          <option value="year">Year (2024)</option>
                          <option value="month">Month (January)</option>
                          <option value="month-year">Month-Year (Jan 2024)</option>
                          <option value="quarter">Quarter (Q1 2024)</option>
                          <option value="day">Day (2024-01-15)</option>
                        </select>
                      </div>
                    )}
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 block mb-1">{chart.type === 'ScatterChart' ? 'Y-Axis (Measure)' : 'Measure (Value)'}</label>
                      <select className="w-full p-1.5 border rounded text-sm dark:bg-gray-700 dark:text-white" value={chart.measure || chart.yAxis || chart.value} onChange={(e) => updateItem('charts', i, 'measure', e.target.value)}>
                        {columns.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    {chart.type !== 'ScatterChart' && (
                      <div className="flex-1">
                        <label className="text-xs text-gray-500 block mb-1">Aggregation</label>
                        <select className="w-full p-1.5 border rounded text-sm dark:bg-gray-700 dark:text-white" value={chart.aggType || 'sum'} onChange={(e) => updateItem('charts', i, 'aggType', e.target.value)}>
                          <option value="sum">Sum</option>
                          <option value="avg">Average</option>
                          <option value="count">Count Rows</option>
                          <option value="countUnique">Count Unique</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
                <button onClick={() => removeItem('charts', i)} className="p-2 text-red-500 hover:bg-red-50 rounded mt-6"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <Button variant="secondary" size="sm" onClick={handleAddChart}><Plus className="w-4 h-4 mr-1" /> Add Chart</Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DashboardBuilderPanel;
