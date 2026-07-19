# India Cyber Threat Intelligence Platform (ICTIP)

## 1. Purpose and Vision
The core objective of ICTIP is to provide a dedicated, real-time Security Operations Center (SOC) dashboard that monitors, visualizes, and analyzes cyber threats specifically targeting Indian digital infrastructure. It bridges the gap between raw threat intelligence data and actionable security insights, allowing analysts to detect anomalies and investigate attacks instantly.

## 2. Modern Real-Time Architecture
The project is built on a highly responsive, async-first modern web architecture designed to handle rapid telemetry data:

* **High-Performance Backend (FastAPI & Python):** Built using FastAPI to handle asynchronous requests efficiently. It serves as the central nervous system that ingests, processes, and normalizes threat data.
* **Real-Time Data Streaming (WebSockets):** Instead of relying on slow HTTP polling, the platform uses persistent WebSocket connections to stream live attacks directly to the frontend the millisecond they are detected.
* **Reactive Frontend (React, TypeScript & Vite):** A highly dynamic, component-driven user interface that updates instantly. It uses Framer Motion for smooth animations and avoids full-page reloads.

## 3. Geospatial Threat Visualization
A core concept of the platform is making invisible cyber attacks visible. 

* **Interactive Mapping (Leaflet):** The platform translates raw IP addresses and telemetry into precise global coordinates. 
* **Visual Attack Vectors:** It renders dynamic, animated attack paths on a world map, showing the origin of the attack (globally) and its precise destination within Indian states and cities, giving analysts immediate situational awareness.

## 4. Multi-Source Intelligence Ingestion
The platform is designed to be highly adaptable and data-agnostic, meaning it can ingest data from multiple distinct streams without confusing them:

* **Live Sensor Telemetry:** Real-time data coming from active network sensors.
* **Threat Intelligence Feeds (OSINT):** Integration with global threat feeds (like AlienVault OTX, AbuseIPDB, and URLhaus) to pull known malicious Indicators of Compromise (IOCs).
* **Simulation Engine:** A built-in synthetic telemetry generator that allows the platform to function in "Demo Mode" for training, testing, and presentations without requiring a live enterprise network.

## 5. Integrated Incident Response (Investigation Mode)
Beyond just visualization, the platform incorporates a full incident response workflow.

* **Analyst Workbenches:** Security analysts can click on any live threat to enter "Investigation Mode."
* **MITRE ATT&CK Mapping:** Threats are categorized using the industry-standard MITRE ATT&CK framework to understand adversary tactics and techniques.
* **AI Analysis & Recommendations:** The system analyzes the event data and generates automated, intelligent response recommendations (e.g., "Block port 445 at the firewall").
* **Evidence Persistence:** All threats, investigation notes, and analyst conclusions are securely saved to a relational database (PostgreSQL/SQLAlchemy) for historical auditing and compliance.

## 6. Security and Cloud-Native Deployment
* **Secure Access:** The analyst console is protected by JWT (JSON Web Token) authentication to ensure only authorized personnel can view sensitive telemetry.
* **DevSecOps Ready:** The application is completely decoupled (frontend and backend are separate services) and containerized, allowing for seamless deployment to modern cloud providers like Vercel (Frontend) and Render/AWS (Backend).