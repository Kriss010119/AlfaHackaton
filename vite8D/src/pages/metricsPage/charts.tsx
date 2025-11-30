import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { setupCanvas, reservoirSample, formatNumber, CHART_COLORS } from './helpers';

export type LegendItem = { label: string; color: string; value?: number };

export const Legend: React.FC<{ items: LegendItem[] }> = ({ items }) => {
  return (
    <div className="legendBlock">
      {items.map((it, i) => (
        <div key={i} className="legendRow">
          <span 
            className="legendColor" 
            style={{ background: it.color }} 
          />
          <span className="legendLabel">
            {it.label}
            {it.value !== undefined ? ` — ${formatNumber(it.value)}` : ''}
          </span>
        </div>
      ))}
    </div>
  );
};

export const ScatterChartCard: React.FC<{
  title: string;
  data: { x: number; y: number }[];
  color?: string;
  maxPoints?: number;
}> = React.memo(({ title, data, color = CHART_COLORS[0], maxPoints = 5000 }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const points = useMemo(() => {
    if (!data || !data.length) return [] as { x: number; y: number }[];
    if (data.length <= maxPoints) return data;
    return reservoirSample(data, maxPoints);
  }, [data, maxPoints]);

  const bounds = useMemo(() => {
    if (!points.length) return null;
    
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const p of points) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
    
    const xRange = maxX - minX;
    const yRange = maxY - minY;
    
    return { 
      minX: minX - xRange * 0.05, 
      maxX: maxX + xRange * 0.05,
      minY: Math.max(0, minY - yRange * 0.05),
      maxY: maxY + yRange * 0.05
    };
  }, [points]);

  const draw = useCallback(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas || !bounds || !points.length) return;

    const { width } = wrapper.getBoundingClientRect();
    const height = Math.max(220, Math.floor(width * 0.6));
    const ctx = setupCanvas(canvas, width, height);
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const margin = { left: 48, right: 12, top: 12, bottom: 36 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;

    ctx.strokeStyle = 'var(--color-border, #e0e0e0)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotH);
    ctx.lineTo(margin.left + plotW, margin.top + plotH);
    ctx.stroke();

    ctx.fillStyle = 'var(--color-text-secondary, #6b7280)';
    ctx.font = '11px system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const t = i / yTicks;
      const y = margin.top + plotH - t * plotH;
      const val = bounds.minY + t * (bounds.maxY - bounds.minY);
      ctx.fillText(formatNumber(val), margin.left - 8, y);

      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + plotW, y);
      ctx.strokeStyle = 'var(--color-border, rgba(0,0,0,0.03))';
      ctx.stroke();
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const xTicks = 5;
    for (let i = 0; i <= xTicks; i++) {
      const t = i / xTicks;
      const x = margin.left + t * plotW;
      const val = Math.round(bounds.minX + t * (bounds.maxX - bounds.minX));
      ctx.fillText(String(val), x, margin.top + plotH + 6);
    }

    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6;
    
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const x = margin.left + ((p.x - bounds.minX) / (bounds.maxX - bounds.minX)) * plotW;
      const y = margin.top + plotH - ((p.y - bounds.minY) / (bounds.maxY - bounds.minY)) * plotH;
      
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, [points, bounds, color]);

  useEffect(() => {
    draw();
    const ro = new ResizeObserver(() => {
      draw();
    });
    
    if (wrapperRef.current) {
      ro.observe(wrapperRef.current);
    }
    
    return () => ro.disconnect();
  }, [draw]);

  const legendItems = useMemo(() => [
    { 
      label: 'Точки (возраст / доход)', 
      color, 
      value: points.length 
    }
  ], [color, points.length]);

  return (
    <div className="chartCard" ref={wrapperRef} style={{ minHeight: 220 }}>
      <h3 className="chartTitle">{title}</h3>
      <div className="chartContainer">
        {!points.length ? (
          <div className="noData">
            <div className="noDataIcon" />
            Недостаточно данных
          </div>
        ) : (
          <>
            <canvas 
              ref={canvasRef} 
              style={{ width: '100%', height: '100%', display: 'block' }} 
            />
            <Legend items={legendItems} />
          </>
        )}
      </div>
    </div>
  );
});

