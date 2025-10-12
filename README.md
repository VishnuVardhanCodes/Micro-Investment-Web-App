# 💰 Micro-Investment Web Application

A comprehensive full-stack micro-investment platform that helps users save and invest their spare change automatically. Built with FastAPI backend and React frontend, featuring transaction roundups, wallet management, money transfers, portfolio tracking with real-time P&L, Razorpay payment integration, and gamification elements.

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

## 🚀 Features

### User Authentication
- ✅ Sign Up / Sign In with email and password
- ✅ JWT-based authentication with secure password hashing (bcrypt)
- ✅ Protected routes and session management

### Transaction & Micro-Investment Logic
- ✅ Manual transaction entry with round-up calculation
- ✅ Round-up to nearest ₹1 or ₹10
- ✅ Automatic savings pool aggregation
- ✅ Mock data generation for testing
- ✅ Transaction history with delete functionality
- ✅ Real-time roundup tracking and display

### Wallet Management
- ✅ Wallet deposit via Razorpay integration
- ✅ Real-time balance tracking
- ✅ Deposit history with transaction details
- ✅ Separate tracking of wallet vs roundup funds
- ✅ Balance display across all pages

### Money Transfer
- ✅ Send money via UPI or mobile number
- ✅ Transfer from wallet balance
- ✅ Optional roundup-to-invest during transfers
- ✅ Transfer history and status tracking
- ✅ Real-time balance validation

### Portfolio Management
- ✅ Browse 30+ stocks, crypto, ETFs, and mutual funds
- ✅ Add/remove stocks from portfolio selection
- ✅ User-selected portfolio customization
- ✅ Auto-recommended investments based on risk profile
- ✅ Real-time P&L tracking with price updates
- ✅ Exit investments and return funds to wallet
- ✅ Detailed investment breakdown by asset

### Investment Options
- ✅ **Invest from Roundups**: Use accumulated transaction roundups
- ✅ **Invest from Wallet**: Use deposited wallet balance
- ✅ Dual-source investment selection
- ✅ Automatic distribution across selected stocks
- ✅ Investment tracking by source (roundups vs wallet)

### Real-Time Market Simulation
- ✅ Auto price updates every 30 seconds
- ✅ Random price fluctuations (-3% to +3%)
- ✅ Manual price update button for testing
- ✅ Live P&L calculation and display
- ✅ Percentage gain/loss tracking

### Razorpay Payment Integration
- ✅ Wallet deposit integration
- ✅ Support for UPI, Card, and Netbanking
- ✅ Secure payment verification with signature validation
- ✅ Automatic balance crediting
- ✅ Sandbox mode for testing

### Dashboard & Gamification
- ✅ Comprehensive overview with key metrics
- ✅ Roundup savings prominently displayed
- ✅ Total invested and wallet balance tracking
- ✅ Investment source breakdown
- ✅ Achievement milestones and badges
- ✅ Progress tracking with visual indicators
- ✅ Recent transactions and transfer history
- ✅ Beautiful, modern UI with Tailwind CSS and gradients

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI
- **Database**: SQLite (with SQLAlchemy ORM)
- **Authentication**: JWT with passlib/bcrypt
- **Payment**: Razorpay Python SDK
- **Environment**: Python 3.8+

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Icons**: Lucide React
- **HTTP Client**: Axios

## 📋 Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn
- Razorpay account (for sandbox keys)

## 🔧 Installation & Setup

### 1. Clone the Repository

```bash
cd /Users/muhammedsaheerkhan/Developer/hackthon
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit the `.env` file with your configuration:

```env
SECRET_KEY=your_super_secret_key_change_this_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DATABASE_URL=sqlite:///./micro_investment.db
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

