// 1. Get references to our HTML elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');

const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const weatherDisplay = document.getElementById('weatherDisplay');

const displayCity = document.getElementById('displayCity');
const displayIcon = document.getElementById('displayIcon');
const displayTemp = document.getElementById('displayTemp');
const displayMessage = document.getElementById('displayMessage');

// New detail elements
const displayFeelsLike = document.getElementById('displayFeelsLike');
const displayHumidity = document.getElementById('displayHumidity');
const displayWind = document.getElementById('displayWind');

// Helper function to handle the search
async function performSearch() {
    const city = cityInput.value.trim();
    if (!city) return;

    // Reset the UI state
    errorState.style.display = 'none';
    weatherDisplay.style.display = 'none';
    loadingState.style.display = 'block';
    
    // Reset background to default
    document.body.className = 'bg-default';

    try {
        // Step 1: Get coordinates for the city (Using Open-Meteo Geocoding API)
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("City not found");
        }

        const location = geoData.results[0];
        const lat = location.latitude;
        const lon = location.longitude;
        const cityName = location.name; 

        // Step 2: Get comprehensive weather data (Using Open-Meteo current endpoint)
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        const current = weatherData.current;
        const temp = Math.round(current.temperature_2m);
        const feelsLike = Math.round(current.apparent_temperature);
        const humidity = current.relative_humidity_2m;
        // Round to 1 decimal place for wind speed
        const windSpeed = Math.round(current.wind_speed_10m * 10) / 10;
        const code = current.weather_code;

        // Step 3: Determine condition, message, icon, and background
        let message = '';
        let icon = '';
        let bgClass = 'bg-default';

        // WMO Weather interpretation codes (simplified)
        // 0: Clear sky
        // 1, 2, 3: Mainly clear, partly cloudy, and overcast
        // 45, 48: Fog
        // 51-67, 80-82, 95-99: Rain/Showers/Thunderstorm
        // 71-77, 85, 86: Snow

        if (code === 0 || code === 1) {
            icon = '☀️';
            bgClass = temp > 30 ? 'bg-hot' : 'bg-sunny';
            message = temp > 30 ? "It's scorching hot! Stay hydrated!" : "Beautiful sunny weather!";
        } else if (code === 2 || code === 3 || code === 45 || code === 48) {
            icon = '☁️';
            bgClass = 'bg-cloudy';
            message = "It's looking cloudy out there.";
        } else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || (code >= 95 && code <= 99)) {
            icon = '🌧️';
            bgClass = 'bg-rainy';
            message = "Don't forget your umbrella!";
        } else if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
            icon = '❄️';
            bgClass = 'bg-snow';
            message = "Brrr! It's snowing! Bundle up!";
        } else {
            icon = '🌡️';
            bgClass = 'bg-default';
            message = "Enjoy the weather!";
        }

        // Override background if extremely cold but not snowing
        if (temp < 5 && bgClass !== 'bg-snow') {
            bgClass = 'bg-cold';
            message = "It's freezing! Keep warm!";
        }

        // Step 4: Update the UI with the final data
        displayCity.textContent = cityName;
        displayTemp.textContent = `${temp}°C`;
        displayMessage.textContent = message;
        displayIcon.textContent = icon;
        
        displayFeelsLike.textContent = `${feelsLike}°C`;
        displayHumidity.textContent = `${humidity}%`;
        displayWind.textContent = `${windSpeed} km/h`;

        // Apply background
        document.body.className = bgClass;

        // Hide loading, show the weather result card smoothly
        loadingState.style.display = 'none';
        weatherDisplay.style.display = 'block';

    } catch (error) {
        // If anything fails
        loadingState.style.display = 'none';
        errorState.style.display = 'block';
        document.body.className = 'bg-default'; // Reset background on error
        console.error("Oops, something went wrong:", error);
    }
}

// 2. Add Event Listeners
searchBtn.addEventListener('click', performSearch);

// Add Enter key support
cityInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        performSearch();
    }
});
