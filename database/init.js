const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'weather.db');
const db = new Database(dbPath);

// Создание таблицы для хранения истории поисков
db.exec(`
  CREATE TABLE IF NOT EXISTS search_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city_name TEXT NOT NULL,
    country TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    temperature REAL,
    weather_code INTEGER,
    search_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_search_date ON search_history(search_date DESC);
`);

console.log('База данных успешно инициализирована');
db.close();
