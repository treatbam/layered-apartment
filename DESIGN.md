---
version: "1.0"
name: "Studio Liquid Ambiance"
description: "Glassmorphic, climate-aware, and color-reactive design system for Home Assistant Lovelace dashboards."
colors:
  bg-base: "#0B0E17"
  bg-surface: "rgba(18, 22, 34, 0.72)"
  bg-glass-tint: "rgba(255, 255, 255, 0.06)"
  border-glass: "rgba(255, 255, 255, 0.14)"
  border-glass-subtle: "rgba(255, 255, 255, 0.07)"
  text-primary: "#FFFFFF"
  text-secondary: "rgba(255, 255, 255, 0.68)"
  text-muted: "rgba(255, 255, 255, 0.42)"
  accent-cool: "#00F5D4"
  accent-cool-glow: "rgba(0, 245, 212, 0.45)"
  accent-heat: "#FF5400"
  accent-heat-glow: "rgba(255, 84, 0, 0.50)"
  accent-fan: "#CED4DA"
  accent-dry: "#FFBE0B"
  accent-party: "#9D4EDD"
  sky-day-start: "#175D97"
  sky-day-end: "#52B1E4"
  sky-sunset-start: "#2D1052"
  sky-sunset-mid: "#BA4849"
  sky-sunset-end: "#FCD279"
  sky-night-start: "#0A0E27"
  sky-night-mid: "#1C1A48"
  sky-night-end: "#251642"
  sky-night-aurora: "rgba(129, 140, 248, 0.42)"
typography:
  title-lg:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 700
    letterSpacing: "-0.02em"
  title-md:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    letterSpacing: "-0.01em"
  body-md:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 500
    letterSpacing: "0.01em"
  caption-sm:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    letterSpacing: "0.02em"
  stat-num:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 800
    letterSpacing: "-0.03em"
rounded:
  sm: "12px"
  md: "18px"
  lg: "24px"
  xl: "32px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "20px"
  xl: "24px"
components:
  card-primary:
    backgroundColor: "{colors.bg-surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: 20px
  card-chip:
    backgroundColor: "{colors.bg-glass-tint}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: 8px
  button-foldout:
    backgroundColor: "{colors.bg-glass-tint}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.pill}"
    padding: 6px
---

## Overview

**Studio Liquid Ambiance** combines Apple-inspired Liquid Glass physics with reactive ambient illumination and atmospheric weather simulations for Home Assistant. The interface merges physical apartment spatial awareness with real-time state feedback:

1. **Liquid Glass & Displacement:** Cards feature translucent glassmorphism with subtle displacement distortion, specular satin rim lighting, and backdrop saturation.
2. **Atmospheric Climate & Weather:** Live celestial gradients calculated from sun elevation (`sun.sun`) blended with animated weather conditions and minisplit wind dynamics.
3. **Dynamic Ambiance:** Real-time mesh gradients that compute the live RGB and Kelvin color temperature blend of active apartment lighting fixtures.
4. **Anti-Clutter Foldouts:** High-frequency controls remain 1-tap accessible while secondary controls (e.g. volume sliders, fixture-level dimmers) hide inside smooth collapsible drawers.

---

## Colors

The color palette is divided into foundational glass neutrals, state-reactive illumination tokens, and semantic HVAC airflow signatures.

### 1. Foundational Canvas & Glass
- **Base Canvas (`{colors.bg-base}`):** Deep obsidian night canvas creating infinite depth behind floating glass modules.
- **Glass Surface (`{colors.bg-surface}`):** Semi-translucent dark slate tinted with backdrop blur.
- **Glass Borders (`{colors.border-glass}`, `{colors.border-glass-subtle}`):** Delicate dual-layer border simulating light catching the bevel of thick optical glass.

### 2. Semantic HVAC Vortices
When the minisplit climate unit is active, fluid wavy vortices blow across the studio floorplan with colors reflecting the thermal mode:
- **Cooling (`{colors.accent-cool}`):** Electric Cyan (`#00F5D4`) blending to Azure Blue (`#3A86FF`) with a soft atmospheric neon aura.
- **Heating (`{colors.accent-heat}`):** Blaze Ember Orange (`#FF5400`) transitioning into Golden Flame (`#FFBE0B`).
- **Fan Circulation (`{colors.accent-fan}`):** Clean Silver Mist (`#CED4DA`) with subtle translucent opacity.
- **Dehumidify / Dry (`{colors.accent-dry}`):** Warm Golden Amber (`#FFBE0B`) to Salmon Rose (`#FB5607`).

