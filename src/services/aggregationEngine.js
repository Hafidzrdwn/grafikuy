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

export const applyFilters = (data, activeFilters) => {
  if (!activeFilters || Object.keys(activeFilters).length === 0) return data;

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
    for (const [column, filterValue] of Object.entries(regularFilters)) {
      if (!filterValue) continue;
      const cellValue = row[column];
      if (String(cellValue) !== String(filterValue)) {
        return false;
      }
    }
    
    for (const [column, range] of Object.entries(dateRanges)) {
      const cellDate = new Date(row[column]);
      if (isNaN(cellDate.getTime())) return false;
      if (range.from && cellDate < range.from) return false;
      if (range.to && cellDate > new Date(range.to.getTime() + 86400000)) return false; 
    }
    
    return true;
  });
};

export const aggregateData = (data, groupByCol, measureCol, aggType = 'sum') => {
  if (!data || data.length === 0) return groupByCol ? [] : 0;

  if (!groupByCol) {
    return computeAgg(data, measureCol, aggType);
  }

  const grouped = {};
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const groupKey = row[groupByCol];
    
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

  if (aggType !== 'count') {
    result.sort((a, b) => b[measureCol] - a[measureCol]);
  }

  return result;
};

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

export const flatToGraph = (data, dimensions, weightCol = null, aggType = 'count') => {
  if (!data || data.length === 0 || !dimensions || dimensions.length < 2) return { nodes: [], links: [] };

  const nodesMap = new Map();
  const linksMap = new Map();

  data.forEach(row => {
    let prevId = null;

    let linkVal = 1; 
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
    let finalWeight = valArr.length; 
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
    
    if(nodesMap.has(linkData.source)) nodesMap.get(linkData.source).value += finalWeight;
    if(nodesMap.has(linkData.target)) nodesMap.get(linkData.target).value += finalWeight;
  }

  const allNodeVals = Array.from(nodesMap.values()).map(n => n.value);
  const minVal = Math.min(...allNodeVals);
  const maxVal = Math.max(...allNodeVals);
  
  const nodes = Array.from(nodesMap.values()).map(n => {
    let size = 10;
    if (maxVal > minVal) {
      size = 10 + ((n.value - minVal) / (maxVal - minVal)) * 40;
    }
    return { ...n, symbolSize: size };
  });

  return { nodes, links };
};
