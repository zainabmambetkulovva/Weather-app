require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// API Routes

// Получение координат города через Nominatim API
app.get('/api/geocode', async (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ error: 'Название города обязательно' });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'WeatherApp/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Ошибка геокодирования');
    }

    const data = await response.json();

    if (data.length === 0) {
      return res.status(404).json({ error: 'Город не найден' });
    }

    const location = data[0];
    res.json({
      name: location.display_name.split(',')[0],
      latitude: parseFloat(location.lat),
      longitude: parseFloat(location.lon),
      country: location.display_name.split(',').slice(-1)[0].trim()
    });
  } catch (error) {
    console.error('Geocode error:', error);
    res.status(500).json({ error: 'Ошибка при получении координат города' });
  }
});

// Получение данных о погоде через Open-Meteo API
app.get('/api/weather', async (req, res) => {
  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Координаты обязательны' });
  }

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto&forecast_days=7`
    );

    if (!response.ok) {
      throw new Error('Ошибка получения данных о погоде');
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Weather error:', error);
    res.status(500).json({ error: 'Ошибка при получении данных о погоде' });
  }
});

// Сохранение поиска в историю
app.post('/api/history', (req, res) => {
  const { city_name, country, latitude, longitude, temperature, weather_code } = req.body;

  if (!city_name || !latitude || !longitude) {
    return res.status(400).json({ error: 'Недостаточно данных для сохранения' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO search_history (city_name, country, latitude, longitude, temperature, weather_code)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(city_name, country, latitude, longitude, temperature, weather_code);

    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('History save error:', error);
    res.status(500).json({ error: 'Ошибка сохранения в историю' });
  }
});

// Получение истории поисков
app.get('/api/history', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT * FROM search_history 
      ORDER BY search_date DESC 
      LIMIT 10
    `);

    const history = stmt.all();
    res.json(history);
  } catch (error) {
    console.error('History fetch error:', error);
    res.status(500).json({ error: 'Ошибка получения истории' });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Инициализация БД при запуске
const initDb = () => {
  try {
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
    console.log('База данных готова');
  } catch (error) {
    console.error('Ошибка инициализации БД:', error);
  }
};

initDb();

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});
