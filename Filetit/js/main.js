const API_BASE_URL = 'https://media2.edu.metropolia.fi/restaurant/api/v1';
const TOKEN_KEY = 'opis-ravintolat-token';
const LOCAL_FAVORITES_KEY = 'opis-ravintolat-favourites';
const UI_STATE_KEY = 'opis-ravintolat-ui-state';
const LANG = 'fi';
const WEEKDAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
const WEEKDAY_LABELS = {
  monday: 'Maanantai',
  tuesday: 'Tiistai',
  wednesday: 'Keskiviikko',
  thursday: 'Torstai',
  friday: 'Perjantai',
};

function loadStoredFavouriteIds() {
  try {
    const storedValue = window.localStorage.getItem(LOCAL_FAVORITES_KEY);

    if (storedValue) {
      const parsedValue = JSON.parse(storedValue);

      if (Array.isArray(parsedValue)) {
        return [...new Set(parsedValue.filter(Boolean))];
      }
    }

    const legacyFavourite = window.localStorage.getItem(
      'opis-ravintolat-local-favourite'
    );

    return legacyFavourite ? [legacyFavourite] : [];
  } catch {
    return [];
  }
}

function saveFavouriteIds(ids) {
  const normalizedIds = [...new Set(ids.filter(Boolean))];

  window.localStorage.setItem(
    LOCAL_FAVORITES_KEY,
    JSON.stringify(normalizedIds)
  );
}

function loadStoredUiState() {
  try {
    const storedValue = window.localStorage.getItem(UI_STATE_KEY);

    if (!storedValue) {
      return {};
    }

    const parsedValue = JSON.parse(storedValue);
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : {};
  } catch {
    return {};
  }
}

function saveUiState(partialState) {
  const currentState = loadStoredUiState();
  const nextState = {
    ...currentState,
    ...partialState,
  };

  window.localStorage.setItem(UI_STATE_KEY, JSON.stringify(nextState));
}

const state = {
  restaurants: [],
  currentUser: null,
  favoriteRestaurantIds: loadStoredFavouriteIds(),
  selectedRestaurantId: '',
  restaurantListExpanded: false,
  mapListExpanded: false,
  city: 'all',
  provider: 'all',
  query: '',
  period: 'day',
  language: LANG,
  geolocation: null,
  menuCache: new Map(),
  activeMenuRequestId: 0,
  loadSource: 'api',
  loadError: '',
  authView: 'login',
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalize(value) {
  return String(value || '')
    .toLocaleLowerCase('fi-FI')
    .trim();
}

function formatDistance(distanceKm) {
  if (!Number.isFinite(distanceKm)) {
    return 'Ei etäisyystietoa';
  }

  return `${distanceKm.toLocaleString('fi-FI', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  })} km`;
}

function getCurrentPageName() {
  const pageName = window.location.pathname.split('/').pop();

  if (!pageName || pageName === 'index.html') {
    return 'etusivu.html';
  }

  return pageName;
}

function getTodayKey() {
  const day = new Date().getDay();

  if (day === 0 || day === 6) {
    return null;
  }

  return WEEKDAY_KEYS[day - 1] || null;
}

function formatWeekDate(dateString) {
  return new Date(dateString).toLocaleDateString('fi-FI', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
  });
}

function buildGoogleMapsUrl(restaurant) {
  const coordinates = restaurant.location?.coordinates;

  if (Array.isArray(coordinates) && coordinates.length === 2) {
    return `https://www.google.com/maps/search/?api=1&query=${coordinates[1]},${coordinates[0]}`;
  }

  const queryParts = [restaurant.name, restaurant.address, restaurant.city]
    .filter(Boolean)
    .join(', ');

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(queryParts)}`;
}

function getFavouriteRestaurantIds() {
  const ids = [...state.favoriteRestaurantIds];

  if (state.currentUser?.favouriteRestaurant) {
    ids.unshift(state.currentUser.favouriteRestaurant);
  }

  return [...new Set(ids.filter(Boolean))];
}

function getPrimaryFavouriteId() {
  return (
    state.currentUser?.favouriteRestaurant ||
    state.favoriteRestaurantIds[0] ||
    ''
  );
}

function isRestaurantFavourite(restaurantId) {
  return getFavouriteRestaurantIds().includes(restaurantId);
}

function persistFavouriteRestaurantIds(restaurantIds) {
  state.favoriteRestaurantIds = [...new Set(restaurantIds.filter(Boolean))];
  saveFavouriteIds(state.favoriteRestaurantIds);
}

function resolveAvatarUrl(avatar) {
  if (!avatar) {
    return '';
  }

  if (/^https?:\/\//i.test(avatar) || avatar.startsWith('data:')) {
    return avatar;
  }

  return `${API_BASE_URL.replace(/\/api\/v1$/, '')}/uploads/${encodeURIComponent(avatar)}`;
}

function getRestaurantId(restaurant) {
  return restaurant._id || restaurant.id;
}

function getCurrentFavouriteId() {
  return getPrimaryFavouriteId();
}

function setStatusMessage(element, message, tone = 'info') {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.dataset.tone = tone;
}

function clearStatusMessage(element) {
  if (!element) {
    return;
  }

  element.textContent = '';
  delete element.dataset.tone;
}

function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

async function apiRequest(path, options = {}) {
  const response = await fetch(apiUrl(path), {
    method: options.method || 'GET',
    headers: {
      ...(options.headers || {}),
      ...(options.authToken
        ? {Authorization: `Bearer ${options.authToken}`}
        : {}),
    },
    body: options.body,
  });

  if (!response.ok) {
    const error = new Error(`API request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }

  return response;
}

