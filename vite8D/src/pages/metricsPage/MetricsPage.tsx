import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, TrendingUp, Target } from 'lucide-react';
import type { Metrics } from './helpers';
import { ScatterChartCard, BarChartCard, PieChartCard } from './charts';
import styles from './MetricsPage.module.css';
import { reservoirSample } from './helpers';

const MetricsPage: React.FC = () => {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:5001/api/metrics/data?user_id=default', { 
          signal: controller.signal 
        });
        
        if (!mounted) return;
        if (!res.ok) throw new Error('Не удалось загрузить данные');
        
        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        console.error(err);
        setError(err instanceof Error ? err.message : 'Ошибка');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    
    return () => { 
      mounted = false; 
      controller.abort(); 
    };
  }, []);

  const incomeData = useMemo(() => {
    if (!metrics) return [] as { label: string; value: number }[];
    const { labels = [], values = [] } = metrics.incomeDistribution || {};
    return labels.map((label, i) => ({ label, value: values[i] ?? 0 }));
  }, [metrics]);

  const genderData = useMemo(() => {
    if (!metrics) return [] as { label: string; value: number }[];
    const { labels = [], values = [] } = metrics.genderDistribution || {};
    return labels.map((label, i) => ({ label, value: values[i] ?? 0 }));
  }, [metrics]);

  const cityData = useMemo(() => {
    if (!metrics) return [] as { label: string; value: number }[];
    const { labels = [], values = [] } = metrics.cityDistribution || {};
    return labels.map((label, i) => ({ label, value: values[i] ?? 0 }));
  }, [metrics]);

  const scatterRaw = useMemo(() => {
    if (!metrics) return [] as { x: number; y: number }[];
    const { ages = [], incomes = [] } = metrics.ageVsIncome || {};
    const n = Math.min(ages.length, incomes.length);
    const arr: { x: number; y: number }[] = [];
    for (let i = 0; i < n; i++) {
      arr.push({ 
        x: Number(ages[i]) || 0, 
        y: Number(incomes[i]) || 0 
      });
    }
    return arr;
  }, [metrics]);

  const scatterForCanvas = useMemo(() => {
    const LIMIT = 5000;
    if (scatterRaw.length <= LIMIT) return scatterRaw;
    return reservoirSample(scatterRaw, LIMIT);
  }, [scatterRaw]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} /> 
          <span>Загрузка данных...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.noData}>
          <Users className={styles.noDataIcon} /> 
          <h3>Ошибка</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={styles.container}>
        <div className={styles.noData}>
          <Users className={styles.noDataIcon} /> 
          <h3>Нет данных</h3>
          <p>Загрузите CSV файл на главной странице чтобы увидеть аналитику</p>
        </div>
      </div>
    );
  }

  const stats = metrics.predictionStats;

  return (
    <div className={styles.container}>
      <motion.div 
        className={styles.header} 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className={styles.title}>Аналитика доходов</h1>
      </motion.div>

      <motion.div 
        className={styles.statsGrid} 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.1 }}
      >
        <div className={styles.statCard}>
          <Users className={styles.statIcon} />
          <div className={styles.statValue}>{stats.totalUsers}</div>
          <div className={styles.statLabel}>Всего клиентов</div>
        </div>
        <div className={styles.statCard}>
          <DollarSign className={styles.statIcon} />
          <div className={styles.statValue}>
            {Math.round(stats.meanIncome).toLocaleString('ru-RU')} ₽
          </div>
          <div className={styles.statLabel}>Средний доход</div>
        </div>
        <div className={styles.statCard}>
          <TrendingUp className={styles.statIcon} />
          <div className={styles.statValue}>
            {Math.round(stats.medianIncome).toLocaleString('ru-RU')} ₽
          </div>
          <div className={styles.statLabel}>Медианный доход</div>
        </div>
        <div className={styles.statCard}>
          <Target className={styles.statIcon} />
          <div className={styles.statValue}>
            {Math.round(stats.maxIncome).toLocaleString('ru-RU')} ₽
          </div>
          <div className={styles.statLabel}>Максимальный доход</div>
        </div>
      </motion.div>

      <motion.div 
        className={styles.chartsGrid} 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ delay: 0.2 }}
      >
        <BarChartCard 
          title="Распределение доходов" 
          data={incomeData} 
          maxBars={10} 
        />
        <PieChartCard 
          title="Гендерное распределение" 
          data={genderData} 
          maxSlices={6} 
        />
        <ScatterChartCard 
          title="Возраст vs Доход" 
          data={scatterForCanvas} 
          maxPoints={5000} 
        />
        <BarChartCard 
          title="Топ городов" 
          data={cityData} 
          maxBars={8} 
        />
      </motion.div>
    </div>
  );
};

export default MetricsPage;