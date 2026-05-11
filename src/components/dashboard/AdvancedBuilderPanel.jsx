import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Settings, Save, Trash2, Plus } from 'lucide-react';

const AdvancedBuilderPanel = ({ config, onSave, columns, onClose, chartType }) => {
  const [draftConfig, setDraftConfig] = useState(config || { dimensions: ['', ''], weightCol: '', aggType: 'sum' });

  useEffect(() => {
    if (config) {
      setDraftConfig(config);
    }
  }, [config]);

  const handleSave = () => {
    onSave(draftConfig);
    if (onClose) onClose();
  };

  const isStream = chartType === 'stream';
  const isMap = chartType === 'map';

  const handleAddLevel = () => {
    setDraftConfig({ ...draftConfig, dimensions: [...(draftConfig.dimensions || []), ''] });
  };

  const handleRemoveLevel = (index) => {
    const newDims = [...(draftConfig.dimensions || [])];
    newDims.splice(index, 1);
    setDraftConfig({ ...draftConfig, dimensions: newDims });
  };

  const handleDimChange = (index, value) => {
    const newDims = [...(draftConfig.dimensions || [])];
    newDims[index] = value;
    setDraftConfig({ ...draftConfig, dimensions: newDims });
  };

  return (
    <Card className="mb-6 border-2 border-(--color-primary) shadow-lg bg-gray-50 dark:bg-[#112D4E]/50">
      <div className="flex items-center justify-between mb-4 border-b pb-4 dark:border-[#3F72AF]/30">
        <h2 className="text-xl font-bold flex items-center gap-2 text-(--color-dark) dark:text-white">
          <Settings className="w-5 h-5 text-(--color-primary)" />
          Advanced Chart Builder
        </h2>
        <div className="flex items-center gap-4">
          <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
            <Save className="w-4 h-4 mr-2" /> Save & Apply
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {isStream ? (
          /* ===== STREAMGRAPH BUILDER ===== */
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-[#3F72AF]/30">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-3 uppercase tracking-wider">Time Axis (X)</label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Date Column</label>
                  <select className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" value={draftConfig.dateCol || ''} onChange={(e) => setDraftConfig({ ...draftConfig, dateCol: e.target.value })}>
                    <option value="">-- Select Column --</option>
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Date Grouping</label>
                  <select className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" value={draftConfig.dateFormat || 'month-year'} onChange={(e) => setDraftConfig({ ...draftConfig, dateFormat: e.target.value })}>
                    <option value="auto">Auto (Raw)</option>
                    <option value="year">Year (2024)</option>
                    <option value="month">Month (January)</option>
                    <option value="month-year">Month-Year (Jan 2024)</option>
                    <option value="quarter">Quarter (Q1 2024)</option>
                    <option value="day">Day (2024-01-15)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-[#3F72AF]/30">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-3 uppercase tracking-wider">Category / Stream (Series)</label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Category Column</label>
                  <select className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" value={draftConfig.catCol || ''} onChange={(e) => setDraftConfig({ ...draftConfig, catCol: e.target.value })}>
                    <option value="">-- Select Column --</option>
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Top N Streams</label>
                  <input 
                    type="number" 
                    min={2} max={20} 
                    className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" 
                    value={draftConfig.topN || 7} 
                    onChange={(e) => setDraftConfig({ ...draftConfig, topN: Math.max(2, Math.min(20, Number(e.target.value))) })}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Limit number of layers (2–20)</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-[#3F72AF]/30">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-3 uppercase tracking-wider">Measure (Y / Thickness)</label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Value Column</label>
                  <select className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" value={draftConfig.valCol || ''} onChange={(e) => setDraftConfig({ ...draftConfig, valCol: e.target.value })}>
                    <option value="">-- Select Column --</option>
                    {columns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Aggregation</label>
                  <select className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" value={draftConfig.aggType || 'sum'} onChange={(e) => setDraftConfig({ ...draftConfig, aggType: e.target.value })}>
                    <option value="sum">Sum</option>
                    <option value="avg">Average</option>
                    <option value="count">Count Rows</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ) : isMap ? (
          /* ===== MAP BUILDER ===== */
          <div className="flex gap-4 items-center bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-[#3F72AF]/30 mb-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">Geographical Dimension (Country/Region/City)</label>
              <select className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" value={draftConfig.geoCol || ''} onChange={(e) => setDraftConfig({ ...draftConfig, geoCol: e.target.value })}>
                <option value="">-- Select Column --</option>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">Value Measure</label>
              <select className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" value={draftConfig.valCol || ''} onChange={(e) => setDraftConfig({ ...draftConfig, valCol: e.target.value })}>
                <option value="">-- Select Column --</option>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {draftConfig.valCol && (
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">Aggregation</label>
                <select className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" value={draftConfig.aggType || 'sum'} onChange={(e) => setDraftConfig({ ...draftConfig, aggType: e.target.value })}>
                  <option value="sum">Sum</option>
                  <option value="avg">Average</option>
                  <option value="count">Count Rows</option>
                  <option value="countUnique">Count Unique</option>
                </select>
              </div>
            )}
          </div>
        ) : (
          /* ===== DEFAULT: FORCE / RADIAL TREE BUILDER ===== */
          <div className="flex flex-col gap-4 bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-[#3F72AF]/30 mb-2">
            <div>
              <label className="text-xs text-gray-500 block mb-2 font-semibold">Hierarchy Levels (Dimensions)</label>
              <div className="space-y-3">
                {(draftConfig.dimensions || ['', '']).map((dim, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="text-sm text-gray-400 w-16">Level {i + 1}</span>
                    <select className="flex-1 p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" value={dim} onChange={(e) => handleDimChange(i, e.target.value)}>
                      <option value="">-- Select Column --</option>
                      {columns.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {(draftConfig.dimensions || []).length > 2 && (
                      <button onClick={() => handleRemoveLevel(i)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <Button variant="ghost" onClick={handleAddLevel} className="mt-3 text-sm text-(--color-primary)">
                <Plus className="w-4 h-4 mr-1" /> Add Level
              </Button>
            </div>
            
            <div className="flex gap-4 pt-4 border-t dark:border-gray-700">
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">Edge Weight / Measure (Optional)</label>
                <select className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" value={draftConfig.weightCol || ''} onChange={(e) => setDraftConfig({ ...draftConfig, weightCol: e.target.value })}>
                  <option value="">None (Count Occurrences)</option>
                  {columns.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {draftConfig.weightCol && (
                <div className="flex-1">
                  <label className="text-xs text-gray-500 block mb-1">Aggregation</label>
                  <select className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" value={draftConfig.aggType || 'sum'} onChange={(e) => setDraftConfig({ ...draftConfig, aggType: e.target.value })}>
                    <option value="sum">Sum</option>
                    <option value="avg">Average</option>
                  </select>
                </div>
              )}
              <div className="flex-1">
                <label className="text-xs text-gray-500 block mb-1">Max Nodes Limit</label>
                <input 
                  type="number" 
                  min={20} max={2000} 
                  className="w-full p-2 border rounded text-sm dark:bg-gray-700 dark:text-white" 
                  value={draftConfig.maxNodes || 200} 
                  onChange={(e) => setDraftConfig({ ...draftConfig, maxNodes: Math.max(20, Math.min(2000, Number(e.target.value))) })}
                />
                <p className="text-[10px] text-gray-400 mt-1">Limits graph complexity (20–2000)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AdvancedBuilderPanel;
