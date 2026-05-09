import { useContext, useEffect, useRef, useState, useMemo } from 'react';
import { DataContext } from '../context/DataContext';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import PageTitle from '../components/ui/PageTitle';
import Card from '../components/ui/Card';
import InsightAccordion from '../components/dashboard/InsightAccordion';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';

const AdvancedChart2Page = () => {
  const { parsedData, schema, loading } = useContext(DataContext);
  const svgRef = useRef();
  const [geoData, setGeoData] = useState(null);

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(res => res.json()).then(setGeoData).catch(console.error);
  }, []);

  const { isCompatible, geoCol, valCol } = useMemo(() => {
    if (!schema) return { isCompatible: false };
    const strCols = schema.columns.filter(c => c.type === 'string');
    const numCols = schema.columns.filter(c => c.type === 'number');
    if (strCols.length >= 1 && numCols.length >= 1) {
      return { isCompatible: true, geoCol: strCols[0].name, valCol: numCols[0].name };
    }
    return { isCompatible: false };
  }, [schema]);

  useEffect(() => {
    if (!isCompatible || !parsedData || !geoData) return;
    const width = 975, height = 610;
    const svg = d3.select(svgRef.current).attr("viewBox", [0, 0, width, height]).style("width", "100%").style("height", "auto");
    svg.selectAll('*').remove();

    const dataMap = new Map();
    parsedData.forEach(d => {
      const loc = String(d[geoCol]).trim();
      const val = Number(d[valCol]) || 0;
      dataMap.set(loc, (dataMap.get(loc) || 0) + val);
    });

    const maxVal = d3.max(Array.from(dataMap.values())) || 1;
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, maxVal]);
    const projection = d3.geoNaturalEarth1().fitSize([width, height], topojson.feature(geoData, geoData.objects.countries));
    const path = d3.geoPath(projection);
    const countries = topojson.feature(geoData, geoData.objects.countries).features;

    const g = svg.append("g");
    svg.call(d3.zoom().on("zoom", e => g.attr("transform", e.transform)));

    g.selectAll("path").data(countries).join("path")
      .attr("fill", d => {
        const val = dataMap.get(d.properties.name);
        return val !== undefined ? colorScale(val) : "#ccc";
      })
      .attr("d", path).attr("stroke", "white").attr("stroke-width", 0.5)
      .append("title").text(d => `${d.properties.name}: ${dataMap.get(d.properties.name) || 0}`);

    return () => svg.selectAll('*').remove();
  }, [parsedData, isCompatible, geoData, geoCol, valCol]);

  return (
    <div className="space-y-6">
      <PageTitle title="Choropleth Map" />
      
      {(loading || (!geoData && isCompatible)) ? (
        <div className="h-64 flex items-center justify-center"><Spinner /></div>
      ) : !isCompatible ? (
        <EmptyState title="Incompatible Dataset" description="Requires a geographical column (e.g., country names) and a numeric column." />
      ) : (
        <>
          <Card className="w-full flex justify-center overflow-hidden min-h-[500px] p-0 relative">
            <svg ref={svgRef} className="w-full h-full max-h-[700px]"></svg>
          </Card>
          <InsightAccordion insight="Map visualization matches country names from data with the world atlas feature properties." />
        </>
      )}
    </div>
  );
};
export default AdvancedChart2Page;
