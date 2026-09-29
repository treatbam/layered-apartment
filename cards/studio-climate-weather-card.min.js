class StudioClimateWeatherCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  setConfig(config) {
    this._config = {
      weather_entity: 'weather.forecast_home',
      climate_entity: 'climate.carriercontroller',
      sun_entity: 'sun.sun',
      humidity_entity: 'sensor.co2_humidity',
      ...config
    };
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  getCardSize() {
    return 4;
  }

  _getSunPhase(sun) {
    if (!sun || !sun.attributes) return 'day';
    const elev = sun.attributes.elevation;
    const rising = sun.attributes.rising;
    if (elev < -10) return 'night';
    if (elev >= -10 && elev < 0) return rising ? 'dawn' : 'dusk';
    if (elev >= 0 && elev < 12) return rising ? 'sunrise' : 'sunset';
    if (elev >= 12 && elev < 25) return 'golden_hour';
    return 'day';
  }

  _getSkyGradient(phase, condition) {
    if (condition && (condition.includes('lightning') || condition.includes('thunder'))) {
      return 'linear-gradient(135deg, #0A0F24 0%, #171E3D 40%, #2B234F 70%, #13172E 100%)';
    }
    if (condition && (condition.includes('pour') || condition.includes('rainy') || condition.includes('rain'))) {
      return 'linear-gradient(135deg, #101D33 0%, #1C2D4A 40%, #2A3F63 75%, #182844 100%)';
    }
    if (condition && condition.includes('snow')) {
      return 'linear-gradient(135deg, #1E2D3D 0%, #32475C 45%, #4F6A85 80%, #6E8CA8 100%)';
    }
    if (condition && (condition.includes('fog') || condition.includes('hazy') || condition.includes('mist'))) {
      return 'linear-gradient(135deg, #1C2430 0%, #2D3A4B 45%, #425266 80%, #576980 100%)';
    }

    switch (phase) {
      case 'night':
        // Deep celestial midnight sapphire & luminous violet
        return 'linear-gradient(135deg, #0A0E27 0%, #12183A 35%, #1C1A48 70%, #251642 100%)';
      case 'dawn':
      case 'dusk':
        // Atmospheric twilight magenta, peach & violet
        return 'linear-gradient(135deg, #1B0B2E 0%, #461448 30%, #852254 60%, #BC3F52 85%, #E5735A 100%)';
      case 'sunrise':
      case 'sunset':
        // Blazing sunset spectrum with coral, amber & gold
        return 'linear-gradient(135deg, #240046 0%, #5A189A 25%, #9D0208 50%, #DC2F02 75%, #F48C06 90%, #FFBA08 100%)';
      case 'golden_hour':
        // Warm golden hour azure & honey amber
        return 'linear-gradient(135deg, #144570 0%, #23689B 40%, #4895EF 70%, #D4A373 90%, #FAEDCD 100%)';
      case 'day':
      default:
        // Radiant clear day azure
        return 'linear-gradient(135deg, #1565C0 0%, #1E88E5 35%, #42A5F5 70%, #80D8FF 100%)';
    }
  }

  _getVortexColors(mode) {
    switch (mode) {
      case 'cool':
        return { stroke1: '#00f5d4', stroke2: '#00bbf9', stroke3: '#3a86ff', glow: 'rgba(0, 245, 212, 0.45)' };
      case 'heat':
        return { stroke1: '#ff0054', stroke2: '#ff5400', stroke3: '#ffbe0b', glow: 'rgba(255, 84, 0, 0.5)' };
      case 'fan_only':
        return { stroke1: '#ffffff', stroke2: '#ced4da', stroke3: '#adb5bd', glow: 'rgba(255, 255, 255, 0.35)' };
      case 'dry':
        return { stroke1: '#ffbe0b', stroke2: '#fb5607', stroke3: '#ff006e', glow: 'rgba(255, 190, 11, 0.45)' };
      default:
        return { stroke1: '#48cae4', stroke2: '#90e0ef', stroke3: '#caf0f8', glow: 'rgba(72, 202, 228, 0.3)' };
    }
  }

  _adjustTemp(delta) {
    if (!this._hass) return;
    const climate = this._hass.states[this._config.climate_entity];
    if (!climate) return;
    const currentTarget = climate.attributes.temperature || 70;
    const newTarget = Math.round(currentTarget + delta);
    this._hass.callService('climate', 'set_temperature', {
      entity_id: this._config.climate_entity,
      temperature: newTarget
    });
  }

  _setHvacMode(mode) {
    if (!this._hass) return;
    this._hass.callService('climate', 'set_hvac_mode', {
      entity_id: this._config.climate_entity,
      hvac_mode: mode
    });
  }

  _openPopup(hash) {
    window.location.hash = hash;
  }

  render() {
    if (!this._hass || !this._config) return;

    const weather = this._hass.states[this._config.weather_entity] || { state: 'sunny', attributes: { temperature: 68, humidity: 50, wind_speed: 5 } };
    const climate = this._hass.states[this._config.climate_entity] || { state: 'off', attributes: { current_temperature: 72, temperature: 70, fan_mode: 'low' } };
    const sun = this._hass.states[this._config.sun_entity] || null;
    const humiditySensor = this._hass.states[this._config.humidity_entity] || null;

    const condition = (weather.state || 'sunny').toLowerCase();
    const outdoorTemp = Math.round(weather.attributes.temperature ?? 0);
    const outdoorHumidity = Math.round(weather.attributes.humidity ?? 0);
    const windSpeed = Math.round(weather.attributes.wind_speed ?? 0);

    const hvacState = (climate.state || 'off').toLowerCase();
    const isClimateOn = hvacState !== 'off';
    const indoorTemp = Math.round(climate.attributes.current_temperature ?? 72);
    const indoorTarget = Math.round(climate.attributes.temperature ?? 70);
    const indoorHumidity = humiditySensor ? Math.round(parseFloat(humiditySensor.state) || 40) : (climate.attributes.current_humidity ? Math.round(climate.attributes.current_humidity) : 45);
    const fanSpeed = climate.attributes.fan_mode || 'low';

    const sunPhase = this._getSunPhase(sun);
    const skyGradient = this._getSkyGradient(sunPhase, condition);
    const vortexColors = this._getVortexColors(hvacState);

    const isNight = sunPhase === 'night' || sunPhase === 'dusk';
    const isThunder = condition.includes('lightning') || condition.includes('thunder');
    const isRain = condition.includes('rain') || condition.includes('pour') || isThunder;
    const isSnow = condition.includes('snow');
    const isSunny = condition.includes('sunny') || condition.includes('clear');
    const isCloudy = condition.includes('cloud') || condition.includes('partlycloudy');
    const isFoggy = condition.includes('fog') || condition.includes('hazy') || condition.includes('mist');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          border-radius: 32px;
          overflow: hidden;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          user-select: none;
          box-shadow: 0 16px 44px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.22);
          background: #0a0e27;
          color: #ffffff;
        }

        .card-container {
          position: relative;
          width: 100%;
          height: 250px;
          overflow: hidden;
          border-radius: 32px;
          background: ${skyGradient};
          transition: background 1.2s ease;
          border: 1px solid rgba(255, 255, 255, 0.14);
        }

        /* Ambient Aurora Glow */
        .celestial-aurora {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 25% 30%, rgba(129, 140, 248, 0.42) 0%, rgba(192, 132, 252, 0.22) 35%, transparent 70%),
                      radial-gradient(ellipse at 80% 65%, rgba(56, 189, 248, 0.22) 0%, rgba(147, 51, 234, 0.18) 40%, transparent 65%);
          pointer-events: none;
          z-index: 1;
        }

        /* Celestial Moon */
        .celestial-moon {
          position: absolute;
          top: 14px;
          left: 20px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          box-shadow: -3px 3px 0 1px #fef08a, 0 0 18px rgba(254, 240, 138, 0.55);
          transform: rotate(-12deg);
          pointer-events: none;
          z-index: 2;
        }

        /* Twinkling Starfield */
        .starfield-layer {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 1;
        }

        .star {
          position: absolute;
          background: #ffffff;
          border-radius: 50%;
          opacity: 0.85;
          box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
          animation: star-twinkle 3.2s ease-in-out infinite alternate;
        }

        @keyframes star-twinkle {
          0% { opacity: 0.25; transform: scale(0.8); }
          50% { opacity: 0.95; transform: scale(1.3); }
          100% { opacity: 0.4; transform: scale(0.9); }
        }

        /* Sun Rays & Beams */
        .sun-rays {
          position: absolute;
          top: -24px;
          left: -24px;
          width: 160px;
          height: 160px;
          background: radial-gradient(circle, rgba(255, 245, 170, 0.6) 0%, rgba(255, 215, 90, 0.28) 40%, transparent 70%);
          border-radius: 50%;
          animation: sun-glisten 4s ease-in-out infinite alternate;
          pointer-events: none;
          z-index: 1;
        }

        .sun-beam {
          position: absolute;
          top: 50px;
          left: 50px;
          width: 180px;
          height: 2px;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.5) 0%, transparent 100%);
          transform-origin: 0 0;
        }

        @keyframes sun-glisten {
          0% { transform: scale(0.94); opacity: 0.7; }
          100% { transform: scale(1.18); opacity: 1; filter: drop-shadow(0 0 16px rgba(255, 220, 90, 0.75)); }
        }

        /* Drifting Clouds */
        .cloud {
          position: absolute;
          background: rgba(255, 255, 255, 0.22);
          border-radius: 40px;
          backdrop-filter: blur(5px);
          -webkit-backdrop-filter: blur(5px);
          animation: cloud-drift 24s linear infinite;
          pointer-events: none;
          z-index: 1;
        }

        @keyframes cloud-drift {
          0% { transform: translateX(-140px); }
          100% { transform: translateX(480px); }
        }

        /* Rain & Lightning */
        .rain-streak {
          position: absolute;
          width: 1.5px;
          height: 22px;
          background: linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.75));
          animation: rain-fall 0.75s linear infinite;
          pointer-events: none;
          z-index: 1;
        }

        @keyframes rain-fall {
          0% { transform: translate(0, -30px); opacity: 0; }
          40% { opacity: 0.85; }
          100% { transform: translate(-30px, 280px); opacity: 0; }
        }

        .lightning-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.85);
          opacity: 0;
          pointer-events: none;
          animation: lightning-strike 7s infinite;
          z-index: 2;
        }

        @keyframes lightning-strike {
          0%, 94%, 97%, 100% { opacity: 0; }
          95%, 96.5% { opacity: 0.85; }
        }

        /* Snow */
        .snowflake {
          position: absolute;
          color: rgba(255, 255, 255, 0.9);
          font-size: 11px;
          animation: snow-fall 4.2s linear infinite;
          pointer-events: none;
          z-index: 1;
        }

        @keyframes snow-fall {
          0% { transform: translateY(-15px) translateX(0); opacity: 0; }
          20% { opacity: 0.95; }
          100% { transform: translateY(270px) translateX(28px); opacity: 0.1; }
        }

        /* Architectural Floorplan Layer */
        .floorplan-layer {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 58%;
          height: 100%;
          pointer-events: none;
          z-index: 2;
          mask-image: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.6) 22%, #000000 100%);
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.6) 22%, #000000 100%);
        }

        .vortex-path {
          fill: none;
          stroke-linecap: round;
          stroke-dasharray: 8 6;
          animation: wind-flow 2.2s linear infinite;
        }

        @keyframes wind-flow {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -28; }
        }

        /* Liquid Glass Tint Overlay */
        .liquid-glass-tint {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(10, 14, 28, 0.18) 0%, rgba(14, 18, 34, 0.42) 55%, rgba(16, 20, 38, 0.58) 100%);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          pointer-events: none;
          z-index: 3;
        }

        /* Foreground Content Layer */
        .content-layer {
          position: relative;
          z-index: 5;
          height: 100%;
          padding: 18px 22px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        /* Row 1: Headers */
        .row-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.88);
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .header-left:hover {
          opacity: 0.8;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.88);
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
          cursor: pointer;
          transition: opacity 0.2s ease;
        }

        .header-right:hover {
          opacity: 0.8;
        }

        /* Row 2: Hero Temperatures & Centered Setpoint */
        .row-hero {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 12px;
        }

        .hero-left {
          display: flex;
          align-items: baseline;
          gap: 6px;
          text-align: left;
        }

        .weather-temp {
          font-size: 54px;
          font-weight: 300;
          letter-spacing: -2px;
          line-height: 1;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
        }

        .weather-cond {
          font-size: 15px;
          font-weight: 500;
          text-transform: capitalize;
          color: rgba(255, 255, 255, 0.9);
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
        }

        .hero-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .temp-controls {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.38);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 28px;
          padding: 4px 10px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .temp-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
          font-size: 19px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .temp-btn:hover {
          background: rgba(255, 255, 255, 0.32);
          transform: scale(1.1);
        }

        .temp-btn:active {
          transform: scale(0.92);
        }

        .target-val {
          font-size: 20px;
          font-weight: 800;
          min-width: 42px;
          text-align: center;
          color: ${isClimateOn ? vortexColors.stroke1 : '#ffffff'};
          text-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
        }

        .target-label-micro {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: rgba(255, 255, 255, 0.65);
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
        }

        .hero-right {
          display: flex;
          align-items: baseline;
          justify-content: flex-end;
          gap: 6px;
          text-align: right;
        }

        .indoor-cond {
          font-size: 15px;
          font-weight: 500;
          text-transform: capitalize;
          color: rgba(255, 255, 255, 0.88);
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
        }

        .indoor-temp {
          font-size: 54px;
          font-weight: 300;
          letter-spacing: -2px;
          line-height: 1;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
        }

        /* Row 3: Footer Telemetry & Mode Selector */
        .row-footer {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 10px;
        }

        .footer-left {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: flex-start;
        }

        .footer-center {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .footer-right {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: flex-end;
        }

        .pill-stat {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(0, 0, 0, 0.32);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.88);
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        }

        .mode-toggle-group {
          display: flex;
          gap: 5px;
          background: rgba(0, 0, 0, 0.28);
          padding: 3px;
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.14);
        }

        .mode-btn {
          background: transparent;
          border: 1px solid transparent;
          border-radius: 12px;
          padding: 4px 9px;
          color: rgba(255, 255, 255, 0.72);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .mode-btn:hover {
          background: rgba(255, 255, 255, 0.18);
          color: #ffffff;
        }

        .mode-btn.active {
          background: ${vortexColors.stroke1};
          color: #0c101c;
          border-color: ${vortexColors.stroke1};
          font-weight: 800;
          box-shadow: 0 0 12px ${vortexColors.glow};
        }
      </style>

      <div class="card-container">
        <!-- 1. Ambient Aurora / Sky Glow -->
        ${isNight ? `
          <div class="celestial-aurora"></div>
          <div class="celestial-moon"></div>
          <div class="starfield-layer">
            <div class="star" style="top: 14%; left: 16%; width: 2px; height: 2px; animation-delay: 0.1s;"></div>
            <div class="star" style="top: 28%; left: 32%; width: 2.5px; height: 2.5px; animation-delay: 0.9s;"></div>
            <div class="star" style="top: 18%; left: 48%; width: 1.5px; height: 1.5px; animation-delay: 1.5s;"></div>
            <div class="star" style="top: 36%; left: 62%; width: 2px; height: 2px; animation-delay: 0.4s;"></div>
            <div class="star" style="top: 15%; left: 78%; width: 2.5px; height: 2.5px; animation-delay: 2.1s;"></div>
            <div class="star" style="top: 42%; left: 88%; width: 1.5px; height: 1.5px; animation-delay: 1.2s;"></div>
            <div class="star" style="top: 60%; left: 24%; width: 1.5px; height: 1.5px; animation-delay: 1.8s;"></div>
            <div class="star" style="top: 75%; left: 72%; width: 2px; height: 2px; animation-delay: 0.7s;"></div>
          </div>
        ` : ''}

        ${isSunny && !isNight ? `
          <div class="sun-rays"></div>
          <div class="sun-beam" style="transform: rotate(15deg);"></div>
          <div class="sun-beam" style="transform: rotate(45deg);"></div>
          <div class="sun-beam" style="transform: rotate(75deg);"></div>
          <div class="sun-beam" style="transform: rotate(105deg);"></div>
        ` : ''}

        ${isCloudy ? `
          <div class="cloud" style="top: 20px; width: 110px; height: 30px; animation-duration: 28s;"></div>
          <div class="cloud" style="top: 55px; width: 150px; height: 38px; animation-duration: 21s; animation-delay: -9s; opacity: 0.18;"></div>
        ` : ''}

        ${isRain ? `
          <div class="rain-streak" style="left: 15%; animation-delay: 0.1s;"></div>
          <div class="rain-streak" style="left: 35%; animation-delay: 0.4s;"></div>
          <div class="rain-streak" style="left: 60%; animation-delay: 0.2s;"></div>
          <div class="rain-streak" style="left: 80%; animation-delay: 0.6s;"></div>
        ` : ''}

        ${isThunder ? `<div class="lightning-overlay"></div>` : ''}

        ${isSnow ? `
          <div class="snowflake" style="left: 20%; animation-delay: 0.3s;">❄</div>
          <div class="snowflake" style="left: 50%; animation-delay: 1.2s; font-size: 8px;">•</div>
          <div class="snowflake" style="left: 75%; animation-delay: 2.1s;">❄</div>
        ` : ''}

        <!-- 2. Architectural Floorplan Vector -->
        <svg class="floorplan-layer" viewBox="0 0 320 220" preserveAspectRatio="none">
          <defs>
            <linearGradient id="vortexGrad" x1="100%" y1="50%" x2="0%" y2="50%">
              <stop offset="0%" stop-color="${vortexColors.stroke1}" stop-opacity="0.9" />
              <stop offset="60%" stop-color="${vortexColors.stroke2}" stop-opacity="0.6" />
              <stop offset="100%" stop-color="${vortexColors.stroke3}" stop-opacity="0.05" />
            </linearGradient>
            <filter id="vortexGlow">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- Outer Studio Walls -->
          <rect x="15" y="18" width="290" height="195" rx="14" fill="none" stroke="rgba(255,255,255,0.28)" stroke-width="2" />
          <!-- Room Partitions -->
          <path d="M 15 100 L 110 100 L 110 18" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" stroke-dasharray="4 3" />
          <path d="M 200 150 L 305 150" fill="none" stroke="rgba(255,255,255,0.18)" stroke-width="1.5" stroke-dasharray="4 3" />

          <!-- Room Labels -->
          <text x="45" y="55" fill="rgba(255,255,255,0.3)" font-size="9" font-weight="700" letter-spacing="1">BED NOOK</text>
          <text x="145" y="65" fill="rgba(255,255,255,0.3)" font-size="9" font-weight="700" letter-spacing="1">LIVING</text>
          <text x="45" y="140" fill="rgba(255,255,255,0.3)" font-size="9" font-weight="700" letter-spacing="1">BATH</text>

          <!-- Minisplit Unit mounted on right wall -->
          <rect x="296" y="65" width="10" height="44" rx="3" fill="${isClimateOn ? vortexColors.stroke1 : 'rgba(255,255,255,0.35)'}" filter="url(#vortexGlow)" />

          <!-- Wind Vortices -->
          ${isClimateOn ? `
            <path class="vortex-path" d="M 296 72 C 230 65, 170 50, 70 60" stroke="url(#vortexGrad)" stroke-width="3" filter="url(#vortexGlow)" />
            <path class="vortex-path" d="M 296 82 C 220 82, 150 80, 40 105" stroke="url(#vortexGrad)" stroke-width="3.5" style="animation-duration: 1.8s;" filter="url(#vortexGlow)" />
            <path class="vortex-path" d="M 296 92 C 230 100, 160 120, 60 140" stroke="url(#vortexGrad)" stroke-width="3" style="animation-duration: 2.5s;" filter="url(#vortexGlow)" />
            <path class="vortex-path" d="M 296 100 C 240 115, 180 145, 90 170" stroke="url(#vortexGrad)" stroke-width="2.5" style="animation-duration: 2s;" filter="url(#vortexGlow)" />
          ` : `
            <path class="vortex-path" d="M 296 82 C 220 82, 170 80, 100 100" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" stroke-dasharray="4 8" style="animation-duration: 4s;" />
          `}
        </svg>

        <!-- 3. Liquid Glass Tint -->
        <div class="liquid-glass-tint"></div>

        <!-- 4. Foreground Content Layer -->
        <div class="content-layer">
          <!-- Row 1: Headers -->
          <div class="row-header">
            <div class="header-left" id="weather-nav">
              <ha-icon icon="${isNight ? 'mdi:weather-night' : 'mdi:weather-partly-cloudy'}"></ha-icon>
              <span>Outdoor · ${sunPhase.replace('_', ' ')}</span>
            </div>
            <div class="header-right" id="climate-nav">
              <span>Studio · AC</span>
              <ha-icon icon="mdi:floor-plan" style="--mdc-icon-size: 16px;"></ha-icon>
            </div>
          </div>

          <!-- Row 2: Hero Temperatures & Centered Setpoint -->
          <div class="row-hero">
            <div class="hero-left">
              <span class="weather-temp">${outdoorTemp}°</span>
              <span class="weather-cond">${condition}</span>
            </div>

            <div class="hero-center">
              <div class="temp-controls">
                <button class="temp-btn" id="btn-down" title="Lower Target">−</button>
                <span class="target-val">${indoorTarget}°</span>
                <button class="temp-btn" id="btn-up" title="Raise Target">+</button>
              </div>
              <span class="target-label-micro">Target Setpoint</span>
            </div>

            <div class="hero-right">
              <span class="indoor-cond">Indoor</span>
              <span class="indoor-temp">${indoorTemp}°</span>
            </div>
          </div>

          <!-- Row 3: Footer Telemetry & Mode Selector -->
          <div class="row-footer">
            <div class="footer-left">
              <span class="pill-stat"><ha-icon icon="mdi:water-percent" style="--mdc-icon-size: 14px;"></ha-icon>${outdoorHumidity}%</span>
              <span class="pill-stat"><ha-icon icon="mdi:weather-windy" style="--mdc-icon-size: 14px;"></ha-icon>${windSpeed} mph</span>
            </div>

            <div class="footer-center">
              <div class="mode-toggle-group">
                <button class="mode-btn ${hvacState === 'off' ? 'active' : ''}" data-mode="off">Off</button>
                <button class="mode-btn ${hvacState === 'cool' ? 'active' : ''}" data-mode="cool">Cool</button>
                <button class="mode-btn ${hvacState === 'heat' ? 'active' : ''}" data-mode="heat">Heat</button>
                <button class="mode-btn ${hvacState === 'fan_only' ? 'active' : ''}" data-mode="fan_only">Fan</button>
              </div>
            </div>

            <div class="footer-right">
              <span class="pill-stat"><ha-icon icon="mdi:fan" style="--mdc-icon-size: 14px;"></ha-icon>${fanSpeed}</span>
              <span class="pill-stat"><ha-icon icon="mdi:water-percent" style="--mdc-icon-size: 14px;"></ha-icon>${indoorHumidity}%</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    this.shadowRoot.getElementById('weather-nav')?.addEventListener('click', () => {
      this._openPopup('#weather');
    });

    this.shadowRoot.getElementById('climate-nav')?.addEventListener('click', () => {
      this._openPopup('#climate');
    });

    this.shadowRoot.getElementById('btn-down')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._adjustTemp(-1);
    });

    this.shadowRoot.getElementById('btn-up')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._adjustTemp(1);
    });

    this.shadowRoot.querySelectorAll('.mode-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const mode = btn.getAttribute('data-mode');
        this._setHvacMode(mode);
      });
    });
  }
}

customElements.define('studio-climate-weather-card', StudioClimateWeatherCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'studio-climate-weather-card',
  name: 'Studio Climate & Weather Card',
  description: 'Atmospheric dynamic sky and weather combined with studio floorplan and animated HVAC wind vortices.'
});
