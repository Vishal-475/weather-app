// Note: In production, use a backend to store API keys
const apiKey = '4ce964e97f56042a8db1631e06a8d4ae';

// Favorites functionality
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

function addToFavorites() {
    const city = document.getElementById('cityName').textContent;
    if (city && !favorites.includes(city)) {
        favorites.push(city);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        displayFavorites();
        alert(`${city} added to favorites!`);
    }
}

// Load last search from localStorage
window.addEventListener('load', () => {
    const lastSearch = JSON.parse(localStorage.getItem('lastSearch'));
    if (lastSearch) {
        document.getElementById('cityInput').value = lastSearch.city;
        document.querySelector(`input[value="${lastSearch.unit}"]`).checked = true;
        getWeather(lastSearch.unit);
    } else {
        getLocation();
    }
});

// Unit toggle handler
document.querySelectorAll('input[name="unit"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
        const unit = e.target.value;
        const city = document.getElementById('cityName').textContent;
        if (city) {
            getWeather(unit);
            getForecast(city, unit);
        }
    });
});

async function getWeather(unit = 'metric') {
    const cityInput = document.getElementById('cityInput').value;
    
    if (!cityInput) {
        showError('Please enter a city name');
        return;
    }

    try {
        showLoading(true);
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${cityInput}&units=${unit}&appid=${apiKey}`
        );

        if (!response.ok) throw new Error('City not found');

        const data = await response.json();
        displayWeather(data, unit);
        getForecast(cityInput, unit);
        
        // Save to localStorage
        localStorage.setItem('lastSearch', JSON.stringify({
            city: data.name,
            unit: unit
        }));
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

function displayWeather(data, unit) {
    errorMsg.style.display = 'none';
    weatherInfo.style.display = 'block';

    // Update theme colors
    const temp = data.main.temp;
    const root = document.documentElement;
    if (temp > 25) {
        root.style.setProperty('--cold-color', '#ff7e5f');
        root.style.setProperty('--neutral-color', '#feb47b');
    } else if (temp < 10) {
        root.style.setProperty('--cold-color', '#00feba');
        root.style.setProperty('--neutral-color', '#5b548a');
    }

    function updateTheme(condition) {
        const root = document.documentElement;
        const themes = {
            Clear: { primary: '#FFD700', secondary: '#FFA500' },
            Rain: { primary: '#4A90E2', secondary: '#1C5D99' },
            Clouds: { primary: '#B0BEC5', secondary: '#78909C' }
        };
        
        root.style.setProperty('--primary-color', themes[condition].primary);
        root.style.setProperty('--secondary-color', themes[condition].secondary);
    }

    // Update weather data
    document.getElementById('temperature').textContent = 
        `${Math.round(data.main.temp)}°${unit === 'metric' ? 'C' : 'F'}`;
    document.getElementById('cityName').textContent = data.name;
    document.getElementById('humidity').textContent = 
        `${data.main.humidity}%`;
    document.getElementById('windSpeed').textContent = 
        `${Math.round(data.wind.speed * (unit === 'metric' ? 3.6 : 2.23694))} ${unit === 'metric' ? 'km/h' : 'mph'}`;
    document.getElementById('pressure').textContent = 
        `${data.main.pressure} hPa`;
    
    const weatherIcon = document.getElementById('weatherIcon');
    weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
}

async function getForecast(city, unit = 'metric') {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=${unit}&appid=${apiKey}`
        );

        if (!response.ok) {
            throw new Error('Unable to fetch forecast data.');
        }

        const data = await response.json();
        displayForecast(data, unit);
    } catch (error) {
        console.error(error);
    }
}

function displayForecast(data, unit) {
    const forecastCards = document.getElementById('forecastCards');
    forecastCards.innerHTML = '';

    const dailyForecast = data.list.filter((item, index) => index % 8 === 0);

    dailyForecast.forEach((item) => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        const icon = item.weather[0].icon;
        const temp = Math.round(item.main.temp);

        const forecastCard = document.createElement('div');
        forecastCard.className = 'forecast-card';
        forecastCard.innerHTML = `
            <div class="day">${day}</div>
            <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="Weather Icon">
            <div class="temp">${temp}°${unit === 'metric' ? 'C' : 'F'}</div>
        `;

        forecastCards.appendChild(forecastCard);
    });
}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherByCoords(lat, lon);
            },
            (error) => {
                showError('Unable to retrieve your location.');
            }
        );
    } else {
        showError('Geolocation is not supported by your browser.');
    }
}

async function fetchWeatherByCoords(lat, lon) {
    const unit = document.querySelector('input[name="unit"]:checked').value;
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${unit}&appid=${apiKey}`
        );

        if (!response.ok) {
            throw new Error('Unable to fetch weather data.');
        }

        const data = await response.json();
        displayWeather(data, unit);
        getForecast(data.name, unit);
    } catch (error) {
        showError(error.message);
    }
}

function showError(message) {
    errorMsg.textContent = message;
    errorMsg.style.display = 'block';
    weatherInfo.style.display = 'none';
}

function showLoading(show) {
    document.getElementById('loading').style.display = show ? 'flex' : 'none';
}

document.getElementById('cityInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        getWeather();
    }
});

function displayFavorites() {
    const favoritesList = document.getElementById('favoritesList');
    favoritesList.innerHTML = '';
    
    favorites.forEach(city => {
        const item = document.createElement('div');
        item.className = 'favorite-item';
        item.textContent = city;
        item.onclick = () => getWeatherForFavorite(city);
        favoritesList.appendChild(item);
    });
}

function getWeatherForFavorite(city) {
    document.getElementById('cityInput').value = city;
    getWeather();
}

// Initialize favorites display on load
window.addEventListener('load', () => {
    displayFavorites();
});

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}