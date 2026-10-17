const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'weather.db');

let db = null;
let SQL = null;

async function initDatabase() {
  if (db) return db;
  
  SQL = await initSqlJs();
  
  // Загружаем существующую БД или создаём новую
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  
  return db;
}

function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

module.exports = {
  initDatabase,
  getDb: () => db,
  saveDatabase
};
