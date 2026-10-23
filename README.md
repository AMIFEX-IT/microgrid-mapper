# SunScout 🌍☀️

### Open-Source GIS Spatial Planner for Rural Renewable Energy Access

**SunScout** is a geospatial planning platform designed to support the assessment and planning of rural renewable energy projects, particularly off-grid solar-plus-storage microgrids. By combining Geographic Information Systems (GIS), satellite imagery, AI-assisted analysis, and techno-economic modelling, SunScout aims to help users evaluate potential sites for decentralized energy infrastructure.

The project focuses on making renewable energy planning more accessible, data-driven, and scalable, especially in communities where extending the conventional electricity grid may be challenging.


---
<img width="800" height="374" alt="Recording 2026-10-23 135446" src="https://github.com/user-attachments/assets/3c5399fc-b1f9-427b-ac1e-feadfd4ba8c9" />


## 📌 Table of Contents

- [Overview](#-overview)
- [Key Capabilities](#-key-capabilities)
- [Who Is It For?](#-who-is-it-for)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Available Scripts](#-available-scripts)
- [Project Structure](#-project-structure)
- [Potential Applications](#-potential-applications)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

## 🌐 Overview

Access to reliable electricity remains a significant challenge for many rural and underserved communities. Traditional grid expansion can be expensive and geographically difficult, making decentralized renewable energy systems an important alternative.

SunScout explores how geospatial technologies and AI-assisted analysis can support the early stages of microgrid planning.

The platform is intended to help users investigate potential project locations, understand spatial characteristics, and assess the feasibility of solar-powered mini-grid systems with battery storage.

### The Vision

To provide an accessible, open-source planning tool that helps researchers, energy developers, engineers, and development organizations make better-informed decisions about rural electrification.

## ✨ Key Capabilities

SunScout is designed around the following capability areas:

### 🗺️ Geospatial Planning

Use GIS-based spatial exploration to support the assessment of potential locations for rural renewable energy infrastructure.

### 🛰️ Satellite-Based Site Assessment

Leverage satellite imagery and geographic information to support the evaluation of communities and potential energy project sites.

### 🤖 AI-Assisted Rooftop Analysis

Explore AI-assisted analysis of rooftops and built environments as a potential input to distributed solar energy assessment.

### ⚡ Microgrid Planning

Focus on off-grid solar photovoltaic (PV) systems paired with battery energy storage to support decentralized electricity access.

### 📊 Techno-Economic Assessment

Support the broader goal of evaluating the technical and economic feasibility of rural solar-plus-storage projects.

> **Note:** These capability areas describe the project's intended scope. The availability and maturity of individual analysis functions depend on the current implementation.

## 🎯 Who Is It For?

SunScout may be useful to:

- **Renewable energy engineers** — explore potential sites for decentralized energy infrastructure.
- **GIS analysts and geospatial researchers** — investigate spatial data for energy-access planning.
- **Energy developers** — support early-stage site assessment and project planning.
- **Researchers and students** — explore the intersection of GIS, AI, and renewable energy systems.
- **Development organizations** — investigate potential approaches to rural electrification.
- **Open-source contributors** — help develop tools for more accessible, data-driven energy planning.

## 🛠️ Technology Stack

The project uses a modern TypeScript-based web development stack.

| Technology        | Purpose                                         |
| ----------------- | ----------------------------------------------- |
| React             | Component-based user interface                  |
| TypeScript        | Type-safe application development               |
| Vite              | Development server and production build tooling |
| Leaflet           | Interactive mapping                             |
| React Leaflet     | React integration for Leaflet maps              |
| D3.js             | Data visualization                              |
| Tailwind CSS      | Utility-first styling                           |
| Motion            | UI animations and transitions                   |
| Lucide React      | Interface icons                                 |
| Google Gemini API | AI integration where configured                 |
| Express           | Server-side functionality where used            |

## 🚀 Getting Started

Follow these steps to run SunScout locally.

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) — a version compatible with the project's dependencies.
- npm, included with Node.js.
- Git.

### 1. Clone the Repository

```bash
git clone https://github.com/AMIFEX-IT/microgrid-mapper.git
```

### 2. Navigate to the Project Directory

```bash
cd microgrid-mapper
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a local environment file based on the provided example:

```bash
cp .env.example .env.local
```

On Windows Command Prompt, you can use:

```cmd
copy .env.example .env.local
```

Configure the environment variables required by the parts of the application you intend to run. See [Environment Configuration](#-environment-configuration).

### 5. Start the Development Server

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal. The current development script uses port `3000`.

### 6. Build for Production

```bash
npm run build
```

The production build is generated in the `dist/` directory.

To preview the production build locally:

```bash
npm run preview
```

## 🔐 Environment Configuration

The repository includes an `.env.example` file documenting environment variables used by the project.

| Variable         | Purpose                                                 |
| ---------------- | ------------------------------------------------------- |
| `GEMINI_API_KEY` | API key for Google Gemini functionality, where required |
| `APP_URL`        | Application URL used by supported runtime integrations  |

Example configuration:

```env
GEMINI_API_KEY=your_gemini_api_key
APP_URL=http://localhost:3000
```

Use the actual values and configuration expected by your deployment environment.

**Security considerations:**

- Never commit real API keys, access tokens, or other secrets to Git.
- Keep local environment files out of version control.
- If an API key is used by browser-side code, do not assume that an environment variable makes it secret. Route sensitive API calls through an appropriately secured backend.
- Configure production environment variables through your hosting provider's environment settings.

## 📜 Available Scripts

| Command           | Description                                                      |
| ----------------- | ---------------------------------------------------------------- |
| `npm run dev`     | Start the development server                                     |
| `npm run build`   | Build the application for production                             |
| `npm run preview` | Preview the production build locally                             |
| `npm run lint`    | Run the configured TypeScript checks                             |
| `npm run clean`   | Remove generated build output and the configured server artifact |

## 📁 Project Structure

The repository is organized around a modern frontend application.

```text
microgrid-mapper/
├── public/
│   └── assets/
├── src/
│   └── main.tsx
├── .aistudio/
├── .env.example
├── .gitignore
├── index.html
├── metadata.json
├── package.json
├── bun.lock
├── tsconfig.json
├── vite.config.ts
└── README.md
```

The structure above highlights the principal repository locations. The `src/` directory contains the application source code, while `public/` contains static assets. Additional modules and components may be organized within the source directory.

## 🌱 Potential Applications

SunScout's intended focus creates opportunities for further development in several areas:

- Rural electrification planning.
- Solar PV and battery-storage site assessment.
- Geospatial analysis of underserved communities.
- AI-assisted identification of buildings and potential energy demand.
- Early-stage renewable energy project feasibility studies.
- Data-driven planning for decentralized energy systems.

These applications represent the broader problem space the project addresses; specific outputs should be validated against the functionality implemented in the current version.

## 🗺️ Roadmap

Potential future development priorities include:

- [ ] Expand geospatial data ingestion and processing.
- [ ] Improve AI-assisted rooftop and building analysis.
- [ ] Integrate population, settlement, and energy-access datasets.
- [ ] Add solar resource and site-suitability assessment.
- [ ] Develop configurable solar PV and battery-storage sizing workflows.
- [ ] Introduce transparent techno-economic analysis and cost estimates.
- [ ] Support exporting assessment results and reports.
- [ ] Improve automated testing and technical documentation.
- [ ] Add deployment and data-source documentation.

The roadmap is a set of potential development priorities, not a claim that these features are currently implemented.

## 🤝 Contributing

Contributions, suggestions, and constructive feedback are welcome.

To contribute:

1. Fork the repository.

2. Create a feature branch.

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. Implement and test your changes.

4. Run the available checks.

   ```bash
   npm run lint
   npm run build
   ```

5. Commit your changes.

   ```bash
   git add .
   git commit -m "Add your feature description"
   ```

6. Push your branch and open a pull request describing the changes.

For larger changes, consider opening an issue first to discuss the proposed implementation.

## 📄 License

Please check the repository for a license file before reusing, modifying, or distributing this project. If no license has been added, the project's reuse and distribution permissions should be clarified before presenting it as an openly licensed software package.

---

## 🔗 Links

- **Live application:** [https://microgrid-mapper.vercel.app/](https://microgrid-mapper.vercel.app/)
- **GitHub repository:** [https://github.com/AMIFEX-IT/microgrid-mapper](https://github.com/AMIFEX-IT/microgrid-mapper)

---


&#x20; \<strong>SunScout — Exploring smarter approaches to rural renewable energy access.\</strong>