**Get Razorpay Keys:**
1. Sign up at [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to Settings → API Keys
3. Generate Test Keys for sandbox mode
4. Copy the Key ID and Key Secret to your `.env` file

### 3. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install
```

## 🚀 Running the Application

### Start Backend Server

```bash
# In the backend directory with venv activated
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: `http://localhost:8000`
API Documentation: `http://localhost:8000/docs`

### Start Frontend Server

```bash
# In the frontend directory
cd frontend
npm run dev
```

Frontend will be available at: `http://localhost:3000`

## 📱 Using the Application

### 1. Create an Account
- Navigate to `http://localhost:3000`
- Click "Sign Up" and create an account
- Set your risk profile (Low, Medium, High)
- Login with your credentials

### 2. Add Transactions (Generate Roundups)
- Go to **"Transactions"** page
- Click **"Add Mock Data"** for quick testing (recommended first step)
  - This adds 4 transactions with proper roundups (~₹18 total)
- Or click **"Add Transaction"** to add manually
- **Important**: Use decimal amounts like ₹234.50, ₹99.30 to generate roundups
  - ❌ ₹100.00 → ₹0 roundup (already round number)
  - ✅ ₹99.30 → ₹0.70 roundup
  - ✅ ₹234.50 → ₹0.50 roundup (nearest ₹1)
  - ✅ ₹89.20 → ₹10.80 roundup (nearest ₹10)
- View your roundup savings pool growing!

### 3. Add Money to Wallet (Optional)
- Go to **"Wallet"** page
- Enter deposit amount
- Click "Add Money"
- Complete Razorpay payment (use test credentials)
- Wallet balance updated instantly

### 4. Select Your Portfolio
- Navigate to **"Portfolio"** page
- Browse 30+ stocks, crypto, ETFs (Reliance, Bitcoin, Nifty 50, etc.)
- Click "Add Stocks" to customize your portfolio
- Select stocks you want to invest in
- Or use auto-recommended stocks based on your risk profile
- Click "X" on any stock to remove it

### 5. Invest Your Money
- Go to **"Invest Money"** page
- **Choose investment source:**
  - **Round-ups**: Invest from transaction roundups (no wallet needed)
  - **Wallet**: Invest from deposited wallet balance
- Enter amount or use quick select buttons
- Click **"Invest Now"**
- Money automatically distributed across your selected stocks
- View investments in Portfolio with real-time P&L

### 6. Track Real-Time P&L
- Go to **"Portfolio"** page
- View current investments with profit/loss
- Click **"Update Prices"** to manually refresh stock prices
- Prices auto-update every 30 seconds in background
- Watch your P&L change in real-time!
- Click "Exit Investment" to sell and return money to wallet

### 7. Send Money (Optional)
- Go to **"Send Money"** page
- Enter recipient UPI or mobile number
- Enter transfer amount (from wallet)
- **Optional**: Add roundup amount to invest simultaneously
  - Transfer comes from wallet
  - Roundup investment comes from your roundup savings
- Complete transfer

### 8. Track Progress
- View **Dashboard** for comprehensive overview
- Monitor roundup savings, wallet balance, total invested
- Check investment source breakdown (roundups vs wallet)
- View recent transactions and transfers
- Unlock achievement badges as you save!
  - 🎯 First Steps - First transaction
  - 💰 Penny Saver - ₹10 saved
  - 📈 Growing Wealth - ₹100 saved
  - 🏆 Investment Pro - ₹500 saved
  - 💎 Wealth Builder - ₹1000 saved

## 🧪 Testing with Razorpay Sandbox

### Test Payment Credentials

**Test Card:**
- Card Number: `4111 1111 1111 1111`
- CVV: Any 3 digits (e.g., `123`)
- Expiry: Any future date (e.g., `12/25`)
- Name: Any name

**Test UPI ID:**
- Success: `success@razorpay`
- Failure: `failure@razorpay`

**Test Netbanking:**
- Select any bank
- Use success/failure based on test scenario

## 📊 API Endpoints

### Authentication
- `POST /signup` - Register new user
- `POST /login` - Login and get JWT token
- `GET /me` - Get current user information

### Transactions
- `POST /transaction` - Create new transaction with round-up
- `GET /transactions` - Get user's transaction history
- `DELETE /transaction/{transaction_id}` - Delete a transaction

### Wallet
- `GET /wallet` - Get wallet balance and roundup savings
- `POST /deposit/create-order` - Create Razorpay order for deposit
- `POST /deposit/verify` - Verify deposit payment
- `GET /deposits` - Get deposit history

### Money Transfer
- `POST /transfer` - Transfer money via UPI/mobile with optional roundup
- `GET /transfers` - Get transfer history

### Portfolio
- `GET /portfolio-options` - Get all available investment options (30+ assets)
- `POST /select-portfolio` - Save user's portfolio selection
- `GET /portfolio` - Get current portfolio selection
- `DELETE /portfolio-selection/{option_id}` - Remove stock from selection
- `GET /investments` - Get user's investment history
- `GET /investments/detailed` - Get detailed investments with P&L
- `POST /investments/exit/{option_id}` - Exit investment and return to wallet

### Investment
- `POST /invest-roundups?amount=X&source=Y` - Invest from roundups or wallet
- `GET /investment-sources` - Get investment breakdown by source
- `POST /update-prices` - Manually trigger price update (testing)

### Dashboard
- `GET /dashboard` - Get dashboard statistics
- `GET /milestones` - Get achievement milestones

### Payment (Razorpay)
- `POST /create-order` - Create Razorpay order
- `POST /verify-payment` - Verify and process payment
- `POST /webhook/razorpay` - Razorpay webhook endpoint

**API Documentation**: Visit `http://localhost:8000/docs` for interactive Swagger documentation

## 🎯 Key Features Explained

### Round-up Calculation
```python
def calculate_roundup(amount: float, nearest: int = 1) -> float:
    rounded = (int(amount // nearest) + 1) * nearest
    return round(rounded - amount, 2)

# Examples:
# Transaction: ₹234.50, nearest=1 → Rounded to: ₹235 → Round-up: ₹0.50
# Transaction: ₹234.50, nearest=10 → Rounded to: ₹240 → Round-up: ₹5.50
# Transaction: ₹89.20, nearest=10 → Rounded to: ₹90 → Round-up: ₹0.80
```

### Dual-Source Investment System
Users can invest from two separate sources:

1. **Roundup Savings** (Primary micro-investment source)
   - Accumulated from transaction roundups
   - No wallet deposit needed
   - Tracks invested vs available roundups
   - Ideal for passive micro-investing

2. **Wallet Balance** (Direct investment source)
   - Money deposited via Razorpay
   - Can be used for transfers or investments
   - Flexible investment amounts
   - Combines with roundups for comprehensive investing

### Real-Time P&L Tracking
```python
# Background task updates prices every 30 seconds
async def update_stock_prices():
    while True:
        await asyncio.sleep(30)
        # Update all stock prices with -3% to +3% change
        for stock in stocks:
            stock.price *= (1 + random.uniform(-0.03, 0.03))

# P&L Calculation
current_value = units * current_price
profit_loss = current_value - amount_invested
profit_loss_percentage = (profit_loss / amount_invested) * 100
```

### Money Transfer with Optional Roundup
```python
# User sends ₹100 + ₹1 roundup to invest
transfer_amount = 100  # Deducted from wallet
roundup_to_invest = 1  # Comes from accumulated roundups (separate source)

# Result:
# - Wallet: -₹100
# - Roundup pool: -₹1
# - Portfolio: +₹1 invested
```

### Auto-Recommendation Logic
The system recommends investments based on user's risk profile:
- **Low Risk**: ETFs (Nifty 50, Gold), Blue-chip stocks (Reliance, TCS), Debt funds
- **Medium Risk**: Mid-cap stocks, Diversified funds, Balanced portfolio
- **High Risk**: Crypto (Bitcoin, Ethereum), Growth stocks, Sector-specific investments

### Portfolio Management
- **Add Stocks**: Select from 30+ options, immediately reflected in future investments
- **Remove Stocks**: Click X to remove, rebalances future investments
- **Exit Investment**: Sell all units, get current value back to wallet
- **Price Updates**: Manual button + automatic 30-second updates

### Gamification System
Users unlock badges based on savings milestones:
- 🎯 **First Steps** - Made first transaction
- 💰 **Penny Saver** - ₹10 saved in roundups
- 📈 **Growing Wealth** - ₹100 saved in roundups
- 🏆 **Investment Pro** - ₹500 saved in roundups
- 💎 **Wealth Builder** - ₹1000 saved in roundups

### Available Investment Options (30+ Assets)

**Blue Chip Stocks (Low Risk)**
- Reliance Industries, TCS, HDFC Bank, ITC, Infosys, Hindustan Unilever

**Mid Cap Stocks (Medium Risk)**
- Asian Paints, Pidilite Industries, Page Industries, Crompton Greaves, Havells India, Marico

**Growth Stocks (High Risk)**
- Zomato, Nykaa, Paytm, Adani Green, Adani Ports

**Cryptocurrencies (High Risk)**
- Bitcoin, Ethereum, Cardano, Polkadot, Solana, Dogecoin, Shiba Inu

**Index ETFs / Mutual Funds (Low Risk)**
- Nifty 50 ETF, Bank Nifty ETF, Gold ETF, Sensex ETF, Liquid Fund, Short Duration Fund, Long Duration Fund

**Debt/Hybrid Funds (Low Risk)**
- Corporate Bond Fund, Government Securities Fund, Balanced Advantage Fund

## 🔒 Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- CORS protection
- Razorpay signature verification
- Input validation with Pydantic
- SQL injection protection with SQLAlchemy

## 📁 Project Structure

```
hackthon/
├── backend/
│   ├── main.py              # FastAPI application & all endpoints
│   ├── models.py            # SQLAlchemy database models
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── auth.py              # JWT authentication & password hashing
│   ├── database.py          # Database configuration & session
│   ├── utils.py             # Helper functions (roundup calc, recommendations)
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Environment variables (not in git)
│   └── .env.example         # Example environment file
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx   # App layout with sidebar navigation
│   │   ├── pages/
│   │   │   ├── Login.jsx           # Login page
│   │   │   ├── Signup.jsx          # Signup page
│   │   │   ├── Dashboard.jsx       # Main dashboard with stats
│   │   │   ├── Transactions.jsx    # Transaction management
│   │   │   ├── Wallet.jsx          # Wallet deposit page
│   │   │   ├── Transfer.jsx        # Money transfer page
│   │   │   ├── PortfolioNew.jsx    # Portfolio management with P&L
│   │   │   └── InvestRoundups.jsx  # Investment page (dual-source)
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx     # Authentication context
│   │   ├── services/
│   │   │   └── api.js              # API client & all endpoint calls
│   │   ├── App.jsx          # Main app component with routes
│   │   ├── main.jsx         # Entry point
│   │   └── index.css        # Global styles with Tailwind
│   ├── public/
│   │   └── index.html       # HTML template with Razorpay script
│   ├── package.json         # Node dependencies
│   ├── vite.config.js       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   └── postcss.config.js    # PostCSS configuration
└── README.md                # This file
```

### Key Files Overview

**Backend:**
- `main.py` - 1000+ lines with all API endpoints, background tasks, startup logic
- `models.py` - User, Transaction, Investment, Portfolio, Transfer, Wallet models
- `schemas.py` - Request/response validation schemas
- `utils.py` - Roundup calculation, portfolio recommendation logic

**Frontend:**
- `pages/*.jsx` - 8 main pages (Dashboard, Transactions, Wallet, Portfolio, etc.)
- `services/api.js` - Centralized API calls using Axios
- `contexts/AuthContext.jsx` - Authentication state management
- `components/Layout.jsx` - Sidebar navigation & layout wrapper

## 🐛 Troubleshooting

### Backend Issues

**Error: Module not found**
```bash
# Make sure virtual environment is activated
source venv/bin/activate
pip install -r requirements.txt
```

**Error: Database locked**
```bash
# Stop the server and delete the database file
rm micro_investment.db
# Restart the server to recreate tables
```

### Frontend Issues

**Error: Module not found**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error: Port 3000 already in use**
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9
# Or use a different port
npm run dev -- --port 3001
```

### Razorpay Issues

**Payment not working**
- Verify Razorpay keys in `.env` are correct
- Ensure using test/sandbox keys
- Check browser console for errors
- Verify Razorpay script is loaded in `public/index.html`

### Feature-Specific Issues

**No roundups showing (₹0.00)**
- You likely entered round numbers like ₹100, ₹200
- Solution: Add transactions with decimals (₹234.50, ₹99.30)
- Quick fix: Click "Add Mock Data" button in Transactions page

**Prices not updating**
- Backend may not be running
- Check terminal for price update logs: `[HH:MM:SS] 📈 Stock prices updated`
- Click "Update Prices" button in Portfolio for manual update
- Restart backend server to restart background task

**Investment from roundups fails**
- Check if you have available roundups (not already invested)
- Go to Dashboard to see "Available to invest"
- Ensure roundup amount < available roundup pool

**Transfer taking money from wallet instead of roundups**
- Transfer amount ALWAYS comes from wallet
- Roundup-to-invest (optional field) comes from roundup pool
- These are separate sources by design

**Portfolio selection not saving**
- Check browser console for errors
- Ensure you clicked the stock cards (they should highlight)
- Try selecting one stock at a time

## ❓ FAQ (Frequently Asked Questions)

**Q: Do I need to deposit money to start investing?**
- No! You can invest using just roundups from transactions. Add transactions with decimal amounts, and roundups will accumulate automatically.

**Q: What's the difference between Wallet and Roundups?**
- **Wallet**: Money you deposit via Razorpay. Used for transfers and investments.
- **Roundups**: Automatically calculated from transactions. Primary micro-investment source.

**Q: How do stock prices change?**
- Prices auto-update every 30 seconds with -3% to +3% random changes (simulated market).
- Click "Update Prices" in Portfolio for manual updates.

**Q: Can I lose money in investments?**
- Yes! Prices fluctuate, so P&L can be positive or negative.
- This is a demo/simulation, not real money.

**Q: How does the "Send Money" roundup investment work?**
- Transfer amount comes from wallet balance.
- Optional roundup amount comes from accumulated roundups.
- Example: Send ₹100 (wallet) + ₹5 roundup investment (from roundup pool).

**Q: Why aren't my roundups showing?**
- You likely added round numbers (₹100, ₹200) which have ₹0 roundup.
- Use decimal amounts: ₹99.30, ₹234.50, etc.
- Quick fix: Click "Add Mock Data" in Transactions.

**Q: Can I remove stocks from my portfolio?**
- Yes! Click the X button on any selected stock in Portfolio page.
- Future investments will exclude removed stocks.

**Q: What happens when I "Exit Investment"?**
- All units are sold at current price.
- Money (current value) is credited to wallet.
- You see total P&L from that investment.

**Q: Is this production-ready?**
- This is a hackathon/demo project using SQLite and simulated prices.
- For production: Use PostgreSQL, real market API, proper security measures.

## 🚀 Production Deployment

### Backend
1. Use PostgreSQL instead of SQLite
2. Set strong `SECRET_KEY` in environment
3. Enable HTTPS
4. Use production Razorpay keys
5. Set up webhook URL in Razorpay dashboard
6. Configure CORS for production domain

### Frontend
1. Build for production: `npm run build`
2. Deploy to Vercel, Netlify, or similar
3. Update API base URL to production backend
4. Enable environment variables for API URL

## 🎨 Application Highlights

### Pages Overview
1. **Dashboard** - Central hub with stats, roundup savings, wallet balance, investment breakdown
2. **Transactions** - Add/delete transactions with roundup calculation
3. **Wallet** - Deposit money via Razorpay, view deposit history
4. **Portfolio** - Manage stocks, view P&L, add/remove selections, exit investments
5. **Invest Money** - Dual-source investing (roundups or wallet)
6. **Send Money** - Transfer via UPI/mobile with optional roundup investment
7. **Login/Signup** - Authentication with risk profile selection

### Technical Highlights
- **Real-time Updates**: Stock prices update every 30 seconds automatically
- **Dual-Source Investing**: Separate tracking of roundup vs wallet investments
- **Smart Validation**: Different balance checks for transfers vs investments
- **Background Tasks**: Async price updates using FastAPI background tasks
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **API Documentation**: Auto-generated Swagger docs at `/docs`

### Business Logic Highlights
- Roundup calculations with flexible rounding (₹1 or ₹10)
- Auto portfolio recommendations based on risk profile
- Real-time P&L calculation with live price updates
- Achievement system to encourage saving habits
- Comprehensive money flow tracking (deposits, transfers, investments, exits)

## 🤝 Contributing

This is a hackathon project. Feel free to fork and enhance!

**Potential Enhancements:**
- Add real stock market API integration
- Implement SIP (Systematic Investment Plan)
- Add more investment options (Gold, Bonds, etc.)
- Create mobile app with React Native
- Add social features (share achievements, compete with friends)
- Implement tax calculation and reporting
- Add bank account linking for automatic roundups

## 📝 License

MIT License - feel free to use this project for learning and development.

## 👨‍💻 Developer

Built with ❤️ for the hackathon by Muhammed Saheer Khan

## 🙏 Acknowledgments

- **FastAPI** - Amazing async Python framework with auto docs
- **React** - Powerful UI library with hooks and context
- **Razorpay** - Seamless payment integration
- **Tailwind CSS** - Utility-first CSS for beautiful UI
- **Lucide React** - Clean and consistent icon set
- **Vite** - Lightning-fast frontend build tool
- **SQLAlchemy** - Powerful ORM for database operations
- **Axios** - Promise-based HTTP client
#   M i c r o - I n v e s t m e n t - W e b - A p p 
 
 