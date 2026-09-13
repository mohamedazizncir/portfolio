---
type: project
id: stockcare-hackathon
tags: [python, reinforcement-learning, healthcare, hackathon]
images: [/projects/stockcare-hackathon/screenshot.jpg, /projects/stockcare-hackathon/pitching-photo.png, /projects/stockcare-hackathon/team-photo.jpeg]
---

## StockCare, healthcare AI hackathon

Project name: StockCare (Predictive Demand and Priority-Aware Distribution Network). Team name: Team Chaneb+.

Three-layer architecture: Layer 1 does pharmacy-level demand forecasting, Layer 2 is a depot-side priority classification engine, Layer 3 does routing with mixed-integer linear programming (MILP).

Aziz is responsible for Layer 2, and implemented a reinforcement learning agent with adaptive weighting for prioritization, defining the state and action space and the reward function himself.

Uses the official Tunisian AMM (market authorization) database from the DPM (dpm.tn), covering 6,058 active drug authorizations, to ground the forecasting in real regulatory data.

**Status:** phase 1 (problem/solution write-up) was submitted. This is a hackathon entry, not a finished product, and no final placement is confirmed yet. Present it as an in-progress hackathon project, not as a completed result.

