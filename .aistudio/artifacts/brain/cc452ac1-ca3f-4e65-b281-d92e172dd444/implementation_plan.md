# Open-Source GIS Spatial Planner for Rural Renewable Energy Access

An interactive geospatial planning workbench that empowers clean energy developers, rural electrification agencies, and development banks to evaluate solar-plus-storage mini-grid feasibility for underserved communities using satellite imagery and techno-economic modeling.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and user experience decisions were confirmed through Phase 1 clarification and will guide the implementation:

- **Confirmed Decision 1 (Geographic Presets & Navigation)**: Provide curated presets across Sub-Saharan Africa and the Global South (e.g., Central Nigeria rural cluster, Northern Kenya pastoral community, Rift Valley Tanzania, Odisha India off-grid hamlet, Andean Peru rural settlement) alongside instant coordinate and place search.
- **Confirmed Decision 2 (IRENA Brief Delivery)**: Deliver a print-ready formatted feasibility report modal with instant browser print-to-PDF formatting, alongside raw structured JSON and markdown export downloads.
- **Confirmed Decision 3 (Techno-Economic Sensitivity Sliders)**: Implement real-time parameter controls for Peak Sun Hours (3.0 – 6.5 h/day), PV Capex ($/kWp), Battery Storage Capex ($/kWh), and Autonomy Days (1.0 – 3.0 days), dynamically updating LCOE and sizing metrics.

---

## 1. Overview & Core Concept

- **What It Does**: The platform pairs an interactive satellite mapping surface (Esri World Imagery) with an automated mini-grid techno-economic sizing engine. Users navigate to any rural or off-grid settlement, inspect high-resolution imagery, and trigger a spatial mini-grid assessment. The system analyzes rooftop geometry, building density, roof materials, and local infrastructure, computing optimal PV capacity, lithium-ion battery requirements, CAPEX breakdowns, and 20-year Levelized Cost of Electricity (LCOE).
- **Target Audience / Persona**: Energy planners, rural electrification agencies (e.g., REA Nigeria, REREC Kenya), renewable mini-grid developers (EPCs), and multilateral climate finance analysts (IRENA, World Bank, AfDB).
- **Key Value**: Reduces preliminary site prospecting time from weeks to seconds by providing instant, standardized geospatial reconnaissance and techno-economic benchmarking conforming to IRENA off-grid development methodologies.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Map Exploration & Targeting**: The user lands on a 60/40 split-screen workspace. The left 60% viewport hosts a high-performance Leaflet satellite canvas initialized over rural Sub-Saharan Africa (`Lat: 9.082, Lng: 8.6753`). Quick-preset tabs and coordinate inputs allow seamless re-centering.
2. **Site Assessment Trigger**: Floating over the map viewport is a focal "Run Assessment Here" action with a reticle crosshair indicator. Clicking captures the active bounding box, center coordinates, and zoom level, triggering a 2-second simulated spatial reconnaissance analysis with progressive status indicators.
3. **Techno-Economic Exploration**: The right 40% panel populates with high-density metric widgets: Usable Rooftop Area, Building Density, Roof Construction Type, PV Array Peak Capacity (kWp), Daily Solar Generation (kWh), Battery Storage Autonomy (kWh), Total CAPEX ($), and estimated LCOE ($/kWh).
4. **Sensitivity Tuning**: The user adjusts interactive sliders (Peak Sun Hours, Unit CAPEX costs, Battery Autonomy) in the control drawer to evaluate cost variations and project viability thresholds.
5. **IRENA Brief Export**: Clicking "Export IRENA Brief" in the header opens a formatted, publication-styled mini-grid pre-feasibility brief with project metadata, financial metrics, spatial coordinates, and downloadable PDF/JSON summaries.

### Visual Identity & Theme
- **Aesthetic Direction**: High-precision geospatial engineering workstation; dark slate theme with deliberate contrast, zero visual clutter, and strict domain styling.
- **Color Palette & Mood**:
  - Neutral Canvas (60%): Deep obsidian slate (`#0B0F17` / `#111827`) for sustained cartographic focus.
  - Structural Surfaces (30%): Hairline-bordered panels (`#1E293B`, border `#334155`) with high legibility.
  - Accent Budget (10%): Solar Amber (`#F59E0B`) and Renewable Emerald (`#10B981`) dedicated exclusively to primary actions, active geospatial layers, and key economic metrics.
- **Typography & Hierarchy**:
  - Display & Headlines: `Plus Jakarta Sans` / `Outfit` for clean, modern headings with strict `text-wrap: balance`.
  - Body & Form Controls: `DM Sans` / `Public Sans` for dense, scannable reading.
  - Telemetry & Financials: Monospace tabular numerals (`font-mono tabular-nums`) for currency figures, energy capacities, and coordinate coordinates.
- **Component Styling & Layout**: Strict adherence to the universal frontend design rules: zero static pill badges, zero code-comment headers (`//`), single-elevation cards with clean hairline dividers, single-line button labels (`whitespace-nowrap`), and single-row top navigation contract.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Map Tile Engine & Satellite Source**
  - *Chosen Approach*: Leaflet with Esri World Imagery (`https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`) combined with OpenStreetMap Carto layer toggle for reference verification.
  - *Why*: High-resolution global satellite coverage in remote rural areas without requiring complex external API tokens or billing constraints; smooth pan/zoom in iframe environments.
  - *Alternatives Considered*: Google Maps JS SDK (requires billing account setup and external script injection) or Mapbox (requires access tokens).

