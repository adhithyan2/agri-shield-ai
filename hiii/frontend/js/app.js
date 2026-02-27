const API_URL = window.location.origin + '/api';

let authToken = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let weatherChart = null;
let forecastChart = null;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  const lang = localStorage.getItem('language') || 'en';
  document.getElementById('languageSelect').value = lang;
  currentLang = lang;
  updateAllTranslations();
  
  loadVillages();
  
  if (authToken) {
    showLoggedInUI();
  } else {
    showGuestMode();
  }
  
  setupEventListeners();
}

function setupEventListeners() {
  document.getElementById('languageSelect').addEventListener('change', (e) => {
    changeLanguage(e.target.value);
  });

  document.getElementById('userLoginForm').addEventListener('submit', handleUserLogin);
  document.getElementById('farmerLoginForm').addEventListener('submit', handleFarmerLogin);
  document.getElementById('signupForm').addEventListener('submit', handleSignup);
  document.getElementById('farmerForm').addEventListener('submit', handleFarmerRegister);
  document.getElementById('logoutBtn').addEventListener('click', logout);
  
  document.getElementById('signupRole').addEventListener('change', (e) => {
    const villageDiv = document.getElementById('villageSelectDiv');
    villageDiv.style.display = e.target.value === 'booth_agent' ? 'block' : 'none';
  });

  document.getElementById('voiceBtn').addEventListener('click', toggleVoiceAssistant);
}

function showLoginModal() {
  new bootstrap.Modal(document.getElementById('authModal')).show();
}

function showLoggedInUI() {
  document.getElementById('guestBanner').style.display = 'none';
  document.getElementById('logoutBtn').style.display = 'block';
  updateNavLinks();
  updateSidebar();
  loadDashboard();
}

function showGuestMode() {
  document.getElementById('guestBanner').style.display = 'flex';
  document.getElementById('logoutBtn').style.display = 'none';
  updateNavLinks();
  updateSidebar();
  loadDashboard();
}

function updateNavLinks() {
  const navLinks = document.getElementById('navLinks');
  navLinks.innerHTML = `
    <li class="nav-item">
      <a class="nav-link active" href="#" onclick="loadDashboard()">${t('dashboard')}</a>
    </li>
  `;
}

function updateSidebar() {
  const sidebarLinks = document.getElementById('sidebarLinks');
  let links = `
    <li class="nav-item">
      <a class="nav-link" href="#" onclick="loadDashboard()">
        <i class="fas fa-home"></i> ${t('dashboard')}
      </a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="#" onclick="loadClimate()">
        <i class="fas fa-cloud"></i> ${t('climate')}
      </a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="#" onclick="loadCropAI()">
        <i class="fas fa-seedling"></i> ${t('cropAI')}
      </a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="#" onclick="loadMarket()">
        <i class="fas fa-shopping-cart"></i> ${t('marketIntelligence')}
      </a>
    </li>
    <li class="nav-item">
      <a class="nav-link" href="#" onclick="loadWaste()">
        <i class="fas fa-recycle"></i> ${t('wasteToMoney')}
      </a>
    </li>
  `;

  if (currentUser && (currentUser.role === 'super_admin' || currentUser.role === 'booth_agent')) {
    links += `
      <li class="nav-item">
        <a class="nav-link" href="#" onclick="loadFarmerManagement()">
          <i class="fas fa-users"></i> ${t('farmerManagement')}
        </a>
      </li>
    `;
  }

  if (currentUser && currentUser.role === 'super_admin') {
    links += `
      <li class="nav-item">
        <a class="nav-link" href="#" onclick="loadAnalytics()">
          <i class="fas fa-chart-bar"></i> ${t('analytics')}
        </a>
      </li>
    `;
  }

  sidebarLinks.innerHTML = links;
}

function setActiveSidebar(link) {
  document.querySelectorAll('#sidebarLinks .nav-link').forEach(l => l.classList.remove('active'));
  link.classList.add('active');
}

async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API call failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    showToast(error.message);
    throw error;
  }
}

async function loadVillages() {
  try {
    const data = await apiCall('/villages');
    const villages = data.villages;
    
    const signupVillage = document.getElementById('signupVillage');
    const farmerVillage = document.getElementById('farmerVillage');
    
    const options = villages.map(v => `<option value="${v._id}">${v.villageName} (${v.villageCode})</option>`).join('');
    
    if (signupVillage) signupVillage.innerHTML = options;
    if (farmerVillage) farmerVillage.innerHTML = options;
  } catch (error) {
    console.error('Failed to load villages:', error);
  }
}