### 3. Celestial Sky Gradients
The outdoor weather transitions continuously based on sun elevation from `sun.sun`:
- **Night:** Celestial Midnight Sapphire (`#0A0E27` to `#251642`) with glowing crescent moon, ambient indigo aurora nebula (`rgba(129, 140, 248, 0.42)`), multi-layered twinkling starfield, and lightning discharges during storms.
- **Dawn / Dusk:** Magenta dusk (`#1B0B2E` through `#852254` to `#E5735A`).
- **Sunrise / Sunset:** Rich solar spectrum (`#240046` to `#9D0208` to `#FFBA08`).
- **Golden Hour:** Warm golden hour azure and honey amber (`#144570` to `#4895EF` to `#FAEDCD`).
- **Day:** Radiant cerulean daylight (`#1565C0` to `#80D8FF`).

### 4. Dynamic Lighting Ambiance
The lighting card calculates a multi-point radial mesh gradient:
`radial-gradient(circle at 15% 25%, rgba(R1, G1, B1, α) 0%, transparent 60%)` + `radial-gradient(circle at 85% 75%, rgba(R2, G2, B2, α) 0%, transparent 60%)`.
- When all lights are off, the card settles into a deep frosted carbon sheen (`#101420`).
- When colored lights are active, their true RGB values are projected into the glass.
- Warm/cool white bulbs are mapped from Kelvin (2700K warm candle to 5000K daylight).

---

## Typography

Typography uses the system font stack (`system-ui`, `-apple-system`, `Segoe UI`, `Roboto`) to ensure zero network latency and native rendering performance on mobile, tablet, and desktop displays.

- **Card Titles (`{typography.title-lg}`):** 17px, Bold 700, -0.02em letter spacing. Crisp and readable at a glance.
- **Area Group Headings (`{typography.title-md}`):** 14px, Semi-Bold 600. Clean separation between room zones.
- **Subtitles & Descriptions (`{typography.body-md}`):** 13px, Medium 500 with 68% opacity for optical balance.
- **Micro Badges & Chips (`{typography.caption-sm}`):** 11px, Bold 700, uppercase letter-spaced badges for active counts (e.g. `7/7`).
- **Hero Metrics (`{typography.stat-num}`):** 22px, Extra-Bold 800 for current temperature and power wattage.

---

## Layout

The dashboard is structured around an adaptive 2-column Sections grid (`max_columns: 2`, `dense_section_placement: true`) that naturally reflows:
- **Mobile Viewport (< 600px):** Single stacked column with compact cards.
- **Tablet / Desktop Viewport (≥ 600px):** Balanced 2-column layout with Climate/Weather on the left and Studio Lighting on the right.

### Section Breakdown
1. **Section 0 (Header Pills):** Horizontal button stack spanning both columns (`column_span: 2`). Quick status badges (Party toggle, Outdoor Temp, Realtime Power, Network Throughput, Total Lights On).
2. **Section 1 (Core Living Area):**
   - Left: `custom:studio-climate-weather-card` (12 columns).
   - Right: `custom:studio-lights-ambient-card` (12 columns).
3. **Section 2 (Media Suite):**
   - Video Card (`media_player.bedroom_tv_2`, 12 columns, 3 rows).
   - Music Card (`media_player.bedroom_speaker`, 12 columns, 3 rows).
4. **Section 3 (Energy & Power):**
   - Real-time power minute average with animated SVG threshold gradient.
5. **Section 4 (Popup Overlays):**
   - Vertical stack housing modal popups for deep control (`#lights`, `#climate`, `#media`, `#power`, `#network`, `#weather`).
6. **Section 5 (Sticky Navigation Dock):**
   - Persistent bottom dock (`footer_mode: true`) with one-tap routing to all 6 overlays.

---

## Elevation & Depth

