import { useState, useEffect } from "react";
import { subscribeToDailyViews } from "@/services/firebase";
import PageTitle from "@/components/ui/PageTitle";
import Card from "@/components/ui/Card";
import AreaChart from "@/components/charts/AreaChart";
import Spinner from "@/components/ui/Spinner";
import * as d3 from "d3";

const PageVisitorsPage = () => {
  const [dailyData, setDailyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState("14d");

  useEffect(() => {
    const unsubscribe = subscribeToDailyViews((data) => {
      setDailyData(data || {});
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const processData = () => {
    if (!dailyData || Object.keys(dailyData).length === 0) return [];

    const parsedData = Object.entries(dailyData)
      .filter(([dateStr]) => dateStr !== 'total')
      .map(([dateStr, value]) => ({
        date: new Date(dateStr),
        value,
      }))
      .sort((a, b) => a.date - b.date);

    const now = new Date();

    if (timeFilter === "14d") {
      const filledData = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);

        const existing = parsedData.find((p) => {
          const pDate = new Date(p.date);
          pDate.setHours(0, 0, 0, 0);
          return pDate.getTime() === d.getTime();
        });

        filledData.push({
          date: d,
          value: existing ? existing.value : 0,
        });
      }
      return filledData;
    }

    if (timeFilter === "month") {
      const monthly = d3.rollup(
        parsedData,
        (v) => d3.sum(v, (d) => d.value),
        (d) => {
          const date = new Date(d.date);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
        },
      );

      const filledData = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;

        filledData.push({
          date: d,
          value: monthly.get(dStr) || 0,
        });
      }
      return filledData;
    }

    if (timeFilter === "year") {
      const yearly = d3.rollup(
        parsedData,
        (v) => d3.sum(v, (d) => d.value),
        (d) => {
          return new Date(d.date).getFullYear();
        },
      );

      const filledData = [];
      const currentYear = now.getFullYear();
      for (let year = currentYear - 4; year <= currentYear; year++) {
        filledData.push({
          date: new Date(year, 0, 1),
          value: yearly.get(year) || 0,
        });
      }
      return filledData;
    }

    return parsedData;
  };

  const chartData = processData();
  const totalViews = dailyData?.total || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between md:items-center md:flex-row flex-col gap-y-4">
        <div>
          <PageTitle title="Page Visitors Analytics" />
          <p className="text-gray-500 dark:text-gray-400">
            Track and analyze dashboard visitor traffic over time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 font-medium">
            Time Range:
          </label>
          <select
            className="p-2 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white dark:border-gray-700 outline-hidden focus:ring-2 focus:ring-(--color-primary)"
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
          >
            <option value="14d">Last 14 Days</option>
            <option value="month">Monthly Overview</option>
            <option value="year">Yearly Overview</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <Card className="p-6">
          <div className="mb-6 flex justify-between items-end">
            <div>
              <h3 className="text-lg font-bold text-(--color-dark) dark:text-white mb-1">
                Traffic Overview
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total visitors for the selected period.
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-(--color-primary) dark:text-[#DBE2EF] tracking-tight">
                {totalViews.toLocaleString("id-ID")}
              </div>
              <p className="text-sm font-medium text-gray-500">Total Views</p>
            </div>
          </div>

          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <AreaChart data={chartData} formatConfig={timeFilter} />
            ) : (
              <div className="h-full w-full flex items-center justify-center border-2 border-dashed rounded-lg border-gray-200 dark:border-gray-700">
                <p className="text-gray-500">
                  No data available for this period.
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PageVisitorsPage;