function loadDashboard() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
    </div>
  `;

  let dashboardHTML = `
    <h2 class="mb-4">${t('welcome')}, ${currentUser ? currentUser.name : 'Guest'}!</h2>
    <div class="row">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <i class="fas fa-cloud me-2"></i> ${t('weatherForecast')}
          </div>
          <div class="card-body" id="weatherWidget">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            <i class="fas fa-chart-line me-2"></i> ${t('temperatureChart')}
          </div>
          <div class="card-body">
            <div class="chart-container">
              <canvas id="tempChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (currentUser && currentUser.role === 'farmer' && currentUser.farmerId) {
    dashboardHTML += `
      <div class="row mt-4">
        <div class="col-12">
          <div class="farmer-id-display">
            <h5>${t('farmerId')}</h5>
            <div class="id">${currentUser.farmerId}</div>
            <p class="mt-2">${currentUser.name} - ${currentUser.landArea} acres - ${currentUser.soilType}</p>
          </div>
        </div>
      </div>
    `;
  }

  if (currentUser && currentUser.villageName) {
    dashboardHTML += `
      <div class="row mt-4">
        <div class="col-12">
          <div class="alert alert-success">
            <i class="fas fa-map-marker-alt me-2"></i> ${currentUser.villageName}
          </div>
        </div>
      </div>
    `;
  }

  mainContent.innerHTML = dashboardHTML;
  loadWeatherWidget();
  loadTempChart();
}

async function loadWeatherWidget() {
  const weatherWidget = document.getElementById('weatherWidget');
  const villageCode = currentUser?.villageCode || 'TNK01';
  
  try {
    const data = await apiCall(`/weather/current?villageCode=${villageCode}`);
    
    if (data.success) {
      const w = data.weather;
      const riskHTML = data.riskFactors.length > 0 
        ? data.riskFactors.map(r => `<span class="risk-badge risk-${r.level}">${r.message}</span>`).join(' ')
        : '<span class="risk-badge risk-low">No major risks</span>';
      
      weatherWidget.innerHTML = `
        <div class="row text-center">
          <div class="col-12">
            <div class="temp">${w.temperature}°C</div>
            <p class="mb-1">${w.description}</p>
            <small>${data.location.name}, ${data.location.country}</small>
          </div>
        </div>
        <div class="row mt-3">
          <div class="col-4 text-center">
            <i class="fas fa-tint fa-lg"></i>
            <div>${w.humidity}%</div>
            <small>${t('humidity')}</small>
          </div>
          <div class="col-4 text-center">
            <i class="fas fa-cloud-rain fa-lg"></i>
            <div>${w.rainfall} mm</div>
            <small>${t('rainfall')}</small>
          </div>
          <div class="col-4 text-center">
            <i class="fas fa-wind fa-lg"></i>
            <div>${w.windSpeed} m/s</div>
            <small>${t('windSpeed')}</small>
          </div>
        </div>
        <div class="mt-3">${riskHTML}</div>
      `;
    }
  } catch (error) {
    weatherWidget.innerHTML = `<p class="text-danger">Failed to load weather</p>`;
  }
}

async function loadTempChart() {
  const villageCode = currentUser?.villageCode || 'TNK01';
  
  try {
    const data = await apiCall(`/weather/forecast?villageCode=${villageCode}`);
    
    if (data.success && data.hourly) {
      const ctx = document.getElementById('tempChart').getContext('2d');
      
      const labels = data.hourly.map(h => h.time.split(' ')[1].split(':')[0] + ':00');
      const temps = data.hourly.map(h => h.temperature);
      const colors = temps.map(t => t > 38 ? '#ff4444' : '#4caf50');
      
      if (weatherChart) weatherChart.destroy();
      
      weatherChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: t('temperature'),
            data: temps,
            borderColor: '#2e7d32',
            backgroundColor: 'rgba(46, 125, 50, 0.1)',
            fill: true,
            pointBackgroundColor: colors,
            pointRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: false }
          }
        }
      });
    }
  } catch (error) {
    console.error('Failed to load chart:', error);
  }
}