Depth is established through physical glassmorphism rather than artificial flat drop-shadows:
- **Primary Card Enclosure:**
  - `box-shadow: 0 10px 30px rgba(0, 0, 0, 0.30), inset 0 1px 1px rgba(255, 255, 255, 0.22);`
  - Inset highlight catches the top edge, mimicking polished crystal glass.
- **Liquid Glass Distortion Parameters:**
  - `radius: 32px`
  - `blur: 8px`
  - `saturate: 140%`
  - `depth: 4px`
  - `strength: 60`
  - `highlightOpacity: 0.28 - 0.40`
- **Soft Blur Divider:**
  - Cards split between outdoor and indoor views use a 24px wide linear blur mask gradient (`linear-gradient(90deg, transparent, rgba(0,0,0,0.5), transparent)`) instead of hard vertical dividing lines.

---

## Shapes

Shapes follow an intentional hierarchy of corner radiuses:
- **`{rounded.xl}` (32px):** Primary outer card containers. Standardized across Bubble cards, Climate Weather, and Ambient Lighting.
- **`{rounded.lg}` (24px):** Secondary nested blocks and pop-up inner modules.
- **`{rounded.md}` (18px):** Collapsible area drawers (Living, Desk, Bed, Bath).
- **`{rounded.sm}` (12px):** Internal device chips and sliders.
- **`{rounded.pill}` (9999px):** Master action buttons, quick toggles, and status badges.

---

## Components

### 1. Studio Climate & Weather Card (`studio-climate-weather-card`)
- **Unified Full-Bleed Celestial Canvas:**
  - Continuous sun-phase gradient spanning the entire card with radiant depth (Celestial Sapphire `#0A0E27` through twilight violet `#251642`).
  - Ambient indigo and violet aurora glow (`.celestial-aurora`) with glowing crescent moon and multi-layered twinkling starfield.
  - Glistening sun rays with CSS keyframe animation for clear daytime conditions.
  - Dynamic meteorological animations: rain streaks, falling snow, and animated lightning flashes.
- **Architectural Floorplan & Wind Vortices Layer:**
  - Right 58% architectural floorplan blueprint overlay with fluid gradient mask dissolve (`mask-image: linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.6) 22%, #000 100%)`).
  - Color-reactive minisplit wind vortex waves streaming across the room (Cool=Cyan, Heat=Orange, Fan=White, Dry=Amber).
- **Exact Symmetrical 3-Column Layout (`1fr auto 1fr`):**
  - **Left Flank (Weather):** Left-aligned header (`Outdoor · Phase`), hero outdoor temperature (`54px`, `weight: 300`), condition subtitle (`15px`, `weight: 500`), and footer chips (`[Humidity %] [Wind mph]`).
  - **Center Column (Agnostic Target Control & Modes):** Directly centered target temperature stepper pill (`[ −  Target°  + ]`) with `TARGET SETPOINT` micro-label and centered bottom HVAC mode selector group (`[Off] [Cool] [Heat] [Fan]`).
  - **Right Flank (Indoor Climate — Mirrored):** Mirrored right-aligned header (`Studio · AC`), hero indoor temperature (`54px`, `weight: 300`), `Indoor` status subtitle (`15px`, `weight: 500`), and footer chips (`[Fan Speed] [Indoor Humidity %]`). Matching identical font size, font weight, line height, and baseline alignment.


### 2. Ambient Lighting Card (`studio-lights-ambient-card`)
- **Master Header & Studio Dimmer:**
  - Floor-plan icon with glowing accent ring reflecting dominant studio light hue.
  - Live tally of active fixtures (`X of Y lights on · Z% avg`).
  - Master All-Off / Turn-On toggle pill button.
  - **Studio Master Dimmer Slider:** Tactile full-width glass slider that adjusts brightness across all active studio lights in unison.
- **Room-Card-Plus Architectural Zones:**
  - 4 architectural zones: Living & Lounge, Desk & Tech, Bed & Ambiance, Bathroom.
  - Each room tile features its own room icon, active count badge (`X On` / `Off`), and **1-tap Room Toggle Button** directly on the tile.
  - Tiles emit dynamic ambient neon rim lighting matching the dominant color of the active lights in that room.
  - Collapsible drawer foldout reveals individual light cards.
