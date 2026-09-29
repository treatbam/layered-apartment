class StudioMediaCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._showVolumeFoldouts = {};
    this._cachedColors = {};
    this._lastPictures = {};
  }

  setConfig(config) {
    this._config = {
      media_type: config.media_type || (config.icon === 'mdi:television' ? 'video' : 'music'),
      title: config.title || (config.media_type === 'video' ? 'Video' : 'Music'),
      icon: config.icon || (config.media_type === 'video' ? 'mdi:television' : 'mdi:speaker'),
      default_entity: config.entity || (config.media_type === 'video' ? 'media_player.bedroom_tv_2' : 'media_player.bedroom_speaker'),
      popup_hash: config.popup_hash || '#media',
      ...config
    };
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  getCardSize() {
    return 3;
  }

  _classifyPlayer(entityId, stateObj) {
    if (!stateObj) return 'other';
    const attrs = stateObj.attributes || {};
    const cType = (attrs.media_content_type || '').toLowerCase();
    const app = (attrs.app_name || '').toLowerCase();
    const name = ((attrs.friendly_name || '') + ' ' + entityId).toLowerCase();

    // 1. Explicit video content types or video apps
    if (['video', 'tvshow', 'movie', 'episode', 'channel', 'clip'].includes(cType)) return 'video';
    if (['youtube', 'netflix', 'plex', 'prime video', 'hulu', 'disney+', 'apple tv', 'kodi', 'emby', 'twitch', 'jellyfin', 'max', 'paramount+'].some(a => app.includes(a))) return 'video';

    // 2. Explicit music content types or presence of artist/album
    if (['music', 'track', 'playlist', 'album', 'artist', 'song', 'audio'].includes(cType)) return 'music';
    if (attrs.media_artist || attrs.media_album_name) return 'music';
    if (['spotify', 'apple music', 'pandora', 'tidal', 'deezer', 'qobuz', 'soundcloud', 'tunein', 'radio', 'sonos', 'music'].some(a => app.includes(a))) return 'music';

    // 3. Device type naming keywords
    const isVideoDevice = /tv|display|screen|projector|hub|show|monitor|roku|chromecast/.test(name);
    const isAudioDevice = /speaker|soundbar|audio|stereo|amp|sub|echo(?! show)|point/.test(name);

    if (isVideoDevice && !isAudioDevice) return 'video';
    if (isAudioDevice && !isVideoDevice) return 'music';
    if (isVideoDevice) return 'video';
    return 'music';
  }

  _getActiveEntities(targetType) {
    if (!this._hass || !this._hass.states) return [];

    const activeList = [];
    const allEntities = Object.keys(this._hass.states).filter(id => id.startsWith('media_player.'));

    for (const entityId of allEntities) {
      const stateObj = this._hass.states[entityId];
      if (!stateObj) continue;

      const state = stateObj.state;
      const isUnavailable = state === 'unavailable' || state === 'unknown' || state === 'off';
      if (isUnavailable) continue;

      const classified = this._classifyPlayer(entityId, stateObj);
      if (classified !== targetType) continue;

      const isActivelyStreaming = state === 'playing' || state === 'paused';
      const hasActiveMedia = !!(stateObj.attributes && (stateObj.attributes.media_title || stateObj.attributes.app_name));

      if (isActivelyStreaming || (state === 'on' && hasActiveMedia)) {
        activeList.push({
          entityId,
          stateObj,
          isPlaying: state === 'playing',
          priority: state === 'playing' ? 1 : 2
        });
      }
    }

    // Sort playing first
    activeList.sort((a, b) => a.priority - b.priority);
    return activeList.map(item => item.entityId);
  }

  _toggleVolume(entityId, e) {
    if (e) e.stopPropagation();
    this._showVolumeFoldouts[entityId] = !this._showVolumeFoldouts[entityId];
    this.render();
  }

  _callService(entityId, service, data = {}) {
    if (!this._hass) return;
    this._hass.callService('media_player', service, {
      entity_id: entityId,
      ...data
    });
  }

  _setVolume(entityId, pct, e) {
    if (e) e.stopPropagation();
    const vol = Math.max(0, Math.min(1, pct / 100));
    this._callService(entityId, 'volume_set', { volume_level: vol });
  }

  _formatTime(seconds) {
    if (isNaN(seconds) || seconds === null || seconds === undefined) return '0:00';
    const s = Math.floor(seconds);
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}:${remMins < 10 ? '0' : ''}${remMins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  _extractColorsFromImage(entityId, imgUrl) {
    if (!imgUrl) return;
    if (this._lastPictures[entityId] === imgUrl && this._cachedColors[entityId]) return;

    this._lastPictures[entityId] = imgUrl;
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 16, 16);
        const data = ctx.getImageData(0, 0, 16, 16).data;

        const r1 = data[16 * 4] || 0;
        const g1 = data[16 * 4 + 1] || 245;
        const b1 = data[16 * 4 + 2] || 212;

        const r2 = data[240 * 4] || 58;
        const g2 = data[240 * 4 + 1] || 134;
        const b2 = data[240 * 4 + 2] || 255;

        this._cachedColors[entityId] = {
          c1: [r1, g1, b1],
          c2: [r2, g2, b2]
        };
        this.render();
      } catch (err) {
        this._cachedColors[entityId] = {
          c1: [0, 245, 212],
          c2: [157, 78, 221]
        };
      }
    };
    img.onerror = () => {
      this._cachedColors[entityId] = {
        c1: [0, 245, 212],
        c2: [58, 134, 255]
      };
    };
    img.src = imgUrl;
  }

  render() {
    if (!this._hass || !this._config) return;

    const mediaType = this._config.media_type; // 'video' or 'music'
    const activeEntities = this._getActiveEntities(mediaType);

    // If no active streams, fall back to configured default entity
    const displayEntities = activeEntities.length > 0 
      ? activeEntities 
      : [this._config.default_entity || this._config.entity];

    const isTwinMode = displayEntities.length > 1;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          user-select: none;
        }

        .media-deck-container {
          display: grid;
          grid-template-columns: ${isTwinMode ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr'};
          gap: 14px;
          width: 100%;
        }

        .media-bubble {
          position: relative;
          border-radius: 32px;
          overflow: hidden;
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          color: #ffffff;
          transition: background 0.8s ease, border-color 0.6s ease, box-shadow 0.6s ease, transform 0.2s ease;
        }

        /* --- HEADER ROW --- */
        .bubble-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          gap: 12px;
        }

        .meta-group {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow: hidden;
          flex: 1;
        }

        .art-thumbnail-wrap {
          width: 46px;
          height: 46px;
          border-radius: ${mediaType === 'music' ? '50%' : '14px'};
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.18);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
        }

        .art-thumbnail-wrap.spinning {
          animation: vinylSpin 14s linear infinite;
        }

        @keyframes vinylSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .art-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .title-text-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
          white-space: nowrap;
        }

        .device-pill-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 2px;
        }

        .device-pill-tag .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #00f5d4;
          box-shadow: 0 0 6px #00f5d4;
          display: inline-block;
        }

        .media-title {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: -0.2px;
          color: #ffffff;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .media-subtitle {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* --- SCRUBBER / PROGRESS BAR --- */
        .progress-bar-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          margin-top: -2px;
        }

        .progress-track {
          flex: 1;
          height: 4px;
          background: rgba(255, 255, 255, 0.16);
          border-radius: 2px;
          overflow: hidden;
          position: relative;
        }

        .progress-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease;
        }

        .progress-time {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.3px;
          color: rgba(255, 255, 255, 0.65);
          white-space: nowrap;
        }

        /* --- CONTROLS ROW --- */
        .controls-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        /* Animated Frequency Waveform */
        .waveform-strip {
          display: flex;
          align-items: center;
          gap: 3px;
          height: 20px;
          padding: 0 4px;
        }

        .wave-bar {
          width: 3px;
          border-radius: 2px;
          transform-origin: bottom;
          animation: wavePulse 1.2s ease-in-out infinite;
        }

        .wave-bar:nth-child(1) { height: 6px; animation-delay: 0.1s; }
        .wave-bar:nth-child(2) { height: 16px; animation-delay: 0.35s; }
        .wave-bar:nth-child(3) { height: 18px; animation-delay: 0.15s; }
        .wave-bar:nth-child(4) { height: 11px; animation-delay: 0.45s; }
        .wave-bar:nth-child(5) { height: 7px; animation-delay: 0.25s; }

        @keyframes wavePulse {
          0%, 100% { transform: scaleY(0.35); opacity: 0.6; }
          50% { transform: scaleY(1.15); opacity: 1; }
        }

        .btn-group {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .ctrl-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          color: #ffffff;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .ctrl-btn:hover {
          background: rgba(255, 255, 255, 0.22);
          transform: scale(1.08);
        }

        .ctrl-btn:active {
          transform: scale(0.92);
        }

        .ctrl-btn:focus-visible {
          outline: 2px solid #ffffff;
          outline-offset: 2px;
        }

        .ctrl-btn.active-accent {
          color: #0b0e17;
          border-color: transparent;
        }

        /* --- FOLDOUT VOLUME DRAWER --- */
        .volume-foldout {
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.42);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 18px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          animation: foldIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes foldIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .vol-slider {
          flex: 1;
          height: 5px;
          -webkit-appearance: none;
          appearance: none;
          background: rgba(255, 255, 255, 0.22);
          border-radius: 3px;
          outline: none;
        }

        .vol-slider:focus-visible {
          outline: 2px solid #ffffff;
          outline-offset: 2px;
        }

        .vol-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.45);
        }

        .vol-pct {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.85);
          min-width: 28px;
          text-align: right;
        }
      </style>

      <div class="media-deck-container">
        ${displayEntities.map((entId) => {
          const stateObj = this._hass.states[entId];
          const state = stateObj ? stateObj.state : 'off';
          const isPlaying = state === 'playing';
          const isOn = state !== 'off' && state !== 'unavailable';

          const attrs = stateObj?.attributes || {};
          const deviceFriendly = attrs.friendly_name || entId.replace('media_player.', '');
          const appName = attrs.app_name || '';
          const rawTitle = attrs.media_title || (appName ? `${appName} Video` : (isOn ? deviceFriendly : `${deviceFriendly} (Off)`));
          const rawSubtitle = attrs.media_artist || attrs.media_album_name || attrs.source || (isOn ? (isPlaying ? (appName ? `Streaming on ${appName}` : 'Playing') : 'Paused') : 'Powered Off');

          const entityPicture = attrs.entity_picture_local || attrs.entity_picture;
          const isMuted = !!attrs.is_volume_muted;
          const volLevel = attrs.volume_level !== undefined ? Math.round(attrs.volume_level * 100) : 50;

          // Position & duration
          const position = attrs.media_position;
          const duration = attrs.media_duration;
          const hasProgress = duration && duration > 0 && position !== undefined;
          const progressPct = hasProgress ? Math.min(100, Math.max(0, (position / duration) * 100)) : 0;
          const timeFormatted = hasProgress ? `${this._formatTime(position)} / ${this._formatTime(duration)}` : '';

          if (entityPicture && isPlaying) {
            this._extractColorsFromImage(entId, entityPicture);
          } else if (!isPlaying && !this._cachedColors[entId]) {
            this._cachedColors[entId] = null;
          }

          const defaultC1 = mediaType === 'video' ? [58, 134, 255] : [0, 245, 212];
          const defaultC2 = mediaType === 'video' ? [0, 245, 212] : [157, 78, 221];
          const c1 = this._cachedColors[entId]?.c1 || defaultC1;
          const c2 = this._cachedColors[entId]?.c2 || defaultC2;

          const cardBg = isPlaying
            ? `radial-gradient(circle at 85% 15%, rgba(${c1[0]}, ${c1[1]}, ${c1[2]}, 0.42) 0%, transparent 60%),
               radial-gradient(circle at 15% 85%, rgba(${c2[0]}, ${c2[1]}, ${c2[2]}, 0.32) 0%, transparent 65%),
               linear-gradient(135deg, rgba(14, 18, 28, 0.94) 0%, rgba(10, 12, 20, 0.98) 100%)`
            : isOn
            ? `radial-gradient(circle at 85% 20%, rgba(${c1[0]}, ${c1[1]}, ${c1[2]}, 0.22) 0%, transparent 60%),
               linear-gradient(135deg, rgba(14, 18, 28, 0.94) 0%, rgba(10, 12, 20, 0.98) 100%)`
            : `linear-gradient(135deg, rgba(14, 18, 28, 0.88) 0%, rgba(10, 12, 20, 0.96) 100%)`;

          const accentColor = `rgb(${c1[0]}, ${c1[1]}, ${c1[2]})`;
          const rimGlow = isPlaying
            ? `0 12px 36px rgba(0, 0, 0, 0.5), 0 0 22px rgba(${c1[0]}, ${c1[1]}, ${c1[2]}, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.3)`
            : isOn
            ? `0 10px 30px rgba(0, 0, 0, 0.35), 0 0 12px rgba(${c1[0]}, ${c1[1]}, ${c1[2]}, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.2)`
            : `0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.16)`;

          const showVol = !!this._showVolumeFoldouts[entId];

          return `
            <div class="media-bubble" style="background: ${cardBg}; border: 1px solid ${isPlaying ? `rgba(${c1[0]}, ${c1[1]}, ${c1[2]}, 0.4)` : 'rgba(255, 255, 255, 0.12)'}; box-shadow: ${rimGlow};">
              <!-- HEADER -->
              <div class="bubble-header" data-entity="${entId}">
                <div class="meta-group">
                  <div class="art-thumbnail-wrap ${isPlaying && mediaType === 'music' ? 'spinning' : ''}" style="${isPlaying ? `box-shadow: 0 0 16px rgba(${c1[0]}, ${c1[1]}, ${c1[2]}, 0.5);` : ''}">
                    ${entityPicture ? `
                      <img class="art-img" src="${entityPicture}" alt="Art">
                    ` : `
                      <ha-icon icon="${mediaType === 'video' ? 'mdi:television' : 'mdi:speaker'}" style="--mdc-icon-size: 24px; color: ${isOn ? accentColor : 'rgba(255, 255, 255, 0.6)'};"></ha-icon>
                    `}
                  </div>
                  <div class="title-text-group">
                    <span class="device-pill-tag">
                      ${isPlaying ? `<span class="live-dot"></span>` : ''}
                      ${appName ? `${appName} \u00b7 ` : ''}${deviceFriendly}
                    </span>
                    <span class="media-title" title="${rawTitle}">${rawTitle}</span>
                    <span class="media-subtitle" title="${rawSubtitle}">${rawSubtitle}</span>
                  </div>
                </div>

                <div class="btn-group">
                  <button class="ctrl-btn ${isOn ? 'active-accent' : ''}" style="${isOn ? `background: ${accentColor}; box-shadow: 0 0 12px ${accentColor};` : ''}" data-action="toggle" data-entity="${entId}" title="Power" aria-label="Power">
                    <ha-icon icon="mdi:power" style="--mdc-icon-size: 18px;"></ha-icon>
                  </button>
                </div>
              </div>

              <!-- SCRUBBER / PROGRESS BAR -->
              ${hasProgress ? `
                <div class="progress-bar-wrap">
                  <div class="progress-track">
                    <div class="progress-fill" style="width: ${progressPct}%; background: ${accentColor}; box-shadow: 0 0 8px ${accentColor};"></div>
                  </div>
                  <span class="progress-time">${timeFormatted}</span>
                </div>
              ` : ''}

              <!-- CONTROLS & VISUALIZER -->
              <div class="controls-row">
                <div class="waveform-strip">
                  ${isPlaying ? `
                    <div class="wave-bar" style="background: ${accentColor};"></div>
                    <div class="wave-bar" style="background: ${accentColor};"></div>
                    <div class="wave-bar" style="background: ${accentColor};"></div>
                    <div class="wave-bar" style="background: ${accentColor};"></div>
                    <div class="wave-bar" style="background: ${accentColor};"></div>
                  ` : `
                    <span style="font-size: 11px; color: rgba(255,255,255,0.45); font-weight: 700;">${isOn ? 'Standby' : 'Off'}</span>
                  `}
                </div>

                <div class="btn-group">
                  ${mediaType === 'music' ? `
                    <button class="ctrl-btn" data-action="prev" data-entity="${entId}" title="Previous" aria-label="Previous Track">
                      <ha-icon icon="mdi:skip-previous" style="--mdc-icon-size: 18px;"></ha-icon>
                    </button>
                    <button class="ctrl-btn" data-action="play_pause" data-entity="${entId}" title="Play/Pause" aria-label="${isPlaying ? 'Pause' : 'Play'}">
                      <ha-icon icon="${isPlaying ? 'mdi:pause' : 'mdi:play'}" style="--mdc-icon-size: 18px;"></ha-icon>
                    </button>
                    <button class="ctrl-btn" data-action="next" data-entity="${entId}" title="Next" aria-label="Next Track">
                      <ha-icon icon="mdi:skip-next" style="--mdc-icon-size: 18px;"></ha-icon>
                    </button>
                  ` : `
                    <button class="ctrl-btn" data-action="play_pause" data-entity="${entId}" title="Play/Pause" aria-label="${isPlaying ? 'Pause' : 'Play'}">
                      <ha-icon icon="${isPlaying ? 'mdi:pause' : 'mdi:play'}" style="--mdc-icon-size: 18px;"></ha-icon>
                    </button>
                    <button class="ctrl-btn" data-action="mute" data-entity="${entId}" title="Mute" aria-label="${isMuted ? 'Unmute' : 'Mute'}">
                      <ha-icon icon="${isMuted ? 'mdi:volume-off' : 'mdi:volume-high'}" style="--mdc-icon-size: 18px;"></ha-icon>
                    </button>
                  `}

                  <button class="ctrl-btn ${showVol ? 'active-accent' : ''}" style="${showVol ? `background: ${accentColor}; box-shadow: 0 0 10px ${accentColor};` : ''}" data-action="vol_toggle" data-entity="${entId}" title="Volume Foldout" aria-label="Toggle Volume" aria-expanded="${showVol}">
                    <ha-icon icon="${isMuted ? 'mdi:volume-off' : 'mdi:volume-medium'}" style="--mdc-icon-size: 18px;"></ha-icon>
                  </button>
                </div>
              </div>

              <!-- FOLDOUT VOLUME SLIDER -->
              <div class="volume-foldout" style="display: ${showVol ? 'flex' : 'none'};">
                <ha-icon icon="mdi:volume-low" style="--mdc-icon-size: 16px; color: rgba(255,255,255,0.65);"></ha-icon>
                <input type="range" class="vol-slider" min="0" max="100" value="${volLevel}" data-entity="${entId}" aria-label="Volume">
                <ha-icon icon="mdi:volume-high" style="--mdc-icon-size: 16px; color: rgba(255,255,255,0.65);"></ha-icon>
                <span class="vol-pct">${volLevel}%</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Event listeners
    this.shadowRoot.querySelectorAll('.bubble-header').forEach((el) => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        window.location.hash = this._config.popup_hash;
      });
    });

    this.shadowRoot.querySelectorAll('.ctrl-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = btn.getAttribute('data-action');
        const entId = btn.getAttribute('data-entity');
        if (!entId) return;

        switch (action) {
          case 'toggle':
            this._callService(entId, 'toggle');
            break;
          case 'play_pause':
            this._callService(entId, 'media_play_pause');
            break;
          case 'prev':
            this._callService(entId, 'media_previous_track');
            break;
          case 'next':
            this._callService(entId, 'media_next_track');
            break;
          case 'mute': {
            const isMuted = this._hass.states[entId]?.attributes?.is_volume_muted;
            this._callService(entId, 'volume_mute', { is_volume_muted: !isMuted });
            break;
          }
          case 'vol_toggle':
            this._toggleVolume(entId, e);
            break;
        }
      });
    });

    this.shadowRoot.querySelectorAll('.vol-slider').forEach((slider) => {
      slider.addEventListener('change', (e) => {
        e.stopPropagation();
        const entId = slider.getAttribute('data-entity');
        const val = Number(e.target.value);
        if (entId) this._setVolume(entId, val, e);
      });
    });
  }
}

customElements.define('studio-media-card', StudioMediaCard);
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'studio-media-card',
  name: 'Studio Media Card',
  description: 'Auto-tracking Video and Music Deck with twin bubble splitting on multi-stream, album art color sync, and foldout volume.'
});
