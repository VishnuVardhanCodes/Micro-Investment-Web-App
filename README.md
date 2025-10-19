# 💰 Micro-Investment Web Application

A comprehensive full-stack micro-investment platform that helps users save and invest their spare change automatically. Built with FastAPI backend and React frontend, featuring transaction roundups, wallet management, money transfers, portfolio tracking with real-time P&L, Razorpay payment integration, and gamification elements..


---
<!-- test -->
## 📑 Table of Contents
- [Quick Start](#-quick-start)
- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Running the Application](#-running-the-application)
- [Using the Application](#-using-the-application)
- [Testing with Razorpay](#-testing-with-razorpay-sandbox)
- [API Endpoints](#-api-endpoints)
- [Key Features Explained](#-key-features-explained)
- [Security Features](#-security-features)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)
- [FAQ](#-faq-frequently-asked-questions)
- [Production Deployment](#-production-deployment)
- [Application Highlights](#-application-highlights)
- [Contributing](#-contributing)

---

## ⚡ Quick Start

```bash
# 1. Backend Setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Edit with your Razorpay keys
uvicorn main:app --reload

# 2. Frontend Setup (new terminal)
cd frontend
npm install
npm run dev

# 3. Open browser
# Visit http://localhost:3000
# Sign up → Add Mock Transactions → Select Portfolio → Invest!
```


