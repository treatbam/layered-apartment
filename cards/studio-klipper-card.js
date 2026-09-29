class StudioKlipperCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._showCamera = false;
    this._confirmCancel = false;
  }

  static getStubConfig() {
    return {
      title: 'MainPi Klipper',
      web_url: 'http://192.168.86.220',
      print_state_entity: 'sensor.mainpi_current_print_state',
      progress_entity: 'sensor.mainpi_progress',
      extruder_temp_entity: 'sensor.mainpi_extruder_temperature',
      bed_temp_entity: 'sensor.mainpi_bed_temperature'
    };
  }

  setConfig(config) {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    this._config = {
      title: config.title || 'MainPi Klipper',
      web_url: config.web_url || 'http://192.168.86.220',
      print_state_entity: config.print_state_entity || 'sensor.mainpi_current_print_state',
      progress_entity: config.progress_entity || 'sensor.mainpi_progress',
      extruder_temp_entity: config.extruder_temp_entity || 'sensor.mainpi_extruder_temperature',
      bed_temp_entity: config.bed_temp_entity || 'sensor.mainpi_bed_temperature',
      filename_entity: config.filename_entity || 'sensor.mainpi_filename',
      current_layer_entity: config.current_layer_entity || 'sensor.mainpi_current_layer',
      total_layer_entity: config.total_layer_entity || 'sensor.mainpi_total_layer',
      time_left_entity: config.time_left_entity || 'sensor.mainpi_print_time_left',
      eta_entity: config.eta_entity || 'sensor.mainpi_print_eta',
      fan_rpm_entity: config.fan_rpm_entity || 'sensor.mainpi_fan_rpm',
      power_entity: config.power_entity || 'sensor.klipper_energy_power',
      mcu_temp_entity: config.mcu_temp_entity || 'sensor.mainpi_mcu_temp',
      tool_x_entity: config.tool_x_entity || 'sensor.mainpi_toolhead_position_x',
      tool_y_entity: config.tool_y_entity || 'sensor.mainpi_toolhead_position_y',
      tool_z_entity: config.tool_z_entity || 'sensor.mainpi_toolhead_position_z',
      light_entity: config.light_entity || 'light.moonraker_lightswitch',
      thumbnail_camera: config.thumbnail_camera || 'camera.mainpi_thumbnail',
      stream_camera: config.stream_camera || 'camera.mainpi_usb',
      btn_pause: config.btn_pause || 'button.mainpi_pause_print',
      btn_resume: config.btn_resume || 'button.mainpi_resume_print',
      btn_cancel: config.btn_cancel || 'button.mainpi_cancel_print',
      btn_home: config.btn_home || 'button.mainpi_home_all_axes',
      btn_estop: config.btn_estop || 'button.mainpi_emergency_stop',
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

  _getState(entityId) {
    if (!this._hass || !entityId) return null;
    return this._hass.states[entityId] || null;
  }

  _getVal(entityId, defaultVal = 0) {
    const s = this._getState(entityId);
    if (!s || s.state === 'unavailable' || s.state === 'unknown') return defaultVal;
    const n = parseFloat(s.state);
    return isNaN(n) ? s.state : n;
  }

  _callButton(entityId) {
    if (!this._hass || !entityId) return;
    this._hass.callService('button', 'press', { entity_id: entityId });
  }

  _toggleLight() {
    if (!this._hass || !this._config.light_entity) return;
    this._hass.callService('light', 'toggle', { entity_id: this._config.light_entity });
  }

  _formatTime(seconds) {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '';
    const s = Math.floor(seconds);
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  }

  render() {
    if (!this._hass || !this._config) return;

    // States & Telemetry
    const printStateRaw = (this._getState(this._config.print_state_entity)?.state || 'standby').toLowerCase();
    const isPrinting = printStateRaw === 'printing';
    const isPaused = printStateRaw === 'paused';
    const isComplete = printStateRaw === 'complete';
    const isError = printStateRaw === 'error' || printStateRaw === 'cancelled';
    const isStandby = !isPrinting && !isPaused && !isComplete && !isError;

    const progress = Math.round(Number(this._getVal(this._config.progress_entity, 0)));
    const extruderTemp = Math.round(Number(this._getVal(this._config.extruder_temp_entity, 0)));
    const bedTemp = Math.round(Number(this._getVal(this._config.bed_temp_entity, 0)));
    const mcuTemp = Math.round(Number(this._getVal(this._config.mcu_temp_entity, 0)));
    const powerW = Math.round(Number(this._getVal(this._config.power_entity, 0)));
    const fanRpm = Math.round(Number(this._getVal(this._config.fan_rpm_entity, 0)));

    const toolX = Number(this._getVal(this._config.tool_x_entity, 0)).toFixed(0);
    const toolY = Number(this._getVal(this._config.tool_y_entity, 0)).toFixed(0);
    const toolZ = Number(this._getVal(this._config.tool_z_entity, 0)).toFixed(1);

    const currentLayer = Number(this._getVal(this._config.current_layer_entity, 0));
    const totalLayer = Number(this._getVal(this._config.total_layer_entity, 0));
    const filename = this._getState(this._config.filename_entity)?.state || '';
    const cleanFilename = filename ? filename.replace(/\.(gcode|gco|g)$/i, '') : '';

    const timeLeftSec = Number(this._getVal(this._config.time_left_entity, 0));
    const timeLeftFormatted = this._formatTime(timeLeftSec);
    const etaRaw = this._getState(this._config.eta_entity)?.state;
    let etaFormatted = '';
    if (etaRaw && etaRaw !== 'unknown' && etaRaw !== 'unavailable') {
      try {
        const d = new Date(etaRaw);
        etaFormatted = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      } catch (err) {}
    }

    const lightState = this._getState(this._config.light_entity)?.state === 'on';

    // Camera entity picture
    const cameraObj = this._showCamera 
      ? this._getState(this._config.stream_camera) 
      : this._getState(this._config.thumbnail_camera);
    const cameraImg = cameraObj?.attributes?.entity_picture;

    // Semantic status theming
    let stateColor = '#38bdf8'; // Sky blue standby
    let stateLabel = 'Ready / Standby';
    let stateGlow = 'rgba(56, 189, 248, 0.35)';

    if (isPrinting) {
      stateColor = '#00f5d4'; // Neon cyan
      stateLabel = 'Printing';
      stateGlow = 'rgba(0, 245, 212, 0.45)';
    } else if (isPaused) {
      stateColor = '#f59e0b'; // Amber
      stateLabel = 'Paused';
      stateGlow = 'rgba(245, 158, 11, 0.45)';
    } else if (isComplete) {
      stateColor = '#10b981'; // Emerald
      stateLabel = 'Print Complete';
      stateGlow = 'rgba(16, 185, 129, 0.45)';
    } else if (isError) {
      stateColor = '#ef4444'; // Red
      stateLabel = printStateRaw.toUpperCase();
      stateGlow = 'rgba(239, 68, 68, 0.45)';
    }

    // Thermal color grading
    const nozzleColor = extruderTemp > 160 ? '#ff5400' : extruderTemp > 45 ? '#ffbe0b' : '#38bdf8';
    const bedColor = bedTemp > 50 ? '#ff5400' : bedTemp > 35 ? '#ffbe0b' : '#38bdf8';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          border-radius: 32px;
          overflow: hidden;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          user-select: none;
          background: radial-gradient(circle at 10% 20%, ${stateGlow} 0%, transparent 55%),
                      radial-gradient(circle at 90% 85%, rgba(168, 85, 247, 0.16) 0%, transparent 60%),
                      linear-gradient(135deg, rgba(16, 20, 32, 0.96) 0%, rgba(10, 12, 20, 0.98) 100%);
          border: 1px solid ${isPrinting ? 'rgba(0, 245, 212, 0.35)' : 'rgba(255, 255, 255, 0.12)'};
          box-shadow: 0 16px 44px rgba(0, 0, 0, 0.45), 0 0 20px ${stateGlow}, inset 0 1px 1px rgba(255, 255, 255, 0.22);
          color: #ffffff;
          position: relative;
          transition: border-color 0.8s ease, box-shadow 0.8s ease;
        }

        .card-inner {
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* --- HEADER ROW --- */
        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .printer-id-group {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }

        .printer-icon-wrap {
          width: 46px;
          height: 46px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${stateColor};
          box-shadow: 0 0 14px ${stateGlow};
          position: relative;
        }

        .status-dot {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: ${stateColor};
          box-shadow: 0 0 8px ${stateColor};
          ${isPrinting ? 'animation: dotPulse 1.8s infinite alternate;' : ''}
        }

        @keyframes dotPulse {
          0% { transform: scale(0.9); opacity: 0.8; }
          100% { transform: scale(1.3); opacity: 1; filter: drop-shadow(0 0 4px ${stateColor}); }
        }

        .title-meta-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .printer-title {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.2px;
          color: #ffffff;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .state-badge {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          padding: 2px 8px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.1);
          color: ${stateColor};
          border: 1px solid ${stateColor};
        }

        .printer-sub {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.65);
          font-weight: 500;
        }

        .header-controls {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .hdr-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #ffffff;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .hdr-btn:hover {
          background: rgba(255, 255, 255, 0.22);
          transform: scale(1.08);
        }

        .hdr-btn.active-light {
          background: #ffbe0b;
          color: #0b0e17;
          border-color: #ffbe0b;
          box-shadow: 0 0 12px rgba(255, 190, 11, 0.6);
        }

        .power-chip {
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 4px 10px;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.85);
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        /* --- ACTIVE JOB SHOWCASE (Bambu Style) --- */
        .job-card {
          background: rgba(0, 0, 0, 0.32);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .job-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }

        .filename-text {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .job-badge-pill {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 3px 8px;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.8);
          white-space: nowrap;
        }

        /* Hero Progress Bar */
        .progress-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .progress-pct-big {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.5px;
          color: ${stateColor};
          text-shadow: 0 0 12px ${stateGlow};
        }

        .progress-meta {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
        }

        .bambu-progress-track {
          width: 100%;
          height: 10px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 5px;
          overflow: hidden;
          position: relative;
        }

        .bambu-progress-fill {
          height: 100%;
          border-radius: 50px;
          background: linear-gradient(90deg, #38bdf8 0%, ${stateColor} 100%);
          box-shadow: 0 0 10px ${stateColor};
          transition: width 0.6s ease;
          position: relative;
        }

        .bambu-progress-fill::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
          ${isPrinting ? 'animation: shimmer 2s infinite;' : ''}
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        /* --- DUAL BAMBU THERMAL DIALS --- */
        .thermal-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .thermal-card {
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 18px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s ease;
        }

        .thermal-icon-wrap {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .thermal-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .thermal-label {
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: rgba(255, 255, 255, 0.6);
        }

        .thermal-val {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.3px;
        }

        /* --- TELEMETRY MICRO-GRID --- */
        .telemetry-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .telem-pill {
          background: rgba(0, 0, 0, 0.22);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          padding: 8px 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 3px;
        }

        .telem-label {
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: rgba(255, 255, 255, 0.5);
        }

        .telem-val {
          font-size: 12px;
          font-weight: 700;
          color: #ffffff;
        }

        /* --- CAMERA / THUMBNAIL EXPANDABLE --- */
        .camera-container {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          overflow: hidden;
          position: relative;
          max-height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .camera-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          max-height: 180px;
        }

        /* --- ACTION CONTROLS DECK --- */
        .controls-deck {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-top: 4px;
        }

        .action-btn {
          flex: 1;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 16px;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 700;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        .action-btn:active {
          transform: scale(0.96);
        }

        .action-btn.btn-pause {
          background: rgba(245, 158, 11, 0.22);
          border-color: rgba(245, 158, 11, 0.5);
          color: #fbbf24;
        }

        .action-btn.btn-resume {
          background: rgba(0, 245, 212, 0.22);
          border-color: rgba(0, 245, 212, 0.5);
          color: #00f5d4;
        }

        .action-btn.btn-cancel {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.45);
          color: #f87171;
        }

        .action-btn.btn-estop {
          background: rgba(239, 68, 68, 0.35);
          border-color: #ef4444;
          color: #ffffff;
          font-weight: 800;
        }
      </style>

      <div class="card-inner">
        <!-- 1. Header -->
        <div class="card-header">
          <div class="printer-id-group" id="headerClick">
            <div class="printer-icon-wrap">
              <span class="status-dot"></span>
              <ha-icon icon="mdi:printer-3d" style="--mdc-icon-size: 24px;"></ha-icon>
            </div>
            <div class="title-meta-group">
              <div class="printer-title">
                ${this._config.title}
                <span class="state-badge">${stateLabel}</span>
              </div>
              <span class="printer-sub">mainsailos · Klipper</span>
            </div>
          </div>

          <div class="header-controls">
            <span class="power-chip">⚡ ${powerW} W</span>
            <button class="hdr-btn ${lightState ? 'active-light' : ''}" id="btnLight" title="Printer Light">
              <ha-icon icon="mdi:lightbulb" style="--mdc-icon-size: 18px;"></ha-icon>
            </button>
            <a class="hdr-btn" href="${this._config.web_url}" target="_blank" title="Open Mainsail UI">
              <ha-icon icon="mdi:open-in-new" style="--mdc-icon-size: 18px;"></ha-icon>
            </a>
          </div>
        </div>

        <!-- 2. Active Job Showcase & Progress (when printing or paused or has filename) -->
        <div class="job-card">
          <div class="job-top-row">
            <span class="filename-text" title="${filename}">${cleanFilename || 'Printer Ready / Standby'}</span>
            ${totalLayer > 0 ? `
              <span class="job-badge-pill">Layer ${currentLayer} / ${totalLayer}</span>
            ` : ''}
          </div>

          <!-- Hero Progress -->
          <div class="progress-section">
            <div class="progress-header">
              <span class="progress-pct-big">${progress}%</span>
              <span class="progress-meta">
                ${timeLeftFormatted ? `⏱️ ${timeLeftFormatted} left` : ''}
                ${etaFormatted ? ` \u00b7 ETA ${etaFormatted}` : ''}
              </span>
            </div>
            <div class="bambu-progress-track">
              <div class="bambu-progress-fill" style="width: ${progress}%;"></div>
            </div>
          </div>
        </div>

        <!-- 3. Dual Bambu-Style Thermal Dials -->
        <div class="thermal-row">
          <div class="thermal-card">
            <div class="thermal-icon-wrap" style="color: ${nozzleColor}; box-shadow: 0 0 10px ${nozzleColor}40;">
              <ha-icon icon="mdi:printer-3d-nozzle-heat" style="--mdc-icon-size: 22px;"></ha-icon>
            </div>
            <div class="thermal-info">
              <span class="thermal-label">Nozzle</span>
              <span class="thermal-val" style="color: ${nozzleColor};">${extruderTemp}\u00b0C</span>
            </div>
          </div>

          <div class="thermal-card">
            <div class="thermal-icon-wrap" style="color: ${bedColor}; box-shadow: 0 0 10px ${bedColor}40;">
              <ha-icon icon="mdi:radiator" style="--mdc-icon-size: 22px;"></ha-icon>
            </div>
            <div class="thermal-info">
              <span class="thermal-label">Heatbed</span>
              <span class="thermal-val" style="color: ${bedColor};">${bedTemp}\u00b0C</span>
            </div>
          </div>
        </div>

        <!-- 4. Telemetry Micro-Grid -->
        <div class="telemetry-grid">
          <div class="telem-pill">
            <span class="telem-label">Fan</span>
            <span class="telem-val">${fanRpm > 0 ? `${fanRpm} RPM` : '0 RPM'}</span>
          </div>
          <div class="telem-pill">
            <span class="telem-label">Tool Z</span>
            <span class="telem-val">${toolZ} mm</span>
          </div>
          <div class="telem-pill">
            <span class="telem-label">MCU Temp</span>
            <span class="telem-val">${mcuTemp}\u00b0C</span>
          </div>
          <div class="telem-pill">
            <span class="telem-label">Position</span>
            <span class="telem-val">${toolX}, ${toolY}</span>
          </div>
        </div>

        <!-- 5. Camera / Thumbnail Preview (if available) -->
        ${cameraImg ? `
          <div class="camera-container" id="cameraToggle" title="Click to switch preview" style="cursor: pointer;">
            <img class="camera-img" src="${cameraImg}" alt="3D Print Preview">
          </div>
        ` : ''}

        <!-- 6. Bambu Action Controls Deck -->
        <div class="controls-deck">
          ${isPrinting ? `
            <button class="action-btn btn-pause" id="btnPause">
              <ha-icon icon="mdi:pause" style="--mdc-icon-size: 18px;"></ha-icon>
              <span>Pause</span>
            </button>
            <button class="action-btn btn-cancel" id="btnCancel">
              <ha-icon icon="mdi:stop" style="--mdc-icon-size: 18px;"></ha-icon>
              <span>${this._confirmCancel ? 'Confirm Stop?' : 'Cancel'}</span>
            </button>
          ` : isPaused ? `
            <button class="action-btn btn-resume" id="btnResume">
              <ha-icon icon="mdi:play" style="--mdc-icon-size: 18px;"></ha-icon>
              <span>Resume</span>
            </button>
            <button class="action-btn btn-cancel" id="btnCancel">
              <ha-icon icon="mdi:stop" style="--mdc-icon-size: 18px;"></ha-icon>
              <span>${this._confirmCancel ? 'Confirm Stop?' : 'Cancel'}</span>
            </button>
          ` : `
            <button class="action-btn" id="btnHome">
              <ha-icon icon="mdi:home" style="--mdc-icon-size: 18px;"></ha-icon>
              <span>Home All</span>
            </button>
            <button class="action-btn" id="btnCamToggle">
              <ha-icon icon="mdi:camera" style="--mdc-icon-size: 18px;"></ha-icon>
              <span>${this._showCamera ? 'Thumbnail' : 'Webcam'}</span>
            </button>
          `}
          <button class="action-btn btn-estop" id="btnEstop" title="Emergency Stop">
            <ha-icon icon="mdi:alert-octagon" style="--mdc-icon-size: 18px;"></ha-icon>
            <span>E-Stop</span>
          </button>
        </div>
      </div>
    `;

    // Event listeners
    this.shadowRoot.getElementById('btnLight')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleLight();
    });

    this.shadowRoot.getElementById('btnPause')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._callButton(this._config.btn_pause);
    });

    this.shadowRoot.getElementById('btnResume')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._callButton(this._config.btn_resume);
    });

    this.shadowRoot.getElementById('btnCancel')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!this._confirmCancel) {
        this._confirmCancel = true;
        this.render();
        setTimeout(() => {
          this._confirmCancel = false;
          this.render();
        }, 4000);
      } else {
        this._callButton(this._config.btn_cancel);
        this._confirmCancel = false;
        this.render();
      }
    });

    this.shadowRoot.getElementById('btnHome')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._callButton(this._config.btn_home);
    });

    this.shadowRoot.getElementById('btnEstop')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to trigger EMERGENCY STOP on Klipper?')) {
        this._callButton(this._config.btn_estop);
      }
    });

    this.shadowRoot.getElementById('btnCamToggle')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._showCamera = !this._showCamera;
      this.render();
    });

    this.shadowRoot.getElementById('cameraToggle')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._showCamera = !this._showCamera;
      this.render();
    });
  }
}

customElements.define('studio-klipper-card', StudioKlipperCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'studio-klipper-card',
  name: 'Studio Klipper 3D Printer Card',
  description: 'Bambu Lab lookalike card for Klipper / Moonraker with dual thermal dials, job progress, webcam preview, and quick controls.'
});
