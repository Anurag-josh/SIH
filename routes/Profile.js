document.addEventListener('DOMContentLoaded', () => {
    const leftSidebar = document.getElementById('left-sidebar');
    const rightSidebar = document.getElementById('right-sidebar');
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const profileToggleBtn = document.getElementById('profile-toggle-btn');
    const overlay = document.getElementById('overlay');
    const dashboardContent = document.getElementById('dashboard-content');
    const userAvatar = document.getElementById('user-avatar');

    const farmerId = localStorage.getItem('farmerId');
    if (!farmerId) {
        window.location.href = '/';
        return;
    }

    let farmerData = {};

    async function initializeDashboard() {
        try {
            const response = await fetch(`/api/farmer-data/${farmerId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Could not fetch farmer data');
            }
            farmerData = await response.json();

            if (!farmerData.name) {
                window.location.href = '/onboarding.html';
                return;
            }

            populateDashboard();

            const latestFarmDetails = farmerData.farmDetails[farmerData.farmDetails.length - 1];
            if (latestFarmDetails && latestFarmDetails.mainCrop) {
                // Fetch calendar data first so it's available for alert checks
                await fetchAndSetCalendar(latestFarmDetails.mainCrop);
                fetchAndRenderCalendar(latestFarmDetails.mainCrop, latestFarmDetails.sowingDate);
            }
            
            if (farmerData.location) {
                // Fetching weather and forecast data and then checking for alerts
                fetchAndRenderTodayWeather(farmerData.location);
                await fetchAndRenderForecast(farmerData.location);
            }
        } catch (error) {
            dashboardContent.innerHTML = `<p class="text-red-500 font-semibold">Error: ${error.message}. Please try logging in again.</p>`;
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
            <div class="text-2xl font-bold mb-10 px-2">agri cultur</div>
            <nav class="flex-grow">
                <ul>
                    <li class="mb-2"><a href="#" class="flex items-center p-3 rounded-lg transition-colors bg-[#D4EDDA] text-[#155724] border-l-4 border-[#28A745]"><span class="material-icons mr-3">dashboard</span>Dashboard</a></li>
                    <li class="mb-2"><a href="#" class="flex items-center p-3 rounded-lg transition-colors hover:bg-gray-700"><span class="material-icons mr-3">analytics</span>Analytics</a></li>
                    <li class="mb-2"><a href="#" class="flex items-center p-3 rounded-lg transition-colors hover:bg-gray-700"><span class="material-icons mr-3">grass</span>Fields</a></li>
                    <li class="mb-2"><a href="#" class="flex items-center p-3 rounded-lg transition-colors hover:bg-gray-700"><span class="material-icons mr-3">agriculture</span>Harvesting</a></li>
                    <li class="mb-2"><a href="#" class="flex items-center p-3 rounded-lg transition-colors hover:bg-gray-700"><span class="material-icons mr-3">account_balance_wallet</span>Finances</a></li>
                    <li class="mb-2"><a href="#" class="flex items-center p-3 rounded-lg transition-colors hover:bg-gray-700"><span class="material-icons mr-3">wb_sunny</span>Weather</a></li>
                    <li><a href="#" class="flex items-center p-3 rounded-lg transition-colors hover:bg-gray-700"><span class="material-icons mr-3">settings</span>Settings</a></li>
                </ul>
            </nav>
            <div><a href="/" id="logout-btn" class="flex items-center p-3 rounded-lg transition-colors hover:bg-gray-700"><span class="material-icons mr-3">logout</span>Logout</a></div>
        `;
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('farmerId');
            window.location.href = '/';
        });
    }

    function renderRightSidebar() {
        const latestFarmDetails = farmerData.farmDetails[farmerData.farmDetails.length - 1] || {};
        rightSidebar.innerHTML = `
            <div class="p-6 flex flex-col h-full">
                <div class="flex justify-between items-center mb-8">
                    <h3 class="font-bold text-xl">Profile</h3>
                    <button id="close-profile-btn" class="text-gray-500"><span class="material-icons">close</span></button>
                </div>
                <div class="flex flex-col items-center text-center border-b pb-6">
                    <img alt="User avatar" class="w-20 h-20 rounded-full mb-4" src="${userAvatar.src}" />
                    <h4 class="font-semibold text-lg">${farmerData.name}</h4>
                    <p class="text-sm text-gray-500">${farmerData.location}</p>
                </div>
                <div class="mt-8">
                    <h3 class="font-bold text-xl mb-4">Current Farm Details</h3>
                    <ul class="space-y-2 text-sm">
                        <li><strong>Land Size:</strong> ${latestFarmDetails.landSize || 'N/A'}</li>
                        <li><strong>Main Crop:</strong> ${latestFarmDetails.mainCrop || 'N/A'}</li>
                        <li><strong>Irrigation:</strong> ${latestFarmDetails.irrigationMethod || 'N/A'}</li>
                    </ul>
                </div>
                <div class="mt-4 flex-grow overflow-y-auto">
                    <h3 class="font-bold text-lg mb-2">Previous Crops</h3>
                    <ul class="space-y-1 text-sm text-gray-600">
                        ${farmerData.farmDetails.slice(0, -1).map(fd => `<li>- ${fd.mainCrop}</li>`).join('') || '<li>No previous crops logged.</li>'}
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
                <h2 class="text-xl font-semibold mb-4">Summary</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="bg-gray-50 p-6 rounded-2xl">
                        <div><p class="text-gray-500">${latestFarmDetails.mainCrop || 'Main Crop'}</p><p class="text-sm text-gray-400">Total production</p></div>
                        <p class="text-3xl font-bold mt-2">125 <span class="text-lg font-medium">Tons</span></p>
                    </div>
                    <div class="bg-gray-50 p-6 rounded-2xl">
                        <div><p class="text-gray-500">Target Profit</p><p class="text-sm text-gray-400">This Season</p></div>
                        <p class="text-3xl font-bold mt-2">$25,000</p>
                    </div>
                    <div class="col-span-1 md:col-span-2 bg-gray-50 p-6 rounded-2xl" id="weather-container">
                        <p class="text-gray-500">Loading today's weather...</p>
                    </div>
                </div>
            </section>
            <section class="mt-8">
                <h2 class="text-xl font-semibold mb-4">Manage your farm</h2>
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 rounded-2xl overflow-hidden h-64 lg:h-auto"><img alt="Cornfield" class="w-full h-full object-cover" src="https://images.pexels.com/photos/18720483/pexels-photo-18720483.jpeg"/></div>
                    <div class="grid grid-cols-2 gap-4" id="forecast-container">
                        <p class="col-span-2 text-gray-500 text-center">Loading 4-day forecast...</p>
                    </div>
                </div>
            </section>
            <section id="calendar-container" class="mt-8"></section>
        `;
    }
    
    // NEW FUNCTION: Fetches the crop calendar and stores it in farmerData
    async function fetchAndSetCalendar(cropName) {
        try {
            const calendarResponse = await fetch(`/api/crop-calendar/${cropName}`);
            if (!calendarResponse.ok) throw new Error('Calendar not found');
            const calendarData = await calendarResponse.json();
            farmerData.cropCalendar = calendarData;
        } catch (error) {
            console.error('Error fetching calendar data for alerts:', error);
            farmerData.cropCalendar = null;
        }
    }

    async function fetchAndRenderCalendar(cropName, sowingDate) {
        try {
            const calendarResponse = await fetch(`/api/crop-calendar/${cropName}`);
            if (!calendarResponse.ok) throw new Error('Calendar not found');
            const calendarData = await calendarResponse.json();
            renderCropCalendar(calendarData.activities, new Date(sowingDate));
        } catch (error) {
            const calendarContainer = document.getElementById('calendar-container');
            if (calendarContainer) {
                calendarContainer.innerHTML = `<p class="p-4 bg-yellow-100 text-yellow-800 rounded-lg">No crop calendar available for ${cropName}.</p>`;
            }
        }
    }
    
    function renderCropCalendar(activities, initialSowingDate) {
        const calendarContainer = document.getElementById('calendar-container');
        if (!calendarContainer) return;

        let calendarHTML = `
            <div class="bg-white p-6 rounded-2xl shadow-lg">
                <h3 class="text-xl font-semibold mb-4">Your Crop Calendar for ${farmerData.farmDetails[farmerData.farmDetails.length - 1].mainCrop}</h3>
                <div class="mb-4">
                    <label for="sowing-date" class="block text-sm font-medium text-gray-700">Change Sowing Date:</label>
                    <input type="date" id="sowing-date" class="mt-1 block w-full md:w-1/3 p-2 border border-gray-300 rounded-md shadow-sm">
                </div>
                <div id="calendar-activities" class="space-y-4"></div>
            </div>
        `;
        calendarContainer.innerHTML = calendarHTML;
        
        const dateInput = document.getElementById('sowing-date');
        const activitiesContainer = document.getElementById('calendar-activities');

        function updateCalendarView(currentSowingDate) {
            let activitiesHTML = '';
            activities.forEach(activity => {
                const startDate = new Date(currentSowingDate);
                startDate.setDate(startDate.getDate() + activity.start_day);

                const endDate = new Date(currentSowingDate);
                endDate.setDate(endDate.getDate() + activity.end_day);

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                startDate.setHours(0, 0, 0, 0);
                endDate.setHours(0, 0, 0, 0);
                
                const isActive = today >= startDate && today <= endDate;

                activitiesHTML += `
                    <div class="p-4 rounded-lg ${isActive ? 'bg-green-100 border-l-4 border-green-500' : 'bg-gray-50'}">
                        <div class="flex justify-between items-center">
                            <p class="font-bold">${activity.stage}</p>
                            <p class="text-sm text-gray-600">${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
                        </div>
                        <p class="mt-2 text-sm">${activity.description}</p>
                        <p class="mt-1 text-sm font-semibold text-red-600">${activity.critical_info || ''}</p>
                    </div>
                `;
            });
            activitiesContainer.innerHTML = activitiesHTML;
        }

        dateInput.valueAsDate = initialSowingDate;
        updateCalendarView(initialSowingDate);
        
        dateInput.addEventListener('change', (e) => {
            if (e.target.value) {
                updateCalendarView(new Date(e.target.value));
            }
        });
    }

    // --- NEW Function to Fetch and Render Today's Weather ---
    async function fetchAndRenderTodayWeather(location) {
        const weatherContainer = document.getElementById('weather-container');
        if (!weatherContainer) return;

        weatherContainer.innerHTML = '<p class="text-gray-500">Loading today\'s weather...</p>';

        try {
            const response = await fetch('/api/get-weather', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location }) 
            });
            if (!response.ok) throw new Error('Failed to fetch weather');

            const weatherData = await response.json();
            
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

        } catch (error) {
            console.error("Weather fetch error:", error);
            weatherContainer.innerHTML = `<p class="text-red-500">Error loading weather data.</p>`;
        }
    }
    
    // --- NEW Function to Fetch and Render 4-Day Forecast ---
    async function fetchAndRenderForecast(location) {
        const forecastContainer = document.getElementById('forecast-container');
        if (!forecastContainer) return;

        forecastContainer.innerHTML = '<p class="col-span-2 text-gray-500 text-center">Loading 4-day forecast...</p>';

        try {
            const response = await fetch('/api/get-forecast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ location })
            });
            if (!response.ok) throw new Error('Failed to fetch forecast');

            const forecastData = await response.json();
            
            // Call the new alert function with the fetched data
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

        } catch (error) {
            console.error("Forecast fetch error:", error);
            forecastContainer.innerHTML = `<p class="col-span-2 text-red-500 text-center">Error loading forecast data.</p>`;
        }
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