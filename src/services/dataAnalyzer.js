// src/services/dataAnalyzer.js
export const analyzeSchema = (rows) => {
  if (!rows || rows.length === 0) return { columns: [], stats: {}, suggestedFilters: [], suggestedCharts: [], suggestedKPIs: [] };

  const sample = rows.slice(0, Math.min(100, rows.length));
  const columns = Object.keys(sample[0]).map(name => {
    let type = 'string';
    const values = sample.map(r => r[name]).filter(v => v !== null && v !== undefined && v !== '');
    
    if (values.length > 0) {
      const isAllNumbers = values.every(v => !isNaN(Number(v)));
      const isAllDates = values.every(v => !isNaN(Date.parse(v)));
      const isAllBooleans = values.every(v => typeof v === 'boolean' || v === 'true' || v === 'false');
      
      if (isAllNumbers) type = 'number';
      else if (isAllBooleans) type = 'boolean';
      else if (isAllDates && !isAllNumbers) type = 'date';
    }
    return { name, type };
  });

  const stats = {};
  columns.forEach(col => {
    const vals = rows.map(r => r[col.name]).filter(v => v !== null && v !== undefined && v !== '');
    if (col.type === 'number') {
      const numVals = vals.map(Number);
      stats[col.name] = {
        min: Math.min(...numVals),
        max: Math.max(...numVals),
        mean: numVals.reduce((a, b) => a + b, 0) / (numVals.length || 1),
        uniqueCount: new Set(vals).size
      };
    } else {
      stats[col.name] = { uniqueCount: new Set(vals).size };
    }
  });

  const suggestedFilters = columns
    .filter(c => (c.type === 'string' && stats[c.name].uniqueCount < 20) || c.type === 'number' || c.type === 'date')
    .slice(0, 6)
    .map(c => ({
      column: c.name,
      type: c.type === 'string' ? 'select' : c.type === 'number' ? 'range' : 'date-range'
    }));

  const suggestedCharts = [];
  const dateCols = columns.filter(c => c.type === 'date');
  const numCols = columns.filter(c => c.type === 'number');
  const catCols = columns.filter(c => c.type === 'string' && stats[c.name].uniqueCount < 50);

  if (dateCols.length > 0 && numCols.length > 0) {
    suggestedCharts.push({ type: 'LineChart', xAxis: dateCols[0].name, yAxis: numCols[0].name });
  }
  if (catCols.length > 0 && numCols.length > 0) {
    suggestedCharts.push({ type: 'BarChart', xAxis: catCols[0].name, yAxis: numCols[0].name });
    if (stats[catCols[0].name].uniqueCount <= 10) {
      suggestedCharts.push({ type: 'PieChart', category: catCols[0].name, value: numCols[0].name });
    }
  }
  if (numCols.length >= 2) {
    suggestedCharts.push({ type: 'ScatterChart', xAxis: numCols[0].name, yAxis: numCols[1].name });
  }
  if (suggestedCharts.length === 0 && catCols.length > 0) {
    suggestedCharts.push({ type: 'BarChart', xAxis: catCols[0].name, yAxis: null });
  }

  const suggestedKPIs = numCols.slice(0, 4).map(c => ({
    label: `Avg ${c.name}`,
    column: c.name,
    agg: 'avg'
  }));

  if (suggestedKPIs.length < 4 && catCols.length > 0) {
    suggestedKPIs.push({
      label: `Unique ${catCols[0].name}`,
      column: catCols[0].name,
      agg: 'countUnique'
    });
  }

  return { columns, stats, suggestedFilters, suggestedCharts: suggestedCharts.slice(0, 4), suggestedKPIs: suggestedKPIs.slice(0, 4) };
};

export const transformDataset = (rawRows, schemaConfig) => {
  return rawRows.map(row => {
    const newRow = { ...row };
    for (const [col, type] of Object.entries(schemaConfig)) {
      let val = newRow[col];
      if (val === null || val === undefined || val === '') continue;
      
      try {
        switch (type) {
          case 'number':
            newRow[col] = Number(String(val).replace(/[^0-9.-]+/g, ''));
            break;
          case 'date':
            const d = new Date(val);
            if (!isNaN(d.getTime())) newRow[col] = d.toISOString().split('T')[0];
            break;
          case 'currency':
            newRow[col] = Number(String(val).replace(/[^0-9.-]+/g, ''));
            break;
          case 'string':
          case 'category':
            newRow[col] = String(val).trim();
            break;
          default:
            break;
        }
      } catch (e) {
        // Fallback to original
      }
    }
    return newRow;
  });
};
