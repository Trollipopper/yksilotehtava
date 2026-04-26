const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const weekdayLabels = {
  monday: 'Maanantai',
  tuesday: 'Tiistai',
  wednesday: 'Keskiviikko',
  thursday: 'Torstai',
  friday: 'Perjantai',
};

const restaurants = [
  {
    id: 'keskusta-kulma',
    name: 'Keskusta Kulma',
    city: 'Helsinki',
    provider: 'UniCafe',
    campus: 'Keskusta',
    price: '2,95-6,20 €',
    distanceKm: 0.4,
    mapX: 18,
    mapY: 28,
    tags: ['Kasvis', 'Salaatti', 'Gluteeniton'],
    weeklyMenus: {
      monday: [
        'Paahdettu kana ja sitruunarisotto',
        'Bataatti-linssikeitto',
        'Salaattipöytä ja leipä',
      ],
      tuesday: [
        'Makaroonilaatikko',
        'Thaimaalainen tofucurry',
        'Paahdetut juurekset',
      ],
      wednesday: [
        'Pinaatti-fetalasagne',
        'Savulohikeitto',
        'Hedelmäinen jälkiruoka',
      ],
      thursday: [
        'Possupata ja perunamuusi',
        'Hernepihvit ja tzatziki',
        'Kausisalaatti',
      ],
      friday: ['Lohipasta', 'Kasvisburgeri', 'Päivän makea päätös'],
    },
  },
  {
    id: 'otaniemi-oasis',
    name: 'Otaniemi Oasis',
    city: 'Espoo',
    provider: 'Sodexo',
    campus: 'Otaniemi',
    price: '3,10-6,50 €',
    distanceKm: 0.8,
    mapX: 52,
    mapY: 22,
    tags: ['Vegaaninen', 'Lämmin lounas', 'Take away'],
    weeklyMenus: {
      monday: [
        'Broilerikastike ja riisi',
        'Miso-ramen',
        'Raikas kurkku-pinaattisalaatti',
      ],
      tuesday: [
        'Jauhelihakastike ja perunat',
        'Sesamtofu ja nuudelit',
        'Paahdettu kukkakaali',
      ],
      wednesday: [
        'Uunifilee ja selleripyree',
        'Kasvispaistos',
        'Mustikkarahka',
      ],
      thursday: [
        'Kermainen lohikeitto',
        'Falafel wrap',
        'Vihersalaatti ja hummus',
      ],
      friday: [
        'Pizza of the day',
        'Paistettu riisi ja kasvikset',
        'Päivän brownie',
      ],
    },
  },
  {
    id: 'myyrmaki-maja',
    name: 'Myyrmäki Maja',
    city: 'Vantaa',
    provider: 'Compass Group',
    campus: 'Myyrmäki',
    price: '2,85-6,00 €',
    distanceKm: 1.1,
    mapX: 71,
    mapY: 44,
    tags: ['Lähiruoka', 'Arkiruoka', 'Kevyt'],
    weeklyMenus: {
      monday: ['Kalkkunapasta', 'Papu-chili', 'Paahdetut juurekset'],
      tuesday: ['Nakkikastike ja muusi', 'Kikherne-curry', 'Raikas coleslaw'],
      wednesday: ['Tonnikalapasta', 'Kasvisbolognese', 'Salaattipöytä'],
      thursday: ['Broileripyörykät', 'Tomaattinen papupata', 'Omenakiisseli'],
      friday: ['Lohi ja tilliperunat', 'Sienirisotto', 'Päivän leivos'],
    },
  },
  {
    id: 'hervanta-halli',
    name: 'Hervanta Halli',
    city: 'Tampere',
    provider: 'Unica',
    campus: 'Hervanta',
    price: '2,90-6,10 €',
    distanceKm: 0.6,
    mapX: 38,
    mapY: 63,
    tags: ['Opiskelijahinta', 'Keittolounas', 'Vegaaninen'],
    weeklyMenus: {
      monday: ['Jauhelihalasagne', 'Hernekeitto', 'Rapeat vihannekset'],
      tuesday: ['Kikhernepihvit', 'Kana-fajitakulho', 'Kausisalaatti'],
      wednesday: ['Perunapekonivuoka', 'Lentil soup', 'Puolukkavispipuuro'],
      thursday: ['Korealainen tofu', 'Uunilohi', 'Paahdettu parsakaali'],
      friday: ['Pasta carbonara', 'Kasviswokki', 'Smoothie'],
    },
  },
  {
    id: 'turku-tori',
    name: 'Turku Tori',
    city: 'Turku',
    provider: 'Konkretia',
    campus: 'Keskusta',
    price: '3,00-6,30 €',
    distanceKm: 1.4,
    mapX: 62,
    mapY: 74,
    tags: ['Kauden maku', 'Runsas salaattipöytä', 'Nopea'],
    weeklyMenus: {
      monday: [
        'Lihapullat ja perunamuusi',
        'Punajuuririsotto',
        'Kurkku-tomaattisalaatti',
      ],
      tuesday: ['Paahdettu kana', 'Sienikeitto', 'Jogurttikastike'],
      wednesday: ['Kermainen kalapasta', 'Kasvispadat', 'Päivän smoothie'],
      thursday: ['Tex Mex bowl', 'Tomaattinen linssikeitto', 'Rieskaleipä'],
      friday: ['Päivän hampurilainen', 'Tofu-nuudelit', 'Kahvin kanssa makea'],
    },
  },
  {
    id: 'oulu-ovi',
    name: 'Oulu Ovi',
    city: 'Oulu',
    provider: 'Uniresta',
    campus: 'Linnanmaa',
    price: '2,80-5,90 €',
    distanceKm: 0.5,
    mapX: 29,
    mapY: 16,
    tags: ['Aamusta iltaan', 'Kasvisvaihtoehdot', 'Edullinen'],
    weeklyMenus: {
      monday: [
        'Poronkäristys ja perunamuusi',
        'Kasvislasagne',
        'Mustikkarahka',
      ],
      tuesday: ['Broilerikeitto', 'Tofupasta', 'Salaattibuffet'],
      wednesday: ['Uunimakkara', 'Kikhernecurry', 'Kurpitsakeitto'],
      thursday: ['Lohikiusaus', 'Kasvispyörykät', 'Hedelmäkulho'],
      friday: ['Jauhelihakastike', 'Paahdetut kasvikset', 'Päivän pulla'],
    },
  },
];

