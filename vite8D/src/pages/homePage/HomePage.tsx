import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Brain, Download, Sparkles, Target } from 'lucide-react';
import styles from './HomePage.module.css';

export default function HomePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [predictionResults, setPredictionResults] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      setSelectedFile(file);
    } else {
      alert('Пожалуйста, выберите CSV файл');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

    const processFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    
    try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('user_id', 'default');

        const response = await fetch('http://localhost:5001/api/predict-income', {
            method: 'POST',
            body: formData,
        }); 

        if (!response.ok) {
        throw new Error('Ошибка при обработке файла');
        }

        const blob = await response.blob();
        const text = await blob.text();
        setPredictionResults(text);
        
    } catch (error) {
        console.error('Error processing file:', error);
        alert('Ошибка при обработке файла');
    } finally {
        setIsProcessing(false);
    }
    };

  const downloadResults = () => {
    if (!predictionResults) return;
    
    const blob = new Blob([predictionResults], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'income_predictions.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={styles.container}>
      <motion.section 
        className={styles.hero}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Sparkles className={styles.heroIcon} />
        <h1 className={styles.heroTitle}>8D Income Predictor</h1>
        <p className={styles.heroSubtitle}>
          Инновационная система предсказания доходов клиентов на основе машинного обучения. 
          Загрузите CSV файл с данными клиентов и получите точные прогнозы доходов.
        </p>
      </motion.section>

      <section className={styles.featuresSection}>
        <div className={styles.featuresContainer}>
          <h2 className={styles.featuresTitle}>Почему выбирают нас</h2>
          <div className={styles.features}>
            <motion.div 
              className={styles.featureCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className={styles.featureIcon}>
                <Brain size={32} />
              </div>
              <h3 className={styles.featureTitle}>AI Powered</h3>
              <p className={styles.featureDescription}>
                Используем передовые алгоритмы машинного обучения для точного предсказания доходов. 
                Наша модель обучается на миллионах данных для максимальной точности прогнозов.
              </p>
            </motion.div>

            <motion.div 
              className={styles.featureCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className={styles.featureIcon}>
                <Target size={32} />
              </div>
              <h3 className={styles.featureTitle}>Высокая точность</h3>
              <p className={styles.featureDescription}>
                Точность предсказаний более 95% на основе исторических данных. 
                Постоянное улучшение моделей и валидация результатов.
              </p>
            </motion.div>

            <motion.div 
              className={styles.featureCard}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className={styles.featureIcon}>
                <FileText size={32} />
              </div>
              <h3 className={styles.featureTitle}>CSV Формат</h3>
              <p className={styles.featureDescription}>
                Простой и понятный формат данных. Поддерживает все необходимые поля клиентов. 
                Быстрая обработка больших объемов данных.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <motion.section
        className={`${styles.uploadSection} ${isDragOver ? styles.dragOver : ''}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={styles.uploadContainer}>
          <Upload className={styles.uploadIcon} />
          <h2 className={styles.uploadTitle}>Загрузите CSV файл</h2>
          <p className={styles.uploadDescription}>
            Перетащите файл с данными клиентов или выберите его вручную. 
            Поддерживаются файлы в формате CSV с данными о клиентах.
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className={styles.fileInput}
          />
          
          <button 
            className={styles.uploadButton}
            onClick={() => fileInputRef.current?.click()}
          >
            Выбрать файл
          </button>

          {selectedFile && (
            <div className={styles.fileInfo}>
              <div className={styles.fileName}>{selectedFile.name}</div>
              <div className={styles.fileSize}>
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
          )}

          {selectedFile && !isProcessing && !predictionResults && (
            <button 
              className={styles.processButton}
              onClick={processFile}
            >
              Обработать данные
            </button>
          )}

          {isProcessing && (
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <span>Обработка данных ML моделью...</span>
            </div>
          )}
        </div>
      </motion.section>

      {predictionResults && (
        <motion.section
          className={styles.resultsSection}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className={styles.resultsContainer}>
            <h3 className={styles.resultsTitle}>Результаты предсказания</h3>
            <p className={styles.resultsDescription}>
              ML модель успешно обработала данные и сгенерировала предсказания доходов. 
              Вы можете скачать файл с результатами в формате CSV.
            </p>
            <button 
              className={styles.downloadButton}
              onClick={downloadResults}
            >
              <Download size={20} />
              Скачать предсказания (CSV)
            </button>
          </div>
        </motion.section>
      )}
    </div>
  );
}