// src/services/aggregationEngine.js

/**
 * Example DashboardConfig JSON Schema:
 * {
 *   "filters": [
 *     { "column": "Region", "type": "select" },
 *     { "column": "Order Date", "type": "date-range" }
 *   ],
 *   "kpiCards": [
 *     { "id": "kpi-1", "label": "Total Sales", "column": "Sales", "aggType": "sum" },
 *     { "id": "kpi-2", "label": "Average Profit", "column": "Profit", "aggType": "avg" }
 *   ],
 *   "charts": [
 *     { 
 *       "id": "chart-1", 
 *       "type": "BarChart", 
 *       "xAxis": "Region", 
 *       "yAxis": "Sales", 
 *       "aggType": "sum" 
 *     },
 *     { 
 *       "id": "chart-2", 
 *       "type": "LineChart", 
 *       "xAxis": "Order Date", 
 *       "yAxis": "Sales", 
 *       "aggType": "sum" 
 *     }
 *   ]
 * }
 */

/**
 * Formats a date value according to the specified format.
 * Used when a date column is selected as a chart dimension.
 */
export const formatDateValue = (rawValue, format) => {
  if (!format || format === 'auto') return String(rawValue);
  
  let d;
  if (rawValue instanceof Date) {
    d = rawValue;
  } else if (typeof rawValue === 'string' || typeof rawValue === 'number') {
    d = new Date(rawValue);
  }
  
  if (!d || isNaN(d.getTime())) return String(rawValue);
  
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthsShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const y = d.getFullYear();
  const m = d.getMonth();
  
  switch (format) {
    case 'year': return String(y);
    case 'month': return months[m];
    case 'month-year': return `${monthsShort[m]} ${y}`;
    case 'quarter': return `Q${Math.floor(m / 3) + 1} ${y}`;
    case 'day': return d.toISOString().split('T')[0];
    default: return String(rawValue);
  }
};

/**
 * Applies active filters to the raw dataset.
 * @param {Array} data - Raw array of objects (e.g., 10,000 rows)
 * @param {Object} activeFilters - Format: { "Region": "North", "Category": "Electronics" }
 * @returns {Array} Filtered data
 */
export const applyFilters = (data, activeFilters) => {
  if (!activeFilters || Object.keys(activeFilters).length === 0) return data;

  // Separate date-range filters from regular filters
  const dateRanges = {};
  const regularFilters = {};
  
  for (const [key, value] of Object.entries(activeFilters)) {
    if (!value) continue;
    if (key.endsWith('__from')) {
      const col = key.replace('__from', '');
      if (!dateRanges[col]) dateRanges[col] = {};
      dateRanges[col].from = new Date(value);
    } else if (key.endsWith('__to')) {
      const col = key.replace('__to', '');
      if (!dateRanges[col]) dateRanges[col] = {};
      dateRanges[col].to = new Date(value);
    } else {
      regularFilters[key] = value;
    }
  }

  return data.filter(row => {
    // Check regular filters
    for (const [column, filterValue] of Object.entries(regularFilters)) {
      if (!filterValue) continue;
      const cellValue = row[column];
      if (String(cellValue) !== String(filterValue)) {
        return false;
      }
    }
    
    // Check date-range filters
    for (const [column, range] of Object.entries(dateRanges)) {
      const cellDate = new Date(row[column]);
      if (isNaN(cellDate.getTime())) return false;
      if (range.from && cellDate < range.from) return false;
      if (range.to && cellDate > new Date(range.to.getTime() + 86400000)) return false; // Include end date
    }
    
    return true;
  });
};

/**
 * Aggregates data for charts and KPI cards (Pivot Table logic).
 * @param {Array} data - Filtered array of objects
 * @param {String} groupByCol - The Dimension (e.g., "Region", "Category"). If null, returns a single global aggregation.
 * @param {String} measureCol - The Measure (e.g., "Sales", "Profit")
 * @param {String} aggType - Aggregation type: "sum", "avg", "count", "min", "max"
 * @returns {Array|Number} Array of { [groupByCol]: value, [measureCol]: aggValue } OR a single number if groupByCol is null.
 */