const state = {
  city: 'all',
  period: 'day',
  provider: 'all',
  query: '',
  selectedRestaurantId: restaurants[0].id,
};

function normalize(value) {
  return value.toLocaleLowerCase('fi-FI').trim();
}

function formatDistance(distanceKm) {
  return `${distanceKm.toLocaleString('fi-FI', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  })} km`;
}

function getTodayKey() {
  const todayIndex = (new Date().getDay() + 6) % 7;
  return weekdays[todayIndex];
}

function getFilteredRestaurants() {
  return restaurants.filter((restaurant) => {
    const searchableText = [
      restaurant.name,
      restaurant.city,
      restaurant.provider,
      restaurant.campus,
      restaurant.tags.join(' '),
    ]
      .join(' ')
      .toLocaleLowerCase('fi-FI');

    const matchesQuery =
      state.query === '' || searchableText.includes(state.query);
    const matchesCity = state.city === 'all' || restaurant.city === state.city;
    const matchesProvider =
      state.provider === 'all' || restaurant.provider === state.provider;

    return matchesQuery && matchesCity && matchesProvider;
  });
}

function setActiveNavigation() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

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

function populateSelect(selectElement, items, allLabel) {
  if (!selectElement) {
    return;
  }

  selectElement.innerHTML = [
    `<option value="all">${allLabel}</option>`,
    ...items.map((item) => `<option value="${item}">${item}</option>`),
  ].join('');
}

function renderPeriodButtons(buttons) {
  buttons.forEach((button) => {
    const isSelected = button.dataset.period === state.period;
    button.classList.toggle('is-active', isSelected);
    button.setAttribute('aria-pressed', String(isSelected));
  });
}

function renderRestaurantList(restaurantsList, filteredRestaurants) {
  if (!restaurantsList) {
    return;
  }

  if (filteredRestaurants.length === 0) {
    restaurantsList.innerHTML = `
      <div class="empty-state">
        <h4>Ei osumia</h4>
        <p>Muuta hakusanaa tai suodattimia, niin ravintolat näkyvät täällä.</p>
      </div>
    `;
    return;
  }

  restaurantsList.innerHTML = filteredRestaurants
    .map((restaurant) => {
      const isSelected = restaurant.id === state.selectedRestaurantId;

      return `
        <button type="button" class="restaurant-card ${
          isSelected ? 'is-active' : ''
        }" data-restaurant-id="${restaurant.id}">
          <div class="restaurant-card__header">
            <div>
              <p class="eyebrow">${restaurant.provider}</p>
              <h4>${restaurant.name}</h4>
            </div>
            <span class="pill">${restaurant.city}</span>
          </div>
          <p class="restaurant-card__meta">${restaurant.campus}</p>
          <p class="restaurant-card__distance">Etäisyys: ${formatDistance(
            restaurant.distanceKm
          )}</p>
          <div class="tag-row">
            ${restaurant.tags
              .map((tag) => `<span class="tag">${tag}</span>`)
              .join('')}
          </div>
        </button>
      `;
    })
    .join('');

  restaurantsList.querySelectorAll('[data-restaurant-id]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedRestaurantId = button.dataset.restaurantId;
      renderDiningApp();
    });
  });
}

