import { motion } from 'framer-motion';
import { Wrench, Code, Server, Zap } from 'lucide-react';
import styles from './ClientsPage.module.css';

export default function ClientsPage() {
  return (
    <div className={styles.container}>
      <motion.section 
        className={styles.hero}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <Wrench className={`${styles.heroIcon} ${styles.pulse}`} />
        <h1 className={styles.heroTitle}>Страница в разработке</h1>
        <p className={styles.heroSubtitle}>
          Мы активно работаем над созданием этой функциональности. 
          Скоро здесь появится что-то очень интересное!
        </p>
      </motion.section>

      <motion.section 
        className={styles.featuresSection}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <div className={styles.featuresContainer}>
          <h2 className={styles.featuresTitle}>Что мы готовим</h2>
          <div className={styles.features}>
            <motion.div 
              className={styles.featureCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className={styles.featureIcon}>
                <Code size={24} />
              </div>
              <h3 className={styles.featureTitle}>Новые возможности</h3>
              <p className={styles.featureDescription}>
                Расширенная аналитика и дополнительные метрики для более глубокого анализа данных клиентов.
              </p>
            </motion.div>

            <motion.div 
              className={styles.featureCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className={styles.featureIcon}>
                <Server size={24} />
              </div>
              <h3 className={styles.featureTitle}>Улучшенная ML модель</h3>
              <p className={styles.featureDescription}>
                Обновленная модель машинного обучения с повышенной точностью предсказаний и поддержкой новых параметров.
              </p>
            </motion.div>

            <motion.div 
              className={styles.featureCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className={styles.featureIcon}>
                <Zap size={24} />
              </div>
              <h3 className={styles.featureTitle}>Быстрая обработка</h3>
              <p className={styles.featureDescription}>
                Оптимизированные алгоритмы для молниеносной обработки больших объемов данных в реальном времени.
              </p>
            </motion.div>
          </div>
        </div>
      </motion.section>
    </div>
  );
}