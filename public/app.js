// Элементы DOM
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('errorMessage');
const weatherContainer = document.getElementById('weatherContainer');
const historySection = document.getElementById('historySection');

// Элементы текущей погоды
const cityName = document.getElementById('cityName');
const currentDate = document.getElementById('currentDate');
const weatherIcon = document.getElementById('weatherIcon');
const temperature = document.getElementById('temperature');
const weatherDescription = document.getElementById('weatherDescription');
const feelsLike = document.getElementById('feelsLike');
const windSpeed = document.getElementById('windSpeed');
const humidity = document.getElementById('humidity');
const windDirection = document.getElementById('windDirection');
const forecastContainer = document.getElementById('forecastContainer');
const historyContainer = document.getElementById('historyContainer');

// Коды погоды Open-Meteo
const weatherCodes = {
    0: { description: 'Ясно', icon: '☀️' },
    1: { description: 'Преимущественно ясно', icon: '🌤️' },
    2: { description: 'Переменная облачность', icon: '⛅' },
    3: { description: 'Пасмурно', icon: '☁️' },
    45: { description: 'Туман', icon: '🌫️' },
    48: { description: 'Изморозь', icon: '🌫️' },
    51: { description: 'Морось легкая', icon: '🌦️' },
    53: { description: 'Морось умеренная', icon: '🌦️' },
    55: { description: 'Морось сильная', icon: '🌧️' },
    61: { description: 'Дождь слабый', icon: '🌧️' },
    63: { description: 'Дождь умеренный', icon: '🌧️' },
    65: { description: 'Дождь сильный', icon: '⛈️' },
    71: { description: 'Снег слабый', icon: '🌨️' },
    73: { description: 'Снег умеренный', icon: '❄️' },
    75: { description: 'Снег сильный', icon: '❄️' },
    77: { description: 'Снежная крупа', icon: '🌨️' },
    80: { description: 'Ливень слабый', icon: '🌦️' },
    81: { description: 'Ливень умеренный', icon: '⛈️' },
    82: { description: 'Ливень сильный', icon: '⛈️' },
    85: { description: 'Снегопад слабый', icon: '🌨️' },
    86: { description: 'Снегопад сильный', icon: '❄️' },
    95: { description: 'Гроза', icon: '⛈️' },
    96: { description: 'Гроза с градом', icon: '⛈️' },
    99: { description: 'Гроза с крупным градом', icon: '⛈️' }
};

// Направления ветра
function getWindDirection(degrees) {
    const directions = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
}

// Форматирование даты
function formatDate(date) {
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(date).toLocaleDateString('ru-RU', options);
}

// Форматирование даты для прогноза
function formatForecastDate(dateString) {
    const date = new Date(dateString);
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString('ru-RU', options);
}

// Получение иконки и описания погоды
function getWeatherInfo(code) {
    return weatherCodes[code] || { description: 'Неизвестно', icon: '🌡️' };
}

// Показать ошибку
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
}

// Скрыть ошибку
function hideError() {
    errorMessage.classList.remove('show');
}

// Показать загрузку
function showLoader() {
    loader.classList.remove('hidden');
    weatherContainer.classList.add('hidden');
}

// Скрыть загрузку
function hideLoader() {
    loader.classList.add('hidden');
}