async function readJson(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

function buildRestaurantFromApi(restaurant, index) {
  return {
    _id: restaurant._id,
    id: restaurant._id,
    name: restaurant.name,
    city: restaurant.city || 'Tuntematon',
    provider: restaurant.company || 'Tuntematon',
    company: restaurant.company || 'Tuntematon',
    campus: restaurant.city || 'Tuntematon',
    address: restaurant.address || '',
    postalCode: restaurant.postalCode || '',
    phone: restaurant.phone || '',
    location: restaurant.location || null,
    mapX: 12 + (index % 4) * 20,
    mapY: 18 + (index % 5) * 12,
    tags: [restaurant.company, restaurant.city, restaurant.postalCode]
      .filter(Boolean)
      .filter(
        (value, valueIndex, array) => array.indexOf(value) === valueIndex
      ),
    distanceKm: Number.POSITIVE_INFINITY,
    isFallback: false,
  };
}

function assignMapPositions(restaurants) {
  const restaurantsWithCoordinates = restaurants.filter((restaurant) => {
    const coordinates = restaurant.location?.coordinates;
    return Array.isArray(coordinates) && coordinates.length === 2;
  });

  if (restaurantsWithCoordinates.length === 0) {
    return restaurants.map((restaurant, index) => ({
      ...restaurant,
      mapX: restaurant.mapX ?? 12 + (index % 4) * 20,
      mapY: restaurant.mapY ?? 18 + (index % 5) * 12,
    }));
  }

  const longitudes = restaurantsWithCoordinates.map(
    (restaurant) => restaurant.location.coordinates[0]
  );
  const latitudes = restaurantsWithCoordinates.map(
    (restaurant) => restaurant.location.coordinates[1]
  );
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);

  const scale = (value, min, max, outputMin, outputMax) => {
    if (max === min) {
      return (outputMin + outputMax) / 2;
    }

    return outputMin + ((value - min) / (max - min)) * (outputMax - outputMin);
  };

  return restaurants.map((restaurant, index) => {
    const coordinates = restaurant.location?.coordinates;

    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      return {
        ...restaurant,
        mapX: restaurant.mapX ?? 12 + (index % 4) * 20,
        mapY: restaurant.mapY ?? 18 + (index % 5) * 12,
      };
    }

    return {
      ...restaurant,
      mapX: Math.round(
        scale(coordinates[0], minLongitude, maxLongitude, 12, 88)
      ),
      mapY: Math.round(scale(coordinates[1], maxLatitude, minLatitude, 14, 84)),
    };
  });
}

function calculateDistanceKm(firstCoordinates, secondCoordinates) {
  const [firstLongitude, firstLatitude] = firstCoordinates;
  const [secondLongitude, secondLatitude] = secondCoordinates;
  const earthRadiusKm = 6371;
  const toRadians = (value) => (value * Math.PI) / 180;

  const deltaLatitude = toRadians(secondLatitude - firstLatitude);
  const deltaLongitude = toRadians(secondLongitude - firstLongitude);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(toRadians(firstLatitude)) *
      Math.cos(toRadians(secondLatitude)) *
      Math.sin(deltaLongitude / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

function decorateRestaurants(restaurants, userLocation = null) {
  const mapReadyRestaurants = assignMapPositions(restaurants);

  return mapReadyRestaurants.map((restaurant, index) => {
    let distanceKm = restaurant.distanceKm;

    if (userLocation && Array.isArray(restaurant.location?.coordinates)) {
      distanceKm = calculateDistanceKm(
        userLocation,
        restaurant.location.coordinates
      );
    } else if (!Number.isFinite(distanceKm)) {
      distanceKm = index * 0.45 + 0.3;
    }

    return {
      ...restaurant,
      distanceKm,
    };
  });
}

async function detectUserLocation() {
  if (!('geolocation' in navigator)) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve([position.coords.longitude, position.coords.latitude]);
      },
      () => resolve(null),
      {
        enableHighAccuracy: false,
        timeout: 4000,
        maximumAge: 10 * 60 * 1000,
      }
    );
  });
}

async function loadRestaurantsFromApi() {
  const response = await apiRequest('/restaurants');
  const payload = await readJson(response);
  const sourceRestaurants = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.restaurants)
      ? payload.restaurants
      : [];
  const restaurants = sourceRestaurants.map((restaurant, index) =>
    buildRestaurantFromApi(restaurant, index)
  );

  return restaurants;
}

async function loadRestaurants() {
  try {
    const apiRestaurants = await loadRestaurantsFromApi();

    if (apiRestaurants.length === 0) {
      throw new Error('No restaurants returned from API');
    }

    state.loadSource = 'live';
    state.loadError = '';
    return apiRestaurants;
  } catch (error) {
    state.loadSource = 'error';
    state.loadError = 'Ravintoladataa ei saatu ladattua.';
    console.error('Restaurant API load failed.', error);
    return [];
  }
}

async function loadCurrentUserFromToken() {
  const token = window.localStorage.getItem(TOKEN_KEY);

  if (!token) {
    return null;
  }

  try {
    const response = await apiRequest('/users/token', {
      authToken: token,
    });
    const user = await readJson(response);
    return {
      ...user,
      token,
    };
  } catch {
    window.localStorage.removeItem(TOKEN_KEY);
    return null;
  }
}

async function loginUser(username, password) {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({username, password}),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const payload = await readJson(response);

  if (payload.token) {
    window.localStorage.setItem(TOKEN_KEY, payload.token);
  }

  return {
    ...payload.data,
    token: payload.token,
  };
}

async function registerUser(username, email, password) {
  const response = await apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify({username, email, password}),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return readJson(response);
}

