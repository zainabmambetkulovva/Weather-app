const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'weather.db');

async function init() {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  
  // Создание таблицы для хранения истории поисков
  db.run(`
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
  `);
  
  db.run(`CREATE INDEX IF NOT EXISTS idx_search_date ON search_history(search_date DESC);`);
  
  // Сохраняем БД в файл
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  
  console.log('База данных успешно инициализирована');
}

init().catch(console.error);