- **Tactile Individual Light Cards:**
  - Luminous circular bulb icon button radiating the light's exact RGB color.
  - Light friendly name with live brightness percentage label (`75% Brightness`).
  - Generous 28px touch slider with colored fill track and white thumb for easy adjustments without accidental toggles.
  - **Quick Color & Kelvin Presets Bar:** 8 tactile bubbles (`Candle 2200K`, `Warm 2700K`, `Neutral 4000K`, `Daylight 5500K`, `Crimson`, `Cyan`, `Purple`, `Amber`) for instant color shifts.
  - Palette button triggering native Home Assistant `hass-more-info` modal for granular hex/color wheel control.
- **Footer Effects & Scenes Dock:**
  - One-tap shortcuts for Party Mode (`input_boolean.party_hue`), Fire Effect (`script.lifx_fireeffect`), Colorloop (`script.1689003108593`), Clean Routine (`script.clean_plant`), and deep `#lights` popup.

### 3. Media Player Cards (`studio-media-card`)
- **Intelligent Stream Classification & Auto-Attachment:**
  - Dynamically scans all `media_player.*` entities in Home Assistant.
  - Intelligently classifies players into `video` or `music` based on content type, active application (`YouTube`, `Netflix`, `Spotify`, etc.), and device attributes.
  - Automatically attaches to any active screen/display/TV streaming video (or speaker streaming audio) without requiring static hardcoded IDs.
  - Gracefully falls back to standby state for the default primary device when no active stream is running.
- **Twin-Bubble Dynamic Splitting:**
  - When 2 or more video displays (or audio speakers) are active concurrently, the card automatically **breaks into two separate bubbles** rendered side-by-side in a responsive glass grid.
  - Each bubble operates independently with its own thumbnail/art, stream metadata, scrubber, controls, and volume foldout.
- **Scrubber & Progress Bar:**
  - For media reporting position and duration, displays an illuminated progress bar with formatted time timestamps (`mm:ss / mm:ss`).
- **Live Album-Art Extraction:**
  - Samples dominant chromatic pixels from `entity_picture` to project ambient mesh glow across the card surface and rim highlight.
- **Acoustic Frequency Waveform:**
  - Animated 5-bar sound visualizer pulsating in real time when `state: playing`.
- **Anti-Clutter Foldout Volume:**
  - Smooth collapsible volume drawer with range slider, percentage readout, and mute button.

### 4. Dynamic Island HUD (`studio-dynamic-island`)
- **Resting Pill Mode:** Compact glass capsule showing live outdoor temperature, active light count with breathing status dot, real-time power wattage, and network throughput.
- **Live Activity Takeover:**
  - *Now Playing:* Spinning vinyl/album thumbnail, 5-bar oscillating waveform visualizer, track/artist title, and inline Play/Pause/Skip controls.
  - *Party Hue:* Animated chromatic spectrum aura border with instant disarm toggle.
  - *Power Alert:* Amber electric pulse border triggered when draw exceeds 1,100W.
- **Interactive Cockpit Hub:** Tapping the island triggers a spring physics expansion (`cubic-bezier(0.34, 1.56, 0.64, 1)`) into a studio control panel with quick toggles, energy metrics, and overlay shortcuts.

### 5. Power Flow & Granular Sub-Meters (`studio-power-flow-card`)
- **Master Hero Capsule:**
  - Live total wattage readout (`1,038 W`) and daily kWh accumulation (`0.77 kWh today`).
  - Dynamic load aura and status badge: Eco Cyan (<550W), Normal Amber (550W–1200W), Heavy Draw Solar Orange (>1200W).
  - Tactile foldout toggle button to expand or collapse the Sankey flow stream.
- **Hierarchy & Sub-Meter Architecture:**
  - True physical breaker hierarchy reflected cleanly without double-counting:
    - Network Server (`sensor.networknonups_energy_power`) sub-metered under Balance Breaker (`sensor.balance_power_minute_average`).
    - MainPi 3D Printer (`sensor.klipper_energy_power`) sub-metered under Bedroom Outlets (`sensor.bedroom_receptacles_power_minute_average`).
  - Sub-circuit bubble pills marked with clean breadcrumb indicators (`↳ Balance Breaker`, `↳ Bedroom Breaker`).
