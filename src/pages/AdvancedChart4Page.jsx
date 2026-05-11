import { useContext, useEffect, useState, useRef } from 'react';
import { DataContext } from '../context/DataContext';
import * as d3 from 'd3';
import PageTitle from '../components/ui/PageTitle';
import Card from '../components/ui/Card';
import InsightAccordion from '../components/dashboard/InsightAccordion';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import AdvancedBuilderPanel from '../components/dashboard/AdvancedBuilderPanel';
import FilterBar from '../components/dashboard/FilterBar';
import Button from '../components/ui/Button';
import { Settings2 } from 'lucide-react';
import { updateDatasetConfig } from '../services/firebase';
import { applyFilters } from '../services/aggregationEngine';

const AdvancedChart4Page = () => {
  const { selectedDataset, parsedData, schema, loading } = useContext(DataContext);
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState(null);
  const [filters, setFilters] = useState({});
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (selectedDataset) {
      setConfig(selectedDataset.advancedChart4Config || null);
    }
  }, [selectedDataset]);

  const handleSaveConfig = async (newConfig) => {
    setConfig(newConfig);
    if (selectedDataset?.id) {
      try {
        await updateDatasetConfig(selectedDataset.id, newConfig, 'advancedChart4Config');
      } catch (e) {
        console.error("Failed to save config", e);
      }
    }
  };

  const isConfigured = config && config.dateCol && config.catCol && config.valCol;

  const isCompatible = () => {
    if (!schema) return false;
    if (!isConfigured) return true;
    const colNames = schema.columns.map(c => c.name);
    return colNames.includes(config.dateCol) && colNames.includes(config.catCol) && colNames.includes(config.valCol);
  };

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  const filteredData = parsedData ? applyFilters(parsedData, filters) : [];

  useEffect(() => {
    if (!isConfigured || !svgRef.current || !filteredData || filteredData.length === 0) return;

    const width = 800, height = 500;
    const margin = { top: 20, right: 30, bottom: 30, left: 50 };

    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height])
      .style('width', '100%')
      .style('height', 'auto');
    svg.selectAll('*').remove();

    const tooltip = d3.select(tooltipRef.current)
      .style('opacity', 0)
      .style('position', 'fixed')
      .style('z-index', '9999')
      .style('background', 'white')
      .style('border', '1px solid #ccc')
      .style('border-radius', '6px')
      .style('padding', '10px 14px')
      .style('pointer-events', 'none')
      .style('font-size', '12px')
      .style('box-shadow', '0 4px 12px rgb(0 0 0 / 0.15)')
      .style('color', '#333');

    const parseSafeDate = (rawVal) => {
      if (!rawVal) return new Date();
      if (rawVal instanceof Date) return rawVal;
      
      if (typeof rawVal === 'number' && rawVal > 40000 && rawVal < 50000) {
        return new Date((rawVal - 25569) * 86400 * 1000);
      }
      
      const strVal = String(rawVal).replace(' ', 'T');
      const d = new Date(strVal);
      
      return isNaN(d.getTime()) ? new Date(0) : d;
    };

    const getGroupDateKey = (rawVal) => {
      const d = parseSafeDate(rawVal);
      const fmt = config.dateFormat || 'month-year';
      
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      
      switch (fmt) {
        case 'year': return `${y}-01-01`;
        case 'month':
        case 'month-year': return `${y}-${m}-01`;
        case 'quarter': 
          const qMonth = String(Math.floor(d.getMonth() / 3) * 3 + 1).padStart(2, '0');
          return `${y}-${qMonth}-01`;
        case 'day': 
        default: return `${y}-${m}-${day}`;
      }
    };

    const aggFn = config.aggType || 'sum';
    const grouped = new Map();
    const catTotals = new Map();
    
    filteredData.forEach(row => {
      const dateKey = getGroupDateKey(row[config.dateCol]);
      const catVal = String(row[config.catCol]);
      const val = Number(row[config.valCol]) || 0;
      
      if (!grouped.has(dateKey)) grouped.set(dateKey, new Map());
      const dateMap = grouped.get(dateKey);
      if (!dateMap.has(catVal)) dateMap.set(catVal, []);
      dateMap.get(catVal).push(val);
      
      catTotals.set(catVal, (catTotals.get(catVal) || 0) + val);
    });

    const topN = config.topN || 7;
    const sortedCats = Array.from(catTotals.entries()).sort((a, b) => b[1] - a[1]);
    const keys = sortedCats.slice(0, topN).map(([k]) => k);

    const dataFormatted = Array.from(grouped, ([dateKey, catMap]) => {
      const obj = { date: new Date(dateKey) };
      if (isNaN(obj.date)) obj.date = dateKey;
      keys.forEach(k => {
        const vals = catMap.get(k) || [];
        if (aggFn === 'avg' && vals.length > 0) {
          obj[k] = vals.reduce((a, b) => a + b, 0) / vals.length;
        } else if (aggFn === 'count') {
          obj[k] = vals.length;
        } else {
          obj[k] = vals.reduce((a, b) => a + b, 0);
        }
      });
      return obj;
    }).sort((a, b) => d3.ascending(a.date, b.date));

    if (dataFormatted.length === 0) return;

    const series = d3.stack().keys(keys).offset(d3.stackOffsetWiggle)(dataFormatted);

    const x = d3.scaleTime()
      .domain(d3.extent(dataFormatted, d => d.date))
      .range([margin.left, width - margin.right]);
    
    const y = d3.scaleLinear()
      .domain([d3.min(series, d => d3.min(d, d => d[0])), d3.max(series, d => d3.max(d, d => d[1]))])
      .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
      .domain(keys)
      .range(['#3F72AF', '#112D4E', '#80C4E9', '#96C9F4', '#5A96E3', '#2A4A7F', '#DBE2EF', '#526D82']);

    const area = d3.area()
      .curve(d3.curveCatmullRom)
      .x(d => x(d.data.date))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]));
    
    console.log(
      "Area :", area
    )

    svg.selectAll('path.stream')
      .data(series)
      .join('path')
      .attr('class', 'stream')
      .attr('fill', ({ key }) => color(key))
      .attr('d', area)
      .attr('opacity', 0.85)
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).attr('opacity', 1);
        tooltip.transition().duration(200).style('opacity', 0.95);
        tooltip.html(`<strong>${d.key}</strong>`)
          .style('left', (event.clientX + 14) + 'px')
          .style('top', (event.clientY - 30) + 'px');
      })
      .on('mousemove', (event) => {
        tooltip.style('left', (event.clientX + 14) + 'px').style('top', (event.clientY - 30) + 'px');
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget).attr('opacity', 0.85);
        tooltip.transition().duration(400).style('opacity', 0);
      });

    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(width / 100).tickSizeOuter(0))
      .attr('color', 'currentColor');

    const legend = svg.append('g')
      .attr('transform', `translate(${width - 120}, ${margin.top})`);

    keys.slice(0, 8).forEach((key, i) => {
      const lg = legend.append('g').attr('transform', `translate(0, ${i * 18})`);
      lg.append('rect').attr('width', 12).attr('height', 12).attr('fill', color(key)).attr('rx', 2);
      lg.append('text').attr('x', 16).attr('y', 10).text(key.length > 14 ? key.substring(0, 12) + '..' : key)
        .style('font-size', '11px').attr('fill', 'currentColor');
    });

    return () => { svg.selectAll('*').remove(); d3.select(tooltipRef.current).style('opacity', 0); };
  }, [filteredData, isConfigured, config]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between md:items-center md:flex-row flex-col gap-y-4">
        <div>
          <PageTitle title="Streamgraph" />
          <p className="text-gray-500 dark:text-gray-400">View volume distribution over a continuous axis using D3.js.</p>
        </div>
        {selectedDataset && (
          <Button variant={isEditing ? "primary" : "secondary"} onClick={() => setIsEditing(!isEditing)}>
            <Settings2 className="w-4 h-4 mr-2" />
            {isEditing ? "Close Builder" : "Edit Chart"}
          </Button>
        )}
      </div>
      
      {isEditing && selectedDataset && (
        <AdvancedBuilderPanel 
          config={config} 
          onSave={handleSaveConfig} 
          onClose={() => setIsEditing(false)}
          columns={schema?.columns?.map(c => c.name) || []}
          chartType="stream"
        />
      )}

      {!loading && selectedDataset && (
        <FilterBar 
          schemaFilters={selectedDataset.dashboardConfig?.filters || []} 
          parsedData={parsedData}
          filters={filters} 
          onFilterChange={handleFilterChange} 
          onReset={() => setFilters({})}
        />
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center"><Spinner /></div>
      ) : !selectedDataset ? (
        <EmptyState title="No Dataset Selected" description="Please set a primary dataset in Data Management first." />
      ) : !isCompatible() ? (
        <EmptyState title="Incompatible Data Mapping" description="The selected columns do not exist in the current dataset schema." />
      ) : !isConfigured ? (
        <EmptyState title="Build Your Advanced Chart" description="Your chart is empty. Click 'Edit Chart' to map your data streams." />
      ) : (
        <>
          <Card className="w-full min-h-125 p-4 relative">
            <div className="relative w-full h-full">
              <svg ref={svgRef} className="w-full h-full min-h-125 text-gray-700 dark:text-gray-300" />
              <div ref={tooltipRef} className="dark:text-gray-800" />
            </div>
          </Card>
          <InsightAccordion insight="Streamgraphs show volume over time stacked symmetrically, ideal for temporal trends. Hover layers to identify categories." />
        </>
      )}
    </div>
  );
};

export default AdvancedChart4Page;
