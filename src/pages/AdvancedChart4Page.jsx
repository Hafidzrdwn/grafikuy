import { useContext, useEffect, useRef, useMemo } from 'react';
import { DataContext } from '../context/DataContext';
import * as d3 from 'd3';
import PageTitle from '../components/ui/PageTitle';
import Card from '../components/ui/Card';
import InsightAccordion from '../components/dashboard/InsightAccordion';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';

const AdvancedChart4Page = () => {
  const { parsedData, schema, loading } = useContext(DataContext);
  const svgRef = useRef();

  const { isCompatible, dateCol, catCol, valCol } = useMemo(() => {
    if (!schema) return { isCompatible: false };
    const dateCols = schema.columns.filter(c => c.type === 'date');
    const catCols = schema.columns.filter(c => c.type === 'string');
    const numCols = schema.columns.filter(c => c.type === 'number');
    
    if (dateCols.length >= 1 && catCols.length >= 1 && numCols.length >= 1) {
      return { isCompatible: true, dateCol: dateCols[0].name, catCol: catCols[0].name, valCol: numCols[0].name };
    }
    if (numCols.length >= 2 && catCols.length >= 1) {
      return { isCompatible: true, dateCol: numCols[0].name, catCol: catCols[0].name, valCol: numCols[1].name };
    }
    return { isCompatible: false };
  }, [schema]);

  useEffect(() => {
    if (!isCompatible || !parsedData || parsedData.length === 0) return;
    const width = 800, height = 500, margin = {top: 20, right: 30, bottom: 30, left: 20};
    const svg = d3.select(svgRef.current).attr("viewBox", [0, 0, width, height]).style("width", "100%").style("height", "auto");
    svg.selectAll('*').remove();

    const rolled = d3.rollup(parsedData, v => d3.sum(v, d => Number(d[valCol])||0), d => d[dateCol], d => d[catCol]);
    const keys = Array.from(new Set(parsedData.map(d => d[catCol])));
    const dataFormatted = Array.from(rolled, ([date, map]) => {
      const obj = { date: new Date(date) };
      if (isNaN(obj.date)) obj.date = Number(date);
      keys.forEach(k => { obj[k] = map.get(k) || 0; });
      return obj;
    }).sort((a, b) => d3.ascending(a.date, b.date));

    const series = d3.stack().keys(keys).offset(d3.stackOffsetWiggle)(dataFormatted);
    const x = d3.scaleTime().domain(d3.extent(dataFormatted, d => d.date)).range([margin.left, width - margin.right]);
    const y = d3.scaleLinear().domain([d3.min(series, d => d3.min(d, d => d[0])), d3.max(series, d => d3.max(d, d => d[1]))]).range([height - margin.bottom, margin.top]);
    const color = d3.scaleOrdinal(d3.schemeTableau10).domain(keys);

    const area = d3.area().curve(d3.curveCatmullRom).x(d => x(d.data.date)).y0(d => y(d[0])).y1(d => y(d[1]));

    const g = svg.append("g");
    g.selectAll("path").data(series).join("path").attr("fill", ({key}) => color(key)).attr("d", area).append("title").text(({key}) => key);
    svg.append("g").attr("transform", `translate(0,${height - margin.bottom})`).call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0));

    return () => svg.selectAll('*').remove();
  }, [parsedData, isCompatible, dateCol, catCol, valCol]);

  return (
    <div className="space-y-6">
      <PageTitle title="Streamgraph" />
      
      {loading ? (
        <div className="h-64 flex items-center justify-center"><Spinner /></div>
      ) : !isCompatible ? (
        <EmptyState title="Incompatible Dataset" description="Requires Date/Time, Categorical, and Numeric columns." />
      ) : (
        <>
          <Card className="w-full min-h-[500px] p-4 relative">
            <svg ref={svgRef} className="w-full h-full min-h-[500px]"></svg>
          </Card>
          <InsightAccordion insight="Streamgraphs show volume over time stacked symmetrically, ideal for temporal trends." />
        </>
      )}
    </div>
  );
};
export default AdvancedChart4Page;
