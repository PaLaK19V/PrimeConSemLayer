# PrimeConSemLayer

PrimeConSemLayer is a React-based frontend prototype for an AI-powered semantic layer designed to interface with enterprise SAP systems such as SAP ECC and SAP S/4HANA.

## Live App

https://prime-con-sem-layer.vercel.app/

## GitHub Repository

https://github.com/PaLaK19V/PrimeConSemLayer

## Key Features

- Natural language query interface for SAP-style business questions
- 19 KPI dashboard cards across sales, finance, procurement, logistics, production, and quality
- Process mining view for Purchase-to-Pay analysis
- Root cause analysis module for underperforming KPIs
- Interactive charts and visualizations using Recharts
- Modern React-based UI with sample SAP-style data

## Current Status

This is a frontend prototype built using mock/sample data. It demonstrates the product concept, user interface, workflows, and dashboard experience.

The app is not yet connected to live SAP ECC or SAP S/4HANA systems.

## Future Scope

- Connect to SAP ECC/S/4HANA using RFC or OData APIs
- Build a secure backend API layer
- Move AI API calls to the backend
- Add authentication and role-based access control
- Integrate real process mining using pm4py or ProM
- Connect dashboards to live SAP tables and KPI data
- Deploy the full system on enterprise cloud infrastructure

## Tech Stack

React, Vite, JavaScript, Recharts, CSS-in-JS styling.

## How to Run Locally

```bash
git clone https://github.com/PaLaK19V/PrimeConSemLayer.git
cd PrimeConSemLayer
npm install
npm run dev
eof