- **Decision 2: Techno-Economic Sizing Formulation**
  - *Chosen Approach*: Standard IRENA and NREL mini-grid benchmarks:
    - $\text{PV Capacity (kWp)} = \text{usable rooftop } (m^2) \times 0.20$
    - $\text{Daily Generation (kWh)} = \text{PV Capacity} \times \text{Peak Sun Hours}$
    - $\text{Battery Storage (kWh)} = \text{Daily Generation} \times \text{Autonomy Days}$
    - $\text{CAPEX (\$)} = (\text{PV Capacity} \times \text{Unit PV Cost}) + (\text{Battery Storage} \times \text{Unit Battery Cost}) + \text{BOS / Grid Extension Overhead}$
    - $\text{LCOE (\$/kWh)} = \frac{\text{CAPEX}}{\text{Daily Generation} \times 365 \times \text{Project Lifetime (20 yrs)}} + \text{O\&M Adder (\$0.05)}$
  - *Why*: Provides transparent, realistic engineering figures aligned with the user prompt, while interactive sensitivity sliders allow immediate scenario modeling.

- **Decision 3: AI Assessment Simulation Architecture**
  - *Chosen Approach*: Structured `simulateGeminiAnalysis(bounds, center)` function generating deterministic, coordinate-seeded building density, roof materials, usable area, and grid distance, complemented by a Gemini-styled AI analytical narrative summary.
  - *Why*: Delivers instant, dependable offline/online feasibility assessments without external network latency or quota interruptions, while providing a clear full-stack pathway for live vision models.

- **Decision 4: Brief Export Mechanism**
  - *Chosen Approach*: Embedded IRENA-formatted modal with native browser `@media print` CSS stylesheet plus instant JSON and Markdown download triggers.
  - *Why*: Guarantees crisp, vector-grade PDF generation without external canvas rasterization issues, working seamlessly across all browsers.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│               Top Navigation Bar (Title & IRENA Export Action)          │
├─────────────────────────────────────┬──────────────────────────────────┤
│           Left Viewport (60%)       │        Right Viewport (40%)      │
│ ┌─────────────────────────────────┐ │ ┌──────────────────────────────┐ │
│ │  Leaflet Map Engine             │ │ │ Location & Preset Selector   │ │
│ │  - Esri World Imagery TileLayer │ │ ├──────────────────────────────┤ │
│ │  - Bounding Box & Center Reticle│ │ │ Techno-Economic Parameter    │ │
│ │  - Spatial Target Overlays      │ │ │ Sensitivity Sliders          │ │
│ │  - Quick Location Presets       │ │ ├──────────────────────────────┤ │
│ ├─────────────────────────────────┤ │ │ AI Site Reconnaissance Cards │ │
│ │  Floating Target Action Dock    │ │ │ - Rooftop Area & Material    │ │
│ │  [ ⊙ Run Assessment Here ]      │ │ │ - Building Density & Infra   │ │
│ └─────────────────────────────────┘ │ ├──────────────────────────────┤ │
│                                     │ │ Sizing & Metric Dashboard    │ │
│                                     │ │ - PV Capacity & Daily Gen    │ │
│                                     │ │ - Battery Autonomy & CAPEX   │ │
│                                     │ │ - 20-Year Levelized Cost     │ │
│                                     │ ├──────────────────────────────┤ │
│                                     │ │ Dynamic Feasibility Summary  │ │
│                                     │ └──────────────────────────────┘ │
├─────────────────────────────────────┴──────────────────────────────────┤
│                  IRENA Feasibility Brief Modal Dialog                   │
│             (Print-to-PDF / JSON Export / Markdown Copy)               │
└────────────────────────────────────────────────────────────────────────┘
```

### State Store & Data Models
- **`MapState`**: Active latitude, longitude, zoom level, viewport bounding box, and selected regional preset.
- **`SensitivityParams`**: Peak Sun Hours ($4.5$ default, $3.0$–$6.5$), PV Capex rate ($\$900$/kWp default, $\$600$–$\$1400$), Battery Capex rate ($\$250$/kWh default, $\$180$–$\$450$), Autonomy Days ($1.5$ default, $1.0$–$3.0$).
- **`AISpatialResult`**:
  - `usable_rooftop_m2`: number (500–5000)
  - `building_density`: "Sparse" | "Medium" | "Dense"
  - `visible_infrastructure`: boolean
  - `roof_material`: "Mostly Metal" | "Thatch" | "Mixed"
  - `estimated_households`: number
  - `nearest_grid_distance_km`: number
- **`CalculatedMetrics`**:
  - `pvCapacityKwp`: number
  - `dailyGenerationKwh`: number
  - `annualGenerationKwh`: number
  - `batteryStorageKwh`: number
  - `pvCapex`: number
  - `batteryCapex`: number
  - `totalCapex`: number
  - `lcoePerKwh`: number
  - `co2MitigatedTonsYear`: number
- **`FeasibilitySummary`**: Dynamic 3-sentence techno-economic narrative summarizing solar resource quality, capital requirements, and mini-grid deployment readiness.