function loadClimate() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <h2 class="mb-4">${t('climate')}</h2>
    <div class="row">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">${t('weatherForecast')}</div>
          <div class="card-body" id="currentWeather">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">${t('riskFactors')}</div>
          <div class="card-body" id="riskFactors">
            <div class="loading"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
    </div>
    <div class="row mt-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header">${t('temperatureChart')}</div>
          <div class="card-body">
            <div class="chart-container">
              <canvas id="forecastChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  loadClimateData();
}

async function loadClimateData() {
  const villageCode = currentUser?.villageCode || 'TNK01';
  
  try {
    const [weatherData, forecastData] = await Promise.all([
      apiCall(`/weather/current?villageCode=${villageCode}`),
      apiCall(`/weather/forecast?villageCode=${villageCode}`)
    ]);

    if (weatherData.success) {
      const w = weatherData.weather;
      document.getElementById('currentWeather').innerHTML = `
        <div class="row">
          <div class="col-6">
            <h3>${w.temperature}°C</h3>
            <p>${w.description}</p>
          </div>
          <div class="col-6">
            <p><strong>${t('humidity')}:</strong> ${w.humidity}%</p>
            <p><strong>${t('rainfall')}:</strong> ${w.rainfall} mm</p>
            <p><strong>${t('windSpeed')}:</strong> ${w.windSpeed} m/s</p>
          </div>
        </div>
      `;
    }

    if (weatherData.success && weatherData.riskFactors) {
      const risksHTML = weatherData.riskFactors.length > 0
        ? weatherData.riskFactors.map(r => `
            <div class="alert alert-${r.level === 'high' ? 'danger' : r.level === 'medium' ? 'warning' : 'success'}">
              <strong>${r.type.toUpperCase()}:</strong> ${r.message}
            </div>
          `).join('')
        : '<div class="alert alert-success">No major risks</div>';
      document.getElementById('riskFactors').innerHTML = risksHTML;
    }

    if (forecastData.success && forecastData.daily) {
      const ctx = document.getElementById('forecastChart').getContext('2d');
      const labels = forecastData.daily.map(d => d.date.split(' ')[0]);
      const temps = forecastData.daily.map(d => d.temp);
      
      if (forecastChart) forecastChart.destroy();
      
      forecastChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: t('temperature'),
            data: temps,
            backgroundColor: temps.map(t => t > 38 ? '#ff4444' : '#4caf50'),
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  } catch (error) {
    console.error('Failed to load climate data:', error);
  }
}

function loadCropAI() {
  const mainContent = document.getElementById('mainContent');
  
  if (!currentUser || currentUser.role !== 'farmer') {
    mainContent.innerHTML = `
      <div class="alert alert-warning">
        <h4>${t('cropRecommendations')}</h4>
        <p>Please login as a farmer to get crop recommendations.</p>
        <button class="btn btn-success" onclick="showLoginModal()">${t('login')}</button>
      </div>
    `;
    return;
  }

  const farmerId = currentUser.farmerId;
  if (!farmerId) {
    mainContent.innerHTML = `
      <div class="alert alert-warning">
        <h4>${t('cropRecommendations')}</h4>
        <p>Farmer ID not found. Please contact your booth agent.</p>
      </div>
    `;
    return;
  }

  mainContent.innerHTML = `
    <h2 class="mb-4">${t('cropRecommendations')}</h2>
    <div class="card">
      <div class="card-body text-center">
        <div class="loading"><div class="spinner"></div></div>
      </div>
    </div>
  `;

  loadCropRecommendations(farmerId);
}

async function loadCropRecommendations(farmerId) {
  const villageCode = currentUser?.villageCode || 'TNK01';
  
  try {
    const [weatherData, cropData] = await Promise.all([
      apiCall(`/weather/current?villageCode=${villageCode}`),
      apiCall(`/crops/recommendation/${farmerId}?temperature=${weatherData.success ? weatherData.weather.temperature : 30}&rainfall=${weatherData.success ? weatherData.weather.rainfall : 100}`)
    ]);

    const mainContent = document.getElementById('mainContent');
    
    if (cropData.success && cropData.recommendations) {
      const cropsHTML = cropData.recommendations.map((crop, index) => {
        const scoreClass = crop.score >= 80 ? 'score-high' : crop.score >= 60 ? 'score-medium' : 'score-low';
        const riskClass = crop.riskPercentage >= 30 ? 'risk-high' : crop.riskPercentage >= 15 ? 'risk-medium' : 'risk-low';
        
        return `
          <div class="card mb-3">
            <div class="card-body">
              <div class="row align-items-center">
                <div class="col-md-2 text-center">
                  <div class="crop-score">
                    <div class="score-circle ${scoreClass}">${crop.score}%</div>
                    <small>#${index + 1}</small>
                  </div>
                </div>
                <div class="col-md-6">
                  <h4>${crop.crop}</h4>
                  <div class="row mt-2">
                    <div class="col-6">
                      <small><strong>${t('temperatureMatch')}:</strong> ${crop.temperatureMatch}%</small>
                    </div>
                    <div class="col-6">
                      <small><strong>${t('rainfallMatch')}:</strong> ${crop.rainfallMatch}%</small>
                    </div>
                    <div class="col-6">
                      <small><strong>${t('soilMatch')}:</strong> ${crop.soilMatch}%</small>
                    </div>
                    <div class="col-6">
                      <small><strong>${t('historicalSuccess')}:</strong> ${crop.historicalSuccess}%</small>
                    </div>
                  </div>
                </div>
                <div class="col-md-4 text-end">
                  <span class="risk-badge ${riskClass}">${t('risk')}: ${crop.riskPercentage}%</span>
                  <h4 class="text-success mt-2">₹${crop.estimatedProfit.toLocaleString()}</h4>
                  <small>${t('profit')}</small>
                  <div class="mt-2 text-primary">
                    <strong>${t('moneyLossAvoided')}:</strong> ₹${crop.moneyLossAvoided.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      mainContent.innerHTML = `
        <h2 class="mb-4">${t('bestCrops')}</h2>
        <div class="farmer-id-display mb-4">
          <p class="mb-1">${cropData.farmer.name} - ${cropData.farmer.landArea} acres - ${cropData.farmer.soilType}</p>
          <small>${t('temperature')}: ${cropData.currentConditions.temperature}°C | ${t('rainfall')}: ${cropData.currentConditions.rainfall}mm</small>
        </div>
        ${cropsHTML}
      `;
    } else {
      mainContent.innerHTML = `<div class="alert alert-danger">${t('noData')}</div>`;
    }
  } catch (error) {
    console.error('Failed to load crop recommendations:', error);
    document.getElementById('mainContent').innerHTML = `<div class="alert alert-danger">Failed to load recommendations</div>`;
  }
}

function loadMarket() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <h2 class="mb-4">${t('marketIntelligence')}</h2>
    <div class="card mb-4">
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <input type="text" class="form-control" id="productSearch" placeholder="${t('searchProducts')}...">
          </div>
          <div class="col-md-4">
            <select class="form-select" id="productCategory">
              <option value="">${t('category')}: All</option>
              <option value="fertilizer">Fertilizer</option>
              <option value="seeds">Seeds</option>
              <option value="pesticide">Pesticide</option>
              <option value="equipment">Equipment</option>
            </select>
          </div>
          <div class="col-md-2">
            <button class="btn btn-success w-100" onclick="searchProducts()">${t('search')}</button>
          </div>
        </div>
      </div>
    </div>
    <div id="productResults">
      <div class="loading"><div class="spinner"></div></div>
    </div>
  `;

  searchProducts();
}

async function searchProducts() {
  const query = document.getElementById('productSearch').value;
  const category = document.getElementById('productCategory').value;
  
  try {
    const data = await apiCall(`/products/search?q=${query || ''}&category=${category}`);
    const resultsDiv = document.getElementById('productResults');
    
    if (data.success && data.results.length > 0) {
      const productsHTML = data.results.map(item => `
        <div class="card mb-3">
          <div class="card-header">${item.productName}</div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>${t('website')}</th>
                    <th>${t('price')}</th>
                    <th>${t('rating')}</th>
                    <th>${t('buyNow')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${item.options.map(opt => `
                    <tr class="${opt.website === item.bestValue.website ? 'table-success' : ''}">
                      <td>
                        <span class="text-capitalize">${opt.website.replace('_', ' ')}</span>
                        ${opt.website === item.cheapest.website ? '<span class="badge bg-success ms-1">Cheapest</span>' : ''}
                        ${opt.website === item.highestRated.website ? '<span class="badge bg-warning ms-1">Highest Rated</span>' : ''}
                      </td>
                      <td>₹${opt.price}</td>
                      <td><i class="fas fa-star text-warning"></i> ${opt.rating}</td>
                      <td>
                        <a href="${opt.url}" target="_blank" class="btn btn-sm btn-success">${t('buyNow')}</a>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `).join('');

      resultsDiv.innerHTML = productsHTML;
    } else {
      resultsDiv.innerHTML = `<div class="alert alert-info">${t('noData')}</div>`;
    }
  } catch (error) {
    document.getElementById('productResults').innerHTML = `<div class="alert alert-danger">Failed to load products</div>`;
  }
}

function loadWaste() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <h2 class="mb-4">${t('wasteToMoney')}</h2>
    <div class="row">
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">${t('wasteCalculator')}</div>
          <div class="card-body">
            <form id="wasteForm">
              <div class="mb-3">
                <label class="form-label">${t('wasteType')}</label>
                <select class="form-select" id="wasteType" required>
                  <option value="crop_residue">${t('cropResidue')}</option>
                  <option value="vegetable_waste">${t('vegetableWaste')}</option>
                  <option value="animal_waste">${t('animalWaste')}</option>
                  <option value="packaging">${t('packaging')}</option>
                  <option value="other">${t('other')}</option>
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label">${t('quantity')} (${t('quintal')})</label>
                <input type="number" class="form-control" id="wasteQuantity" min="1" required>
              </div>
              <div class="mb-3">
                <label class="form-label">${t('climate')}</label>
                <select class="form-select" id="wasteClimate" required>
                  <option value="sunny">${t('sunny')}</option>
                  <option value="rainy">${t('rainy')}</option>
                  <option value="cloudy">${t('cloudy')}</option>
                  <option value="humid">${t('humid')}</option>
                </select>
              </div>
              <button type="submit" class="btn btn-success w-100">${t('calculate')}</button>
            </form>
          </div>
        </div>
      </div>
      <div class="col-md-6">
        <div class="money-saved-counter mb-4">
          <h5>${t('moneySaved')}</h5>
          <div class="amount">₹<span id="totalSaved">0</span></div>
        </div>
        <div id="wasteResult">
          <div class="alert alert-info">${t('calculate')}...</div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('wasteForm').addEventListener('submit', calculateWasteIncome);
  loadMoneySaved();
}

async function calculateWasteIncome(e) {
  e.preventDefault();
  
  const wasteType = document.getElementById('wasteType').value;
  const quantity = parseFloat(document.getElementById('wasteQuantity').value);
  const climate = document.getElementById('wasteClimate').value;
  const farmerId = currentUser?.farmerId || null;

  try {
    const data = await apiCall('/waste/calc', 'POST', {
      farmerId,
      wasteType,
      quantity,
      climateCondition: climate
    });

    if (data.success) {
      const result = data.result;
      document.getElementById('wasteResult').innerHTML = `
        <div class="card">
          <div class="card-body">
            <h5>${result.bestOption.method} - Best Option</h5>
            <div class="waste-income">₹${result.bestOption.income.toLocaleString()}</div>
            
            <table class="table mt-3">
              <tr>
                <td>${t('compost')}</td>
                <td>₹${result.incomes[0].income.toLocaleString()}</td>
              </tr>
              <tr>
                <td>${t('biogas')}</td>
                <td>₹${result.incomes[1].income.toLocaleString()}</td>
              </tr>
              <tr>
                <td>${t('resale')}</td>
                <td>₹${result.incomes[2].income.toLocaleString()}</td>
              </tr>
            </table>
            
            <h6 class="mt-3">${t('optimizationTips')}:</h6>
            <ul class="text-muted">
              ${result.optimizationSuggestions.map(s => `<li>${s}</li>`).join('')}
            </ul>
            
            <h6 class="mt-3">${t('contactDealer')}:</h6>
            ${result.dealerList.map(d => `
              <div class="dealer-card">
                <strong>${d.name}</strong><br>
                <small>${d.location}</small><br>
                <a href="tel:${d.phone}" class="btn btn-sm btn-success mt-2">${d.phone}</a>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      if (result.moneySaved > 0) {
        loadMoneySaved();
      }
    }
  } catch (error) {
    showToast('Failed to calculate');
  }
}

async function loadMoneySaved() {
  if (currentUser && currentUser.farmerId) {
    try {
      const data = await apiCall(`/waste/history/${currentUser.farmerId}`);
      if (data.success) {
        document.getElementById('totalSaved').textContent = data.summary.totalIncome.toLocaleString();
      }
    } catch (error) {
      console.error('Failed to load money saved');
    }
  }
}

function loadFarmerManagement() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h2>${t('farmerManagement')}</h2>
      <button class="btn btn-success" onclick="showFarmerModal()">
        <i class="fas fa-plus"></i> ${t('addFarmer')}
      </button>
    </div>
    <div class="card">
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-hover" id="farmersTable">
            <thead>
              <tr>
                <th>${t('farmerId')}</th>
                <th>${t('name')}</th>
                <th>${t('village')}</th>
                <th>${t('landArea')}</th>
                <th>${t('soilType')}</th>
                <th>${t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              <tr><td colspan="6" class="text-center"><div class="spinner"></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  loadFarmersList();
}

async function loadFarmersList() {
  try {
    const villageId = currentUser?.villageId;
    const url = villageId ? `/farmers?villageId=${villageId}` : '/farmers';
    const data = await apiCall(url);

    if (data.success) {
      const tbody = document.querySelector('#farmersTable tbody');
      
      if (data.farmers.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center">${t('noData')}</td></tr>`;
        return;
      }

      tbody.innerHTML = data.farmers.map(f => `
        <tr>
          <td><code>${f.farmerId}</code></td>
          <td>${f.name}</td>
          <td>${f.villageId?.villageName || '-'}</td>
          <td>${f.landArea} acres</td>
          <td class="text-capitalize">${f.soilType}</td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="deleteFarmer('${f.farmerId}')">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (error) {
    console.error('Failed to load farmers:', error);
  }
}

function showFarmerModal() {
  new bootstrap.Modal(document.getElementById('farmerModal')).show();
}

async function handleFarmerRegister(e) {
  e.preventDefault();

  const farmerData = {
    name: document.getElementById('farmerName').value,
    villageId: document.getElementById('farmerVillage').value,
    landArea: parseFloat(document.getElementById('farmerLandArea').value),
    soilType: document.getElementById('farmerSoilType').value,
    cropHistory: document.getElementById('farmerCropHistory').value.split(',').map(s => s.trim()).filter(s => s),
    mobile: document.getElementById('farmerMobile').value
  };

  try {
    const data = await apiCall('/farmers/register', 'POST', farmerData);
    
    if (data.success) {
      showToast(`${t('registerSuccess')}: ${data.farmer.farmerId}`);
      bootstrap.Modal.getInstance(document.getElementById('farmerModal')).hide();
      document.getElementById('farmerForm').reset();
      loadFarmersList();
    }
  } catch (error) {
    showToast('Failed to register farmer');
  }
}

async function deleteFarmer(farmerId) {
  if (!confirm('Are you sure?')) return;

  try {
    await apiCall(`/farmers/${farmerId}`, 'DELETE');
    showToast('Farmer deleted');
    loadFarmersList();
  } catch (error) {
    showToast('Failed to delete');
  }
}

function loadAnalytics() {
  const mainContent = document.getElementById('mainContent');
  mainContent.innerHTML = `
    <h2 class="mb-4">${t('analytics')}</h2>
    <div class="loading"><div class="spinner"></div></div>
  `;

  apiCall('/villages/analytics')
    .then(data => {
      if (data.success) {
        const s = data.summary;
        mainContent.innerHTML = `
          <div class="row mb-4">
            <div class="col-md-3">
              <div class="stat-card card">
                <div class="stat-value">${s.totalVillages}</div>
                <div class="stat-label">Villages</div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stat-card card">
                <div class="stat-value">${s.totalFarmers}</div>
                <div class="stat-label">${t('totalFarmers')}</div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stat-card card">
                <div class="stat-value">${s.totalLandArea}</div>
                <div class="stat-label">${t('totalLand')} (acres)</div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="stat-card card">
                <div class="stat-value">₹${s.totalMoneySaved.toLocaleString()}</div>
                <div class="stat-label">${t('totalSaved')}</div>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-header">${t('villagePerformance')}</div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table">
                  <thead>
                    <tr>
                      <th>${t('village')}</th>
                      <th>${t('totalFarmers')}</th>
                      <th>${t('totalLand')}</th>
                      <th>${t('totalSaved')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.analytics.map(a => `
                      <tr>
                        <td>${a.village} (${a.villageCode})</td>
                        <td>${a.farmerCount}</td>
                        <td>${a.totalLand} acres</td>
                        <td>₹${a.totalMoneySaved.toLocaleString()}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
      }
    })
    .catch(error => {
      mainContent.innerHTML = `<div class="alert alert-danger">Failed to load analytics</div>`;
    });
}

async function handleUserLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const data = await apiCall('/auth/login', 'POST', { email, password });
    
    if (data.success) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
      showLoggedInUI();
      showToast(t('loginSuccess'));
    }
  } catch (error) {
    showToast('Login failed');
  }
}

async function handleFarmerLogin(e) {
  e.preventDefault();
  
  const farmerId = document.getElementById('loginFarmerId').value;

  try {
    const data = await apiCall('/auth/login', 'POST', { farmerId });
    
    if (data.success) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
      showLoggedInUI();
      showToast(t('loginSuccess'));
    }
  } catch (error) {
    showToast('Invalid Farmer ID');
  }
}

async function handleSignup(e) {
  e.preventDefault();
  
  const userData = {
    name: document.getElementById('signupName').value,
    email: document.getElementById('signupEmail').value,
    password: document.getElementById('signupPassword').value,
    role: document.getElementById('signupRole').value,
    villageId: document.getElementById('signupVillage').value || null
  };

  try {
    const data = await apiCall('/auth/signup', 'POST', userData);
    
    if (data.success) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      bootstrap.Modal.getInstance(document.getElementById('authModal')).hide();
      showLoggedInUI();
      showToast(t('loginSuccess'));
    }
  } catch (error) {
    showToast('Signup failed');
  }
}

function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showGuestMode();
  showToast(t('logoutSuccess'));
}

function showToast(message) {
  const toast = document.getElementById('toast');
  document.getElementById('toastBody').textContent = message;
  new bootstrap.Toast(toast).show();
}

function toggleVoiceAssistant() {
  const voiceBtn = document.getElementById('voiceBtn');
  
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    showToast('Voice recognition not supported');
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  recognition.lang = currentLang === 'ta' ? 'ta-IN' : currentLang === 'hi' ? 'hi-IN' : currentLang === 'te' ? 'te-IN' : 'en-US';
  recognition.interimResults = false;

  voiceBtn.classList.add('listening');
  showToast(t('voiceListening'));

  recognition.start();

  recognition.onresult = (event) => {
    voiceBtn.classList.remove('listening');
    const transcript = event.results[0][0].transcript.toLowerCase();
    showToast(`Heard: ${transcript}`);
    processVoiceCommand(transcript);
  };

  recognition.onerror = () => {
    voiceBtn.classList.remove('listening');
    showToast(t('voiceError'));
  };

  recognition.onend = () => {
    voiceBtn.classList.remove('listening');
  };
}

function processVoiceCommand(command) {
  if (command.includes('rain') || command.includes('मैदी') || command.includes('மழை') || command.includes(' rain')) {
    loadClimate();
    showToast('Showing weather forecast');
  } else if (command.includes('crop') || command.includes('फसल') || command.includes('பயிர்') || command.includes(' crop')) {
    loadCropAI();
    showToast('Showing crop recommendations');
  } else if (command.includes('market') || command.includes('खरीद') || command.includes('சந்தை') || command.includes(' market')) {
    loadMarket();
    showToast('Showing market');
  } else if (command.includes('waste') || command.includes('कचरा') || command.includes('கழிவு') || command.includes(' waste')) {
    loadWaste();
    showToast('Showing waste calculator');
  } else {
    showToast('Command not recognized. Try: rain, crop, market, or waste');
  }
}

window.loadDashboard = loadDashboard;
window.loadClimate = loadClimate;
window.loadCropAI = loadCropAI;
window.loadMarket = loadMarket;
window.loadWaste = loadWaste;
window.loadFarmerManagement = loadFarmerManagement;
window.loadAnalytics = loadAnalytics;
window.showLoginModal = showLoginModal;
window.showFarmerModal = showFarmerModal;
window.deleteFarmer = deleteFarmer;
window.searchProducts = searchProducts;
window.toggleVoiceAssistant = toggleVoiceAssistant;
