class StudioDynamicIsland extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isExpanded = false;
  }

  static getStubConfig() {
    return {
      weather_entity: 'weather.forecast_home',
      power_entity: 'sensor.wattmeter_power_minute_average',
      energy_today_entity: 'sensor.wattmeter_energy_today',
      download_entity: 'sensor.bandwhich_download_mbps',
      upload_entity: 'sensor.bandwhich_upload_mbps',
      music_entity: 'media_player.bedroom_speaker',
      tv_entity: 'media_player.bedroom_tv_2',
      party_entity: 'input_boolean.party_hue',
      climate_entity: 'climate.carriercontroller',
      printer_state_entity: 'sensor.mainpi_current_print_state'
    };
  }

  setConfig(config) {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    this._config = {
      weather_entity: 'weather.forecast_home',
      power_entity: 'sensor.wattmeter_power_minute_average',
      energy_today_entity: 'sensor.wattmeter_energy_today',
      download_entity: 'sensor.bandwhich_download_mbps',
      upload_entity: 'sensor.bandwhich_upload_mbps',
      music_entity: 'media_player.bedroom_speaker',
      tv_entity: 'media_player.bedroom_tv_2',
      party_entity: 'input_boolean.party_hue',
      climate_entity: 'climate.carriercontroller',
      lights: [
        'light.ceiling_lights', 'light.kitchen_lamp_light', 'light.ceiling_fan_light_2',
        'light.lampfloor_light_2', 'light.beam', 'light.threelamps', 'light.floor_light',
        'light.shelf', 'light.printer_light', 'light.huestrips', 'light.hue_play_left',
        'light.hue_play_right', 'light.monitor', 'light.closet_beam', 'light.shelf_lamp',
        'light.candle', 'light.wled', 'light.bathroom_lighting', 'light.bathroom_clean_right',
        'light.vanity_left', 'light.bathroom_vanity_right', 'light.bedroom_tiles'
      ],
      ...config
    };
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  getCardSize() {
    return this._isExpanded ? 3 : 1;
  }

  _toggleExpand(e) {
    if (e) e.stopPropagation();
    this._isExpanded = !this._isExpanded;
    this.render();
  }

  _callService(domain, service, data) {
    if (!this._hass) return;
    this._hass.callService(domain, service, data);
  }

  _navigate(hash) {
    window.location.hash = hash;
  }

  _getWeatherIcon(condition, isNight) {
    if (!condition) return isNight ? 'mdi:weather-night' : 'mdi:weather-sunny';
    const c = condition.toLowerCase();
    if (c.includes('rain') || c.includes('pour')) return 'mdi:weather-pouring';
    if (c.includes('lightning') || c.includes('thunder')) return 'mdi:weather-lightning';
    if (c.includes('snow')) return 'mdi:weather-snowy';
    if (c.includes('cloud') && c.includes('partly')) return isNight ? 'mdi:weather-night-partly-cloudy' : 'mdi:weather-partly-cloudy';
    if (c.includes('cloud')) return 'mdi:weather-cloudy';
    if (c.includes('fog') || c.includes('hazy')) return 'mdi:weather-fog';
    return isNight ? 'mdi:weather-night' : 'mdi:weather-sunny';
  }

  render() {
    if (!this._hass) return;

    const weather = this._hass.states[this._config.weather_entity];
    const power = this._hass.states[this._config.power_entity];
    const energyToday = this._hass.states[this._config.energy_today_entity];
    const download = this._hass.states[this._config.download_entity];
    const upload = this._hass.states[this._config.upload_entity];
    const music = this._hass.states[this._config.music_entity];
    const tv = this._hass.states[this._config.tv_entity];
    const party = this._hass.states[this._config.party_entity];
    const climate = this._hass.states[this._config.climate_entity];

    const outdoorTemp = weather ? Math.round(weather.attributes.temperature ?? 0) : 60;
    const weatherCond = weather ? weather.state : 'clear-night';
    const isNight = weatherCond.includes('night');
    const weatherIcon = this._getWeatherIcon(weatherCond, isNight);

    const powerWatts = power ? Math.round(parseFloat(power.state) || 0) : 0;
    const powerKwh = energyToday ? parseFloat(energyToday.state || 0).toFixed(2) : '0.00';
    const dlSpeed = download ? parseFloat(download.state || 0).toFixed(1) : '0.0';
    const ulSpeed = upload ? parseFloat(upload.state || 0).toFixed(1) : '0.0';

    const onLightsCount = this._config.lights
      .map(id => this._hass.states[id])
      .filter(s => s && s.state === 'on').length;

    const isParty = party && party.state === 'on';
    const isMusicPlaying = music && music.state === 'playing';
    const isTvOn = tv && tv.state === 'on';
    const isHighPower = powerWatts > 1100;

    const printer = this._hass.states[this._config.printer_state_entity];
    const printerState = printer ? printer.state.toLowerCase() : 'standby';
    const isPrinterError = printerState === 'error';
    const isPrinterComplete = printerState === 'complete';

    const trackTitle = music?.attributes?.media_title || (isTvOn ? 'TV Active' : 'Bedroom Audio');
    const trackArtist = music?.attributes?.media_artist || (music?.attributes?.app_name || 'Music');
    const albumArt = music?.attributes?.entity_picture;

    const isExpanded = this._isExpanded;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          margin: 0 0 10px 0;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          user-select: none;
          box-sizing: border-box;
        }

        /* --- THE DYNAMIC ISLAND PILL CONTAINER --- */
        .island-capsule {
          position: relative;
          background: rgba(14, 18, 28, 0.88);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border-radius: ${isExpanded ? '28px' : '9999px'};
          border: 1px solid rgba(255, 255, 255, 0.16);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.42), inset 0 1px 1px rgba(255, 255, 255, 0.28);
          color: #ffffff;
          transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
          overflow: hidden;
          cursor: pointer;
        }

        .island-capsule:active {
          transform: scale(0.99);
        }

        /* Party Border Aura */
        .island-capsule.party-mode {
          border-color: rgba(255, 110, 220, 0.6);
          box-shadow: 0 0 24px rgba(180, 50, 255, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.4);
          animation: partyGlow 4s linear infinite;
        }

        @keyframes partyGlow {
          0% { border-color: rgba(255, 0, 128, 0.7); box-shadow: 0 0 20px rgba(255, 0, 128, 0.35); }
          33% { border-color: rgba(0, 245, 212, 0.7); box-shadow: 0 0 20px rgba(0, 245, 212, 0.35); }
          66% { border-color: rgba(255, 190, 11, 0.7); box-shadow: 0 0 20px rgba(255, 190, 11, 0.35); }
          100% { border-color: rgba(255, 0, 128, 0.7); box-shadow: 0 0 20px rgba(255, 0, 128, 0.35); }
        }

        /* High Power Pulse Border */
        .island-capsule.power-alert {
          border-color: rgba(255, 84, 0, 0.7);
          box-shadow: 0 0 20px rgba(255, 84, 0, 0.45);
        }

        /* --- RESTING COMPACT PILL LAYOUT --- */
        .compact-pill {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          min-height: 44px;
          gap: 10px;
        }

        .pill-section {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: -0.2px;
        }

        .pill-weather {
          color: rgba(255, 255, 255, 0.95);
        }

        .weather-icon-wrap {
          color: ${isNight ? '#8ab4f8' : '#fbc02d'};
          display: flex;
          align-items: center;
        }

        .pill-status {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #ffffff;
        }

        .live-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: ${onLightsCount > 0 ? '#00f5d4' : 'rgba(255, 255, 255, 0.4)'};
          box-shadow: ${onLightsCount > 0 ? '0 0 8px #00f5d4' : 'none'};
          animation: ${onLightsCount > 0 ? 'pulseGlow 2.5s infinite' : 'none'};
        }

        @keyframes pulseGlow {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        .pill-telemetry {
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255, 255, 255, 0.8);
          font-size: 12px;
        }

        .telemetry-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .power-item {
          color: ${powerWatts > 1000 ? '#ff5400' : powerWatts > 600 ? '#ffbe0b' : '#00f5d4'};
        }

        .chevron-toggle {
          color: rgba(255, 255, 255, 0.45);
          display: flex;
          align-items: center;
          transition: transform 0.3s ease;
        }

        /* --- LIVE ACTIVITY: MEDIA PLAYING --- */
        .media-activity {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 14px;
          min-height: 48px;
          gap: 12px;
        }

        .media-left {
          display: flex;
          align-items: center;
          gap: 10px;
          overflow: hidden;
          flex: 1;
        }

        .album-art-wrap {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 0 10px rgba(0, 245, 212, 0.3);
          animation: spinRecord 12s linear infinite;
        }

        @keyframes spinRecord {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .album-art-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .media-track-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          white-space: nowrap;
        }

        .track-title {
          font-size: 13px;
          font-weight: 700;
          color: #ffffff;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .track-artist {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.65);
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Animated Audio Waveform Bars */
        .waveform-container {
          display: flex;
          align-items: center;
          gap: 3px;
          height: 20px;
          padding: 0 6px;
        }

        .sound-bar {
          width: 3px;
          background: #00f5d4;
          border-radius: 2px;
          animation: waveBar 1.2s ease-in-out infinite;
        }

        .sound-bar:nth-child(1) { height: 6px; animation-delay: 0.1s; }
        .sound-bar:nth-child(2) { height: 14px; animation-delay: 0.3s; }
        .sound-bar:nth-child(3) { height: 18px; animation-delay: 0.15s; }
        .sound-bar:nth-child(4) { height: 10px; animation-delay: 0.4s; }
        .sound-bar:nth-child(5) { height: 8px; animation-delay: 0.25s; }

        @keyframes waveBar {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1.1); }
        }

        .media-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .action-mini-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-mini-btn:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        /* --- LIVE ACTIVITY: PARTY MODE --- */
        .party-activity {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          min-height: 44px;
        }

        .party-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 700;
          color: #ff85ea;
        }

        /* --- EXPANDED HUD COCKPIT --- */
        .expanded-hud {
          padding: 16px 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          cursor: default;
        }

        .hud-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .hud-title-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
        }

        .hud-grid-chips {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: 8px;
        }

        .hud-chip {
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 8px 10px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 12px;
          font-weight: 600;
        }

        .hud-chip:hover {
          background: rgba(255, 255, 255, 0.16);
        }

        .hud-chip.active {
          background: rgba(0, 245, 212, 0.15);
          border-color: rgba(0, 245, 212, 0.4);
          color: #00f5d4;
        }

        .hud-telemetry-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
        }

        .hud-tele-item {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .hud-dock-row {
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding-top: 4px;
        }

        .dock-link-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.75);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .dock-link-btn:hover {
          color: #00f5d4;
        }
      </style>

      <div class="island-capsule ${isPrinterError ? 'printer-error' : isParty ? 'party-mode' : ''} ${isHighPower && !isPrinterError ? 'power-alert' : ''}" id="island-main">
        ${isExpanded ? `
          <!-- EXPANDED COCKPIT HUD -->
          <div class="expanded-hud">
            <div class="hud-header">
              <div class="hud-title-wrap">
                <ha-icon icon="mdi:home-variant" style="--mdc-icon-size: 18px; color: #00f5d4;"></ha-icon>
                <span>Studio Live Cockpit</span>
              </div>
              <div class="chevron-toggle" id="hud-collapse" style="cursor: pointer; padding: 4px;" aria-label="Collapse HUD" role="button" tabindex="0">
                <ha-icon icon="mdi:chevron-up" style="--mdc-icon-size: 20px;"></ha-icon>
              </div>
            </div>

            <!-- QUICK ACTIONS GRID -->
            <div class="hud-grid-chips">
              <div class="hud-chip ${isParty ? 'active' : ''}" id="chip-party-toggle">
                <ha-icon icon="mdi:party-popper" style="--mdc-icon-size: 16px;"></ha-icon>
                <span>Party Hue</span>
              </div>
              <div class="hud-chip ${onLightsCount > 0 ? 'active' : ''}" id="chip-lights-toggle">
                <ha-icon icon="${onLightsCount > 0 ? 'mdi:lightbulb-on' : 'mdi:lightbulb-off'}" style="--mdc-icon-size: 16px;"></ha-icon>
                <span>${onLightsCount} On</span>
              </div>
              <div class="hud-chip ${climate && climate.state !== 'off' ? 'active' : ''}" id="chip-climate-nav">
                <ha-icon icon="mdi:thermostat" style="--mdc-icon-size: 16px;"></ha-icon>
                <span>${climate ? climate.state.toUpperCase() : 'OFF'}</span>
              </div>
              <div class="hud-chip ${isMusicPlaying ? 'active' : ''}" id="chip-media-toggle">
                <ha-icon icon="${isMusicPlaying ? 'mdi:pause' : 'mdi:play'}" style="--mdc-icon-size: 16px;"></ha-icon>
                <span>${isMusicPlaying ? 'Playing' : 'Audio'}</span>
              </div>
            </div>

            <!-- TELEMETRY ROW -->
            <div class="hud-telemetry-row">
              <div class="hud-tele-item" id="tele-weather">
                <ha-icon icon="${weatherIcon}" style="--mdc-icon-size: 16px; color: #8ab4f8;"></ha-icon>
                <span>${outdoorTemp}°F · ${weatherCond}</span>
              </div>
              <div class="hud-tele-item" id="tele-power">
                <ha-icon icon="mdi:flash" style="--mdc-icon-size: 16px; color: #ffbe0b;"></ha-icon>
                <span>${powerWatts} W (${powerKwh} kWh)</span>
              </div>
              <div class="hud-tele-item" id="tele-net">
                <ha-icon icon="mdi:swap-vertical" style="--mdc-icon-size: 16px; color: #00f5d4;"></ha-icon>
                <span>${dlSpeed} Mb / ${ulSpeed} Mb</span>
              </div>
            </div>

            <!-- QUICK NAVIGATION DOCK -->
            <div class="hud-dock-row">
              <button class="dock-link-btn" data-nav="#lights">
                <ha-icon icon="mdi:floor-plan" style="--mdc-icon-size: 18px;"></ha-icon>
                <span>Lights</span>
              </button>
              <button class="dock-link-btn" data-nav="#climate">
                <ha-icon icon="mdi:thermostat" style="--mdc-icon-size: 18px;"></ha-icon>
                <span>Climate</span>
              </button>
              <button class="dock-link-btn" data-nav="#media">
                <ha-icon icon="mdi:play-circle" style="--mdc-icon-size: 18px;"></ha-icon>
                <span>Media</span>
              </button>
              <button class="dock-link-btn" data-nav="#power">
                <ha-icon icon="mdi:lightning-bolt" style="--mdc-icon-size: 18px;"></ha-icon>
                <span>Power</span>
              </button>
              <button class="dock-link-btn" data-nav="#weather">
                <ha-icon icon="mdi:weather-partly-cloudy" style="--mdc-icon-size: 18px;"></ha-icon>
                <span>Radar</span>
              </button>
            </div>
          </div>
        ` : isMusicPlaying ? `
          <!-- LIVE ACTIVITY: NOW PLAYING MUSIC -->
          <div class="media-activity" id="media-strip">
            <div class="media-left">
              <div class="album-art-wrap">
                ${albumArt ? `
                  <img class="album-art-img" src="${albumArt}" alt="Artwork">
                ` : `
                  <ha-icon icon="mdi:music" style="--mdc-icon-size: 18px; color: #00f5d4;"></ha-icon>
                `}
              </div>
              <div class="media-track-info">
                <span class="track-title">${trackTitle}</span>
                <span class="track-artist">${trackArtist}</span>
              </div>
            </div>

            <div class="waveform-container">
              <div class="sound-bar"></div>
              <div class="sound-bar"></div>
              <div class="sound-bar"></div>
              <div class="sound-bar"></div>
              <div class="sound-bar"></div>
            </div>

            <div class="media-actions">
              <button class="action-mini-btn" id="btn-play-pause" title="Play/Pause" aria-label="Play/Pause">
                <ha-icon icon="mdi:pause" style="--mdc-icon-size: 16px;"></ha-icon>
              </button>
              <button class="action-mini-btn" id="btn-next" title="Next" aria-label="Next Track">
                <ha-icon icon="mdi:skip-next" style="--mdc-icon-size: 16px;"></ha-icon>
              </button>
            </div>
          </div>
        ` : isPrinterError ? `
          <!-- LIVE ACTIVITY: PRINTER ERROR ACTIVE -->
          <div class="party-activity" id="printer-error-strip">
            <div class="party-badge">
              <ha-icon icon="mdi:alert-circle" style="--mdc-icon-size: 20px; color: #ef4444;"></ha-icon>
              <span>3D Printer Error Detected</span>
            </div>
            <div class="media-actions">
              <button class="action-mini-btn" id="btn-printer-nav" title="View Printer" aria-label="View Printer">
                <ha-icon icon="mdi:printer-3d" style="--mdc-icon-size: 16px;"></ha-icon>
              </button>
            </div>
          </div>
        ` : isParty ? `
          <!-- LIVE ACTIVITY: PARTY MODE ACTIVE -->
          <div class="party-activity" id="party-strip">
            <div class="party-badge">
              <ha-icon icon="mdi:party-popper" style="--mdc-icon-size: 20px; color: #ff85ea;"></ha-icon>
              <span>Party Hue Active · Ambient Sound & Lights</span>
            </div>
            <div class="media-actions">
              <button class="action-mini-btn" id="btn-party-off" title="Turn Off Party Mode" aria-label="Turn Off Party Mode">
                <ha-icon icon="mdi:close" style="--mdc-icon-size: 16px;"></ha-icon>
              </button>
            </div>
          </div>
        ` : `
          <!-- COMPACT RESTING PILL (MICRO-TELEMETRY HUD) -->
          <div class="compact-pill" id="compact-pill-view">
            <!-- LEFT: WEATHER & TEMP -->
            <div class="pill-section pill-weather" id="chip-weather" style="position: relative;">
              <div class="weather-icon-wrap">
                <ha-icon icon="${weatherIcon}" style="--mdc-icon-size: 18px;"></ha-icon>
                ${isPrinterComplete ? '<div class="notification-dot" style="position: absolute; top: -2px; left: -2px; width: 8px; height: 8px; border-radius: 50%; background:#10b981; box-shadow:0 0 6px #10b981;"></div>' : ''}
              </div>
              <span>${outdoorTemp}°</span>
            </div>

            <!-- CENTER: STUDIO STATUS PILL -->
            <div class="pill-status" id="chip-center">
              <span class="live-dot"></span>
              <span>${onLightsCount > 0 ? onLightsCount + ' Lights On' : 'Studio Quiet'}</span>
            </div>

            <!-- RIGHT: POWER & BANDWIDTH -->
            <div class="pill-telemetry">
              <div class="telemetry-item power-item" id="chip-power" title="Current Power Consumption">
                <ha-icon icon="mdi:flash" style="--mdc-icon-size: 14px;"></ha-icon>
                <span>${powerWatts}W</span>
              </div>
              <div class="telemetry-item" id="chip-network" title="Download Throughput">
                <ha-icon icon="mdi:arrow-down" style="--mdc-icon-size: 14px; color: #00f5d4;"></ha-icon>
                <span>${dlSpeed}M</span>
              </div>
              <div class="chevron-toggle" id="pill-expand-arrow">
                <ha-icon icon="mdi:chevron-down" style="--mdc-icon-size: 16px;"></ha-icon>
              </div>
            </div>
          </div>
        `}
      </div>
    `;

    // Setup event listeners
    if (isExpanded) {
      this.shadowRoot.getElementById('hud-collapse')?.addEventListener('click', (e) => this._toggleExpand(e));
      this.shadowRoot.getElementById('chip-party-toggle')?.addEventListener('click', () => {
        this._callService('homeassistant', 'toggle', { entity_id: this._config.party_entity });
      });
      this.shadowRoot.getElementById('chip-lights-toggle')?.addEventListener('click', () => {
        this._callService('light', onLightsCount > 0 ? 'turn_off' : 'turn_on', { entity_id: this._config.lights });
      });
      this.shadowRoot.getElementById('chip-climate-nav')?.addEventListener('click', () => {
        this._navigate('#climate');
      });
      this.shadowRoot.getElementById('chip-media-toggle')?.addEventListener('click', () => {
        this._callService('media_player', 'media_play_pause', { entity_id: this._config.music_entity });
      });
      this.shadowRoot.getElementById('tele-weather')?.addEventListener('click', () => this._navigate('#weather'));
      this.shadowRoot.getElementById('tele-power')?.addEventListener('click', () => this._navigate('#power'));
      this.shadowRoot.getElementById('tele-net')?.addEventListener('click', () => this._navigate('#network'));
      this.shadowRoot.querySelectorAll('.dock-link-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const nav = btn.getAttribute('data-nav');
          if (nav) this._navigate(nav);
        });
      });
    } else if (isPrinterError) {
      this.shadowRoot.getElementById('printer-error-strip')?.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        this._navigate('#klipper');
      });
      this.shadowRoot.getElementById('btn-printer-nav')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this._navigate('#klipper');
      });
    } else if (isMusicPlaying) {
      this.shadowRoot.getElementById('media-strip')?.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        this._navigate('#media');
      });
      this.shadowRoot.getElementById('btn-play-pause')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this._callService('media_player', 'media_play_pause', { entity_id: this._config.music_entity });
      });
      this.shadowRoot.getElementById('btn-next')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this._callService('media_player', 'media_next_track', { entity_id: this._config.music_entity });
      });
    } else if (isParty) {
      this.shadowRoot.getElementById('party-strip')?.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        this._toggleExpand(e);
      });
      this.shadowRoot.getElementById('btn-party-off')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this._callService('homeassistant', 'turn_off', { entity_id: this._config.party_entity });
      });
    } else {
      this.shadowRoot.getElementById('chip-weather')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this._navigate('#weather');
      });
      this.shadowRoot.getElementById('chip-power')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this._navigate('#power');
      });
      this.shadowRoot.getElementById('chip-network')?.addEventListener('click', (e) => {
        e.stopPropagation();
        this._navigate('#network');
      });
      this.shadowRoot.getElementById('compact-pill-view')?.addEventListener('click', (e) => {
        this._toggleExpand(e);
      });
    }
  }
}

customElements.define('studio-dynamic-island', StudioDynamicIsland);
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'studio-dynamic-island',
  name: 'Studio Dynamic Island Card',
  description: 'Dynamic Island HUD featuring Live Activities for Music, Party, Power Surge, and expandable cockpit.'
});
