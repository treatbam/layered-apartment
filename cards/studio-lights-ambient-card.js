class StudioLightsAmbientCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._expandedAreas = { living: false, desk: false, bed: false, bath: false };
    this._selectedLightForColors = null;
  }

  static getStubConfig() {
    return {
      title: 'Studio Lighting'
    };
  }

  setConfig(config) {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    this._config = {
      title: config.title || 'Studio Lighting',
      popup_hash: config.popup_hash || '#lights',
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

  _toggleArea(areaKey) {
    this._expandedAreas[areaKey] = !this._expandedAreas[areaKey];
    this.render();
  }

  _toggleEntity(entityId, e) {
    if (e) e.stopPropagation();
    if (!this._hass) return;
    this._hass.callService('light', 'toggle', { entity_id: entityId });
  }

  _toggleRoom(areaEntities, turnOn, e) {
    if (e) e.stopPropagation();
    if (!this._hass || !areaEntities || areaEntities.length === 0) return;
    this._hass.callService('light', turnOn ? 'turn_on' : 'turn_off', {
      entity_id: areaEntities
    });
  }

  _setBrightness(entityId, pct, e) {
    if (e) e.stopPropagation();
    if (!this._hass) return;
    this._hass.callService('light', 'turn_on', {
      entity_id: entityId,
      brightness_pct: Math.max(1, Math.min(100, Math.round(pct)))
    });
  }

  _setMasterBrightness(onEntityIds, pct, e) {
    if (e) e.stopPropagation();
    if (!this._hass || !onEntityIds || onEntityIds.length === 0) return;
    this._hass.callService('light', 'turn_on', {
      entity_id: onEntityIds,
      brightness_pct: Math.max(1, Math.min(100, Math.round(pct)))
    });
  }

  _setColor(entityId, colorType, value, e) {
    if (e) e.stopPropagation();
    if (!this._hass) return;
    if (colorType === 'kelvin') {
      this._hass.callService('light', 'turn_on', {
        entity_id: entityId,
        color_temp_kelvin: value
      });
    } else if (colorType === 'rgb') {
      this._hass.callService('light', 'turn_on', {
        entity_id: entityId,
        rgb_color: value
      });
    } else if (colorType === 'script') {
      const scriptName = value.replace('script.', '');
      this._hass.callService('script', scriptName, { target_entity: entityId });
    }
  }

  _openMoreInfo(entityId, e) {
    if (e) e.stopPropagation();
    const event = new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true
    });
    this.dispatchEvent(event);
  }

  _toggleAllLights(turnOn) {
    if (!this._hass) return;
    const allIds = this._getAllEntityIds();
    this._hass.callService('light', turnOn ? 'turn_on' : 'turn_off', {
      entity_id: allIds
    });
  }

  _getAllEntityIds() {
    return [
      'light.ceiling_lights', 'light.ceiling_one', 'light.ceiling_two',
      'light.kitchen_lamp_light', 'light.lampfloor_light_2', 'light.floorlamp_glow',
      'light.beam', 'light.threelamps', 'light.floor_light', 'light.shelf',
      'light.monitor', 'light.hue_play_left', 'light.hue_play_right',
      'light.printer_light', 'light.huestrips', 'light.moonraker_lightswitch',
      'light.closet_beam', 'light.closet_lighting', 'light.shelf_lamp',
      'light.wled', 'light.bathroom_clean_right', 'light.bathroom_clean_left',
      'light.vanityplus'
    ];
  }

  _computeAmbientGlow(onLights) {
    if (!onLights || onLights.length === 0) {
      return {
        bg: 'linear-gradient(135deg, rgba(16, 20, 32, 0.95) 0%, rgba(12, 14, 24, 0.98) 100%)',
        accent: '#5a6b8c',
        glow: 'none',
        accentRgb: [90, 107, 140]
      };
    }

    const rgbColors = [];
    let totalBri = 0;

    for (const l of onLights) {
      const attrs = l.attributes || {};
      totalBri += (attrs.brightness || 128);
      if (attrs.rgb_color && Array.isArray(attrs.rgb_color)) {
        rgbColors.push(attrs.rgb_color);
      } else if (attrs.color_temp_kelvin) {
        const k = attrs.color_temp_kelvin;
        if (k < 2600) rgbColors.push([255, 147, 41]);
        else if (k < 3200) rgbColors.push([255, 185, 115]);
        else if (k < 4500) rgbColors.push([255, 220, 175]);
        else rgbColors.push([215, 235, 255]);
      } else {
        rgbColors.push([255, 215, 150]);
      }
    }

    const c1 = rgbColors[0] || [255, 180, 80];
    const c2 = rgbColors[Math.floor(rgbColors.length / 2)] || c1;
    const c3 = rgbColors[rgbColors.length - 1] || c2;
    const avgBriPct = Math.round((totalBri / (onLights.length * 255)) * 100);

    const alpha1 = Math.min(0.55, 0.22 + (avgBriPct / 100) * 0.32);
    const alpha2 = Math.min(0.48, 0.18 + (avgBriPct / 100) * 0.28);
    const alpha3 = Math.min(0.38, 0.12 + (avgBriPct / 100) * 0.22);

    const bg = `
      radial-gradient(ellipse at 15% 20%, rgba(${c1[0]}, ${c1[1]}, ${c1[2]}, ${alpha1}) 0%, transparent 58%),
      radial-gradient(ellipse at 85% 75%, rgba(${c2[0]}, ${c2[1]}, ${c2[2]}, ${alpha2}) 0%, transparent 60%),
      radial-gradient(circle at 50% 50%, rgba(${c3[0]}, ${c3[1]}, ${c3[2]}, ${alpha3}) 0%, transparent 70%),
      linear-gradient(135deg, rgba(16, 20, 34, 0.94) 0%, rgba(11, 14, 24, 0.98) 100%)
    `;

    return {
      bg,
      accent: `rgb(${c1[0]}, ${c1[1]}, ${c1[2]})`,
      glow: `0 0 28px rgba(${c1[0]}, ${c1[1]}, ${c1[2]}, 0.42)`,
      accentRgb: c1
    };
  }

  render() {
    if (!this._hass) return;

    const areaDefs = [
      {
        key: 'living',
        name: 'Living & Lounge',
        icon: 'mdi:sofa',
        entities: [
          'light.ceiling_lights',
          'light.lampfloor_light_2',
          'light.floorlamp_glow',
          'light.kitchen_lamp_light',
          'light.beam',
          'light.threelamps',
          'light.floor_light',
          'light.shelf'
        ]
      },
      {
        key: 'desk',
        name: 'Desk & Tech',
        icon: 'mdi:desktop-classic',
        entities: [
          'light.monitor',
          'light.hue_play_left',
          'light.hue_play_right',
          'light.huestrips',
          'light.printer_light',
          'light.moonraker_lightswitch'
        ]
      },
      {
        key: 'bed',
        name: 'Bed & Ambiance',
        icon: 'mdi:bed-king',
        entities: [
          'light.closet_beam',
          'light.closet_lighting',
          'light.shelf_lamp',
          'light.wled'
        ]
      },
      {
        key: 'bath',
        name: 'Bathroom',
        icon: 'mdi:shower',
        entities: [
          'light.bathroom_clean_right',
          'light.bathroom_clean_left',
          'light.vanityplus'
        ]
      }
    ];

    const allAreaEntities = areaDefs.flatMap(a => a.entities);
    const existingEntities = allAreaEntities.filter(id => this._hass.states[id]);
    const onLights = existingEntities
      .map(id => this._hass.states[id])
      .filter(s => s && s.state === 'on');

    const onEntityIds = onLights.map(s => s.entity_id);
    const ambient = this._computeAmbientGlow(onLights);
    const onCount = onLights.length;
    const isAnyOn = onCount > 0;

    let totalBri = 0;
    onLights.forEach(l => totalBri += (l.attributes.brightness || 0));
    const avgBri = onCount > 0 ? Math.round((totalBri / (onCount * 255)) * 100) : 0;

    const partyHueState = this._hass.states['input_boolean.party_hue']?.state === 'on';

    // Color/Temp preset definitions
    // LIFX Themes / Scenes shortcuts instead of generic colors
    const colorPresets = [
      { name: 'Warm White', type: 'kelvin', value: 2700, icon: 'mdi:white-balance-incandescent', bg: 'linear-gradient(135deg, #FFB973, #FFA242)' },
      { name: 'Miami Theme', type: 'script', value: 'script.lifx_theme_miami', icon: 'mdi:palm-tree', bg: 'linear-gradient(135deg, #FF0050, #00F5D4)' },
      { name: 'Cyberpunk Theme', type: 'script', value: 'script.lifx_theme_cyberpunk', icon: 'mdi:city', bg: 'linear-gradient(135deg, #9D4EDD, #00F5D4)' },
      { name: 'Fire Effect', type: 'script', value: 'script.lifx_fireeffect', icon: 'mdi:fire', bg: 'linear-gradient(135deg, #FFAA00, #FF0050)' }
    ];

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          border-radius: 32px;
          overflow: hidden;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          user-select: none;
          background: ${ambient.bg};
          border: 1px solid ${isAnyOn ? `rgba(${ambient.accentRgb[0]}, ${ambient.accentRgb[1]}, ${ambient.accentRgb[2]}, 0.35)` : 'rgba(255, 255, 255, 0.12)'};
          box-shadow: 0 16px 44px rgba(0, 0, 0, 0.42), ${ambient.glow}, inset 0 1px 1px rgba(255, 255, 255, 0.22);
          transition: background 1.2s ease, border-color 0.8s ease, box-shadow 0.8s ease;
          color: #ffffff;
          position: relative;
        }

        .card-body {
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* --- HEADER ROW --- */
        .header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
        }

        .header-title-group {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .studio-icon-wrap {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: ${isAnyOn ? ambient.accent : 'rgba(255, 255, 255, 0.08)'};
          color: ${isAnyOn ? '#0d111d' : '#ffffff'};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: ${isAnyOn ? ambient.glow : 'none'};
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .title-text-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .card-title {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: -0.3px;
          color: #ffffff;
        }

        .card-subtitle {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.68);
          font-weight: 500;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .master-toggle-btn {
          background: ${isAnyOn ? 'rgba(255, 255, 255, 0.16)' : 'rgba(255, 255, 255, 0.08)'};
          border: 1px solid rgba(255, 255, 255, 0.18);
          color: #ffffff;
          padding: 7px 16px;
          border-radius: 22px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .master-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.28);
          transform: scale(1.05);
        }

        .master-toggle-btn:active {
          transform: scale(0.95);
        }

        /* --- STUDIO MASTER BRIGHTNESS BAR --- */
        .master-brightness-wrap {
          display: ${isAnyOn ? 'flex' : 'none'};
          align-items: center;
          gap: 12px;
          padding: 8px 14px;
          background: rgba(0, 0, 0, 0.32);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }

        .master-brightness-slider {
          flex: 1;
          height: 6px;
          -webkit-appearance: none;
          appearance: none;
          background: rgba(255, 255, 255, 0.22);
          border-radius: 3px;
          outline: none;
        }

        .master-brightness-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
        }

        .master-bri-label {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.7);
        }

        /* --- ROOM / AREA TILES (Room Card Plus) --- */
        .areas-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .area-item {
          background: rgba(0, 0, 0, 0.24);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.25s ease;
        }

        .area-item.open {
          background: rgba(0, 0, 0, 0.35);
          border-color: rgba(255, 255, 255, 0.16);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        }

        .area-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          cursor: pointer;
          gap: 12px;
        }

        .area-name-group {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
        }

        .area-icon-wrap {
          width: 32px;
          height: 32px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.85);
          transition: all 0.2s ease;
        }

        .area-icon-wrap.active {
          background: ${ambient.accent};
          color: #0b0e17;
          box-shadow: 0 0 10px ${ambient.accent};
        }

        .area-pill-badge {
          background: rgba(255, 255, 255, 0.12);
          padding: 3px 9px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.8);
        }

        .area-pill-badge.active {
          background: ${ambient.accent};
          color: #0c101c;
          font-weight: 800;
        }

        .area-right-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .room-toggle-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #ffffff;
          padding: 4px 10px;
          border-radius: 14px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .room-toggle-btn:hover {
          background: rgba(255, 255, 255, 0.22);
        }

        .room-toggle-btn.on {
          background: rgba(255, 255, 255, 0.24);
          border-color: rgba(255, 255, 255, 0.35);
        }

        .chevron-icon {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          color: rgba(255, 255, 255, 0.5);
        }

        .area-item.open .chevron-icon {
          transform: rotate(180deg);
        }

        /* --- FOLDOUT DRAWER WITH TACTILE LIGHT TILES --- */
        .foldout-drawer {
          display: none;
          padding: 12px 16px 16px 16px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          flex-direction: column;
          gap: 12px;
        }

        .area-item.open .foldout-drawer {
          display: flex;
        }

        .light-card-row {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 16px;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: all 0.2s ease;
        }

        .light-card-row.on {
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(255, 255, 255, 0.18);
        }

        .light-main-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .light-identity {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          flex: 1;
          overflow: hidden;
        }

        .light-bulb-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          flex-shrink: 0;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .light-bulb-btn:hover {
          transform: scale(1.1);
        }

        .light-bulb-btn.on {
          color: #0b0e17;
          border-color: transparent;
        }

        .light-info-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
          overflow: hidden;
        }

        .light-name {
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .light-status-text {
          font-size: 11px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
        }

        .light-controls-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-more-info {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.45);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .btn-more-info:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }

        /* Tactile Light Slider */
        .slider-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
        }

        .slider-pill {
          flex: 1;
          height: 6px;
          -webkit-appearance: none;
          appearance: none;
          background: rgba(255, 255, 255, 0.18);
          border-radius: 3px;
          outline: none;
        }

        .slider-pill::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
          transition: transform 0.15s ease;
        }

        .slider-pill::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }

        .bri-badge-val {
          font-size: 11px;
          font-weight: 800;
          min-width: 32px;
          text-align: right;
          color: rgba(255, 255, 255, 0.85);
        }

        /* Preset Color Buttons Bar */
        .presets-bar {
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          padding: 2px 0;
        }

        .preset-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.3);
          cursor: pointer;
          flex-shrink: 0;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .preset-dot:hover {
          transform: scale(1.25);
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
        }

        /* --- QUICK CHIPS FOOTER --- */
        .quick-chips-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 2px;
        }

        .chip-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 16px;
          padding: 8px 14px;
          font-size: 12px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .chip-btn:hover {
          background: rgba(255, 255, 255, 0.22);
          transform: translateY(-1px);
        }

        .chip-btn.active-party {
          background: #9d4edd;
          color: #ffffff;
          border-color: #c77dff;
          box-shadow: 0 0 16px rgba(157, 78, 221, 0.6);
          animation: partyPulse 2s infinite alternate;
        }

        @keyframes partyPulse {
          0% { box-shadow: 0 0 12px #9d4edd; }
          100% { box-shadow: 0 0 24px #00f5d4; }
        }
      </style>

      <div class="card-body">
        <!-- HEADER -->
        <div class="header-row">
          <div class="header-title-group" id="header-link">
            <div class="studio-icon-wrap">
              <ha-icon icon="mdi:floor-plan" style="--mdc-icon-size: 26px;"></ha-icon>
            </div>
            <div class="title-text-group">
              <span class="card-title">${this._config.title}</span>
              <span class="card-subtitle">${onCount} of ${existingEntities.length} lights on ${onCount > 0 ? `\u00b7 ${avgBri}% avg` : ''}</span>
            </div>
          </div>

          <div class="header-actions">
            <button class="master-toggle-btn" id="master-toggle" aria-label="${isAnyOn ? 'Turn All Lights Off' : 'Turn All Lights On'}">
              <ha-icon icon="${isAnyOn ? 'mdi:lightbulb-off' : 'mdi:lightbulb-on'}" style="--mdc-icon-size: 16px;"></ha-icon>
              <span>${isAnyOn ? 'All Off' : 'Turn On'}</span>
            </button>
          </div>
        </div>

        <!-- STUDIO MASTER BRIGHTNESS SLIDER -->
        <div class="master-brightness-wrap">
          <span class="master-bri-label">Studio Dimmer</span>
          <input type="range" class="master-brightness-slider" min="1" max="100" value="${avgBri}" id="master-slider">
          <span class="bri-badge-val">${avgBri}%</span>
        </div>

        <!-- ROOM / AREA TILES -->
        <div class="areas-container">
          ${areaDefs.map((area) => {
            const areaStates = area.entities
              .map(id => this._hass.states[id])
              .filter(Boolean);
            const areaOnStates = areaStates.filter(s => s.state === 'on');
            const areaOn = areaOnStates.length;
            const isOpen = !!this._expandedAreas[area.key];

            // Area dominant color
            let areaGlow = 'rgba(255, 255, 255, 0.15)';
            if (areaOn > 0) {
              const firstOn = areaOnStates[0];
              const rgb = firstOn.attributes.rgb_color || [255, 215, 140];
              areaGlow = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
            }

            return `
              <div class="area-item ${isOpen ? 'open' : ''}">
                <div class="area-header" data-area="${area.key}">
                  <div class="area-name-group">
                    <div class="area-icon-wrap ${areaOn > 0 ? 'active' : ''}" style="${areaOn > 0 ? `background: ${areaGlow};` : ''}">
                      <ha-icon icon="${area.icon}" style="--mdc-icon-size: 18px;"></ha-icon>
                    </div>
                    <span>${area.name}</span>
                    <span class="area-pill-badge ${areaOn > 0 ? 'active' : ''}" style="${areaOn > 0 ? `background: ${areaGlow};` : ''}">
                      ${areaOn > 0 ? `${areaOn} On` : 'Off'}
                    </span>
                  </div>

                  <div class="area-right-group">
                    <button class="room-toggle-btn ${areaOn > 0 ? 'on' : ''}" data-action="toggle-room" data-room="${area.key}">
                      ${areaOn > 0 ? 'Turn Off' : 'Turn On'}
                    </button>
                    <ha-icon class="chevron-icon" icon="mdi:chevron-down" style="--mdc-icon-size: 20px;"></ha-icon>
                  </div>
                </div>

                <!-- FOLDOUT INDIVIDUAL LIGHT TILES -->
                <div class="foldout-drawer">
                  ${areaStates.map((s) => {
                    const isLightOn = s.state === 'on';
                    const rgb = s.attributes.rgb_color || [255, 220, 160];
                    const bulbColor = isLightOn ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : 'rgba(255, 255, 255, 0.4)';
                    const briPct = isLightOn ? Math.round(((s.attributes.brightness || 255) / 255) * 100) : 0;
                    const friendly = s.attributes.friendly_name || s.entity_id.replace('light.', '');
                    const supportsColor = s.attributes.supported_color_modes && (
                      s.attributes.supported_color_modes.includes('rgb') ||
                      s.attributes.supported_color_modes.includes('rgbw') ||
                      s.attributes.supported_color_modes.includes('rgbww') ||
                      s.attributes.supported_color_modes.includes('xy') ||
                      s.attributes.supported_color_modes.includes('color_temp')
                    );

                    return `
                      <div class="light-card-row ${isLightOn ? 'on' : ''}">
                        <div class="light-main-bar">
                          <div class="light-identity" data-action="toggle-single" data-entity="${s.entity_id}">
                            <button class="light-bulb-btn ${isLightOn ? 'on' : ''}" style="${isLightOn ? `background: ${bulbColor}; box-shadow: 0 0 12px ${bulbColor};` : ''}" title="Toggle" aria-label="Toggle Light">
                              <ha-icon icon="${isLightOn ? 'mdi:lightbulb' : 'mdi:lightbulb-outline'}" style="--mdc-icon-size: 20px;"></ha-icon>
                            </button>
                            <div class="light-info-text">
                              <span class="light-name" title="${friendly}">${friendly}</span>
                              <span class="light-status-text">${isLightOn ? `${briPct}% Brightness` : 'Powered Off'}</span>
                            </div>
                          </div>

                          <div class="light-controls-right">
                            <button class="btn-more-info" data-action="more-info" data-entity="${s.entity_id}" title="Color Picker & Details" aria-label="More Info">
                              <ha-icon icon="mdi:palette" style="--mdc-icon-size: 18px;"></ha-icon>
                            </button>
                          </div>
                        </div>

                        ${isLightOn ? `
                          <!-- Brightness Slider -->
                          <div class="slider-wrap">
                            <input type="range" class="slider-pill" min="1" max="100" value="${briPct}" data-entity="${s.entity_id}">
                            <span class="bri-badge-val">${briPct}%</span>
                          </div>

                          <!-- Color & White Presets Bar -->
                          ${supportsColor ? `
                            <div class="presets-bar">
                              ${colorPresets.map((p) => `
                                <div class="preset-dot" style="background: ${p.bg};" data-entity="${s.entity_id}" data-type="${p.type}" data-val='${JSON.stringify(p.value)}' title="${p.name}"></div>
                              `).join('')}
                            </div>
                          ` : ''}
                        ` : ''}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- QUICK CHIPS SCENES & EFFECTS -->
        <div class="quick-chips-row">
          <button class="chip-btn ${partyHueState ? 'active-party' : ''}" id="chip-party">
            <ha-icon icon="mdi:party-popper" style="--mdc-icon-size: 16px;"></ha-icon>
            <span>Party Mode</span>
          </button>
          <button class="chip-btn" id="chip-fire">
            <ha-icon icon="mdi:fire" style="--mdc-icon-size: 16px; color: #ff5400;"></ha-icon>
            <span>Fire Effect</span>
          </button>
          <button class="chip-btn" id="chip-colorloop">
            <ha-icon icon="mdi:looks" style="--mdc-icon-size: 16px; color: #00f5d4;"></ha-icon>
            <span>Colorloop</span>
          </button>
          <button class="chip-btn" id="chip-clean">
            <ha-icon icon="mdi:sparkles" style="--mdc-icon-size: 16px; color: #f48c06;"></ha-icon>
            <span>Clean Routine</span>
          </button>
          <button class="chip-btn" id="chip-more">
            <ha-icon icon="mdi:dots-grid" style="--mdc-icon-size: 16px;"></ha-icon>
            <span>All 34 Lights</span>
          </button>
        </div>
      </div>
    `;

    // Event listeners
    this.shadowRoot.getElementById('header-link')?.addEventListener('click', () => {
      window.location.hash = this._config.popup_hash;
    });

    this.shadowRoot.getElementById('master-toggle')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleAllLights(!isAnyOn);
    });

    this.shadowRoot.getElementById('master-slider')?.addEventListener('change', (e) => {
      e.stopPropagation();
      const val = Number(e.target.value);
      this._setMasterBrightness(onEntityIds, val, e);
    });

    this.shadowRoot.querySelectorAll('.area-header').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const area = el.getAttribute('data-area');
        if (area) this._toggleArea(area);
      });
    });

    this.shadowRoot.querySelectorAll('[data-action="toggle-room"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const areaKey = btn.getAttribute('data-room');
        const areaDef = areaDefs.find(a => a.key === areaKey);
        if (!areaDef) return;
        const areaEntities = areaDef.entities.filter(id => this._hass.states[id]);
        const isAreaOn = areaEntities.some(id => this._hass.states[id]?.state === 'on');
        this._toggleRoom(areaEntities, !isAreaOn, e);
      });
    });

    this.shadowRoot.querySelectorAll('[data-action="toggle-single"]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const ent = el.getAttribute('data-entity');
        if (ent) this._toggleEntity(ent, e);
      });
    });

    this.shadowRoot.querySelectorAll('[data-action="more-info"]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const ent = btn.getAttribute('data-entity');
        if (ent) this._openMoreInfo(ent, e);
      });
    });

    this.shadowRoot.querySelectorAll('.slider-pill').forEach((slider) => {
      slider.addEventListener('change', (e) => {
        e.stopPropagation();
        const ent = slider.getAttribute('data-entity');
        const val = Number(slider.value);
        if (ent) this._setBrightness(ent, val, e);
      });
    });

    this.shadowRoot.querySelectorAll('.preset-dot').forEach((dot) => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        const ent = dot.getAttribute('data-entity');
        const type = dot.getAttribute('data-type');
        const val = JSON.parse(dot.getAttribute('data-val'));
        if (ent) this._setColor(ent, type, val, e);
      });
    });

    this.shadowRoot.getElementById('chip-party')?.addEventListener('click', () => {
      this._hass.callService('homeassistant', 'toggle', { entity_id: 'input_boolean.party_hue' });
    });

    this.shadowRoot.getElementById('chip-fire')?.addEventListener('click', () => {
      this._hass.callService('script', 'lifx_fireeffect');
    });

    this.shadowRoot.getElementById('chip-colorloop')?.addEventListener('click', () => {
      this._hass.callService('script', '1689003108593');
    });

    this.shadowRoot.getElementById('chip-clean')?.addEventListener('click', () => {
      this._hass.callService('script', 'clean_plant');
    });

    this.shadowRoot.getElementById('chip-more')?.addEventListener('click', () => {
      window.location.hash = this._config.popup_hash;
    });
  }
}

customElements.define('studio-lights-ambient-card', StudioLightsAmbientCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'studio-lights-ambient-card',
  name: 'Studio Lights Ambient Card',
  description: 'Room-Card-Plus inspired lighting suite with neon glow ambiance, master studio dimmer, room toggles, touch sliders, and quick color presets.'
});