export const aggregateData = (data, groupByCol, measureCol, aggType = 'sum') => {
  if (!data || data.length === 0) return groupByCol ? [] : 0;

  // Global Aggregation (For KPI Cards)
  if (!groupByCol) {
    return computeAgg(data, measureCol, aggType);
  }

  // Grouped Aggregation (For Charts)
  const grouped = {};
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const groupKey = row[groupByCol];
    
    // Skip null/undefined grouping keys
    if (groupKey === null || groupKey === undefined || groupKey === '') continue;

    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    grouped[groupKey].push(row);
  }

  const result = [];
  for (const [key, groupRows] of Object.entries(grouped)) {
    const val = computeAgg(groupRows, measureCol, aggType);
    result.push({
      [groupByCol]: key,
      [measureCol]: val
    });
  }

  // Optional: Sort result by measure for better visualization
  if (aggType !== 'count') {
    result.sort((a, b) => b[measureCol] - a[measureCol]);
  }

  return result;
};

// Helper function to compute mathematical aggregation
const computeAgg = (rows, measureCol, aggType) => {
  if (aggType === 'count') return rows.length;
  
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  let validCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const val = Number(rows[i][measureCol]);
    if (!isNaN(val)) {
      sum += val;
      if (val < min) min = val;
      if (val > max) max = val;
      validCount++;
    }
  }

  if (validCount === 0) return 0;

  switch (aggType) {
    case 'sum': return sum;
    case 'avg': return sum / validCount;
    case 'min': return min;
    case 'max': return max;
    default: return sum;
  }
};

/**
 * Transforms flat tabular data into a Graph structure (nodes and links)
 * Ideal for Force Directed Graphs, Radial Trees, etc.
 */
export const flatToGraph = (data, dimensions, weightCol = null, aggType = 'count') => {
  if (!data || data.length === 0 || !dimensions || dimensions.length < 2) return { nodes: [], links: [] };

  const nodesMap = new Map();
  const linksMap = new Map();

  data.forEach(row => {
    let prevId = null;

    let linkVal = 1; // Default is count
    if (weightCol && row[weightCol] !== undefined && row[weightCol] !== null) {
      const val = Number(row[weightCol]);
      if (!isNaN(val)) linkVal = val;
    }

    let currentPathId = "";

    for (let i = 0; i < dimensions.length; i++) {
      const dimCol = dimensions[i];
      const rawVal = row[dimCol];
      if (rawVal === undefined || rawVal === null || String(rawVal).trim() === '') break;
      
      const valStr = String(rawVal).trim();
      currentPathId = currentPathId ? `${currentPathId}___${valStr}` : valStr;

      if (!nodesMap.has(currentPathId)) {
        nodesMap.set(currentPathId, { id: currentPathId, name: valStr, category: dimCol, symbolSize: 10, value: 0 });
      }

      if (prevId !== null) {
        const linkId = `${prevId}====${currentPathId}`;
        if (!linksMap.has(linkId)) {
          linksMap.set(linkId, { source: prevId, target: currentPathId, value: [] });
        }
        linksMap.get(linkId).value.push(linkVal);
      }
      
      prevId = currentPathId;
    }
  });

  const links = [];
  for (const linkData of linksMap.values()) {
    const valArr = linkData.value;
    let finalWeight = valArr.length; // 'count'
    if (aggType === 'sum') {
      finalWeight = valArr.reduce((a, b) => a + b, 0);
    } else if (aggType === 'avg') {
      finalWeight = valArr.reduce((a, b) => a + b, 0) / valArr.length;
    }
    
    links.push({
      source: linkData.source,
      target: linkData.target,
      value: finalWeight
    });
    
    // Add to node weights for sizing
    if(nodesMap.has(linkData.source)) nodesMap.get(linkData.source).value += finalWeight;
    if(nodesMap.has(linkData.target)) nodesMap.get(linkData.target).value += finalWeight;
  }

  // Normalize symbol size for ECharts
  const allNodeVals = Array.from(nodesMap.values()).map(n => n.value);
  const minVal = Math.min(...allNodeVals);
  const maxVal = Math.max(...allNodeVals);
  
  const nodes = Array.from(nodesMap.values()).map(n => {
    let size = 10;
    if (maxVal > minVal) {
      // Scale between 10 and 50
      size = 10 + ((n.value - minVal) / (maxVal - minVal)) * 40;
    }
    return { ...n, symbolSize: size };
  });

  return { nodes, links };
};
