class StudioPowerFlowCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._selectedId = null;
    this._isFolded = false;
    this._tooltip = null;
  }

  static getStubConfig() {
    return {
      title: 'Studio Power Flow',
      main_entity: 'sensor.wattmeter_power_minute_average',
      today_entity: 'sensor.wattmeter_energy_today',
      balance_entity: 'sensor.balance_power_minute_average'
    };
  }

  setConfig(config) {
    if (!config) {
      throw new Error("Invalid configuration");
    }
    this._config = {
      title: config.title || 'Studio Power Flow',
      main_entity: config.main_entity || 'sensor.wattmeter_power_minute_average',
      today_entity: config.today_entity || 'sensor.wattmeter_energy_today',
      balance_entity: config.balance_entity || 'sensor.balance_power_minute_average',
      popup_hash: config.popup_hash || '#power',
      circuits: config.circuits || [
        { id: 'fridge', sector: 'kitchen', name: 'Fridge & Table', entity: 'sensor.refrigerator_table_receptacle_power_minute_average', icon: 'mdi:fridge-outline', color: '#F59E0B' },
        { id: 'kitch', sector: 'kitchen', name: 'Kitchen Outlets', entity: 'sensor.kitchen_receptacles_power_minute_average', icon: 'mdi:power-socket-us', color: '#EA580C' },
        { id: 'micro', sector: 'kitchen', name: 'Microwave & Cook', entity: 'sensor.microwave_power_minute_average', icon: 'mdi:microwave', color: '#EF4444' },
        { id: 'bed', sector: 'bed', name: 'Bedroom Outlets', entity: 'sensor.bedroom_receptacles_power_minute_average', icon: 'mdi:bed', color: '#38BDF8' },
        { id: 'print', sector: 'bed', name: '3D Printer', entity: 'sensor.klipper_energy_power', icon: 'mdi:printer-3d', color: '#06B6D4', subtag: '↳ Bedroom Breaker', parent: 'bed' },
        { id: 'ceil', sector: 'bed', name: 'Ceiling & Fan', entity: 'sensor.ceiling_lights_fan_power_minute_average', icon: 'mdi:ceiling-light', color: '#FBBF24' },
        { id: 'bal', sector: 'bal', name: 'Balance Breaker', entity: 'sensor.balance_power_minute_average', icon: 'mdi:scale-balance', color: '#94A3B8' },
        { id: 'net', sector: 'bal', name: 'Network Server', entity: 'sensor.networknonups_energy_power', icon: 'mdi:server-network', color: '#A855F7', subtag: '↳ Balance Breaker', parent: 'bal' }
      ],
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

  _navigatePopup(e) {
    if (e) e.stopPropagation();
    if (this._config.popup_hash) {
      window.location.hash = this._config.popup_hash;
    }
  }

  _fireMoreInfo(entityId, e) {
    if (e) e.stopPropagation();
    if (!entityId) return;
    const ev = new CustomEvent('hass-more-info', {
      bubbles: true,
      composed: true,
      detail: { entityId }
    });
    this.dispatchEvent(ev);
  }

  _selectCircuit(id, e) {
    if (e) e.stopPropagation();
    this._selectedId = this._selectedId === id ? null : id;
    this.render();
  }

  _toggleFold(e) {
    if (e) e.stopPropagation();
    this._isFolded = !this._isFolded;
    this.render();
  }

  _getPower(entityId) {
    if (!this._hass || !entityId) return 0;
    const stateObj = this._hass.states[entityId];
    if (!stateObj || stateObj.state === 'unavailable' || stateObj.state === 'unknown') return 0;
    const val = parseFloat(stateObj.state);
    return isNaN(val) ? 0 : Math.max(0, val);
  }

  _formatPower(w) {
    if (w >= 1000) return `${(w / 1000).toFixed(2)} kW`;
    if (w >= 10) return `${Math.round(w)} W`;
    return `${w.toFixed(1)} W`;
  }

  render() {
    if (!this._hass || !this._config) return;

    // 1. Compute live values
    const mainW = this._getPower(this._config.main_entity);
    const todayState = this._hass.states[this._config.today_entity];
    const todayKWh = todayState ? parseFloat(todayState.state) || 0 : 0;

    const circuitData = this._config.circuits.map(c => {
      const w = this._getPower(c.entity);
      return { ...c, w };
    });

    const sumTracked = circuitData.reduce((acc, c) => acc + c.w, 0);
    const totalW = Math.max(mainW, sumTracked);

    // Dynamic aura color based on total load
    let loadAura = 'rgba(0, 245, 212, 0.35)'; // Eco cyan
    let loadStatus = 'Eco Load';
    let loadAccent = '#00F5D4';
    if (totalW > 1200) {
      loadAura = 'rgba(255, 84, 0, 0.45)'; // High solar orange
      loadStatus = 'Heavy Draw';
      loadAccent = '#FF5400';
    } else if (totalW > 550) {
      loadAura = 'rgba(255, 190, 11, 0.40)'; // Moderate amber
      loadStatus = 'Normal Load';
      loadAccent = '#FFBE0B';
    }

    // Sectors definition
    const sectors = [
      { id: 'sec-kitchen', key: 'kitchen', name: 'Kitchen Circuit', color: '#F59E0B', icon: 'mdi:silverware-fork-knife' },
      { id: 'sec-bed', key: 'bed', name: 'Bedroom Circuit', color: '#38BDF8', icon: 'mdi:bed' },
      { id: 'sec-bal', key: 'bal', name: 'Balance Circuit', color: '#94A3B8', icon: 'mdi:scale-balance' }
    ];

    sectors.forEach(s => {
      s.w = circuitData.filter(c => c.sector === s.key).reduce((acc, c) => acc + c.w, 0);
    });

    // 2. Geometry calculations for SVG Sankey
    const canvasW = 960;
    const canvasH = 430;
    const padY = 22;
    const gap = 9;
    const minNodeH = 26;

    // Circuit nodes layout (Column 3: x = 700, w = 240)
    const nCircuits = circuitData.length;
    const availH = canvasH - 2 * padY - (nCircuits - 1) * gap;
    const extraH = Math.max(0, availH - nCircuits * minNodeH);

    let curY = padY;
    circuitData.forEach(c => {
      const share = totalW > 0 ? c.w / totalW : 1 / nCircuits;
      const h = minNodeH + share * extraH;
      c.y = curY;
      c.h = h;
      c.pct = totalW > 0 ? (c.w / totalW) * 100 : 0;
      curY += h + gap;
    });

    // Sector nodes layout (Column 2: x = 420, w = 150)
    // Span matches min Y and max Y of daughter circuits
    sectors.forEach(s => {
      const daughters = circuitData.filter(c => c.sector === s.key);
      if (daughters.length > 0) {
        s.y = daughters[0].y;
        s.h = (daughters[daughters.length - 1].y + daughters[daughters.length - 1].h) - s.y;
      } else {
        s.y = padY;
        s.h = minNodeH;
      }
      s.pct = totalW > 0 ? (s.w / totalW) * 100 : 0;
    });

    // Apartment node (Column 1: x = 200, w = 110)
    const aptY = padY + 10;
    const aptH = canvasH - 2 * padY - 20;

    // Grid node (Column 0: x = 24, w = 90)
    const gridY = padY + 30;
    const gridH = canvasH - 2 * padY - 60;

    // Helper to generate Bezier ribbon
    const ribbonPath = (x0, y0, h0, x1, y1, h1) => {
      const dx = x1 - x0;
      const cx1 = x0 + dx * 0.44;
      const cx2 = x1 - dx * 0.44;
      return `M ${x0.toFixed(1)} ${y0.toFixed(1)} ` +
             `C ${cx1.toFixed(1)} ${y0.toFixed(1)}, ${cx2.toFixed(1)} ${y1.toFixed(1)}, ${x1.toFixed(1)} ${y1.toFixed(1)} ` +
             `L ${x1.toFixed(1)} ${(y1 + h1).toFixed(1)} ` +
             `C ${cx2.toFixed(1)} ${(y1 + h1).toFixed(1)}, ${cx1.toFixed(1)} ${(y0 + h0).toFixed(1)}, ${x0.toFixed(1)} ${(y0 + h0).toFixed(1)} Z`;
    };

    const pulseLine = (x0, y0, h0, x1, y1, h1) => {
      const dx = x1 - x0;
      const cx1 = x0 + dx * 0.44;
      const cx2 = x1 - dx * 0.44;
      return `M ${x0.toFixed(1)} ${(y0 + h0 / 2).toFixed(1)} ` +
             `C ${cx1.toFixed(1)} ${(y0 + h0 / 2).toFixed(1)}, ${cx2.toFixed(1)} ${(y1 + h1 / 2).toFixed(1)}, ${x1.toFixed(1)} ${(y1 + h1 / 2).toFixed(1)}`;
    };

    // Build SVG Gradients and Ribbons
    let defsSvg = `
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <linearGradient id="grad-grid-apt" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#00F5D4" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.4" />
        </linearGradient>
    `;

    sectors.forEach(s => {
      defsSvg += `
        <linearGradient id="grad-apt-${s.key}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#38BDF8" stop-opacity="0.4" />
          <stop offset="100%" stop-color="${s.color}" stop-opacity="0.45" />
        </linearGradient>
      `;
    });

    circuitData.forEach(c => {
      defsSvg += `
        <linearGradient id="grad-sec-${c.id}" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${c.color}" stop-opacity="0.35" />
          <stop offset="100%" stop-color="${c.color}" stop-opacity="0.55" />
        </linearGradient>
      `;
    });
    defsSvg += `</defs>`;

    // Build Ribbons: Grid -> Apt
    let ribbonsSvg = '';
    const gridToAptIsActive = !this._selectedId;
    ribbonsSvg += `
      <path class="sankey-ribbon ${gridToAptIsActive ? 'active' : 'dimmed'}"
            d="${ribbonPath(24 + 90, gridY, gridH, 200, aptY, aptH)}"
            fill="url(#grad-grid-apt)" />
      <path class="sankey-pulse"
            d="${pulseLine(24 + 90, gridY, gridH, 200, aptY, aptH)}"
            style="stroke: #00F5D4; animation-duration: ${Math.max(1.0, 3.5 - (totalW / 1200) * 2.2)}s;" />
    `;

    // Apt -> Sectors
    let aptCurY = aptY;
    sectors.forEach(s => {
      const share = totalW > 0 ? s.w / totalW : 0.25;
      const hFromApt = aptH * share;
      const isSecActive = !this._selectedId || circuitData.find(c => c.id === this._selectedId)?.sector === s.key;

      ribbonsSvg += `
        <path class="sankey-ribbon ${isSecActive ? 'active' : 'dimmed'}"
              d="${ribbonPath(200 + 110, aptCurY, hFromApt, 420, s.y, s.h)}"
              fill="url(#grad-apt-${s.key})"
              data-sector="${s.key}" />
        <path class="sankey-pulse"
              d="${pulseLine(200 + 110, aptCurY, hFromApt, 420, s.y, s.h)}"
              style="stroke: ${s.color}; animation-duration: ${Math.max(1.1, 4.0 - (s.w / 600) * 2.5)}s;" />
      `;
      aptCurY += hFromApt;
    });

    // Sectors -> Circuits
    sectors.forEach(s => {
      const daughters = circuitData.filter(c => c.sector === s.key);
      let secCurY = s.y;
      daughters.forEach(c => {
        const shareInSector = s.w > 0 ? c.w / s.w : 1 / daughters.length;
        const hFromSec = s.h * shareInSector;
        const isCircActive = !this._selectedId || this._selectedId === c.id;

        ribbonsSvg += `
          <path class="sankey-ribbon circuit-link ${isCircActive ? 'active' : 'dimmed'}"
                d="${ribbonPath(420 + 150, secCurY, hFromSec, 700, c.y, c.h)}"
                fill="url(#grad-sec-${c.id})"
                data-id="${c.id}"
                data-name="${c.name}"
                data-w="${c.w.toFixed(1)}"
                data-pct="${c.pct.toFixed(1)}" />
          <path class="sankey-pulse ${isCircActive ? 'active' : 'dimmed'}"
                d="${pulseLine(420 + 150, secCurY, hFromSec, 700, c.y, c.h)}"
                style="stroke: ${c.color}; animation-duration: ${Math.max(0.9, 4.5 - (c.w / 400) * 3.2)}s;" />
        `;
        secCurY += hFromSec;
      });
    });

    // Render Nodes:
    let nodesSvg = '';

    // 1. Grid Node
    nodesSvg += `
      <g class="sankey-node" transform="translate(24, ${gridY})">
        <rect width="90" height="${gridH}" rx="14" class="node-bg" />
        <rect width="90" height="${gridH}" rx="14" class="node-border" style="stroke: #00F5D4;" />
        <text x="45" y="${gridH / 2 - 8}" text-anchor="middle" class="node-title">GRID</text>
        <text x="45" y="${gridH / 2 + 10}" text-anchor="middle" class="node-val" style="fill: #00F5D4;">${this._formatPower(totalW)}</text>
      </g>
    `;

    // 2. Apartment Node
    nodesSvg += `
      <g class="sankey-node" transform="translate(200, ${aptY})">
        <rect width="110" height="${aptH}" rx="16" class="node-bg" />
        <rect width="110" height="${aptH}" rx="16" class="node-border" style="stroke: #38BDF8;" />
        <text x="55" y="${aptH / 2 - 12}" text-anchor="middle" class="node-title">STUDIO</text>
        <text x="55" y="${aptH / 2 + 8}" text-anchor="middle" class="node-val" style="fill: #38BDF8;">${this._formatPower(totalW)}</text>
        <text x="55" y="${aptH / 2 + 24}" text-anchor="middle" class="node-sub">100% DRAW</text>
      </g>
    `;

    // 3. Sector Nodes
    sectors.forEach(s => {
      nodesSvg += `
        <g class="sankey-node sector-node" transform="translate(420, ${s.y})">
          <rect width="150" height="${s.h}" rx="12" class="node-bg" />
          <rect width="150" height="${s.h}" rx="12" class="node-border" style="stroke: ${s.color};" />
          <text x="14" y="${s.h > 36 ? s.h / 2 - 4 : s.h / 2 + 3}" class="node-title">${s.name}</text>
          ${s.h > 36 ? `<text x="14" y="${s.h / 2 + 12}" class="node-val" style="fill: ${s.color};">${this._formatPower(s.w)} · ${s.pct.toFixed(0)}%</text>` : ''}
        </g>
      `;
    });

    // 4. Circuit Load Nodes
    circuitData.forEach(c => {
      const isSelected = this._selectedId === c.id;
      nodesSvg += `
        <g class="sankey-node circuit-node ${isSelected ? 'selected' : ''}"
           data-id="${c.id}"
           transform="translate(700, ${c.y})">
          <rect width="236" height="${c.h}" rx="10" class="node-bg" />
          <rect width="236" height="${c.h}" rx="10" class="node-border" style="stroke: ${c.color};" />
          <circle cx="14" cy="${c.h / 2}" r="4" style="fill: ${c.color};" />
          <text x="26" y="${c.h > 34 ? c.h / 2 - 3 : c.h / 2 + 4}" class="circuit-name">${c.name}</text>
          <text x="222" y="${c.h > 34 ? c.h / 2 - 3 : c.h / 2 + 4}" text-anchor="end" class="circuit-val" style="fill: ${c.color};">${this._formatPower(c.w)}</text>
          ${c.h > 34 ? `<text x="222" y="${c.h / 2 + 11}" text-anchor="end" class="circuit-pct">${c.pct.toFixed(1)}%</text>` : ''}
        </g>
      `;
    });

    // 3. Assemble HTML Template
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          --card-radius: 32px;
          --glass-surface: rgba(18, 22, 34, 0.72);
          --glass-rim: rgba(255, 255, 255, 0.12);
          --text-primary: #FFFFFF;
          --text-secondary: rgba(255, 255, 255, 0.68);
          --text-muted: rgba(255, 255, 255, 0.42);
        }

        .studio-power-card {
          position: relative;
          background: var(--glass-surface);
          border: 1px solid var(--glass-rim);
          border-radius: var(--card-radius);
          padding: 22px;
          backdrop-filter: blur(24px) saturate(160%);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.16);
          color: var(--text-primary);
          overflow: hidden;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          transition: border-color 0.3s ease;
        }

        .ambient-aurora {
          position: absolute;
          top: -60px;
          right: -40px;
          width: 320px;
          height: 240px;
          background: radial-gradient(circle, ${loadAura} 0%, rgba(0, 0, 0, 0) 70%);
          pointer-events: none;
          filter: blur(40px);
          transition: background 0.8s ease;
          z-index: 0;
        }

        /* Hero Header */
        .card-header {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 1;
          margin-bottom: 18px;
          cursor: pointer;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .icon-aura-container {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px ${loadAura};
        }

        .icon-aura-container ha-icon {
          color: ${loadAccent};
          --mdc-icon-size: 26px;
        }

        .title-group {
          display: flex;
          flex-direction: column;
        }

        .card-title {
          font-size: 1.0625rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .status-badge {
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 3px 8px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: ${loadAccent};
        }

        .card-subtitle {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text-secondary);
          margin-top: 3px;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hero-metric {
          text-align: right;
        }

        .hero-stat {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #FFFFFF;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .hero-sub {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .fold-btn {
          width: 36px;
          height: 36px;
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .fold-btn:hover {
          background: rgba(255, 255, 255, 0.14);
          transform: scale(1.08);
        }

        /* Granular Sub-Bubbles Dock */
        .sub-bubbles-dock {
          position: relative;
          z-index: 1;
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 12px;
          margin-bottom: 16px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.15) transparent;
        }

        .sub-bubbles-dock::-webkit-scrollbar {
          height: 4px;
        }

        .sub-bubbles-dock::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
        }

        .sub-bubble {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.09);
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          user-select: none;
        }

        .sub-bubble:hover {
          background: rgba(255, 255, 255, 0.09);
          border-color: rgba(255, 255, 255, 0.22);
          transform: translateY(-2px);
        }

        .sub-bubble.selected {
          background: rgba(255, 255, 255, 0.14);
          border-color: var(--bubble-color);
          box-shadow: 0 0 16px var(--bubble-color);
          transform: translateY(-2px);
        }

        .sub-bubble-icon {
          width: 28px;
          height: 28px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.08);
        }

        .sub-bubble-icon ha-icon {
          --mdc-icon-size: 16px;
          color: var(--bubble-color);
        }

        .sub-bubble-info {
          display: flex;
          flex-direction: column;
        }

        .sub-bubble-name {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .sub-bubble-val {
          font-size: 0.875rem;
          font-weight: 700;
          color: #FFFFFF;
        }

        .sub-bubble-tag {
          font-size: 8.5px;
          font-weight: 700;
          color: var(--bubble-color);
          opacity: 0.9;
          letter-spacing: 0.02em;
          white-space: nowrap;
        }

        /* Sankey Flow View Container */
        .flow-container {
          position: relative;
          z-index: 1;
          width: 100%;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 20px;
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
        }

        .flow-container.folded {
          display: none;
        }

        svg.sankey-svg {
          width: 100%;
          height: auto;
          display: block;
        }

        .sankey-ribbon {
          transition: fill-opacity 0.25s ease, opacity 0.25s ease, filter 0.25s ease;
          cursor: pointer;
        }

        .sankey-ribbon.dimmed {
          opacity: 0.14;
        }

        .sankey-ribbon.active {
          opacity: 0.95;
        }

        .sankey-pulse {
          stroke-dasharray: 6 12;
          fill: none;
          stroke-width: 2.2;
          opacity: 0.75;
          animation: flowPulse 2s linear infinite;
          pointer-events: none;
        }

        .sankey-pulse.dimmed {
          opacity: 0.05;
        }

        @keyframes flowPulse {
          to {
            stroke-dashoffset: -36px;
          }
        }

        .sankey-node {
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .sankey-node:hover {
          filter: brightness(1.2);
        }

        .node-bg {
          fill: rgba(18, 22, 34, 0.88);
        }

        .node-border {
          fill: none;
          stroke-width: 1.4;
          stroke-opacity: 0.6;
        }

        .circuit-node.selected .node-border {
          stroke-width: 2.4;
          stroke-opacity: 1;
          filter: drop-shadow(0 0 8px currentColor);
        }

        .node-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.02em;
          fill: #FFFFFF;
        }

        .node-val {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: -0.01em;
        }

        .node-sub {
          font-size: 9px;
          font-weight: 700;
          fill: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .circuit-name {
          font-size: 11px;
          font-weight: 600;
          fill: #E2E8F0;
        }

        .circuit-val {
          font-size: 11px;
          font-weight: 800;
        }

        .circuit-pct {
          font-size: 9.5px;
          font-weight: 600;
          fill: var(--text-muted);
        }

        /* Tooltip */
        .tooltip-card {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(18, 22, 34, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 14px;
          padding: 6px 14px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #FFFFFF;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
          pointer-events: none;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      </style>

      <div class="studio-power-card">
        <div class="ambient-aurora"></div>

        <!-- Master Power Hero Header -->
        <div class="card-header" id="headerNav">
          <div class="header-left">
            <div class="icon-aura-container">
              <ha-icon icon="mdi:lightning-bolt"></ha-icon>
            </div>
            <div class="title-group">
              <div class="card-title">
                ${this._config.title}
                <span class="status-badge">${loadStatus}</span>
              </div>
              <div class="card-subtitle">
                ${todayKWh > 0 ? `${todayKWh.toFixed(2)} kWh today · ` : ''}${nCircuits} Circuits Monitored
              </div>
            </div>
          </div>
          <div class="header-right">
            <div class="hero-metric">
              <div class="hero-stat">${this._formatPower(totalW)}</div>
              <div class="hero-sub">Live Studio Draw</div>
            </div>
            <div class="fold-btn" id="foldBtn" title="${this._isFolded ? 'Expand Flow Graph' : 'Collapse Flow Graph'}">
              <ha-icon icon="${this._isFolded ? 'mdi:chevron-down' : 'mdi:chevron-up'}"></ha-icon>
            </div>
          </div>
        </div>

        <!-- Granular Sub-Bubbles Dock ("more smaller bubbles of other meters") -->
        <div class="sub-bubbles-dock">
          ${circuitData.map(c => `
            <div class="sub-bubble ${this._selectedId === c.id ? 'selected' : ''}"
                 data-id="${c.id}"
                 data-entity="${c.entity || ''}"
                 style="--bubble-color: ${c.color};">
              <div class="sub-bubble-icon">
                <ha-icon icon="${c.icon || 'mdi:flash'}"></ha-icon>
              </div>
              <div class="sub-bubble-info">
                <span class="sub-bubble-name">${c.name}</span>
                ${c.subtag ? `<span class="sub-bubble-tag">${c.subtag}</span>` : ''}
                <span class="sub-bubble-val">${this._formatPower(c.w)}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Liquid Glass Sankey Energy Flow Graph -->
        <div class="flow-container ${this._isFolded ? 'folded' : ''}">
          <svg class="sankey-svg" viewBox="0 0 ${canvasW} ${canvasH}">
            ${defsSvg}
            <g class="ribbons-layer">
              ${ribbonsSvg}
            </g>
            <g class="nodes-layer">
              ${nodesSvg}
            </g>
          </svg>
          ${this._selectedId ? `
            <div class="tooltip-card">
              <span style="color: ${circuitData.find(c => c.id === this._selectedId)?.color || '#FFF'}">●</span>
              ${circuitData.find(c => c.id === this._selectedId)?.name}:
              <strong>${this._formatPower(circuitData.find(c => c.id === this._selectedId)?.w || 0)}</strong>
              (${circuitData.find(c => c.id === this._selectedId)?.pct.toFixed(1)}% of total studio power)
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // 4. Attach Event Handlers
    this.shadowRoot.getElementById('headerNav').addEventListener('click', (e) => {
      if (e.target.closest('#foldBtn')) return;
      this._navigatePopup(e);
    });

    this.shadowRoot.getElementById('foldBtn').addEventListener('click', (e) => {
      this._toggleFold(e);
    });

    // Sub-bubble click handlers
    this.shadowRoot.querySelectorAll('.sub-bubble').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = el.getAttribute('data-id');
        this._selectCircuit(id, e);
      });
      el.addEventListener('dblclick', (e) => {
        const entityId = el.getAttribute('data-entity');
        this._fireMoreInfo(entityId, e);
      });
    });

    // SVG circuit node click handlers
    this.shadowRoot.querySelectorAll('.circuit-node, .circuit-link').forEach(el => {
      el.addEventListener('click', (e) => {
        const id = el.getAttribute('data-id');
        this._selectCircuit(id, e);
      });
    });
  }
}

customElements.define('studio-power-flow-card', StudioPowerFlowCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'studio-power-flow-card',
  name: 'Studio Power Flow Card',
  description: 'Liquid Glass Sankey Energy Flow & Granular Sub-Bubbles for Home Assistant'
});
