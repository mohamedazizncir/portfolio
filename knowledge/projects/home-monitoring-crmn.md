---
type: project
id: home-monitoring-crmn
tags: [python, rag, agentic-ai, internship]
---

## Contextual agentic reasoning for home health monitoring

Built during the CRMN internship (Sousse, 06/2026 to 08/2026). Official title: "Contextual Agentic Reasoning via RAG and Interoperability APIs in Home-Monitoring Frameworks."

A system that monitors a patient's vital signs at home, decides whether an alert is needed, and determines what kind of network support the situation requires. Two tiers, connected only through a Kafka message broker: Tier 1 is fast and rule-based, Tier 2 is slower and reasoning-based.

Aziz worked on: choosing the orchestration framework for Tier 2, then extending the Tier 2 pipeline to reason over enriched context across multiple emergency scenarios, plus the RAG retrieval stack and the interoperability services connecting the two tiers (a retrieval service and a network-request emission service).

Benchmarked four vector databases (ChromaDB, FAISS, Qdrant, and a fourth) and several orchestration frameworks for latency, reliability, and scalability, then integrated the best combination. Stack: Llama, Kafka, Docker, LangGraph, CrewAI, RAGAS, Git, Python.

All data used was synthetic, since no real smart-home hardware was available.

**Status:** internship complete. He is now continuing this work with his supervisor toward a research publication, this is what gave him a genuine interest in agentic AI research.

