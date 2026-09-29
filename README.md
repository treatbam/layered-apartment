# HAOS Studio Dashboard & Custom Lovelace Cards

An ultra-modern, glassmorphic Home Assistant dashboard ecosystem designed for high-density, tactile studio apartment management. Built with liquid glass design principles, responsive touch-first cards, dynamic SVG graphics, and real-time state reactivity.

---

## 🎨 Design System

Complete architecture, visual specifications, color tokens, and layout guidelines are documented in detail in [DESIGN.md](DESIGN.md).

* **Curvature**: Uniform `32px` corner radii across all top-level cards and `20px` for nested controls.
* **Surface Materials**: Dark obsidian glass (`rgba(16, 20, 32, 0.72)`) with 24px hardware-accelerated backdrop blur and chromatic edge highlights (`rgba(255, 255, 255, 0.12)`).
* **State Aura**: Context-driven dynamic lighting projections (climate thermal states, active lighting hues, print status, and album art chroma extraction).

---

## 📦 Custom Cards Suite

The repository contains 6 custom Lovelace cards located in [`cards/`](cards/):

### 1. Dynamic Island HUD (`custom:studio-dynamic-island`)
* **Resting Mode**: Compact floating glass capsule displaying live weather temperature, active fixture count with breathing status dot, real-time power draw, and network throughput.
* **Live Activity Takeover**:
  * *Now Playing*: Spinning vinyl thumbnail, 5-bar live oscillating waveform visualizer, track metadata, and inline transport controls.
  * *Party Mode*: Animated rainbow chromatic spectrum border with instant disarm toggle.
  * *Power Alert*: Pulsing amber electric glow when power draw exceeds threshold (1,100W).
* **Spring Expansion**: Expands on tap with spring physics (`cubic-bezier(0.34, 1.56, 0.64, 1)`) into a studio control cockpit.

### 2. Climate & Weather Engine (`custom:studio-climate-weather-card`)
* **Atmospheric Sky Engine**: Real-time celestial background rendering based on sun elevation, cloud coverage, and precipitation (clear day glistening rays, nocturnal starfield, rain streaks, snowfall, lightning).
* **Architectural Blueprint & Airflow**: Floorplan overlay with color-reactive minisplit vortex streams (Cyan for Cool, Orange for Heat, White for Fan, Amber for Dry).
* **Symmetrical Mirrored Flanks**:
  * Left Flank: Outdoor conditions, weather temperature, humidity, and wind speed.
  * Mirrored Right Flank: Indoor studio temperature, AC state, indoor humidity, and fan speed.
  * Center Column: Agnostic setpoint temperature stepper (`− / +`) and HVAC mode selector pills.

### 3. Ambient Lighting Card (`custom:studio-lights-ambient-card`)
* **Studio Master Dimmer**: Full-width glass touch slider adjusting brightness across all active studio lights in unison.
* **Architectural Zone Tiles**: 4 tactile room tiles (Living & Lounge, Desk & Tech, Bed & Ambiance, Bathroom) with live counts and 1-tap room toggles directly on the tile.
* **Dynamic Neon Glow**: Individual bulb icons radiating the exact live RGB hue of each fixture.
* **Quick Presets Bar**: 8 instant lighting presets (`Candle 2200K`, `Warm 2700K`, `Neutral 4000K`, `Daylight 5500K`, `Crimson`, `Cyan`, `Purple`, `Amber`).

### 4. Smart Media Deck (`custom:studio-media-card`)
* **Dynamic Stream Tracking**: Automatically scans and attaches to any active display, TV, or speaker streaming media without requiring static entity locking.
* **Twin-Bubble Dynamic Splitting**: If two or more screens (or speakers) stream concurrently, the card dynamically splits into two independent side-by-side glass bubbles.
* **Acoustic Waveform & Chromatic Aura**: Real-time 5-bar equalizer visualizer and background mesh glow derived from album art.
* **Foldout Volume Drawer**: Collapsible touch volume slider with mute toggle.

### 5. Liquid Glass Power Flow Card (`custom:studio-power-flow-card`)
* **Dynamic Load Aura**: Live total wattage readout and daily kWh accumulation with state-reactive aura (Eco Cyan, Normal Amber, Solar Orange).
* **Breaker Hierarchy Architecture**: Accurately maps sub-metered devices beneath their parent breaker without double-counting:
  * Network Server (`sensor.networknonups_energy_power`) $\rightarrow$ sub-metered under Balance Breaker.
  * 3D Printer (`sensor.klipper_energy_power`) $\rightarrow$ sub-metered under Bedroom Outlets Breaker.
* **Interactive Sankey Vector Stream**: Fluid cubic bezier ribbons with animated energy particles traveling at speeds proportional to live power draw. Tap any ribbon to isolate its consumption.

### 6. Klipper 3D Printer Card (`custom:studio-klipper-card`)
* **Bambu Lab Inspired Aesthetic**: High-finish status pill (`STANDBY`, `PRINTING`, `PAUSED`, `COMPLETE`, `ERROR`) with state-coded ambient illumination.
* **Dual Radial Thermal Dials**: Circular SVG heat gauges with dynamic thermal gradients for Extruder/Nozzle (`210°C / 210°C`) and Heated Bed (`60°C / 60°C`).
* **Job Progress & Shine Sweeper**: Animated gradient shine sweep across the active print progress bar, layer counter (`Layer X/Y`), and remaining time countdown.
* **G-Code Thumbnail & Live Webcam**: 1-tap toggle between Moonraker G-code thumbnail preview (`camera.mainpi_thumbnail`) and live USB webcam stream (`camera.mainpi_usb`).
* **Tactile Safety Cockpit**: Pause, Resume, Stop (with double-click protection), Home All (`G28`), Emergency Stop (`M112`), Enclosure Light toggle, and direct link to Mainsail web UI.

---

## 📁 Repository Structure

```text
.
├── cards/
│   ├── studio-climate-weather-card.js
│   ├── studio-dynamic-island.js
│   ├── studio-klipper-card.js
│   ├── studio-lights-ambient-card.js
│   ├── studio-media-card.js
│   └── studio-power-flow-card.js
├── dashboards/
│   └── layered-apartment.yaml        # Complete exported Lovelace dashboard configuration
├── DESIGN.md                         # Comprehensive Design System & Architecture Specification
└── README.md
```

---

## 🚀 Installation & Usage

### Option 1: File Storage (`/local/`)
1. Copy the files from `cards/` into your Home Assistant configuration directory under `www/studio/` (e.g. `/config/www/studio/`).
2. Add the resources in Home Assistant via **Settings $\rightarrow$ Dashboards $\rightarrow$ Resources** (or Lovelace YAML):
   ```yaml
   url: /local/studio/studio-dynamic-island.js
   type: module
   url: /local/studio/studio-climate-weather-card.js
   type: module
   url: /local/studio/studio-lights-ambient-card.js
   type: module
   url: /local/studio/studio-media-card.js
   type: module
   url: /local/studio/studio-power-flow-card.js
   type: module
   url: /local/studio/studio-klipper-card.js
   type: module
   ```

### Option 2: Inline Lovelace Resource (No External Hosting)
All studio cards are self-contained ES6 modules without external build dependencies and can be registered directly as inline Lovelace resources via the Home Assistant WebSocket API (`ha_config_set_dashboard_resource` with `content`).

---

## 📄 License

MIT License. Designed with ❤️ for Home Assistant OS.