export const BarChartCard: React.FC<{
  title: string;
  data: { label: string; value: number }[];
  maxBars?: number;
  color?: string;
}> = React.memo(({ title, data, maxBars = 10, color = CHART_COLORS[0] }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const bars = useMemo(() => {
    if (!data || !data.length) return [] as { label: string; value: number }[];
    const sorted = [...data].sort((a, b) => b.value - a.value);
    return sorted.slice(0, maxBars);
  }, [data, maxBars]);

  const draw = useCallback(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas || !bars.length) return;

    const { width } = wrapper.getBoundingClientRect();
    const height = Math.max(220, Math.floor(width * 0.6));
    const ctx = setupCanvas(canvas, width, height);
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const margin = { left: 40, right: 12, top: 12, bottom: 40 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;

    const values = bars.map(bar => bar.value);
    const maxVal = Math.max(...values, 1);
    const barWidth = plotW / Math.max(bars.length, 1);

    ctx.fillStyle = color;
    for (let i = 0; i < bars.length; i++) {
      const value = bars[i].value;
      const barHeight = (value / maxVal) * plotH;
      const x = margin.left + i * barWidth + barWidth * 0.1;
      const barW = Math.max(4, barWidth * 0.8);
      const y = margin.top + plotH - barHeight;
      
      ctx.fillRect(x, y, barW, barHeight);
    }

    ctx.fillStyle = 'var(--color-text-secondary, #6b7280)';
    ctx.font = '11px system-ui, -apple-system, "Segoe UI", Roboto';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i < bars.length; i++) {
      const x = margin.left + i * barWidth + barWidth / 2;
      const label = bars[i].label;
      const displayLabel = label.length > 12 ? label.slice(0, 10) + '…' : label;
      ctx.fillText(displayLabel, x, margin.top + plotH + 8);
    }

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const yTicks = 4;
    for (let i = 0; i <= yTicks; i++) {
      const value = (i / yTicks) * maxVal;
      const y = margin.top + plotH - (i / yTicks) * plotH;
      ctx.fillText(formatNumber(value), margin.left - 6, y);
    }
  }, [bars, color]);

  useEffect(() => {
    draw();
    const ro = new ResizeObserver(() => draw());
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [draw]);

  const legendItems = useMemo(() => 
    bars.slice(0, 5).map(bar => ({ 
      label: bar.label, 
      color, 
      value: bar.value 
    })), 
    [bars, color]
  );

  return (
    <div className="chartCard" ref={wrapperRef} style={{ minHeight: 220 }}>
      <h3 className="chartTitle">{title}</h3>
      <div className="chartContainer">
        {!bars.length ? (
          <div className="noData">
            <div className="noDataIcon" />
            Нет данных
          </div>
        ) : (
          <>
            <canvas 
              ref={canvasRef} 
              style={{ width: '100%', height: '100%', display: 'block' }} 
            />
            <Legend items={legendItems} />
          </>
        )}
      </div>
    </div>
  );
});

export const PieChartCard: React.FC<{
  title: string;
  data: { label: string; value: number }[];
  maxSlices?: number;
}> = React.memo(({ title, data, maxSlices = 6 }) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const slices = useMemo(() => {
    if (!data || !data.length) return [] as { label: string; value: number }[];
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const top = sorted.slice(0, maxSlices - 1); 
    
    const others = sorted.slice(maxSlices - 1);
    const othersSum = others.reduce((sum, item) => sum + item.value, 0);
    
    if (othersSum > 0) {
      top.push({ label: 'Другие', value: othersSum });
    }
    
    return top;
  }, [data, maxSlices]);

  const draw = useCallback(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas || !slices.length) return;

    const { width } = wrapper.getBoundingClientRect();
    const size = Math.min(180, Math.floor(width * 0.8));
    const ctx = setupCanvas(canvas, width, size + 30);
    if (!ctx) return;

    ctx.clearRect(0, 0, width, size + 30);

    const total = slices.reduce((sum, slice) => sum + slice.value, 0);
    if (total <= 0) return;

    const centerX = width / 2;
    const centerY = size / 2;
    const radius = Math.min(centerX, centerY) - 10;

    let startAngle = -Math.PI / 2; 

    for (let i = 0; i < slices.length; i++) {
      const slice = slices[i];
      const sliceAngle = (slice.value / total) * 2 * Math.PI;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      
      ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length];
      ctx.fill();

      startAngle = endAngle;
    }

    ctx.fillStyle = 'var(--color-text-primary, #111827)';
    ctx.font = 'bold 14px system-ui, -apple-system, "Segoe UI", Roboto';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatNumber(total), centerX, centerY);
  }, [slices]);

  useEffect(() => {
    draw();
    const ro = new ResizeObserver(() => draw());
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [draw]);

  const legendItems = useMemo(() => 
    slices.map((slice, i) => ({
      label: slice.label,
      color: CHART_COLORS[i % CHART_COLORS.length],
      value: slice.value
    })), 
    [slices]
  );

  return (
    <div className="chartCard" ref={wrapperRef} style={{ minHeight: 220 }}>
      <h3 className="chartTitle">{title}</h3>
      <div className="chartContainer">
        {!slices.length ? (
          <div className="noData">
            <div className="noDataIcon" />
            Нет данных
          </div>
        ) : (
          <>
            <canvas 
              ref={canvasRef} 
              style={{ width: '100%', height: '100%', display: 'block' }} 
            />
            <Legend items={legendItems} />
          </>
        )}
      </div>
    </div>
  );
});