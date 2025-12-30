import React, { useEffect, useState } from 'react';

const WeatherWidget = ({ lang, apiConfig }) => {
    const [weather, setWeather] = useState(null);
    const [aqi, setAqi] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [location, setLocation] = useState({ lat: 26.8467, lon: 80.9462, city: 'Lucknow' }); // Default: Lucknow

    const t = {
        weather: lang === 'hi' ? 'मौसम' : 'Weather',
        aqi: lang === 'hi' ? 'वायु गुणवत्ता' : 'Air Quality',
        loading: lang === 'hi' ? 'लोड हो रहा है...' : 'Loading...',
        noApi: lang === 'hi' ? 'API कॉन्फ़िगर नहीं है' : 'API not configured',
        good: lang === 'hi' ? 'अच्छी' : 'Good',
        moderate: lang === 'hi' ? 'सामान्य' : 'Moderate',
        unhealthy: lang === 'hi' ? 'खराब' : 'Unhealthy',
        veryUnhealthy: lang === 'hi' ? 'बहुत खराब' : 'Very Unhealthy',
        hazardous: lang === 'hi' ? 'खतरनाक' : 'Hazardous',
        yourLocation: lang === 'hi' ? 'आपका स्थान' : 'Your Location'
    };

    const getAqiInfo = (value) => {
        if (value <= 50) return { label: t.good, color: '#10b981', bg: '#d1fae5' };
        if (value <= 100) return { label: t.moderate, color: '#f59e0b', bg: '#fef3c7' };
        if (value <= 150) return { label: t.unhealthy, color: '#f97316', bg: '#fed7aa' };
        if (value <= 200) return { label: t.veryUnhealthy, color: '#ef4444', bg: '#fecaca' };
        return { label: t.hazardous, color: '#7c2d12', bg: '#fca5a5' };
    };

    const getWeatherIcon = (code) => {
        if (code === 0) return 'fa-sun';
        if (code <= 3) return 'fa-cloud-sun';
        if (code <= 48) return 'fa-smog';
        if (code <= 67) return 'fa-cloud-rain';
        if (code <= 77) return 'fa-snowflake';
        if (code <= 82) return 'fa-cloud-showers-heavy';
        return 'fa-cloud-bolt';
    };

    useEffect(() => {
        // Get user's location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;

                    // Reverse geocode to get city name
                    try {
                        const geoRes = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=${lang}`
                        );
                        const geoData = await geoRes.json();
                        const cityName = geoData.address?.city ||
                            geoData.address?.town ||
                            geoData.address?.village ||
                            geoData.address?.state_district ||
                            geoData.address?.state ||
                            (lang === 'hi' ? 'आपका स्थान' : 'Your Location');

                        setLocation({
                            lat: lat,
                            lon: lon,
                            city: cityName
                        });
                    } catch (e) {
                        console.log('Geocoding error:', e);
                        setLocation({
                            lat: lat,
                            lon: lon,
                            city: lang === 'hi' ? 'आपका स्थान' : 'Your Location'
                        });
                    }
                },
                () => {
                    // Geolocation denied or error - use default Lucknow
                    console.log('Geolocation denied, using Lucknow');
                }
            );
        }
    }, [lang]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch weather with daily min/max temperatures
                const weatherRes = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=1`
                );
                const weatherData = await weatherRes.json();
                if (weatherData.daily) {
                    setWeather({
                        tempMax: Math.round(weatherData.daily.temperature_2m_max[0]),
                        tempMin: Math.round(weatherData.daily.temperature_2m_min[0]),
                        code: weatherData.daily.weather_code[0]
                    });
                }
            } catch (e) {
                console.error('Weather error:', e);
            }

            try {
                // Use Open-Meteo Air Quality API for AQI based on location
                const aqiRes = await fetch(
                    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${location.lat}&longitude=${location.lon}&current=us_aqi`
                );
                const aqiData = await aqiRes.json();
                if (aqiData.current && aqiData.current.us_aqi) {
                    setAqi(aqiData.current.us_aqi);
                }
            } catch (e) {
                console.error('AQI error:', e);
            }

            setLoading(false);
        };

        fetchData();
    }, [location]);

    if (loading) {
        return (
            <div className="sidebar-weather-card">
                <div style={{ textAlign: 'center', padding: '15px', color: 'var(--text-muted)' }}>
                    <i className="fas fa-spinner fa-spin"></i>
                </div>
            </div>
        );
    }

    const aqiInfo = aqi ? getAqiInfo(aqi) : null;

    return (
        <div className="sidebar-weather-card">
            <div className="weather-row">
                {weather ? (
                    <div className="weather-mini">
                        <i className={`fas ${getWeatherIcon(weather.code)}`} style={{ fontSize: '1.5rem', color: 'var(--accent)' }}></i>
                        <div>
                            <span className="weather-temp">{weather.tempMax}°C</span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '3px' }}>/ {weather.tempMin}°C</span>
                            <span className="weather-city">{location.city}</span>
                        </div>
                    </div>
                ) : (
                    <div className="weather-mini no-data">
                        <i className="fas fa-cloud-sun" style={{ color: 'var(--text-muted)' }}></i>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t.noApi}</span>
                    </div>
                )}

                {aqi ? (
                    <div className="aqi-mini" style={{ background: aqiInfo.bg }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: aqiInfo.color }}>{aqi}</span>
                        <span style={{ fontSize: '0.7rem', color: aqiInfo.color }}>{aqiInfo.label}</span>
                    </div>
                ) : (
                    <div className="aqi-mini no-data">
                        <i className="fas fa-lungs" style={{ color: 'var(--text-muted)' }}></i>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>AQI N/A</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WeatherWidget;

