import { useEffect, useRef } from 'react'
import ApexCharts from 'apexcharts'

export function Chart({
  options,
  config,
  series,
  type,
  height = '100%',
  width = '100%',
  className = '',
  id,
  ...props
}) {
  const containerRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const rawOptions = config?.options || options || {};
    const rawSeries = config?.series || series || rawOptions.series || [];
    const chartType = config?.type || type || rawOptions.chart?.type || 'line';
    const chartHeight = config?.height || height || rawOptions.chart?.height || '100%';

    const currentTheme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
    const themeAware = getThemeAwareOptions(rawOptions, currentTheme);

    const finalOptions = {
      ...themeAware,
      series: rawSeries,
      chart: {
        ...(themeAware.chart || {}),
        type: chartType,
        height: chartHeight,
        background: 'transparent',
        toolbar: themeAware.chart?.toolbar || { show: false },
      },
    };

    containerRef.current.innerHTML = '';
    const chart = new ApexCharts(containerRef.current, finalOptions);
    chartInstance.current = chart;
    chart.render();

    const handleThemeChange = (e) => {
      const nextTheme = e.detail?.theme || (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
      if (chartInstance.current) {
        const updated = getThemeAwareOptions(rawOptions, nextTheme);
        chartInstance.current.updateOptions({
          ...updated,
          theme: { mode: nextTheme },
        });
      }
    };

    window.addEventListener('stisla:themechange', handleThemeChange);

    return () => {
      window.removeEventListener('stisla:themechange', handleThemeChange);
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [options, config, series, type, height]);

  return (
    <div
      ref={containerRef}
      id={id}
      className={className}
      style={{ width, height: typeof height === 'number' ? `${height}px` : height }}
      {...props}
    />
  );
}

export function ApexChart(props) {
  return <Chart {...props} />;
}

function getThemeAwareOptions(options, theme) {
  // Deep clone options to avoid mutation
  const newOptions = JSON.parse(JSON.stringify(options))
  
  // Apply theme-aware colors
  if (newOptions.colors) {
    newOptions.colors = newOptions.colors.map(color => resolveColorToken(color, theme))
  }
  
  if (newOptions.fill?.colors) {
    newOptions.fill.colors = newOptions.fill.colors.map(color => resolveColorToken(color, theme))
  }
  
  if (newOptions.stroke?.colors) {
    newOptions.stroke.colors = newOptions.stroke.colors.map(color => resolveColorToken(color, theme))
  }
  
  if (newOptions.xaxis?.labels?.style?.colors) {
    newOptions.xaxis.labels.style.colors = resolveColorToken(newOptions.xaxis.labels.style.colors, theme)
  }
  
  if (newOptions.yaxis?.labels?.style?.colors) {
    newOptions.yaxis.labels.style.colors = resolveColorToken(newOptions.yaxis.labels.style.colors, theme)
  }
  
  if (newOptions.tooltip?.theme) {
    newOptions.tooltip.theme = theme
  }
  
  if (newOptions.grid?.borderColor) {
    newOptions.grid.borderColor = resolveColorToken(newOptions.grid.borderColor, theme)
  }
  
  if (newOptions.dataLabels?.style?.colors) {
    newOptions.dataLabels.style.colors = newOptions.dataLabels.style.colors.map(color => resolveColorToken(color, theme))
  }
  
  if (newOptions.plotOptions?.radialBar?.track?.background) {
    newOptions.plotOptions.radialBar.track.background = resolveColorToken(newOptions.plotOptions.radialBar.track.background, theme)
  }
  
  if (newOptions.plotOptions?.heatmap?.colorScale?.ranges) {
    newOptions.plotOptions.heatmap.colorScale.ranges = newOptions.plotOptions.heatmap.colorScale.ranges.map(range => ({
      ...range,
      color: resolveColorToken(range.color, theme)
    }))
  }
  
  return newOptions
}

function resolveColorToken(color, theme) {
  if (!color || typeof color !== 'string') return color;

  if (color.startsWith('var(')) {
    const varName = color.replace(/var\(|\)/g, '').trim();
    if (typeof window !== 'undefined') {
      const val = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
      if (val) return val;
    }
    const fallbacks = {
      '--color-primary': '#2274e2',
      '--color-success': '#10b981',
      '--color-warning': '#f59e0b',
      '--color-danger': '#e05260',
      '--color-info': '#06b6d4',
      '--color-muted-foreground': theme === 'dark' ? '#94a3b8' : '#64748b',
      '--color-border': theme === 'dark' ? '#334155' : '#e2e8f0',
      '--color-surface': theme === 'dark' ? '#1e293b' : '#ffffff',
      '--color-background': theme === 'dark' ? '#0f172a' : '#f8fafc',
    };
    return fallbacks[varName] || color;
  }

  return color;
}

// Pre-built chart configurations matching the original charts.js
export const chartConfigs = {
  sales: (theme = 'light') => ({
    chart: {
      type: 'area',
      height: 300,
      sparkline: { enabled: false },
      toolbar: { show: false },
      fontFamily: 'inherit',
      foreColor: 'var(--color-muted-foreground)',
    },
    colors: ['var(--color-primary)', 'var(--color-accent)'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    series: [
      { name: 'This Month', data: [31, 40, 28, 51, 42, 109, 100] },
      { name: 'Last Month', data: [11, 32, 45, 32, 34, 52, 41] },
    ],
    xaxis: {
      categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      labels: { style: { colors: 'var(--color-muted-foreground)', fontSize: '12px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: 'var(--color-muted-foreground)', fontSize: '12px' }, formatter: (val) => val.toFixed(0) },
      min: 0,
      max: 120,
      tickAmount: 4,
    },
    grid: {
      borderColor: 'var(--color-border)',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
      padding: { top: -20, bottom: -10 },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: 'var(--color-muted-foreground)', useSeriesColors: false },
      markers: { width: 8, height: 8, radius: 4 },
      itemMargin: { horizontal: 16, vertical: 4 },
    },
    tooltip: {
      theme: theme,
      y: { formatter: (val) => `${val}k` },
    },
  }),

  hero: (theme = 'light') => ({
    chart: {
      type: 'area',
      height: 280,
      sparkline: { enabled: false },
      toolbar: { show: false },
      fontFamily: 'inherit',
      foreColor: 'var(--color-muted-foreground)',
    },
    colors: ['var(--color-primary)'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.35,
        opacityTo: 0.02,
        stops: [0, 90, 100],
        colorStops: [
          { offset: 0, color: 'var(--color-primary)', opacity: 0.35 },
          { offset: 100, color: 'var(--color-primary)', opacity: 0.02 },
        ],
      },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    series: [{ name: 'Revenue', data: [28, 40, 36, 52, 38, 60, 55, 65, 58, 72, 68, 85] }],
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      labels: { style: { colors: 'var(--color-muted-foreground)', fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { show: false },
      min: 20,
      max: 90,
    },
    grid: { show: false },
    tooltip: {
      theme: theme,
      x: { show: false },
      y: { title: { formatter: () => 'Revenue: ' } },
    },
  }),

  revenue: (theme = 'light') => ({
    chart: {
      type: 'bar',
      height: 300,
      stacked: true,
      toolbar: { show: false },
      fontFamily: 'inherit',
      foreColor: 'var(--color-muted-foreground)',
    },
    colors: ['var(--color-primary)', 'var(--color-accent)', 'var(--color-success)'],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 1, colors: ['transparent'] },
    series: [
      { name: 'Subscriptions', data: [44, 55, 41, 67, 22, 43, 21, 49, 42, 58, 33, 61] },
      { name: 'One-time', data: [13, 23, 20, 8, 13, 27, 33, 12, 19, 24, 11, 18] },
      { name: 'Add-ons', data: [11, 17, 15, 15, 21, 14, 15, 13, 17, 19, 12, 14] },
    ],
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      labels: { style: { colors: 'var(--color-muted-foreground)', fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: 'var(--color-muted-foreground)', fontSize: '11px' }, formatter: (val) => `$${val}k` },
      min: 0,
      max: 100,
    },
    grid: {
      borderColor: 'var(--color-border)',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } },
      padding: { top: -10, bottom: -10 },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: 'var(--color-muted-foreground)', useSeriesColors: false },
      markers: { width: 8, height: 8, radius: 4 },
      itemMargin: { horizontal: 16, vertical: 4 },
    },
    tooltip: {
      theme: theme,
      y: { formatter: (val) => `$${val}k` },
    },
  }),

  donut: (labels, series, colorTokens, theme = 'light') => ({
    chart: {
      type: 'donut',
      height: 260,
      fontFamily: 'inherit',
      foreColor: 'var(--color-muted-foreground)',
    },
    colors: colorTokens.map(c => `var(--color-${c})`),
    dataLabels: {
      enabled: false,
    },
    stroke: { width: 0 },
    series: series,
    labels: labels,
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      labels: { colors: 'var(--color-muted-foreground)', useSeriesColors: true },
      markers: { width: 8, height: 8, radius: 4 },
      itemMargin: { horizontal: 16, vertical: 8 },
      formatter: (label, opts) => `${label} (${opts.w.globals.seriesPercent[opts.seriesIndex].toFixed(1)}%)`,
    },
    tooltip: {
      theme: theme,
      y: { formatter: (val) => `${val}%` },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, fontSize: '14px', fontWeight: 600, color: 'var(--color-foreground)' },
            value: { show: true, fontSize: '20px', fontWeight: 700, color: 'var(--color-foreground)', formatter: (val) => `${val}%` },
            total: { show: true, label: 'Total', fontSize: '12px', color: 'var(--color-muted-foreground)' },
          },
        },
      },
    },
  }),

  category: (theme = 'light') => ({
    chart: {
      type: 'bar',
      height: 300,
      toolbar: { show: false },
      fontFamily: 'inherit',
      foreColor: 'var(--color-muted-foreground)',
    },
    colors: ['var(--color-primary)'],
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '60%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
        distributed: true,
        dataLabels: { position: 'top' },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `${val}%`,
      offsetX: -30,
      style: { fontSize: '12px', fontWeight: 600, colors: ['#fff'] },
    },
    stroke: { show: true, width: 1, colors: ['transparent'] },
    series: [{ name: 'Share', data: [44, 55, 41, 67, 22, 43] }],
    xaxis: {
      categories: ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Beauty', 'Books'],
      labels: { style: { colors: 'var(--color-muted-foreground)', fontSize: '12px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: 'var(--color-muted-foreground)', fontSize: '12px' } },
    },
    grid: {
      borderColor: 'var(--color-border)',
      strokeDashArray: 4,
      yaxis: { lines: { show: false } },
      xaxis: { lines: { show: true } },
      padding: { left: 0, right: 0 },
    },
    tooltip: {
      theme: theme,
      y: { formatter: (val) => `${val}%` },
    },
  }),

  channel: (theme = 'light') => ({
    chart: {
      type: 'donut',
      height: 300,
      fontFamily: 'inherit',
      foreColor: 'var(--color-muted-foreground)',
    },
    colors: ['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-info)', 'var(--color-accent)'],
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    series: [35, 25, 20, 12, 8],
    labels: ['Direct', 'Organic', 'Referral', 'Social', 'Email'],
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      labels: { colors: 'var(--color-muted-foreground)', useSeriesColors: true },
      markers: { width: 8, height: 8, radius: 4 },
      itemMargin: { horizontal: 16, vertical: 8 },
      formatter: (label, opts) => `${label} (${opts.w.globals.seriesPercent[opts.seriesIndex].toFixed(1)}%)`,
    },
    tooltip: {
      theme: theme,
      y: { formatter: (val) => `${val}%` },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: { show: true, fontSize: '14px', fontWeight: 600, color: 'var(--color-foreground)' },
            value: { show: true, fontSize: '22px', fontWeight: 700, color: 'var(--color-foreground)', formatter: (val) => `${val}%` },
            total: { show: true, label: 'Traffic', fontSize: '12px', color: 'var(--color-muted-foreground)' },
          },
        },
      },
    },
  }),

  topProducts: (theme = 'light') => ({
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false },
      fontFamily: 'inherit',
      foreColor: 'var(--color-muted-foreground)',
    },
    colors: ['var(--color-primary)'],
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '70%',
        borderRadius: 4,
        borderRadiusApplication: 'end',
        distributed: true,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => `$${val}k`,
      offsetX: -40,
      style: { fontSize: '11px', fontWeight: 600, colors: ['#fff'] },
    },
    stroke: { show: true, width: 1, colors: ['transparent'] },
    series: [{ name: 'Revenue', data: [125, 98, 87, 76, 65, 54, 43, 32, 28, 19] }],
    xaxis: {
      categories: ['iPhone 15 Pro', 'MacBook Air M2', 'AirPods Pro', 'iPad Pro', 'Apple Watch', 'Mac Mini', 'iPhone 15', 'AirPods 3', 'iPad Air', 'Magic Keyboard'],
      labels: { style: { colors: 'var(--color-muted-foreground)', fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: 'var(--color-muted-foreground)', fontSize: '11px' } },
    },
    grid: {
      borderColor: 'var(--color-border)',
      strokeDashArray: 4,
      yaxis: { lines: { show: false } },
      xaxis: { lines: { show: true } },
      padding: { left: 0, right: 0 },
    },
    tooltip: {
      theme: theme,
      y: { formatter: (val) => `$${val}k` },
    },
  }),

  fulfillment: (theme = 'light') => ({
    chart: {
      type: 'radialBar',
      height: 300,
      fontFamily: 'inherit',
      foreColor: 'var(--color-muted-foreground)',
    },
    colors: ['var(--color-success)', 'var(--color-warning)', 'var(--color-danger)'],
    plotOptions: {
      radialBar: {
        size: 120,
        startAngle: -90,
        endAngle: 90,
        track: {
          background: 'var(--color-border)',
          strokeWidth: '80%',
          margin: 16,
        },
        dataLabels: {
          name: { show: true, fontSize: '14px', fontWeight: 600, color: 'var(--color-foreground)', offsetY: 10 },
          value: { show: true, fontSize: '28px', fontWeight: 700, color: 'var(--color-foreground)', offsetY: -10, formatter: (val) => `${val}%` },
          total: { show: true, label: 'Fulfilled', fontSize: '12px', color: 'var(--color-muted-foreground)' },
        },
        hollow: { size: '50%' },
      },
    },
    stroke: { lineCap: 'round' },
    series: [87, 52, 23],
    labels: ['Shipped', 'Processing', 'Pending'],
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      labels: { colors: 'var(--color-muted-foreground)', useSeriesColors: true },
      markers: { width: 8, height: 8, radius: 4 },
      itemMargin: { horizontal: 16, vertical: 8 },
      formatter: (label, opts) => `${label} (${opts.w.globals.series[opts.seriesIndex]}%)`,
    },
    tooltip: {
      theme: theme,
      y: { formatter: (val) => `${val}%` },
    },
  }),

  heatmap: (theme = 'light') => ({
    chart: {
      type: 'heatmap',
      height: 300,
      fontFamily: 'inherit',
      foreColor: 'var(--color-muted-foreground)',
      toolbar: { show: false },
    },
    colors: ['var(--color-primary)'],
    dataLabels: { enabled: false },
    series: [
      { name: 'Mon', data: [28, 31, 40, 28, 51, 42, 109, 100, 45, 32, 34, 52, 41, 28, 31, 40, 28, 51, 42, 109, 100, 45, 32, 34] },
      { name: 'Tue', data: [11, 32, 45, 32, 34, 52, 41, 28, 31, 40, 28, 51, 42, 109, 100, 45, 32, 34, 52, 41, 28, 31, 40, 28] },
      { name: 'Wed', data: [51, 42, 109, 100, 45, 32, 34, 52, 41, 28, 31, 40, 28, 51, 42, 109, 100, 45, 32, 34, 52, 41, 28, 31] },
      { name: 'Thu', data: [40, 28, 51, 42, 109, 100, 45, 32, 34, 52, 41, 28, 31, 40, 28, 51, 42, 109, 100, 45, 32, 34, 52, 41] },
      { name: 'Fri', data: [109, 100, 45, 32, 34, 52, 41, 28, 31, 40, 28, 51, 42, 109, 100, 45, 32, 34, 52, 41, 28, 31, 40, 28] },
      { name: 'Sat', data: [34, 52, 41, 28, 31, 40, 28, 51, 42, 109, 100, 45, 32, 34, 52, 41, 28, 31, 40, 28, 51, 42, 109, 100] },
      { name: 'Sun', data: [45, 32, 34, 52, 41, 28, 31, 40, 28, 51, 42, 109, 100, 45, 32, 34, 52, 41, 28, 31, 40, 28, 51, 42] },
    ],
    xaxis: {
      type: 'category',
      categories: ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'],
      labels: { style: { colors: 'var(--color-muted-foreground)', fontSize: '10px' }, rotate: -45 },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: 'var(--color-muted-foreground)', fontSize: '11px' } },
    },
    grid: {
      borderColor: 'var(--color-border)',
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        radius: 2,
        useFillColorAsStroke: true,
        colorScale: {
          ranges: [
            { from: 0, to: 20, color: 'var(--color-primary)', name: 'Low' },
            { from: 21, to: 50, color: 'var(--color-primary)', name: 'Medium' },
            { from: 51, to: 80, color: 'var(--color-primary)', name: 'High' },
            { from: 81, to: 100, color: 'var(--color-primary)', name: 'Peak' },
          ],
        },
      },
    },
    tooltip: {
      theme: theme,
      y: { formatter: (val) => `${val} orders` },
    },
  }),

  sparkline: (data, color = 'primary', theme = 'light') => ({
    chart: {
      type: 'area',
      height: 48,
      sparkline: { enabled: true },
      toolbar: { show: false },
      fontFamily: 'inherit',
    },
    colors: [`var(--color-${color})`],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.3,
        opacityTo: 0.02,
        stops: [0, 90, 100],
      },
    },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    series: [{ data }],
    xaxis: { labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { show: false }, min: Math.min(...data) * 0.9, max: Math.max(...data) * 1.1 },
    grid: { show: false, padding: { top: 0, right: 0, bottom: 0, left: 0 } },
    tooltip: {
      theme: theme,
      x: { show: false },
      y: { title: { formatter: () => '' } },
      marker: { show: false },
    },
  }),
}