- **Granular Sub-Bubbles Dock:**
  - Horizontal scrolling row of miniature glass bubble pills for every monitored circuit (Fridge, Network Server, Bedroom Outlets, Kitchen Outlets, 3D Printer, Microwave, Ceiling/Fan, Untracked Balance).
  - Real-time wattage readouts, status indicator dots, and single-tap stream isolation.
  - Double-click triggers native HA `hass-more-info` dialog.
- **Liquid Glass Sankey Energy Stream:**
  - Fluid cubic bezier vector ribbons connecting Grid → Studio → Sectors (Tech, Kitchen, Bed/Living, Untracked) → Individual Circuit Meters.
  - Proportional ribbon heights matching live consumption fractions.
  - Animated energy particle currents (`stroke-dasharray` / `stroke-dashoffset` GPU compositor animation) traveling at speeds proportional to wattage.
  - Interactive selection: Clicking or hovering any ribbon or node isolates that stream with luminous chromatic glow and displays a micro-glass tooltip with exact Watts and percentage share.


### 6. Klipper 3D Printer Card (`studio-klipper-card`)
- **Bambu Lab Inspired Bubble Aesthetic:**
  - High-performance glassmorphism card matching the studio dashboard design system (`border-radius: 32px`, `backdrop-filter: blur(24px)`).
  - Clean status badge pill showing current state (`STANDBY`, `PRINTING`, `PAUSED`, `COMPLETE`, `ERROR`) with state-coded ambient glow (Cyan, Emerald, Amber, Crimson).
- **Dual Radial Thermal Dials:**
  - Extruder / Nozzle temperature dial with dynamic circular progress track and target setpoint display (`210°C / 210°C`).
  - Heated Bed temperature dial with gradient thermal arc and target readout (`60°C / 60°C`).
  - Active heating indicators and dynamic thermal gradient (Cool Slate → Warm Amber → Flame Coral).
- **Job Progress & Shine Sweeper:**
  - Hero progress bar with animated CSS linear-gradient shine sweep across active print progress (`X%`).
  - Filename marquee and active layer readout (`Layer X / Y`).
  - Dynamic ETA and remaining print time countdown.
- **Micro-Telemetry Matrix:**
  - Live 4-tile telemetry grid: Cooling Fan Speed (`%`), Toolhead Z-Height (`mm`), MCU Temperature (`°C`), and Chamber / Toolhead status.
- **Visual G-Code Preview & Webcam Stream:**
  - Interactive preview viewport displaying Moonraker G-code thumbnail preview (`camera.mainpi_thumbnail`) with toggle button to switch instantly to live USB webcam stream (`camera.mainpi_usb`).
- **Tactile Quick Action Cockpit:**
  - Print controls: Pause / Resume, Cancel / Stop (with double-click protection to prevent accidental print abortion).
  - Toolhead Home All axes (`G28`), Emergency Stop (`M112`), Enclosure Light toggle (`light.moonraker_lightswitch`).
  - One-tap launcher button opening full Mainsail / Moonraker web UI (`http://192.168.86.220`).

---

## Do's and Don'ts

### Do's
- **DO** use `always_visible: false` on sliders in sub-buttons to keep the main view decluttered.
- **DO** use the `change` event (instead of raw `input`) when binding sliders to Home Assistant services to avoid flooding the WebSocket connection during drags.
- **DO** ensure all text rendered on dynamic weather backgrounds has a subtle text-shadow (`text-shadow: 0 1px 4px rgba(0,0,0,0.6)`) to guarantee WCAG AA readability across bright skies.
- **DO** keep the outer corner radius locked to `32px` on all top-level cards for uniform visual rhythm.
- **DO** preserve the `#hash` pop-up system for deep dive controls instead of cramming rarely-used settings onto the main dashboard.

### Don'ts
- **DON'T** use hard, opaque dividing lines between card sections; use translucent borders (`rgba(255, 255, 255, 0.08)`) or blur masks.
- **DON'T** let light sliders occupy permanent full-width rows on the primary dashboard when an area foldout or sub-button foldout can present them cleanly.
- **DON'T** use jarring, high-frequency animations; keep ambient weather and airflow animations smooth (2s to 8s loop intervals with ease-in-out timing).
- **DON'T** mix mismatched border radiuses on peer cards in the same section.
