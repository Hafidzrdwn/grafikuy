import { useContext, useEffect, useState, useRef } from 'react';
import { DataContext } from '../context/DataContext';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
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

const AdvancedChart2Page = () => {
  const { selectedDataset, parsedData, schema, loading } = useContext(DataContext);
  const [isEditing, setIsEditing] = useState(false);
  const [config, setConfig] = useState(null);
  const [geoData, setGeoData] = useState(null);
  const [filters, setFilters] = useState({});
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => res.json())
      .then(setGeoData)
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedDataset) {
      setConfig(selectedDataset.advancedChart2Config || null);
    }
  }, [selectedDataset]);

  const handleSaveConfig = async (newConfig) => {
    setConfig(newConfig);
    if (selectedDataset?.id) {
      try {
        await updateDatasetConfig(selectedDataset.id, newConfig, 'advancedChart2Config');
      } catch (e) {
        console.error("Failed to save config", e);
      }
    }
  };

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));

  const isConfigured = config && config.geoCol && config.valCol;

  const isCompatible = () => {
    if (!schema) return false;
    if (!isConfigured) return true;
    const colNames = schema.columns.map(c => c.name);
    return colNames.includes(config.geoCol) && colNames.includes(config.valCol);
  };

  const filteredData = parsedData ? applyFilters(parsedData, filters) : [];

  useEffect(() => {
    if (!isConfigured || !filteredData || !geoData || !svgRef.current) return;

    const width = 975, height = 610;
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

    // Country name alias lookup for matching dataset names to GeoJSON names
    const countryAliases = {
      'United States': 'United States of America',
      'USA': 'United States of America',
      'US': 'United States of America',
      'UK': 'United Kingdom',
      'South Korea': 'Korea',
      'North Korea': "Dem. Rep. Korea",
      'Russia': 'Russia',
      'Czech Republic': 'Czechia',
      'DR Congo': 'Dem. Rep. Congo',
      'Congo': 'Congo',
      'Ivory Coast': "Côte d'Ivoire",
      'Tanzania': 'Tanzania',
      'Burma': 'Myanmar',
    };

    // Build data map with aggregation
    const dataMap = new Map();
    filteredData.forEach(d => {
      const loc = String(d[config.geoCol]).trim();
      const val = Number(d[config.valCol]) || 0;
      if (!dataMap.has(loc)) dataMap.set(loc, { sum: 0, count: 0 });
      const curr = dataMap.get(loc);
      curr.sum += val;
      curr.count += 1;
    });

    const aggMap = new Map();
    for (const [name, stats] of dataMap.entries()) {
      const agg = config.aggType || 'sum';
      let finalVal = stats.sum;
      if (agg === 'avg') finalVal = stats.sum / stats.count;
      else if (agg === 'count') finalVal = stats.count;
      aggMap.set(name, finalVal);
    }

    const maxVal = d3.max(Array.from(aggMap.values())) || 1;
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, maxVal]);
    const countries = topojson.feature(geoData, geoData.objects.countries);
    const projection = d3.geoNaturalEarth1().fitSize([width, height], countries);
    const path = d3.geoPath(projection);

    const g = svg.append('g');
    svg.call(d3.zoom().scaleExtent([1, 8]).on('zoom', e => g.attr('transform', e.transform)));

    const aggLabel = config.aggType === 'avg' ? 'Average' : config.aggType === 'count' ? 'Count' : 'Total';

    // Build a lookup that resolves both original name and alias
    const resolveCountryValue = (geoName) => {
      // Direct match
      if (aggMap.has(geoName)) return aggMap.get(geoName);
      // Reverse alias: check if any dataset name maps to this geoName
      for (const [dataName, geoAlias] of Object.entries(countryAliases)) {
        if (geoAlias === geoName && aggMap.has(dataName)) return aggMap.get(dataName);
      }
      // Forward alias: check if geoName itself is a key that maps to a dataset name
      if (countryAliases[geoName] && aggMap.has(countryAliases[geoName])) return aggMap.get(countryAliases[geoName]);
      return undefined;
    };

    // Detect how many data entries match country names
    let matchCount = 0;
    for (const [name] of aggMap.entries()) {
      // Check direct match or alias
      let matched = false;
      for (const feat of countries.features) {
        if (feat.properties.name === name) { matched = true; break; }
      }
      if (!matched) {
        if (countryAliases[name]) matched = true;
      }
      if (!matched) {
        // Reverse: check if any alias value matches a geoJSON name
        for (const [, geoAlias] of Object.entries(countryAliases)) {
          if (geoAlias === name) { matched = true; break; }
        }
      }
      if (matched) matchCount++;
    }

    const totalEntries = aggMap.size;
    const isChoropleth = totalEntries === 0 || (matchCount / totalEntries) > 0.3;

    g.selectAll('path')
      .data(countries.features)
      .join('path')
      .attr('fill', d => {
        if (!isChoropleth) return '#e2e8f0';
        const val = resolveCountryValue(d.properties.name);
        return val !== undefined ? colorScale(val) : '#e2e8f0';
      })
      .attr('d', path)
      .attr('stroke', 'white')
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.currentTarget).attr('stroke', '#112D4E').attr('stroke-width', 2);
        const val = resolveCountryValue(d.properties.name);
        const formattedVal = val !== undefined ? new Intl.NumberFormat().format(Math.round(val)) : 'No data';
        tooltip.transition().duration(200).style('opacity', 0.95);
        tooltip.html(
          `<strong>${d.properties.name}</strong><br/>${aggLabel} of ${config.valCol}: ${formattedVal}`
        )
          .style('left', (event.clientX + 14) + 'px')
          .style('top', (event.clientY - 30) + 'px');
      })
      .on('mousemove', (event) => {
        tooltip.style('left', (event.clientX + 14) + 'px').style('top', (event.clientY - 30) + 'px');
      })
      .on('mouseout', (event) => {
        d3.select(event.currentTarget).attr('stroke', 'white').attr('stroke-width', 0.5);
        tooltip.transition().duration(400).style('opacity', 0);
      });

    // If data is NOT country-level (region/city), render bubble circles
    if (!isChoropleth && totalEntries > 0) {
      const bubbleData = Array.from(aggMap.entries()).map(([name, val]) => ({ name, value: val }));
      const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(bubbleData, d => d.value)])
        .range([4, 35]);

      // Distribute bubbles evenly across the map
      const cols = Math.ceil(Math.sqrt(bubbleData.length));
      const cellW = (width - 100) / cols;
      const cellH = (height - 60) / Math.ceil(bubbleData.length / cols);

      g.selectAll('circle.bubble')
        .data(bubbleData)
        .join('circle')
        .attr('class', 'bubble')
        .attr('cx', (d, i) => 50 + (i % cols) * cellW + cellW / 2)
        .attr('cy', (d, i) => 30 + Math.floor(i / cols) * cellH + cellH / 2)
        .attr('r', d => radiusScale(d.value))
        .attr('fill', d => colorScale(d.value))
        .attr('fill-opacity', 0.7)
        .attr('stroke', '#112D4E')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseover', (event, d) => {
          d3.select(event.currentTarget).attr('fill-opacity', 1).attr('stroke-width', 2);
          const formattedVal = new Intl.NumberFormat().format(Math.round(d.value));
          tooltip.transition().duration(200).style('opacity', 0.95);
          tooltip.html(`<strong>${d.name}</strong><br/>${aggLabel} of ${config.valCol}: ${formattedVal}`)
            .style('left', (event.clientX + 14) + 'px')
            .style('top', (event.clientY - 30) + 'px');
        })
        .on('mousemove', (event) => {
          tooltip.style('left', (event.clientX + 14) + 'px').style('top', (event.clientY - 30) + 'px');
        })
        .on('mouseout', (event) => {
          d3.select(event.currentTarget).attr('fill-opacity', 0.7).attr('stroke-width', 1);
          tooltip.transition().duration(400).style('opacity', 0);
        });

      // Labels for bubbles
      g.selectAll('text.bubble-label')
        .data(bubbleData)
        .join('text')
        .attr('class', 'bubble-label')
        .attr('x', (d, i) => 50 + (i % cols) * cellW + cellW / 2)
        .attr('y', (d, i) => 30 + Math.floor(i / cols) * cellH + cellH / 2 + 3)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('fill', '#112D4E')
        .attr('font-weight', 'bold')
        .attr('pointer-events', 'none')
        .text(d => d.name.length > 10 ? d.name.substring(0, 8) + '..' : d.name);
    }

    return () => { svg.selectAll('*').remove(); d3.select(tooltipRef.current).style('opacity', 0); };
  }, [filteredData, isConfigured, geoData, config]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <PageTitle title="Choropleth Map" />
          <p className="text-gray-500 dark:text-gray-400">View geographical distribution using D3.js.</p>
        </div>
        {selectedDataset && (
          <Button variant={isEditing ? "primary" : "secondary"} onClick={() => setIsEditing(!isEditing)}>
            <Settings2 className="w-4 h-4 mr-2" />
            {isEditing ? "Close Builder" : "Edit Chart"}
          </Button>
        )}
      </div>

      {!loading && selectedDataset && (
        <FilterBar 
          schemaFilters={selectedDataset.dashboardConfig?.filters || []} 
          parsedData={parsedData}
          filters={filters} 
          onFilterChange={handleFilterChange} 
          onReset={() => setFilters({})}
        />
      )}
      
      {isEditing && selectedDataset && (
        <AdvancedBuilderPanel 
          config={config} 
          onSave={handleSaveConfig} 
          onClose={() => setIsEditing(false)}
          columns={schema?.columns?.map(c => c.name) || []}
          chartType="map"
        />
      )}

      {(loading || (!geoData && selectedDataset)) ? (
        <div className="h-64 flex items-center justify-center"><Spinner /></div>
      ) : !selectedDataset ? (
        <EmptyState title="No Dataset Selected" description="Please set a primary dataset in Data Management first." />
      ) : !isCompatible() ? (
        <EmptyState title="Incompatible Data Mapping" description="The selected columns do not exist in the current dataset schema." />
      ) : !isConfigured ? (
        <EmptyState title="Build Your Advanced Chart" description="Your chart is empty. Click 'Edit Chart' to map geographical data." />
      ) : (
        <>
          <Card className="w-full min-h-[500px] p-0 relative overflow-hidden">
            <div className="relative w-full h-full">
              <svg ref={svgRef} className="w-full h-full max-h-[700px]" />
              <div ref={tooltipRef} className="dark:text-gray-800" />
            </div>
          </Card>
          <InsightAccordion insight="Map visualization matches country names from data with world atlas properties. Hover to see details." />
        </>
      )}
    </div>
  );
};

export default AdvancedChart2Page;