function renderMenuSection(menuPanel, restaurant) {
  if (!menuPanel) {
    return;
  }

  const todayKey = getTodayKey();

  if (state.period === 'day') {
    const dailyMenu = restaurant.weeklyMenus[todayKey];

    menuPanel.innerHTML = `
      <article class="menu-card menu-card--highlight">
        <div class="menu-card__header">
          <div>
            <p class="eyebrow">Tämän päivän ruokalista</p>
            <h4>${weekdayLabels[todayKey]}</h4>
          </div>
          <span class="pill pill--accent">Päivän näkymä</span>
        </div>
        <ul class="menu-list">
          ${dailyMenu.map((meal) => `<li>${meal}</li>`).join('')}
        </ul>
      </article>
      <p class="menu-note">
        Tämä näkymä on rakennettu niin, että myöhempi API voi korvata listan
        ilman HTML-muutoksia.
      </p>
    `;
    return;
  }

  menuPanel.innerHTML = `
    <div class="menu-grid">
      ${weekdays
        .map(
          (dayKey) => `
            <article class="menu-card ${dayKey === todayKey ? 'is-today' : ''}">
              <div class="menu-card__header">
                <div>
                  <p class="eyebrow">${weekdayLabels[dayKey]}</p>
                  <h4>Viikon lista</h4>
                </div>
                ${
                  dayKey === todayKey
                    ? '<span class="pill pill--accent">Tänään</span>'
                    : ''
                }
              </div>
              <ul class="menu-list">
                ${restaurant.weeklyMenus[dayKey]
                  .map((meal) => `<li>${meal}</li>`)
                  .join('')}
              </ul>
            </article>
          `
        )
        .join('')}
    </div>
  `;
}

function renderSelectedRestaurantInfo(infoElement, restaurant) {
  if (!infoElement) {
    return;
  }

  infoElement.innerHTML = `
    <p>${restaurant.city} · ${restaurant.provider} · ${restaurant.campus}</p>
    <p>${formatDistance(restaurant.distanceKm)} päässä · ${restaurant.price}</p>
    <div class="tag-row">
      ${restaurant.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}
    </div>
  `;
}

function renderDiningApp() {
  const restaurantsList = document.getElementById('restaurant-list');
  const menuPanel = document.getElementById('menu-panel');
  const restaurantCount = document.getElementById('restaurant-count');
  const selectedName = document.getElementById('selected-restaurant-name');
  const selectedInfo = document.getElementById('selected-restaurant-info');
  const periodButtons = document.querySelectorAll('[data-period]');

  if (!restaurantsList || !menuPanel) {
    return;
  }

  const filteredRestaurants = getFilteredRestaurants();

  if (
    filteredRestaurants.length > 0 &&
    !filteredRestaurants.some(
      (restaurant) => restaurant.id === state.selectedRestaurantId
    )
  ) {
    state.selectedRestaurantId = filteredRestaurants[0].id;
  }

  const selectedRestaurant =
    filteredRestaurants.find(
      (restaurant) => restaurant.id === state.selectedRestaurantId
    ) ||
    filteredRestaurants[0] ||
    restaurants[0];

  renderPeriodButtons(Array.from(periodButtons));
  renderRestaurantList(restaurantsList, filteredRestaurants);
  renderMenuSection(menuPanel, selectedRestaurant);
  renderSelectedRestaurantInfo(selectedInfo, selectedRestaurant);

  if (restaurantCount) {
    restaurantCount.textContent = `${filteredRestaurants.length}`;
  }

  if (selectedName) {
    selectedName.textContent = selectedRestaurant.name;
  }
}