async function updateCurrentUser(payload) {
  const response = await apiRequest('/users', {
    method: 'PUT',
    authToken: state.currentUser?.token,
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return readJson(response);
}

async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await apiRequest('/users/avatar', {
    method: 'POST',
    authToken: state.currentUser?.token,
    body: formData,
  });

  return readJson(response);
}

async function deleteCurrentUser() {
  const response = await apiRequest('/users', {
    method: 'DELETE',
    authToken: state.currentUser?.token,
  });

  return readJson(response);
}

async function checkUsernameAvailability(username) {
  const response = await apiRequest(
    `/users/available/${encodeURIComponent(username)}`
  );

  return readJson(response);
}

async function loadMenuFromApi(restaurantId, period) {
  const endpoint =
    period === 'day'
      ? `/restaurants/daily/${encodeURIComponent(restaurantId)}/${LANG}`
      : `/restaurants/weekly/${encodeURIComponent(restaurantId)}/${LANG}`;

  const response = await apiRequest(endpoint);
  return readJson(response);
}

async function loadRestaurantMenu(restaurant, period) {
  const cacheKey = `${restaurant.id}:${period}:${LANG}`;

  if (state.menuCache.has(cacheKey)) {
    return state.menuCache.get(cacheKey);
  }

  let menuData;

  try {
    menuData = await loadMenuFromApi(restaurant.id, period);
  } catch (error) {
    console.error(`Menu load failed for ${restaurant.id}.`, error);
    menuData = period === 'day' ? {courses: []} : {days: []};
  }

  state.menuCache.set(cacheKey, menuData);
  return menuData;
}

function getRestaurantById(restaurantId) {
  return state.restaurants.find((restaurant) => restaurant.id === restaurantId);
}

function getFilteredRestaurants() {
  const searchQuery = normalize(state.query);

  return state.restaurants.filter((restaurant) => {
    const searchableText = [
      restaurant.name,
      restaurant.city,
      restaurant.provider,
      restaurant.campus,
      restaurant.address,
      restaurant.postalCode,
      restaurant.tags.join(' '),
    ]
      .join(' ')
      .toLocaleLowerCase('fi-FI');

    const matchesQuery =
      searchQuery === '' || searchableText.includes(searchQuery);
    const matchesCity = state.city === 'all' || restaurant.city === state.city;
    const matchesProvider =
      state.provider === 'all' || restaurant.provider === state.provider;

    return matchesQuery && matchesCity && matchesProvider;
  });
}

function getSortedRestaurants(restaurants) {
  const favouriteIds = new Set(getFavouriteRestaurantIds());

  return [...restaurants].sort((firstRestaurant, secondRestaurant) => {
    const firstIsFavourite = favouriteIds.has(getRestaurantId(firstRestaurant));
    const secondIsFavourite = favouriteIds.has(
      getRestaurantId(secondRestaurant)
    );

    if (firstIsFavourite && !secondIsFavourite) {
      return -1;
    }

    if (secondIsFavourite && !firstIsFavourite) {
      return 1;
    }

    const distanceDifference =
      (firstRestaurant.distanceKm ?? Number.POSITIVE_INFINITY) -
      (secondRestaurant.distanceKm ?? Number.POSITIVE_INFINITY);

    if (distanceDifference !== 0) {
      return distanceDifference;
    }

    return firstRestaurant.name.localeCompare(secondRestaurant.name, 'fi');
  });
}

function setActiveNavigation() {
  const currentPage = getCurrentPageName();

  document.querySelectorAll('[data-nav-link]').forEach((link) => {
    const isActive = link.getAttribute('href') === currentPage;
    link.classList.toggle('is-active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function populateSelect(selectElement, items, allLabel, selectedValue = 'all') {
  if (!selectElement) {
    return;
  }

  const options = [
    `<option value="all">${escapeHtml(allLabel)}</option>`,
    ...items.map(
      (item) =>
        `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`
    ),
  ];

  selectElement.innerHTML = options.join('');
  selectElement.value = selectedValue;
}

function populateFavouriteSelect(selectElement) {
  if (!selectElement) {
    return;
  }

  const favouriteId = getCurrentFavouriteId();

  selectElement.innerHTML = [
    '<option value="">Valitse ravintola</option>',
    ...getSortedRestaurants(state.restaurants).map(
      (restaurant) =>
        `<option value="${escapeHtml(restaurant.id)}">${escapeHtml(restaurant.name)} · ${escapeHtml(restaurant.city)}</option>`
    ),
  ].join('');

  selectElement.value = favouriteId || '';
}

function persistCurrentUiState() {
  saveUiState({
    selectedRestaurantId: state.selectedRestaurantId,
    city: state.city,
    provider: state.provider,
    query: state.query,
    period: state.period,
  });
}

function renderPeriodButtons() {
  document.querySelectorAll('[data-period]').forEach((button) => {
    const isSelected = button.dataset.period === state.period;
    button.classList.toggle('is-active', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });
}

function renderRestaurantList() {
  const restaurantsList = document.getElementById('restaurant-list');

  if (!restaurantsList) {
    return;
  }

  const filteredRestaurants = getSortedRestaurants(getFilteredRestaurants());
  const selectedRestaurantId = state.selectedRestaurantId;
  const visibleRestaurants = state.restaurantListExpanded
    ? filteredRestaurants
    : filteredRestaurants.slice(0, 8);
  const hasMoreRestaurants =
    visibleRestaurants.length < filteredRestaurants.length;

  if (filteredRestaurants.length === 0) {
    restaurantsList.innerHTML = `
      <div class="empty-state">
        <h4>Ravintoloita ei löydy</h4>
      </div>
    `;
    return;
  }

  restaurantsList.innerHTML = visibleRestaurants
    .map((restaurant) => {
      const restaurantId = getRestaurantId(restaurant);
      const isSelected = restaurantId === selectedRestaurantId;
      const isFavourite = isRestaurantFavourite(restaurantId);
      const tagMarkup = (restaurant.tags || [])
        .map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`)
        .join('');
      const mapsUrl = buildGoogleMapsUrl(restaurant);

      return `
        <article class="restaurant-card ${isSelected ? 'is-active' : ''} ${isFavourite ? 'is-favorite' : ''}" data-restaurant-id="${escapeHtml(restaurantId)}">
          <button type="button" class="restaurant-card__select" data-select-restaurant="${escapeHtml(restaurantId)}">
            <div class="restaurant-card__header">
              <div>
                <p class="eyebrow">${escapeHtml(restaurant.provider)}</p>
                <h4>${escapeHtml(restaurant.name)}</h4>
              </div>
              <span class="pill">${escapeHtml(restaurant.city)}</span>
            </div>
            <p class="restaurant-card__meta">${escapeHtml(restaurant.address || restaurant.campus || '')}</p>
            <p class="restaurant-card__meta">${escapeHtml(restaurant.postalCode || '')} ${escapeHtml(restaurant.phone || '')}</p>
            <p class="restaurant-card__distance">Etäisyys: ${escapeHtml(formatDistance(restaurant.distanceKm))}</p>
            <div class="tag-row">${tagMarkup}</div>
          </button>
          <div class="restaurant-card__actions button-row">
            <button type="button" class="button button--ghost button--small" data-open-maps="${escapeHtml(mapsUrl)}">
              Näytä kartassa
            </button>
            <button type="button" class="button button--secondary button--small ${isFavourite ? 'is-active' : ''}" data-favourite-restaurant="${escapeHtml(restaurantId)}" data-favourite-active="${String(isFavourite)}">
              ${isFavourite ? 'Suosikki' : 'Aseta suosikiksi'}
            </button>
          </div>
        </article>
      `;
    })
    .join('');

  if (hasMoreRestaurants) {
    restaurantsList.insertAdjacentHTML(
      'beforeend',
      `
        <button type="button" class="button button--ghost show-more-button" data-show-more-restaurants>
          Näytä lisää
        </button>
      `
    );
  }

  restaurantsList
    .querySelectorAll('[data-select-restaurant]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        state.selectedRestaurantId = button.dataset.selectRestaurant || '';
        persistCurrentUiState();
        void renderDiningApp();
      });
    });

  restaurantsList
    .querySelectorAll('[data-favourite-restaurant]')
    .forEach((button) => {
      button.addEventListener('click', async () => {
        const restaurantId = button.dataset.favouriteRestaurant || '';
        const isActive = button.dataset.favouriteActive === 'true';

        if (isActive) {
          await setFavouriteRestaurant(restaurantId);
        } else {
          await setPrimaryFavouriteRestaurant(restaurantId);
        }
      });
    });

  restaurantsList.querySelectorAll('[data-open-maps]').forEach((button) => {
    button.addEventListener('click', () => {
      const mapsUrl = button.dataset.openMaps || '';

      if (mapsUrl) {
        window.open(mapsUrl, '_blank', 'noopener,noreferrer');
      }
    });
  });

  const showMoreButton = restaurantsList.querySelector(
    '[data-show-more-restaurants]'
  );

  if (showMoreButton) {
    showMoreButton.addEventListener('click', () => {
      state.restaurantListExpanded = true;
      void renderDiningApp();
    });
  }
}

function renderSelectedRestaurantInfo(infoElement, restaurant) {
  if (!infoElement || !restaurant) {
    return;
  }

  infoElement.innerHTML = `
    <p>${escapeHtml(restaurant.city)} · ${escapeHtml(restaurant.provider)} · ${escapeHtml(restaurant.campus)}</p>
    <p>${escapeHtml(restaurant.address || '')}</p>
    <p>${escapeHtml(formatDistance(restaurant.distanceKm))} päässä · ${escapeHtml(restaurant.postalCode || '')}</p>
    ${restaurant.phone ? `<p>${escapeHtml(restaurant.phone)}</p>` : ''}
    <div class="tag-row">${(restaurant.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}</div>
  `;
}

function renderMenuMarkup(menuData, restaurant, period) {
  if (period === 'day') {
    const courses = Array.isArray(menuData.courses) ? menuData.courses : [];
    const todayKey = getTodayKey();
    const dayLabel = todayKey ? WEEKDAY_LABELS[todayKey] : 'Tänään';

    if (courses.length === 0) {
      return `
        <article class="menu-card menu-card--highlight">
          <div class="menu-card__header">
            <div>
              <p class="eyebrow">Päivän ruokalista</p>
              <h4>${escapeHtml(dayLabel)}</h4>
            </div>
            <span class="pill pill--accent">Ei listaa</span>
          </div>
        </article>
      `;
    }

    return `
      <article class="menu-card menu-card--highlight">
        <div class="menu-card__header">
          <div>
            <p class="eyebrow">Päivän ruokalista</p>
            <h4>${escapeHtml(dayLabel)}</h4>
          </div>
          <span class="pill pill--accent">Päivän näkymä</span>
        </div>
        <ul class="menu-list">
          ${courses
            .map(
              (course) => `
                <li class="menu-item">
                  <div>
                    <strong>${escapeHtml(course.name)}</strong>
                    ${course.diets ? `<span>${escapeHtml(course.diets)}</span>` : ''}
                  </div>
                  ${course.price ? `<span>${escapeHtml(course.price)}</span>` : ''}
                </li>
              `
            )
            .join('')}
        </ul>
      </article>
    `;
  }

  const days = Array.isArray(menuData.days) ? menuData.days : [];

  if (days.length === 0) {
    return `
      <div class="empty-state">
        <h4>Viikkonäkymää ei löytynyt</h4>
        <p>Valitulle ravintolalle ei löytynyt viikkoruokalistaa.</p>
      </div>
    `;
  }

  return `
    <div class="menu-grid">
      ${days
        .map((day) => {
          const dayDate = day.date ? formatWeekDate(day.date) : 'Viikon päivä';
          const courses = Array.isArray(day.courses) ? day.courses : [];
          const todayKey = getTodayKey();
          const isToday = todayKey
            ? dayDate
                .toLowerCase()
                .includes(WEEKDAY_LABELS[todayKey].toLowerCase())
            : false;

          return `
            <article class="menu-card ${isToday ? 'is-today' : ''}">
              <div class="menu-card__header">
                <div>
                  <p class="eyebrow">${escapeHtml(dayDate)}</p>
                  <h4>Viikon lista</h4>
                </div>
                ${isToday ? '<span class="pill pill--accent">Tänään</span>' : ''}
              </div>
              <ul class="menu-list">
                ${courses
                  .map(
                    (course) => `
                      <li class="menu-item">
                        <div>
                          <strong>${escapeHtml(course.name)}</strong>
                          ${course.diets ? `<span>${escapeHtml(course.diets)}</span>` : ''}
                        </div>
                        ${course.price ? `<span>${escapeHtml(course.price)}</span>` : ''}
                      </li>
                    `
                  )
                  .join('')}
              </ul>
            </article>
          `;
        })
        .join('')}
    </div>
  `;
}

async function renderMenuSection(menuPanel, restaurant) {
  if (!menuPanel || !restaurant) {
    return;
  }

  const requestId = ++state.activeMenuRequestId;
  menuPanel.innerHTML = `
    <div class="loading-surface">
      <div class="loading-surface__bar"></div>
      <p>Haetaan ruokalistaa API:sta...</p>
    </div>
  `;

  const menuData = await loadRestaurantMenu(restaurant, state.period);

  if (requestId !== state.activeMenuRequestId) {
    return;
  }

  menuPanel.innerHTML = renderMenuMarkup(menuData, restaurant, state.period);
}

function renderSelectedRestaurantName(nameElement, restaurant) {
  if (!nameElement || !restaurant) {
    return;
  }

  nameElement.textContent = restaurant.name;
}

async function renderDiningApp() {
  const restaurantsList = document.getElementById('restaurant-list');
  const menuPanel = document.getElementById('menu-panel');
  const restaurantCount = document.getElementById('restaurant-count');
  const selectedName = document.getElementById('selected-restaurant-name');
  const selectedInfo = document.getElementById('selected-restaurant-info');
  const filteredRestaurants = getSortedRestaurants(getFilteredRestaurants());

  if (!restaurantsList || !menuPanel) {
    return;
  }

  if (filteredRestaurants.length === 0) {
    restaurantsList.innerHTML = `
      <div class="empty-state">
        <h4>Ei ravintoloita</h4>
      </div>
    `;
    menuPanel.innerHTML = `
      <div class="empty-state">
        <h4>Valitse ravintola</h4>
      </div>
    `;
    if (restaurantCount) {
      restaurantCount.textContent = '0';
    }
    if (selectedName) {
      selectedName.textContent = '-';
    }
    if (selectedInfo) {
      selectedInfo.innerHTML = '';
    }
    return;
  }

  const favouriteId = getCurrentFavouriteId();
  const selectedRestaurant =
    filteredRestaurants.find(
      (restaurant) => getRestaurantId(restaurant) === state.selectedRestaurantId
    ) ||
    filteredRestaurants.find(
      (restaurant) => getRestaurantId(restaurant) === favouriteId
    ) ||
    filteredRestaurants[0];

  state.selectedRestaurantId = getRestaurantId(selectedRestaurant);
  persistCurrentUiState();

  renderPeriodButtons();
  renderRestaurantList();
  renderSelectedRestaurantName(selectedName, selectedRestaurant);
  renderSelectedRestaurantInfo(selectedInfo, selectedRestaurant);
  if (restaurantCount) {
    restaurantCount.textContent = String(filteredRestaurants.length);
  }

  await renderMenuSection(menuPanel, selectedRestaurant);
}

async function renderFeaturedRestaurants() {
  const featuredContainer = document.getElementById('featured-restaurants');

  if (!featuredContainer) {
    return;
  }

  const sortedRestaurants = getSortedRestaurants(state.restaurants);
  const selectedRestaurant = sortedRestaurants.find(
    (restaurant) => getRestaurantId(restaurant) === state.selectedRestaurantId
  );
  const restaurants = [
    ...(selectedRestaurant ? [selectedRestaurant] : []),
    ...sortedRestaurants.filter(
      (restaurant) => getRestaurantId(restaurant) !== state.selectedRestaurantId
    ),
  ].slice(0, 3);

  if (restaurants.length === 0) {
    featuredContainer.innerHTML = `
      <div class="empty-state">
        <h4>Ei ravintoloita</h4>
      </div>
    `;
    return;
  }

  featuredContainer.innerHTML = restaurants
    .map(
      () => `
        <article class="feature-card feature-card--restaurant loading-surface">
          <div class="loading-surface__bar"></div>
          <p>Ladataan ravintoloita...</p>
        </article>
      `
    )
    .join('');

  const cards = await Promise.all(
    restaurants.map(async (restaurant) => {
      const menuData = await loadRestaurantMenu(restaurant, 'day');
      const courses = Array.isArray(menuData.courses) ? menuData.courses : [];

      return `
        <button type="button" class="feature-card feature-card--restaurant featured-card-button" data-featured-restaurant="${escapeHtml(getRestaurantId(restaurant))}">
          <p class="eyebrow">${escapeHtml(restaurant.city)} · ${escapeHtml(restaurant.provider)}</p>
          <h3>${escapeHtml(restaurant.name)}</h3>
          <p>${escapeHtml(restaurant.campus || restaurant.address || '')} · ${escapeHtml(formatDistance(restaurant.distanceKm))}</p>
          <ul class="mini-list">
            ${courses
              .slice(0, 3)
              .map((course) => `<li>${escapeHtml(course.name)}</li>`)
              .join('')}
          </ul>
        </button>
      `;
    })
  );

  featuredContainer.innerHTML = cards.join('');

  featuredContainer
    .querySelectorAll('[data-featured-restaurant]')
    .forEach((button) => {
      button.addEventListener('click', () => {
        state.selectedRestaurantId = button.dataset.featuredRestaurant || '';
        persistCurrentUiState();
        window.location.href = 'ravintolat.html';
      });
    });
}

function getMapLabel(restaurant, isFavorite, isSelected) {
  return `
    <button
      type="button"
      class="map-pin ${isSelected ? 'is-selected' : ''} ${isFavorite ? 'is-favorite' : ''}"
      style="left: ${restaurant.mapX}%; top: ${restaurant.mapY}%;"
      data-map-restaurant="${escapeHtml(getRestaurantId(restaurant))}"
    >
      <span class="map-pin__dot"></span>
      <span class="map-pin__label">${escapeHtml(restaurant.name)}</span>
    </button>
  `;
}

function renderMapView() {
  const mapPins = document.getElementById('map-pins');
  const nearestRestaurant = document.getElementById('nearest-restaurant');
  const mapList = document.getElementById('map-list');

  if (!mapPins || !nearestRestaurant || !mapList) {
    return;
  }

  const restaurants = getSortedRestaurants(state.restaurants);
  const visibleRestaurants = state.mapListExpanded
    ? restaurants
    : restaurants.slice(0, 8);
  const hasMoreRestaurants = visibleRestaurants.length < restaurants.length;

  if (restaurants.length === 0) {
    mapPins.innerHTML = '';
    nearestRestaurant.innerHTML = '<p>Ravintoloita ei löytynyt.</p>';
    mapList.innerHTML = '';
    return;
  }

  const closestRestaurant = restaurants[0];

  mapPins.innerHTML = restaurants
    .map((restaurant) =>
      getMapLabel(
        restaurant,
        isRestaurantFavourite(getRestaurantId(restaurant)),
        getRestaurantId(restaurant) === closestRestaurant.id
      )
    )
    .join('');

  mapList.innerHTML = visibleRestaurants
    .map(
      (restaurant) => `
        <button type="button" class="map-list-item ${isRestaurantFavourite(getRestaurantId(restaurant)) ? 'is-favorite' : ''}" data-map-restaurant="${escapeHtml(getRestaurantId(restaurant))}">
          <span>
            <strong>${escapeHtml(restaurant.name)}</strong>
            <span>${escapeHtml(restaurant.city)} · ${escapeHtml(restaurant.provider)}</span>
          </span>
          <span>${escapeHtml(formatDistance(restaurant.distanceKm))}</span>
        </button>
      `
    )
    .join('');

  if (hasMoreRestaurants) {
    mapList.insertAdjacentHTML(
      'beforeend',
      `
        <button type="button" class="button button--ghost show-more-button" data-show-more-map>
          Näytä lisää
        </button>
      `
    );
  }

  nearestRestaurant.innerHTML = `
    <h4>${escapeHtml(closestRestaurant.name)}</h4>
    <p>${escapeHtml(closestRestaurant.city)} · ${escapeHtml(closestRestaurant.provider)}</p>
    <p>${escapeHtml(closestRestaurant.campus || closestRestaurant.address || '')}</p>
    <p>${escapeHtml(formatDistance(closestRestaurant.distanceKm))}</p>
    <div class="tag-row">
      ${(closestRestaurant.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
    </div>
    <p class="field-help">${state.geolocation ? 'Lähin ravintola perustuu sijaintiisi.' : 'Lähin ravintola perustuu ravintoloiden sijaintitietoihin.'}</p>
  `;

  mapPins.querySelectorAll('[data-map-restaurant]').forEach((button) => {
    button.addEventListener('click', async () => {
      state.selectedRestaurantId = button.dataset.mapRestaurant || '';
      persistCurrentUiState();
      await renderDiningApp();
      renderMapView();
    });
  });

  mapList.querySelectorAll('[data-map-restaurant]').forEach((button) => {
    button.addEventListener('click', async () => {
      state.selectedRestaurantId = button.dataset.mapRestaurant || '';
      persistCurrentUiState();
      await renderDiningApp();
      renderMapView();
    });
  });

  const showMoreButton = mapList.querySelector('[data-show-more-map]');

  if (showMoreButton) {
    showMoreButton.addEventListener('click', () => {
      state.mapListExpanded = true;
      renderMapView();
    });
  }
}

function renderAuthPanel() {
  const authStatus = document.getElementById('auth-status');
  const currentUserName = document.getElementById('current-user-name');
  const currentUserMeta = document.getElementById('current-user-meta');
  const currentUserFavourite = document.getElementById(
    'current-user-favourite'
  );
  const currentUserAvatar = document.getElementById('current-user-avatar');
  const userSummary = document.querySelector('.user-summary');
  const profileForm = document.getElementById('profile-form');
  const avatarForm = document.getElementById('avatar-form');
  const logoutButton = document.getElementById('logout-button');
  const deleteButton = document.getElementById('delete-account-button');
  const favouriteSelect = document.getElementById(
    'favourite-restaurant-select'
  );
  const authGrid = document.querySelector('.auth-grid');

  populateFavouriteSelect(favouriteSelect);

  if (state.currentUser) {
    const favouriteRestaurant = getRestaurantById(
      state.currentUser.favouriteRestaurant
    );
    const favouriteLabel = favouriteRestaurant
      ? `${favouriteRestaurant.name} · ${favouriteRestaurant.city}`
      : 'Ei valittua suosikkia';
    const initials = state.currentUser.username
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    state.authView = 'profile';

    const authGate = document.getElementById('auth-gate');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (authGate) {
      authGate.hidden = true;
    }

    if (authGrid) {
      authGrid.hidden = true;
    }

    if (loginForm) {
      loginForm.hidden = true;
    }

    if (registerForm) {
      registerForm.hidden = true;
    }

    if (userSummary) {
      userSummary.hidden = false;
    }

    if (profileForm) {
      profileForm.hidden = false;
    }

    if (avatarForm) {
      avatarForm.hidden = false;
    }

    if (deleteButton) {
      deleteButton.hidden = false;
    }

    if (currentUserName) {
      currentUserName.textContent = state.currentUser.username;
    }

    if (currentUserMeta) {
      currentUserMeta.textContent =
        state.currentUser.email || 'Kirjautuneena palveluun';
    }

    if (currentUserFavourite) {
      currentUserFavourite.textContent = `Suosikki: ${favouriteLabel}`;
    }

    if (currentUserAvatar) {
      currentUserAvatar.innerHTML = '';
      const avatarValue = state.currentUser.avatar || '';
      const resolvedAvatar = resolveAvatarUrl(avatarValue);

      if (resolvedAvatar) {
        const image = document.createElement('img');
        image.alt = state.currentUser.username;
        image.src = resolvedAvatar;
        image.addEventListener('error', () => {
          currentUserAvatar.textContent = initials || 'OR';
        });
        currentUserAvatar.appendChild(image);
      } else {
        currentUserAvatar.textContent = initials || 'OR';
      }
    }

    if (profileForm) {
      profileForm.querySelectorAll('input, select, button').forEach((field) => {
        field.disabled = false;
      });
    }

    if (avatarForm) {
      avatarForm.querySelectorAll('input, button').forEach((field) => {
        field.disabled = false;
      });
    }

    if (logoutButton) {
      logoutButton.disabled = false;
    }

    if (deleteButton) {
      deleteButton.disabled = false;
    }

    if (favouriteSelect) {
      favouriteSelect.value = state.currentUser.favouriteRestaurant || '';
    }

    setStatusMessage(
      authStatus,
      `Kirjautunut käyttäjä: ${state.currentUser.username}`,
      'success'
    );
    return;
  }

  state.authView = state.authView === 'register' ? 'register' : 'login';

  const authGate = document.getElementById('auth-gate');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');

  if (authGate) {
    authGate.hidden = false;
  }

  if (authGrid) {
    authGrid.hidden = false;
  }

  if (loginForm) {
    loginForm.hidden = state.authView !== 'login';
  }

  if (registerForm) {
    registerForm.hidden = state.authView !== 'register';
  }

  if (userSummary) {
    userSummary.hidden = true;
  }

  if (profileForm) {
    profileForm.hidden = true;
  }

  if (avatarForm) {
    avatarForm.hidden = true;
  }

  if (deleteButton) {
    deleteButton.hidden = true;
  }

  if (currentUserName) {
    currentUserName.textContent = 'Ei kirjautumista';
  }

  if (currentUserMeta) {
    currentUserMeta.textContent =
      'Kirjaudu sisään, niin voit hallita suosikkiravintolaa ja profiiliasi.';
  }

  if (currentUserFavourite) {
    currentUserFavourite.textContent =
      'Suosikit: paikallinen valinta tai ei vielä valittu';
  }

  if (currentUserAvatar) {
    currentUserAvatar.textContent = 'OR';
  }

  if (profileForm) {
    profileForm.querySelectorAll('input, select, button').forEach((field) => {
      field.disabled = true;
    });
  }

  if (avatarForm) {
    avatarForm.querySelectorAll('input, button').forEach((field) => {
      field.disabled = true;
    });
  }

  if (logoutButton) {
    logoutButton.disabled = true;
  }

  if (deleteButton) {
    deleteButton.disabled = true;
  }

  if (favouriteSelect) {
    favouriteSelect.value = getCurrentFavouriteId();
  }

  setStatusMessage(
    authStatus,
    'Kirjaudu sisään tai rekisteröidy hallitaksesi omaa tiliä.',
    'info'
  );
}

async function setFavouriteRestaurant(restaurantId, options = {}) {
  if (!restaurantId) {
    return;
  }

  const restaurant = getRestaurantById(restaurantId);

  if (!restaurant) {
    return;
  }

  const isPrimarySet = options.mode === 'primary';
  const favoriteIds = new Set(getFavouriteRestaurantIds());
  const wasFavourite = favoriteIds.has(restaurantId);

  if (isPrimarySet) {
    favoriteIds.add(restaurantId);
  } else if (wasFavourite) {
    favoriteIds.delete(restaurantId);
  } else {
    favoriteIds.add(restaurantId);
  }

  persistFavouriteRestaurantIds([...favoriteIds]);

  if (state.currentUser) {
    let nextPrimaryId = getPrimaryFavouriteId();

    if (isPrimarySet) {
      nextPrimaryId = restaurantId;
    } else if (wasFavourite && nextPrimaryId === restaurantId) {
      nextPrimaryId = [...favoriteIds][0] || '';
    }

    const updatedUser = await updateCurrentUser({
      username: state.currentUser.username,
      email: state.currentUser.email,
      favouriteRestaurant: nextPrimaryId,
      avatar: state.currentUser.avatar,
    });

    state.currentUser = {
      ...state.currentUser,
      ...updatedUser.data,
      token: state.currentUser.token,
    };
  }

  renderAuthPanel();
  await renderDiningApp();
  renderMapView();
  await renderFeaturedRestaurants();
}

async function setPrimaryFavouriteRestaurant(restaurantId) {
  if (!restaurantId) {
    return;
  }

  const restaurant = getRestaurantById(restaurantId);

  if (!restaurant) {
    return;
  }

  const favoriteIds = new Set(getFavouriteRestaurantIds());
  favoriteIds.add(restaurantId);
  persistFavouriteRestaurantIds([...favoriteIds]);

  if (state.currentUser) {
    const updatedUser = await updateCurrentUser({
      username: state.currentUser.username,
      email: state.currentUser.email,
      favouriteRestaurant: restaurantId,
      avatar: state.currentUser.avatar,
    });

    state.currentUser = {
      ...state.currentUser,
      ...updatedUser.data,
      token: state.currentUser.token,
    };
  }

  renderAuthPanel();
  await renderDiningApp();
  renderMapView();
  await renderFeaturedRestaurants();
}

function setupRestaurantFilters() {
  const searchInput = document.getElementById('restaurant-search');
  const cityFilter = document.getElementById('city-filter');
  const providerFilter = document.getElementById('provider-filter');
  const periodButtons = document.querySelectorAll('[data-period]');

  if (!searchInput || !cityFilter || !providerFilter) {
    return;
  }

  searchInput.value = state.query;
  searchInput.addEventListener('input', async (event) => {
    state.query = normalize(event.target.value);
    persistCurrentUiState();
    await renderDiningApp();
  });

  cityFilter.addEventListener('change', async (event) => {
    state.city = event.target.value;
    state.restaurantListExpanded = false;
    persistCurrentUiState();
    await renderDiningApp();
  });

  providerFilter.addEventListener('change', async (event) => {
    state.provider = event.target.value;
    state.restaurantListExpanded = false;
    persistCurrentUiState();
    await renderDiningApp();
  });

  periodButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      state.period = button.dataset.period || 'day';
      persistCurrentUiState();
      await renderDiningApp();
    });
  });
}

function setupContactForm() {
  const contactButton = document.getElementById('contact-send-button');
  const status = document.getElementById('contact-status');

  if (!contactButton) {
    return;
  }

  contactButton.addEventListener('click', () => {
    setStatusMessage(status, 'Viestiä ei vielä lähetetä.', 'info');
  });
}

function setupAuthForms() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const profileForm = document.getElementById('profile-form');
  const avatarForm = document.getElementById('avatar-form');
  const logoutButton = document.getElementById('logout-button');
  const deleteButton = document.getElementById('delete-account-button');
  const authStatus = document.getElementById('auth-status');
  const usernameAvailability = document.getElementById('username-availability');
  const usernameCheckButton = document.getElementById('username-check-button');
  const favouriteSelect = document.getElementById(
    'favourite-restaurant-select'
  );
  const showRegisterButton = document.getElementById('show-register-button');
  const showLoginButton = document.getElementById('show-login-button');

  if (showRegisterButton) {
    showRegisterButton.addEventListener('click', () => {
      state.authView = 'register';
      renderAuthPanel();
    });
  }

  if (showLoginButton) {
    showLoginButton.addEventListener('click', () => {
      state.authView = 'login';
      renderAuthPanel();
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearStatusMessage(authStatus);

      if (state.currentUser) {
        setStatusMessage(authStatus, 'Olet jo kirjautunut sisään.', 'info');
        return;
      }

      const formData = new FormData(loginForm);
      const username = String(formData.get('username') || '').trim();
      const password = String(formData.get('password') || '').trim();

      try {
        state.currentUser = await loginUser(username, password);
        state.authView = 'profile';
        setStatusMessage(authStatus, 'Kirjautuminen onnistui.', 'success');
        loginForm.reset();
        renderAuthPanel();
        await renderDiningApp();
        renderMapView();
        await renderFeaturedRestaurants();
      } catch {
        setStatusMessage(
          authStatus,
          'Kirjautuminen epäonnistui. Tarkista tiedot.',
          'error'
        );
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearStatusMessage(authStatus);

      const formData = new FormData(registerForm);
      const username = String(formData.get('username') || '').trim();
      const email = String(formData.get('email') || '').trim();
      const password = String(formData.get('password') || '').trim();

      try {
        const result = await registerUser(username, email, password);
        const activationMessage = result?.data?.activationUrl
          ? `Rekisteröinti onnistui. Aktivointilinkki: ${result.data.activationUrl}`
          : 'Rekisteröinti onnistui.';
        setStatusMessage(authStatus, activationMessage, 'success');
        registerForm.reset();
        state.authView = 'login';
        renderAuthPanel();
      } catch {
        setStatusMessage(authStatus, 'Rekisteröinti epäonnistui.', 'error');
      }
    });
  }

  if (usernameCheckButton) {
    usernameCheckButton.addEventListener('click', async () => {
      const registerUsername = document.getElementById('register-username');

      if (!registerUsername || !usernameAvailability) {
        return;
      }

      const username = String(registerUsername.value || '').trim();

      if (!username) {
        setStatusMessage(
          usernameAvailability,
          'Anna käyttäjänimi ensin.',
          'error'
        );
        return;
      }

      try {
        const result = await checkUsernameAvailability(username);
        setStatusMessage(
          usernameAvailability,
          result.available
            ? 'Käyttäjänimi on vapaa.'
            : 'Käyttäjänimi on varattu.',
          result.available ? 'success' : 'error'
        );
      } catch {
        setStatusMessage(
          usernameAvailability,
          'Käyttäjänimen tarkistus epäonnistui.',
          'error'
        );
      }
    });
  }

  if (profileForm) {
    profileForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearStatusMessage(authStatus);

      if (!state.currentUser) {
        setStatusMessage(
          authStatus,
          'Kirjaudu sisään ennen profiilin päivitystä.',
          'error'
        );
        return;
      }

      const formData = new FormData(profileForm);
      const username = String(formData.get('username') || '').trim();
      const email = String(formData.get('email') || '').trim();
      const password = String(formData.get('password') || '').trim();
      const favouriteRestaurant = String(
        formData.get('favouriteRestaurant') || ''
      ).trim();
      const payload = {
        username,
        email,
        favouriteRestaurant: favouriteRestaurant || undefined,
        avatar: state.currentUser.avatar,
      };

      if (password) {
        payload.password = password;
      }

      try {
        const result = await updateCurrentUser(payload);
        state.currentUser = {
          ...state.currentUser,
          ...result.data,
          token: state.currentUser.token,
        };

        if (favouriteRestaurant) {
          persistFavouriteRestaurantIds([
            ...getFavouriteRestaurantIds(),
            favouriteRestaurant,
          ]);
        }

        profileForm.reset();
        setStatusMessage(authStatus, 'Profiili päivitetty.', 'success');
        renderAuthPanel();
        await renderDiningApp();
        renderMapView();
        await renderFeaturedRestaurants();
      } catch {
        setStatusMessage(
          authStatus,
          'Profiilin päivitys epäonnistui.',
          'error'
        );
      }
    });
  }

  if (favouriteSelect) {
    favouriteSelect.addEventListener('change', async (event) => {
      if (!event.target.value) {
        return;
      }

      await setPrimaryFavouriteRestaurant(event.target.value);
    });
  }

  if (avatarForm) {
    avatarForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearStatusMessage(authStatus);

      if (!state.currentUser) {
        setStatusMessage(
          authStatus,
          'Kirjaudu sisään ennen kuvan lataamista.',
          'error'
        );
        return;
      }

      const avatarInput = document.getElementById('avatar-file');
      const file = avatarInput?.files?.[0];

      if (!file) {
        setStatusMessage(authStatus, 'Valitse ensin kuva.', 'error');
        return;
      }

      try {
        const result = await uploadAvatar(file);
        state.currentUser = {
          ...state.currentUser,
          avatar: result.data?.avatar || state.currentUser.avatar,
          token: state.currentUser.token,
        };
        avatarForm.reset();
        setStatusMessage(authStatus, 'Profiilikuva päivitetty.', 'success');
        renderAuthPanel();
      } catch {
        setStatusMessage(
          authStatus,
          'Profiilikuvan lataus epäonnistui.',
          'error'
        );
      }
    });
  }

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      state.currentUser = null;
      state.authView = 'login';
      window.localStorage.removeItem(TOKEN_KEY);
      setStatusMessage(authStatus, 'Uloskirjautuminen onnistui.', 'success');
      renderAuthPanel();
      void renderDiningApp();
      renderMapView();
      void renderFeaturedRestaurants();
    });
  }

  if (deleteButton) {
    deleteButton.addEventListener('click', async () => {
      if (!state.currentUser) {
        return;
      }

      try {
        await deleteCurrentUser();
        state.currentUser = null;
        state.authView = 'login';
        window.localStorage.removeItem(TOKEN_KEY);
        setStatusMessage(authStatus, 'Käyttäjätili poistettu.', 'success');
        renderAuthPanel();
        void renderDiningApp();
        renderMapView();
      } catch {
        setStatusMessage(
          authStatus,
          'Käyttäjätilin poisto epäonnistui.',
          'error'
        );
      }
    });
  }
}

function syncFilterOptions() {
  const cityFilter = document.getElementById('city-filter');
  const providerFilter = document.getElementById('provider-filter');

  const cities = [
    ...new Set(state.restaurants.map((restaurant) => restaurant.city)),
  ].sort((first, second) => first.localeCompare(second, 'fi'));
  const providers = [
    ...new Set(state.restaurants.map((restaurant) => restaurant.provider)),
  ].sort((first, second) => first.localeCompare(second, 'fi'));

  populateSelect(cityFilter, cities, 'Kaikki kaupungit', state.city);
  populateSelect(providerFilter, providers, 'Kaikki tarjoajat', state.provider);
}

function syncSearchField() {
  const searchInput = document.getElementById('restaurant-search');

  if (searchInput) {
    searchInput.value = state.query;
  }
}

function syncProfileFields() {
  const profileForm = document.getElementById('profile-form');
  const favouriteSelect = document.getElementById(
    'favourite-restaurant-select'
  );

  if (!profileForm) {
    return;
  }

  const usernameInput = profileForm.querySelector('#profile-username');
  const emailInput = profileForm.querySelector('#profile-email');
  const favouriteInput = favouriteSelect;

  if (state.currentUser) {
    if (usernameInput) {
      usernameInput.value = state.currentUser.username || '';
    }

    if (emailInput) {
      emailInput.value = state.currentUser.email || '';
    }

    if (favouriteInput) {
      favouriteInput.value = getCurrentFavouriteId();
    }
  } else if (favouriteInput) {
    favouriteInput.value = getCurrentFavouriteId();
  }
}

async function bootstrapApp() {
  const [userLocation, restaurants, currentUser] = await Promise.all([
    detectUserLocation(),
    loadRestaurants(),
    loadCurrentUserFromToken(),
  ]);
  const storedUiState = loadStoredUiState();

  state.geolocation = userLocation;
  state.currentUser = currentUser;
  state.restaurants = decorateRestaurants(restaurants, userLocation);
  state.selectedRestaurantId = storedUiState.selectedRestaurantId || '';
  state.city = storedUiState.city || 'all';
  state.provider = storedUiState.provider || 'all';
  state.query = storedUiState.query || '';
  state.period = storedUiState.period || 'day';

  if (!state.currentUser && storedUiState.authView === 'register') {
    state.authView = 'register';
  }

  state.selectedRestaurantId =
    state.selectedRestaurantId ||
    currentUser?.favouriteRestaurant ||
    getCurrentFavouriteId() ||
    state.restaurants[0]?.id ||
    '';

  syncFilterOptions();
  syncSearchField();
  syncProfileFields();
}

async function init() {
  setActiveNavigation();
  setupRestaurantFilters();
  setupContactForm();
  setupAuthForms();

  await bootstrapApp();
  renderAuthPanel();
  await renderDiningApp();
  renderMapView();
  await renderFeaturedRestaurants();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    void init();
  });
} else {
  void init();
}
