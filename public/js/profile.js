document.addEventListener('DOMContentLoaded', () => {
    const leftSidebar = document.getElementById('left-sidebar');
    const rightSidebar = document.getElementById('right-sidebar');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const profileToggleBtn = document.getElementById('profile-toggle-btn');
    const overlay = document.getElementById('overlay');
    const dashboardContent = document.getElementById('dashboard-content');
    const userAvatar = document.getElementById('user-avatar');

    const farmerId = window.farmerId;
    if (!farmerId) {
        window.location.href = '/login';
        return;
    }

    let farmerData = {};

    async function initializeDashboard() {
        try {
            const response = await fetch(`/api/farmer-data/${farmerId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || (window.t && window.t.couldNotFetchFarmerData) || 'Could not fetch farmer data');
            }
            farmerData = await response.json();

            if (!farmerData.name) {
                window.location.href = '/onboarding';
                return;
            }

            populateDashboard();

            // Crop calendar is rendered by the new calendar widget in renderMainContent()
            
            if (farmerData.location) {
                // Fetching weather and forecast data and then checking for alerts
                fetchAndRenderTodayWeather(farmerData.location);
                await fetchAndRenderForecast(farmerData.location);
            }
        } catch (error) {
            dashboardContent.innerHTML = `<p class="text-red-500 font-semibold">${(window.t && window.t.errorTryLoggingInAgain) || 'Error: Please try logging in again.'}</p>`;
        }
    }

    function populateDashboard() {
        userAvatar.src = `https://placehold.co/40x40/28A745/FFFFFF?text=${farmerData.name.charAt(0)}`;
        renderLeftSidebar();
        renderRightSidebar();
        renderMainContent();
    }

    function renderLeftSidebar() {
        leftSidebar.innerHTML = `
            <div class="text-2xl font-bold mb-10 px-2">Krishi Sakhi</div>
            <nav class="flex-grow">
                <ul>
                    <li class="mb-2"><a href="#" class="flex items-center p-3 rounded-lg transition-colors bg-[#D4EDDA] text-[#155724] border-l-4 border-[#28A745]"><span class="material-icons mr-3">dashboard</span>${(window.t && window.t.dashboard) || 'Dashboard'}</a></li>
                    <li class="mb-2"><a href="/diagnosis" class="flex items-center p-3 rounded-lg transition-colors hover:bg-gray-700"><span class="material-icons mr-3">analytics</span>${(window.t && window.t.diagnosis) || 'Diagnosis'}</a></li>
                    <li class="mb-2"><a href="/labs" class="flex items-center p-3 rounded-lg transition-colors hover:bg-gray-700"><span class="material-icons mr-3">grass</span>${(window.t && window.t.labs) || 'Labs'}</a></li>
                    <li class="mb-2"><a href="/weather" class="flex items-center p-3 rounded-lg transition-colors hover:bg-gray-700"><span <span class="material-icons mr-3">wb_sunny</span>${(window.t && window.t.weather) || 'Weather'}</a></li>
                    <li class="mb-2"><a href="/marketplace" class="flex items-center p-3 rounded-lg transition-colors hover:bg-gray-700"><span class="material-icons mr-3">account_balance_wallet</span>${(window.t && window.t.marketplace) || 'Marketplace'}</a></li>
                    <li><a href="/chatbot" class="flex items-center p-3 rounded-lg transition-colors hover:bg-gray-700"><span class="material-icons mr-3">settings</span>${(window.t && window.t.chatbot) || 'Chatbot'}</a></li>
                </ul>
            </nav>
            <div><a href="/" id="logout-btn" class="flex items-center p-3 rounded-lg transition-colors hover:bg-gray-700"><span class="material-icons mr-3">logout</span>${(window.t && window.t.logout) || 'Logout'}</a></div>
        `;
        document.getElementById('logout-btn').addEventListener('click', () => {
            window.location.href = '/logout';
        });
    }

    function renderRightSidebar() {
        const latestFarmDetails = farmerData.farmDetails[farmerData.farmDetails.length - 1] || {};
        rightSidebar.innerHTML = `
            <div class="p-6 flex flex-col h-full">
                <div class="flex justify-between items-center mb-8">
                    <h3 class="font-bold text-xl">${(window.t && window.t.profile) || 'Profile'}</h3>
                    <button id="close-profile-btn" class="text-gray-500"><span class="material-icons">close</span></button>
                </div>
                <div class="flex flex-col items-center text-center border-b pb-6">
                    <img alt="User avatar" class="w-20 h-20 rounded-full mb-4" src="${userAvatar.src}" />
                    <h4 class="font-semibold text-lg">${farmerData.name}</h4>
                    <p class="text-sm text-gray-500">${farmerData.location}</p>
                </div>
                <div class="mt-8">
                    <h3 class="font-bold text-xl mb-4">${(window.t && window.t.currentFarmDetails) || 'Current Farm Details'}</h3>
                    <ul class="space-y-2 text-sm">
                        <li><strong>${(window.t && window.t.landSize) || 'Land Size'}:</strong> ${latestFarmDetails.landSize || 'N/A'}</li>
                        <li><strong>${(window.t && window.t.mainCrop) || 'Main Crop'}:</strong> ${latestFarmDetails.mainCrop || 'N/A'}</li>
                        <li><strong>${(window.t && window.t.irrigation) || 'Irrigation'}:</strong> ${latestFarmDetails.irrigationMethod || 'N/A'}</li>
                    </ul>
                </div>
                <div class="mt-4 flex-grow overflow-y-auto">
                    <h3 class="font-bold text-lg mb-2">${(window.t && window.t.previousCrops) || 'Previous Crops'}</h3>
                    <ul class="space-y-1 text-sm text-gray-600">
                        ${farmerData.farmDetails.slice(0, -1).map(fd => `<li>- ${fd.mainCrop}</li>`).join('') || `<li>${(window.t && window.t.noPreviousCrops) || 'No previous crops logged.'}</li>`}
                    </ul>
                </div>
            </div>
        `;
        document.getElementById('close-profile-btn').addEventListener('click', toggleRightSidebar);
    }

    function renderMainContent() {
        const latestFarmDetails = farmerData.farmDetails[farmerData.farmDetails.length - 1] || {};
        dashboardContent.innerHTML = `
            <div id="alert-container" class="mb-4"></div>
            <section>
                <h2 class="text-xl font-semibold mb-4">${(window.t && window.t.summary) || 'Summary'}</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-gray-50 p-6 rounded-2xl">
                        <div><p class="text-gray-500">${latestFarmDetails.mainCrop || ((window.t && window.t.mainCrop) || 'Main Crop')}</p><p class="text-sm text-gray-400">${(window.t && window.t.totalProduction) || 'Total production'}</p></div>
                        <p class="text-3xl font-bold mt-2">125 <span class="text-lg font-medium">${(window.t && window.t.tons) || 'Tons'}</span></p>
                    </div>
                    <div class="bg-gray-50 p-6 rounded-2xl">
                        <div><p class="text-gray-500">${(window.t && window.t.targetProfit) || 'Target Profit'}</p><p class="text-sm text-gray-400">${(window.t && window.t.thisSeason) || 'This Season'}</p></div>
                        <p class="text-3xl font-bold mt-2">$25,000</p>
                    </div>
                    <div class="col-span-1 md:col-span-2 bg-gray-50 p-6 rounded-2xl" id="weather-container">
                        <p class="text-gray-500">${(window.t && window.t.loadingWeather) || "Loading today's weather..."}</p>
                    </div>
                </div>
            </section>
            <section class="mt-8">
                <h2 class="text-xl font-semibold mb-4">${(window.t && window.t.manageYourFarm) || 'Manage your farm'}</h2>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 rounded-2xl overflow-hidden h-64 lg:h-auto"><img alt="Cornfield" class="w-full h-full object-cover" src="https://images.pexels.com/photos/18720483/pexels-photo-18720483.jpeg"/></div>
                    <div class="grid grid-cols-2 gap-4" id="forecast-container">
                        <p class="col-span-2 text-gray-500 text-center">${(window.t && window.t.loadingForecast) || 'Loading 4-day forecast...'}</p>
                    </div>
                </div>
            </section>
            <section id="calendar-container" class="mt-8"></section>
        `;
        renderNewCalendarShell();
    }
    
    // Replace old calendar with new calendar UI and logic (calendar-container)
    function renderNewCalendarShell() {
        const container = document.getElementById('calendar-container');
        if (!container) return;
        container.innerHTML = `
            <div class="bg-white rounded-2xl shadow-lg p-6">
                <div class="flex items-center gap-4 mb-5">
                    <div class="bg-green-100 p-3 rounded-full"><span class="material-icons text-green-600">event</span></div>
                    <div>
                        <h3 class="text-xl font-bold text-gray-800">Create Your Schedule</h3>
                        <p class="text-sm text-gray-500">Get a personalized farm calendar in seconds.</p>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label for="cc-crop-select" class="block text-sm font-medium text-gray-700 mb-2">1. Select Your Crop</label>
                        <select id="cc-crop-select" class="w-full p-3 text-base border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500">
                            <option>Loading crops...</option>
                        </select>
                    </div>
                    <div>
                        <label for="cc-sowing-date" class="block text-sm font-medium text-gray-700 mb-2">2. Enter Sowing Date</label>
                        <input type="date" id="cc-sowing-date" class="w-full p-3 text-base border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500">
                    </div>
                    <div class="self-end">
                        <button id="cc-generate-btn" class="w-full flex items-center justify-center bg-green-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-700 transition">
                            <svg id="cc-loading-spinner" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span id="cc-button-text">Generate Schedule</span>
                        </button>
                    </div>
                </div>
            </div>

            <div id="cc-task-list-card" class="bg-white rounded-2xl shadow-lg p-6 hidden mt-6">
                <h4 class="text-xl font-bold text-gray-800 mb-4">Your Step-by-Step Schedule</h4>
                <div id="cc-task-list-body" class="space-y-4"></div>
            </div>

            <div id="cc-calendar-card" class="bg-white rounded-2xl shadow-lg p-4 sm:p-6 hidden mt-6">
                <div class="flex items-center justify-between mb-4">
                    <h5 id="cc-month-year-display" class="text-xl font-bold text-gray-800"></h5>
                    <div class="flex items-center gap-2">
                        <button id="cc-today-btn" class="text-sm font-medium text-gray-600 hover:text-green-600 px-3 py-1.5 rounded-md hover:bg-gray-100">Today</button>
                        <button id="cc-prev-month-btn" class="p-2 rounded-full hover:bg-gray-100"><span class="material-icons text-gray-500">chevron_left</span></button>
                        <button id="cc-next-month-btn" class="p-2 rounded-full hover:bg-gray-100"><span class="material-icons text-gray-500">chevron_right</span></button>
                    </div>
                </div>
                <div class="grid grid-cols-7 gap-1 text-center text-sm font-semibold text-gray-400 mb-2">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div id="cc-calendar-body" class="grid grid-cols-7 gap-1"></div>
            </div>
            
            <div id="cc-placeholder-card" class="text-center py-16 px-6 bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-200 mt-6">
                <span class="material-icons mx-auto block text-gray-400">calendar_today</span>
                <h6 class="mt-2 text-lg font-medium text-gray-900">Your schedule will appear here</h6>
                <p class="mt-1 text-sm text-gray-500">Select a crop and date above to get started.</p>
            </div>

            <div id="cc-day-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 hidden z-50">
                <div class="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 id="cc-modal-date" class="text-xl font-bold text-gray-800"></h3>
                        <button id="cc-close-modal-btn" class="p-2 rounded-full hover:bg-gray-200"><span class="material-icons text-gray-600">close</span></button>
                    </div>
                    <div id="cc-modal-event-list" class="space-y-2 mb-6"></div>
                    <div class="border-t pt-4">
                        <h4 class="text-lg font-semibold text-gray-700 mb-2">Add a New Task or Note</h4>
                        <form id="cc-add-event-form">
                            <input type="hidden" id="cc-event-date-input">
                            <input id="cc-event-title-input" type="text" placeholder="e.g., Bought seeds" class="w-full p-2 border border-gray-300 rounded-md mb-2" required>
                            <select id="cc-event-type-select" class="w-full p-2 border border-gray-300 rounded-md mb-4">
                                <option value="Note">Note</option>
                                <option value="Fertilizer">Fertilizer</option>
                                <option value="Irrigation">Irrigation</option>
                                <option value="Pest Control">Pest Control</option>
                                <option value="Weeding">Weeding</option>
                                <option value="Harvesting">Harvesting</option>
                            </select>
                            <button type="submit" class="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition">Add Event</button>
                        </form>
                    </div>
                </div>
            </div>
        `;
        initCropCalendarWidget();
    }

    // --- Render Today's Weather from static data (no API) ---
    async function fetchAndRenderTodayWeather(location) {
        const weatherContainer = document.getElementById('weather-container');
        if (!weatherContainer) return;

        weatherContainer.innerHTML = `<p class="text-gray-500">${(window.t && window.t.loadingWeather) || "Loading today's weather..."}</p>`;

        // Static sample weather data (customize as needed)
        const weatherData = {
            main: { temp: 29.6 },
            weather: [{ main: 'Clouds', description: 'scattered clouds', icon: '03d' }]
        };

        const temp = Math.round(weatherData.main.temp);
        const description = weatherData.weather[0].description;
        const iconUrl = `http://openweathermap.org/img/wn/${weatherData.weather[0].icon}@2x.png`;

        const weatherHtml = `
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-lg font-semibold">${farmerData.location}</p>
                    <p class="text-sm text-gray-600">${description}</p>
                </div>
                <div class="text-right">
                    <p class="text-4xl font-bold">${temp}°C</p>
                    <img src="${iconUrl}" alt="${description}" class="w-16 h-16 inline-block"/>
                </div>
            </div>
        `;
        weatherContainer.innerHTML = weatherHtml;
    }
    
    // --- Render 4-Day Forecast from static data (no API) ---
    async function fetchAndRenderForecast(location) {
        const forecastContainer = document.getElementById('forecast-container');
        if (!forecastContainer) return;

        forecastContainer.innerHTML = `<p class="col-span-2 text-gray-500 text-center">${(window.t && window.t.loadingForecast) || "Loading 4-day forecast..."}</p>`;

        // Static 4-day forecast sample (timestamps are today + n days)
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        const forecastData = [
            { dt: Math.floor((now + 1 * dayMs) / 1000), main: { temp: 30 }, weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }] },
            { dt: Math.floor((now + 2 * dayMs) / 1000), main: { temp: 28 }, weather: [{ main: 'Clouds', description: 'few clouds', icon: '02d' }] },
            { dt: Math.floor((now + 3 * dayMs) / 1000), main: { temp: 27 }, weather: [{ main: 'Rain', description: 'light rain', icon: '10d' }] },
            { dt: Math.floor((now + 4 * dayMs) / 1000), main: { temp: 31 }, weather: [{ main: 'Clear', description: 'sunny', icon: '01d' }] }
        ];

        // Use forecast for alerts
        checkAndRenderAlerts(forecastData, farmerData);

        let forecastHtml = '';
        forecastData.forEach(day => {
            const date = new Date(day.dt * 1000).toLocaleDateString();
            const temp = Math.round(day.main.temp);
            const description = day.weather[0].description;
            const iconUrl = `http://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;

            forecastHtml += `
                <div class="bg-gray-50 p-4 rounded-2xl text-center">
                    <p>${date}</p>
                    <img src="${iconUrl}" alt="${description}" class="w-12 h-12 mx-auto"/>
                    <p class="text-3xl font-bold">${temp}°</p>
                    <p>${description}</p>
                </div>
            `;
        });
        forecastContainer.innerHTML = forecastHtml;
    }

    // NEW FUNCTION: The core logic to check for weather-related alerts
    function checkAndRenderAlerts(forecastData, farmerData) {
        const latestFarmDetails = farmerData.farmDetails[farmerData.farmDetails.length - 1];
        if (!latestFarmDetails || !latestFarmDetails.sowingDate || !farmerData.cropCalendar) return;

        const sowingDate = new Date(latestFarmDetails.sowingDate);
        const today = new Date();
        const oneDay = 1000 * 60 * 60 * 24;
        const daysPassed = Math.floor(Math.abs((today - sowingDate) / oneDay));

        let alertMessage = null;

        // A simple set of rules for common crops
        const rules = {
            'Rice': [
                {
                    conditions: (weather) => weather.main.temp > 35,
                    stage: [30, 60], // Tillering to Flowering
                    message: "⚠️ High temperatures forecasted during the flowering stage. This can reduce yield. Ensure proper irrigation."
                },
                {
                    conditions: (weather) => weather.weather[0].main === 'Rain' && (weather.weather[0].description.includes('heavy') || weather.weather[0].description.includes('storm')),
                    stage: [1, 20], // Seedling/Transplanting
                    message: "🌧️ Heavy rain is expected in the coming days. Ensure proper field drainage to prevent waterlogging."
                }
            ],
            'Wheat': [
                 {
                    conditions: (weather) => weather.weather[0].main === 'Rain' || weather.weather[0].main === 'Snow',
                    stage: [70, 90], // Grain filling to Maturity
                    message: "⚠️ Risk of unexpected precipitation. This could cause lodging and fungal diseases. Monitor your fields closely."
                }
            ],
             'Cotton': [
                {
                    conditions: (weather) => weather.main.temp > 40,
                    stage: [60, 100], // Flowering to boll development
                    message: "🔥 High temperatures can cause shedding of squares and small bolls. Consider light irrigation during the hottest parts of the day."
                }
            ],
            'Tomato': [
                {
                    conditions: (weather) => weather.weather[0].main === 'Rain' && (weather.weather[0].description.includes('heavy') || weather.weather[0].description.includes('storm')),
                    stage: [45, 90], // Flowering to Fruiting
                    message: "⚠️ Heavy rain is expected during the fruiting stage. This can lead to fruit cracking and disease. Ensure good drainage."
                },
                {
                    conditions: (weather) => weather.main.temp > 35,
                    stage: [40, 80], // Flowering to Fruit setting
                    message: "🔥 High temperatures forecasted during flowering. This can cause flower drop and reduced fruit set. Consider covering or shading."
                }
            ]
        };

        const cropRules = rules[latestFarmDetails.mainCrop];
        if (!cropRules) return; // No specific rules for this crop

        const currentCropStageData = farmerData.cropCalendar.activities.find(a => 
            daysPassed >= a.start_day && daysPassed <= a.end_day
        );

        if (!currentCropStageData) return; // Cannot find a matching stage

        for (const rule of cropRules) {
            if (daysPassed >= rule.stage[0] && daysPassed <= rule.stage[1]) {
                for (const weather of forecastData) {
                    if (rule.conditions(weather)) {
                        alertMessage = rule.message;
                        renderAlert(alertMessage, 'warning');
                        return; // Stop after finding the first alert
                    }
                }
            }
        }
    }

    function renderAlert(message, type) {
        const alertContainer = document.getElementById('alert-container');
        if (!alertContainer) return;

        let style = '';
        if (type === 'warning') {
            style = 'bg-red-100 border border-red-400 text-red-700';
        } else {
            style = 'bg-green-100 border border-green-400 text-green-700';
        }

        alertContainer.innerHTML = `
            <div class="p-4 rounded-lg flex items-center ${style}">
                <span class="material-icons mr-3">warning</span>
                <p class="font-semibold">${message}</p>
            </div>
        `;
    }

    // --- Sidebar Toggle Logic ---
    menuToggleBtn.addEventListener('click', () => {
        leftSidebar.classList.toggle('-ml-64');
    });
    
    function toggleRightSidebar() {
        rightSidebar.classList.toggle('translate-x-full');
        overlay.classList.toggle('hidden', rightSidebar.classList.contains('translate-x-full'));
    }

    profileToggleBtn.addEventListener('click', toggleRightSidebar);
    overlay.addEventListener('click', () => {
        if (!rightSidebar.classList.contains('translate-x-full')) toggleRightSidebar();
    });
    
    initializeDashboard();
});