function renderFeaturedRestaurants() {
  const featuredContainer = document.getElementById('featured-restaurants');

  if (!featuredContainer) {
    return;
  }

  const featuredRestaurants = [...restaurants]
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 3);

  featuredContainer.innerHTML = featuredRestaurants
    .map((restaurant) => {
      const todayMenu = restaurant.weeklyMenus[getTodayKey()];

      return `
        <article class="feature-card feature-card--restaurant">
          <p class="eyebrow">${restaurant.city} · ${restaurant.provider}</p>
          <h3>${restaurant.name}</h3>
          <p>${restaurant.campus} · ${formatDistance(restaurant.distanceKm)}</p>
          <ul class="mini-list">
            ${todayMenu
              .slice(0, 2)
              .map((meal) => `<li>${meal}</li>`)
              .join('')}
          </ul>
        </article>
      `;
    })
    .join('');
}

function renderMapView() {
  const mapPins = document.getElementById('map-pins');
  const nearestRestaurant = document.getElementById('nearest-restaurant');
  const mapList = document.getElementById('map-list');

  if (!mapPins || !nearestRestaurant || !mapList) {
    return;
  }

  const sortedRestaurants = [...restaurants].sort(
    (firstRestaurant, secondRestaurant) =>
      firstRestaurant.distanceKm - secondRestaurant.distanceKm
  );
  const closestRestaurant = sortedRestaurants[0];

  mapPins.innerHTML = sortedRestaurants
    .map((restaurant) => {
      const isClosest = restaurant.id === closestRestaurant.id;

      return `
        <button
          type="button"
          class="map-pin ${isClosest ? 'is-nearest' : ''}"
          style="left: ${restaurant.mapX}%; top: ${restaurant.mapY}%;"
          data-restaurant-pin="${restaurant.id}"
        >
          <span class="map-pin__dot"></span>
          <span class="map-pin__label">${restaurant.name}</span>
        </button>
      `;
    })
    .join('');

  mapList.innerHTML = sortedRestaurants
    .map(
      (restaurant) => `
        <button type="button" class="map-list-item" data-map-restaurant="${restaurant.id}">
          <span>
            <strong>${restaurant.name}</strong>
            <span>${restaurant.city} · ${restaurant.provider}</span>
          </span>
          <span>${formatDistance(restaurant.distanceKm)}</span>
        </button>
      `
    )
    .join('');

  nearestRestaurant.innerHTML = `
    <h4>${closestRestaurant.name}</h4>
    <p>${closestRestaurant.city} · ${closestRestaurant.provider}</p>
    <p>${closestRestaurant.campus} · ${formatDistance(closestRestaurant.distanceKm)}</p>
    <div class="tag-row">
      ${closestRestaurant.tags.map((tag) => `<span class="tag">${tag}</span>`).join('')}
    </div>
  `;

  mapPins.querySelectorAll('[data-restaurant-pin]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedRestaurantId = button.dataset.restaurantPin;
      renderDiningApp();
      renderMapView();
    });
  });

  mapList.querySelectorAll('[data-map-restaurant]').forEach((button) => {
    button.addEventListener('click', () => {
      state.selectedRestaurantId = button.dataset.mapRestaurant;
      renderDiningApp();
      renderMapView();
    });
  });
}

function setupRestaurantFilters() {
  const searchInput = document.getElementById('restaurant-search');
  const cityFilter = document.getElementById('city-filter');
  const providerFilter = document.getElementById('provider-filter');
  const periodButtons = document.querySelectorAll('[data-period]');

  if (!searchInput || !cityFilter || !providerFilter) {
    return;
  }

  populateSelect(
    cityFilter,
    [...new Set(restaurants.map((restaurant) => restaurant.city))].sort(),
    'Kaikki kaupungit'
  );
  populateSelect(
    providerFilter,
    [...new Set(restaurants.map((restaurant) => restaurant.provider))].sort(),
    'Kaikki tarjoajat'
  );

  searchInput.addEventListener('input', (event) => {
    state.query = normalize(event.target.value);
    renderDiningApp();
  });

  cityFilter.addEventListener('change', (event) => {
    state.city = event.target.value;
    renderDiningApp();
  });

  providerFilter.addEventListener('change', (event) => {
    state.provider = event.target.value;
    renderDiningApp();
  });

  periodButtons.forEach((button) => {
    button.addEventListener('click', () => {
      state.period = button.dataset.period;
      renderDiningApp();
    });
  });
}

function setupContactForm() {
  const contactForm = document.getElementById('contact-form');

  if (!contactForm) {
    return;
  }

  const status = document.getElementById('contact-status');

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (status) {
      status.textContent =
        'Kiitos viestistä. Lomake on valmiina myöhempää API-käsittelyä varten.';
    }

    contactForm.reset();
  });
}

function init() {
  setActiveNavigation();
  setupRestaurantFilters();
  renderDiningApp();
  renderFeaturedRestaurants();
  renderMapView();
  setupContactForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
