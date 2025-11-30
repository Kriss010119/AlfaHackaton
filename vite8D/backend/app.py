from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import pandas as pd
import numpy as np
import io
import os
import json
from datetime import datetime
import logging
from logging.handlers import RotatingFileHandler

# Настройка логирования
log_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

file_handler = RotatingFileHandler('app.log', maxBytes=10000, backupCount=1)
file_handler.setFormatter(log_formatter)
file_handler.setLevel(logging.INFO)

console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)
console_handler.setLevel(logging.DEBUG)

logging.basicConfig(
    level=logging.DEBUG,
    handlers=[file_handler, console_handler]
)

logger = logging.getLogger(__name__)
app = Flask(__name__)
CORS(app)

# Папки для хранения данных
UPLOAD_FOLDER = 'uploads'
DATA_FOLDER = 'user_data'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

class DataStorage:
    def __init__(self):
        self.users_file = os.path.join(DATA_FOLDER, 'users.json')
        self.metrics_file = os.path.join(DATA_FOLDER, 'metrics.json')
        self.clients_file = os.path.join(DATA_FOLDER, 'clients.json')
    
    def save_user_metrics(self, user_id, original_data, predictions, metrics):
        """Сохраняет данные пользователя и готовые метрики"""
        try:
            # Загружаем существующие данные пользователей
            if os.path.exists(self.users_file):
                with open(self.users_file, 'r', encoding='utf-8') as f:
                    users_data = json.load(f)
            else:
                users_data = {}
            
            # Загружаем существующие метрики
            if os.path.exists(self.metrics_file):
                with open(self.metrics_file, 'r', encoding='utf-8') as f:
                    metrics_data = json.load(f)
            else:
                metrics_data = {}
            
            # Сохраняем данные пользователя
            users_data[str(user_id)] = {
                'processed_at': datetime.now().isoformat(),
                'total_users': len(original_data),
                'mean_income': float(predictions['predicted_income'].mean())
            }
            
            # Сохраняем готовые метрики
            metrics_data[str(user_id)] = metrics
            
            # Сохраняем клиентские данные
            self._save_clients_data(user_id, original_data, predictions)
            
            # Сохраняем обратно
            with open(self.users_file, 'w', encoding='utf-8') as f:
                json.dump(users_data, f, ensure_ascii=False, indent=2)
            
            with open(self.metrics_file, 'w', encoding='utf-8') as f:
                json.dump(metrics_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Saved metrics for user {user_id} with {len(original_data)} clients")
            return True
            
        except Exception as e:
            logger.error(f"Error saving user metrics: {str(e)}")
            return False
    
    def _save_clients_data(self, user_id, original_data, predictions):
        """Сохраняет детальные данные клиентов"""
        try:
            # Загружаем существующие данные клиентов
            if os.path.exists(self.clients_file):
                with open(self.clients_file, 'r', encoding='utf-8') as f:
                    clients_data = json.load(f)
            else:
                clients_data = {}
            
            # Объединяем оригинальные данные с предсказаниями
            merged_data = original_data.copy()
            merged_data['predicted_income'] = predictions['predicted_income'].values
            
            # Конвертируем в список словарей
            clients_list = []
            for _, row in merged_data.iterrows():
                client = {
                    'id': str(row['id']) if 'id' in row and pd.notna(row['id']) else f'client_{_}',
                    'age': float(row['age']) if 'age' in row and pd.notna(row['age']) else None,
                    'gender': str(row['gender']) if 'gender' in row and pd.notna(row['gender']) else None,
                    'city': str(row['city']) if 'city' in row and pd.notna(row['city']) else None,
                    'salaryAvg6to12m': float(row['salary_6to12m_avg']) if 'salary_6to12m_avg' in row and pd.notna(row['salary_6to12m_avg']) else None,
                    'creditTurnoverAvg': float(row['turn_cur_cr_avg_act_v2']) if 'turn_cur_cr_avg_act_v2' in row and pd.notna(row['turn_cur_cr_avg_act_v2']) else None,
                    'payments12m': float(row['dp_ils_paymentssum_avg_12m']) if 'dp_ils_paymentssum_avg_12m' in row and pd.notna(row['dp_ils_paymentssum_avg_12m']) else None,
                    'creditLimitTotal': float(row['hdb_bki_total_max_limit']) if 'hdb_bki_total_max_limit' in row and pd.notna(row['hdb_bki_total_max_limit']) else None,
                    'dt': str(row['dt']) if 'dt' in row and pd.notna(row['dt']) else None,
                    'predictedIncome': float(row['predicted_income']) if pd.notna(row['predicted_income']) else None
                }
                clients_list.append(client)
            
            clients_data[str(user_id)] = {
                'clients': clients_list,
                'total': len(clients_list),
                'user_id': user_id
            }
            
            with open(self.clients_file, 'w', encoding='utf-8') as f:
                json.dump(clients_data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"Saved {len(clients_list)} clients for user {user_id}")
            
        except Exception as e:
            logger.error(f"Error saving clients data: {str(e)}")
            raise
    
    def get_all_users(self):
        """Возвращает список всех пользователей"""
        try:
            if os.path.exists(self.users_file):
                with open(self.users_file, 'r', encoding='utf-8') as f:
                    users_data = json.load(f)
                    return users_data
            return {}
        except Exception as e:
            logger.error(f"Error loading users data: {str(e)}")
            return {}
    
    def get_user_metrics(self, user_id):
        """Возвращает готовые метрики конкретного пользователя"""
        try:
            if os.path.exists(self.metrics_file):
                with open(self.metrics_file, 'r', encoding='utf-8') as f:
                    metrics_data = json.load(f)
                    return metrics_data.get(str(user_id))
            return None
        except Exception as e:
            logger.error(f"Error loading metrics data: {str(e)}")
            return None
    
    def get_user_clients(self, user_id, page=1, per_page=20, search=None):
        """Возвращает клиентов пользователя с пагинацией и поиском"""
        try:
            if not os.path.exists(self.clients_file):
                return None
            
            with open(self.clients_file, 'r', encoding='utf-8') as f:
                clients_data = json.load(f)
            
            user_clients = clients_data.get(str(user_id))
            if not user_clients:
                return None
            
            clients = user_clients['clients']
            
            # Применяем поиск если указан
            if search and search.strip():
                search_lower = search.lower().strip()
                clients = [c for c in clients if 
                          (c['id'] and search_lower in c['id'].lower()) or
                          (c['city'] and c['city'] and search_lower in c['city'].lower()) or
                          (c['gender'] and c['gender'] and search_lower in c['gender'].lower())]
            
            # Применяем пагинацию
            total = len(clients)
            start_idx = (page - 1) * per_page
            end_idx = start_idx + per_page
            paginated_clients = clients[start_idx:end_idx]
            
            return {
                'clients': paginated_clients,
                'total': total,
                'page': page,
                'per_page': per_page,
                'total_pages': (total + per_page - 1) // per_page,
                'user_id': user_id
            }
            
        except Exception as e:
            logger.error(f"Error loading clients data: {str(e)}")
            return None

class IncomePredictor:
    def __init__(self):
        self.data_storage = DataStorage()
    
    def preprocess_data(self, df):
        """Предобработка данных"""
        try:
            processed_df = df.copy()
            
            # Заполняем пропущенные значения
            numeric_columns = processed_df.select_dtypes(include=[np.number]).columns
            processed_df[numeric_columns] = processed_df[numeric_columns].fillna(0)
            
            categorical_columns = processed_df.select_dtypes(include=['object']).columns
            for col in categorical_columns:
                processed_df[col] = processed_df[col].fillna('Unknown')
            
            logger.info(f"Processed data shape: {processed_df.shape}")
            return processed_df
            
        except Exception as e:
            logger.error(f"Error in data preprocessing: {str(e)}")
            raise
    
    def calculate_metrics(self, original_data, predictions):
        """Вычисляет все метрики один раз при обработке файла"""
        try:
            # Базовые статистики
            income_values = predictions['predicted_income']
            
            # Распределение доходов
            income_bins = [0, 50000, 100000, 150000, 200000, float('inf')]
            income_labels = ['0-50k', '50-100k', '100-150k', '150-200k', '200k+']
            income_distribution = pd.cut(income_values, bins=income_bins, labels=income_labels)
            income_counts = income_distribution.value_counts().reindex(income_labels, fill_value=0)
            
            # Данные для scatter plot (возраст vs доход)
            ages = original_data['age'].tolist() if 'age' in original_data.columns else []
            incomes = income_values.tolist()
            
            # Распределение по полу
            gender_labels = []
            gender_values = []
            if 'gender' in original_data.columns:
                gender_counts = original_data['gender'].value_counts()
                gender_labels = gender_counts.index.tolist()
                gender_values = gender_counts.values.tolist()
            
            # Распределение по городам (топ-5)
            city_labels = []
            city_values = []
            if 'city' in original_data.columns:
                city_counts = original_data['city'].value_counts().head(5)
                city_labels = city_counts.index.tolist()
                city_values = city_counts.values.tolist()
            
            # Формируем готовые метрики
            metrics = {
                'incomeDistribution': {
                    'labels': income_labels,
                    'values': income_counts.tolist()
                },
                'ageVsIncome': {
                    'ages': ages,
                    'incomes': incomes
                },
                'genderDistribution': {
                    'labels': gender_labels,
                    'values': gender_values
                },
                'cityDistribution': {
                    'labels': city_labels,
                    'values': city_values
                },
                'predictionStats': {
                    'meanIncome': float(income_values.mean()),
                    'medianIncome': float(income_values.median()),
                    'minIncome': float(income_values.min()),
                    'maxIncome': float(income_values.max()),
                    'totalUsers': len(original_data)
                }
            }
            
            logger.info("Metrics calculated successfully")
            return metrics
            
        except Exception as e:
            logger.error(f"Error calculating metrics: {str(e)}")
            raise
    
    def predict_income(self, df, user_id="default"):
        """Генерирует предсказания и сразу вычисляет метрики"""
        try:
            processed_data = self.preprocess_data(df)
            
            # Упрощенная генерация предсказаний
            np.random.seed(42)
            base_income = np.random.normal(80000, 25000, len(processed_data))
            
            # Корректируем на основе возраста если есть
            if 'age' in processed_data.columns:
                age_values = pd.to_numeric(processed_data['age'], errors='coerce').fillna(35)
                age_factor = np.clip(age_values / 40, 0.5, 2.0)
                base_income = base_income * age_factor
            
            # Гарантируем минимальный и максимальный доход
            predictions = np.clip(base_income, 30000, 300000)
            
            # Создаем DataFrame с результатами
            results_df = pd.DataFrame({
                'client_id': processed_data['id'] if 'id' in processed_data.columns else range(len(processed_data)),
                'predicted_income': predictions.round(2)
            })
            
            # Сразу вычисляем все метрики
            metrics = self.calculate_metrics(processed_data, results_df)
            
            # Сохраняем данные и метрики
            self.data_storage.save_user_metrics(user_id, processed_data, results_df, metrics)
            
            logger.info(f"Generated predictions and metrics for {len(results_df)} clients")
            return results_df
            
        except Exception as e:
            logger.error(f"Error in prediction: {str(e)}")
            raise

# Создаем экземпляр предсказателя
predictor = IncomePredictor()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@app.route('/api/predict-income', methods=['POST'])
def predict_income():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        user_id = request.form.get('user_id', 'default')
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.csv'):
            return jsonify({'error': 'File must be CSV format'}), 400
        
        try:
            # Пробуем разные разделители и кодировки
            file_content = file.read().decode('utf-8')
            file_stream = io.StringIO(file_content)
            
            # Пробуем разные разделители
            for sep in [';', ',', '\t']:
                file_stream.seek(0)
                try:
                    df = pd.read_csv(file_stream, sep=sep)
                    if df.shape[1] > 1:
                        logger.info(f"Successfully read CSV with separator: {sep}")
                        break
                except Exception as e:
                    logger.warning(f"Failed to read with separator {sep}: {e}")
                    continue
            
            # Если все еще одна колонка, пробуем без указания разделителя
            if df.shape[1] == 1:
                file_stream.seek(0)
                df = pd.read_csv(file_stream)
                logger.info("Read CSV with default separator")
                
        except Exception as e:
            logger.error(f"Error reading CSV: {str(e)}")
            return jsonify({'error': f'Invalid CSV format: {str(e)}'}), 400
        
        # Проверяем наличие обязательных колонок
        if 'id' not in df.columns:
            return jsonify({
                'error': f'Missing required column: id',
                'available_columns': list(df.columns)
            }), 400
        
        logger.info(f"Received data: {df.shape[0]} rows, {df.shape[1]} columns")
        logger.info(f"Columns: {list(df.columns)}")
        
        # Генерируем предсказания и метрики
        predictions_df = predictor.predict_income(df, user_id)
        
        # Создаем CSV для скачивания
        output = io.StringIO()
        predictions_df.to_csv(output, index=False, sep=',')
        output.seek(0)
        
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/csv',
            as_attachment=True,
            download_name='income_predictions.csv'
        )
        
    except Exception as e:
        logger.error(f"Unexpected error in predict_income: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@app.route('/api/metrics/data', methods=['GET'])
def get_metrics_data():
    """Возвращает готовые метрики (быстро, без вычислений)"""
    try:
        user_id = request.args.get('user_id', 'default')
        metrics = predictor.data_storage.get_user_metrics(user_id)
        
        if not metrics:
            return jsonify({'error': 'No metrics found for user'}), 404
        
        return jsonify(metrics)
        
    except Exception as e:
        logger.error(f"Error getting metrics: {str(e)}")
        return jsonify({'error': 'Error getting metrics data'}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    """Возвращает список всех пользователей с данными"""
    try:
        users_data = predictor.data_storage.get_all_users()
        users_list = []
        
        for user_id, data in users_data.items():
            users_list.append({
                'user_id': user_id,
                'processed_at': data.get('processed_at', datetime.now().isoformat()),
                'total_clients': data.get('total_users', 0),
                'mean_income': data.get('mean_income', 0)
            })
        
        return jsonify(users_list)
        
    except Exception as e:
        logger.error(f"Error getting users: {str(e)}")
        return jsonify({'error': 'Error getting users list'}), 500

@app.route('/api/clients', methods=['GET'])
def get_clients():
    """Возвращает клиентов пользователя с пагинацией и поиском"""
    try:
        user_id = request.args.get('user_id', 'default')
        page = int(request.args.get('page', 1))
        per_page = min(int(request.args.get('per_page', 20)), 100)  # максимум 100 на странице
        search = request.args.get('search', '')
        
        clients_data = predictor.data_storage.get_user_clients(
            user_id, page, per_page, search
        )
        
        if not clients_data:
            return jsonify({
                'clients': [],
                'total': 0,
                'page': page,
                'per_page': per_page,
                'total_pages': 0,
                'user_id': user_id
            })
        
        return jsonify(clients_data)
        
    except Exception as e:
        logger.error(f"Error getting clients: {str(e)}")
        return jsonify({'error': 'Error getting clients data'}), 500

@app.route('/api/test-upload', methods=['POST'])
def test_upload():
    """Тестовый endpoint для проверки загрузки файлов"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        logger.info(f"File received: {file.filename}")
        logger.info(f"Content type: {file.content_type}")
        
        file_content = file.read()
        logger.info(f"File size: {len(file_content)} bytes")
        
        try:
            content = file_content.decode('utf-8')
            lines = content.split('\n')
            logger.info(f"First 3 lines: {lines[:3]}")
            
            return jsonify({
                'success': True,
                'filename': file.filename,
                'first_lines': lines[:3],
                'total_lines': len(lines)
            })
        except Exception as e:
            logger.error(f"Error reading file: {str(e)}")
            return jsonify({'error': f'File read error: {str(e)}'}), 400
            
    except Exception as e:
        logger.error(f"Test upload error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    logger.info("Starting Flask server on http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True)