// Получить координаты города
async function getCoordinates(city) {
    try {
        const response = await fetch(`/api/geocode?city=${encodeURIComponent(city)}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка получения координат');
        }
        
        return await response.json();
    } catch (error) {
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Нет подключения к интернету');
        }
        throw error;
    }
}

// Получить данные о погоде
async function getWeatherData(latitude, longitude) {
    try {
        const response = await fetch(`/api/weather?latitude=${latitude}&longitude=${longitude}`);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка получения данных о погоде');
        }
        
        return await response.json();
    } catch (error) {
        if (error.message.includes('Failed to fetch')) {
            throw new Error('Нет подключения к интернету');
        }
        throw error;
    }
}

// Сохранить в историю
async function saveToHistory(data) {
    try {
        await fetch('/api/history', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.error('Ошибка сохранения в историю:', error);
    }
}

// Загрузить историю
async function loadHistory() {
    try {
        const response = await fetch('/api/history');
        const history = await response.json();
        
        if (history.length > 0) {
            historySection.classList.remove('hidden');
            displayHistory(history);
        }
    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
    }
}

// Отобразить историю
function displayHistory(history) {
    historyContainer.innerHTML = '';
    
    history.forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const weatherInfo = getWeatherInfo(item.weather_code);
        const date = new Date(item.search_date);
        
        historyItem.innerHTML = `
            <div>
                <span class="history-city">${item.city_name}</span>
                <span style="color: var(--text-light); font-size: 0.9rem; margin-left: 10px;">
                    ${date.toLocaleDateString('ru-RU')} ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
            <div>
                <span style="margin-right: 10px;">${weatherInfo.icon}</span>
                <span class="history-temp">${Math.round(item.temperature)}°C</span>
            </div>
        `;
        
        historyItem.addEventListener('click', () => {
            cityInput.value = item.city_name;
            searchWeather();
        });
        
        historyContainer.appendChild(historyItem);
    });
}

// Отобразить данные о погоде
function displayWeather(locationData, weatherData) {
    // Текущая погода
    cityName.textContent = locationData.name;
    currentDate.textContent = formatDate(new Date());
    
    const currentWeatherInfo = getWeatherInfo(weatherData.current.weather_code);
    weatherIcon.textContent = currentWeatherInfo.icon;
    weatherDescription.textContent = currentWeatherInfo.description;
    
    temperature.textContent = `${Math.round(weatherData.current.temperature_2m)}°`;
    feelsLike.textContent = `${Math.round(weatherData.current.apparent_temperature)}°C`;
    windSpeed.textContent = `${Math.round(weatherData.current.wind_speed_10m)} км/ч`;
    humidity.textContent = `${weatherData.current.relative_humidity_2m}%`;
    windDirection.textContent = getWindDirection(weatherData.current.wind_direction_10m);
    
    // Прогноз на 7 дней
    displayForecast(weatherData.daily);
    
    // Показать контейнер с погодой
    weatherContainer.classList.remove('hidden');
    
    // Сохранить в историю
    saveToHistory({
        city_name: locationData.name,
        country: locationData.country,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        temperature: weatherData.current.temperature_2m,
        weather_code: weatherData.current.weather_code
    });
    
    // Обновить историю
    loadHistory();
}

// Отобразить прогноз
function displayForecast(dailyData) {
    forecastContainer.innerHTML = '';
    
    // Пропускаем сегодняшний день и показываем следующие 7 дней
    for (let i = 1; i < dailyData.time.length; i++) {
        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        
        const weatherInfo = getWeatherInfo(dailyData.weather_code[i]);
        
        forecastCard.innerHTML = `
            <div class="forecast-date">${formatForecastDate(dailyData.time[i])}</div>
            <div class="forecast-icon">${weatherInfo.icon}</div>
            <div class="forecast-temp">
                <span class="temp-max">${Math.round(dailyData.temperature_2m_max[i])}°</span>
                <span class="temp-min">${Math.round(dailyData.temperature_2m_min[i])}°</span>
            </div>
            <div class="forecast-details">
                ${dailyData.precipitation_sum[i] > 0 ? `💧 ${dailyData.precipitation_sum[i]} мм` : ''}
                ${dailyData.precipitation_sum[i] > 0 ? '<br>' : ''}
                💨 ${Math.round(dailyData.wind_speed_10m_max[i])} км/ч
            </div>
        `;
        
        forecastContainer.appendChild(forecastCard);
    }
}

// Поиск погоды
async function searchWeather() {
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Пожалуйста, введите название города');
        return;
    }
    
    hideError();
    showLoader();
    
    try {
        // Получаем координаты города
        const locationData = await getCoordinates(city);
        
        // Получаем данные о погоде
        const weatherData = await getWeatherData(locationData.latitude, locationData.longitude);
        
        // Отображаем данные
        displayWeather(locationData, weatherData);
        
        hideLoader();
    } catch (error) {
        hideLoader();
        showError(error.message);
        console.error('Ошибка:', error);
    }
}

// Обработчики событий
searchBtn.addEventListener('click', searchWeather);

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchWeather();
    }
});

// Загрузка истории при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
});
