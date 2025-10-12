from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import razorpay
import hmac
import hashlib
import os
import random
import asyncio
from datetime import datetime
from dotenv import load_dotenv

from database import engine, get_db, Base
from models import User, Transaction, PortfolioOption, PortfolioSelection, Investment, Milestone, UserMilestone, RiskProfile, AssetType, MoneyTransfer, TransferStatus, WalletDeposit, DepositMethod
from schemas import (
    UserCreate, UserLogin, UserResponse, Token,
    TransactionCreate, TransactionResponse,
    PortfolioOptionResponse, PortfolioSelectionCreate, PortfolioSelectionResponse,
    InvestmentResponse, InvestmentDetailResponse, DashboardStats, MilestoneResponse,
    OrderCreate, OrderResponse, PaymentWebhook,
    MoneyTransferCreate, MoneyTransferResponse,
    WalletDepositCreate, WalletDepositVerify, WalletDepositResponse, WalletBalanceResponse,
    InvestmentSourceResponse
)
from auth import get_password_hash, verify_password, create_access_token, get_current_user
from utils import calculate_roundup, get_auto_recommended_portfolios

load_dotenv()

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Micro-Investment API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Razorpay client
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "rzp_test_key")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "rzp_test_secret")
razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Background task to update stock prices
async def update_stock_prices():
    """Update stock prices every 30 seconds to simulate market changes"""
    while True:
        await asyncio.sleep(30)  # 30 seconds
        
        db = next(get_db())
        try:
            portfolio_options = db.query(PortfolioOption).all()
            
            for option in portfolio_options:
                # Simulate price change: -3% to +3% random change for more visible P&L
                change_percent = random.uniform(-0.03, 0.03)
                new_price = option.current_price * (1 + change_percent)
                option.current_price = round(new_price, 2)
            
            db.commit()
            print(f"[{datetime.now().strftime('%H:%M:%S')}] 📈 Stock prices updated (30s interval)")
        except Exception as e:
            print(f"Error updating prices: {e}")
            db.rollback()
        finally:
            db.close()

# Initialize default data
@app.on_event("startup")
async def startup_event():
    db = next(get_db())
    
    # Create portfolio options if not exist
    if db.query(PortfolioOption).count() == 0:
        portfolio_options = [
            # Blue Chip Stocks (Low Risk)
            PortfolioOption(name="Reliance Industries", symbol="RELIANCE", asset_type=AssetType.STOCK, risk_level=RiskProfile.LOW, description="Leading conglomerate - Oil, Retail, Telecom", current_price=2450.50),
            PortfolioOption(name="Infosys", symbol="INFY", asset_type=AssetType.STOCK, risk_level=RiskProfile.LOW, description="Global IT Services & Consulting", current_price=1450.75),
            PortfolioOption(name="HDFC Bank", symbol="HDFCBANK", asset_type=AssetType.STOCK, risk_level=RiskProfile.LOW, description="India's largest private bank", current_price=1650.30),
            PortfolioOption(name="TCS", symbol="TCS", asset_type=AssetType.STOCK, risk_level=RiskProfile.LOW, description="Tata Consultancy Services - IT Giant", current_price=3650.80),
            PortfolioOption(name="ICICI Bank", symbol="ICICIBANK", asset_type=AssetType.STOCK, risk_level=RiskProfile.LOW, description="Leading private sector bank", current_price=1050.20),
            PortfolioOption(name="Wipro", symbol="WIPRO", asset_type=AssetType.STOCK, risk_level=RiskProfile.LOW, description="IT Services & Consulting", current_price=445.60),
            
            # Mid Cap Stocks (Medium Risk)
            PortfolioOption(name="Asian Paints", symbol="ASIANPAINT", asset_type=AssetType.STOCK, risk_level=RiskProfile.MEDIUM, description="Leading paint manufacturer", current_price=2950.40),
            PortfolioOption(name="Bajaj Finance", symbol="BAJFINANCE", asset_type=AssetType.STOCK, risk_level=RiskProfile.MEDIUM, description="NBFC - Consumer finance leader", current_price=6850.90),
            PortfolioOption(name="Titan Company", symbol="TITAN", asset_type=AssetType.STOCK, risk_level=RiskProfile.MEDIUM, description="Jewelry & Watches leader", current_price=3340.75),
            PortfolioOption(name="Kotak Mahindra Bank", symbol="KOTAKBANK", asset_type=AssetType.STOCK, risk_level=RiskProfile.MEDIUM, description="Private sector banking", current_price=1780.50),
            PortfolioOption(name="HCL Technologies", symbol="HCLTECH", asset_type=AssetType.STOCK, risk_level=RiskProfile.MEDIUM, description="IT Services & Products", current_price=1520.30),
            PortfolioOption(name="Mahindra & Mahindra", symbol="M&M", asset_type=AssetType.STOCK, risk_level=RiskProfile.MEDIUM, description="Auto & Farm Equipment", current_price=1890.60),
            
            # Growth Stocks (High Risk)
            PortfolioOption(name="Adani Green Energy", symbol="ADANIGREEN", asset_type=AssetType.STOCK, risk_level=RiskProfile.HIGH, description="Renewable energy leader", current_price=1120.40),
            PortfolioOption(name="Zomato", symbol="ZOMATO", asset_type=AssetType.STOCK, risk_level=RiskProfile.HIGH, description="Food delivery & dining", current_price=145.80),
            PortfolioOption(name="Paytm", symbol="PAYTM", asset_type=AssetType.STOCK, risk_level=RiskProfile.HIGH, description="Digital payments platform", current_price=890.20),
            PortfolioOption(name="Adani Ports", symbol="ADANIPORTS", asset_type=AssetType.STOCK, risk_level=RiskProfile.HIGH, description="Port infrastructure", current_price=1250.70),
            PortfolioOption(name="LIC", symbol="LICI", asset_type=AssetType.STOCK, risk_level=RiskProfile.MEDIUM, description="Life Insurance Corporation", current_price=920.50),
            
            # Cryptocurrencies (High Risk)
            PortfolioOption(name="Bitcoin", symbol="BTC", asset_type=AssetType.CRYPTO, risk_level=RiskProfile.HIGH, description="Leading cryptocurrency - Digital gold", current_price=4500000.00),
            PortfolioOption(name="Ethereum", symbol="ETH", asset_type=AssetType.CRYPTO, risk_level=RiskProfile.HIGH, description="Smart contracts & DeFi platform", current_price=280000.00),
            PortfolioOption(name="Solana", symbol="SOL", asset_type=AssetType.CRYPTO, risk_level=RiskProfile.HIGH, description="High-speed blockchain", current_price=12500.00),
            PortfolioOption(name="Cardano", symbol="ADA", asset_type=AssetType.CRYPTO, risk_level=RiskProfile.HIGH, description="Proof-of-stake blockchain", current_price=45.50),
            PortfolioOption(name="Polygon", symbol="MATIC", asset_type=AssetType.CRYPTO, risk_level=RiskProfile.HIGH, description="Ethereum scaling solution", current_price=65.80),
            PortfolioOption(name="Ripple", symbol="XRP", asset_type=AssetType.CRYPTO, risk_level=RiskProfile.HIGH, description="Cross-border payments", current_price=52.30),
            PortfolioOption(name="Polkadot", symbol="DOT", asset_type=AssetType.CRYPTO, risk_level=RiskProfile.HIGH, description="Multi-chain protocol", current_price=520.40),
            
            # Index ETFs / Mutual Funds (Low Risk)
            PortfolioOption(name="Nifty 50 ETF", symbol="NIFTYBEES", asset_type=AssetType.ETF, risk_level=RiskProfile.LOW, description="Tracks Nifty 50 index - Top 50 companies", current_price=225.60),
            PortfolioOption(name="Bank Nifty ETF", symbol="BANKBEES", asset_type=AssetType.ETF, risk_level=RiskProfile.MEDIUM, description="Banking sector index fund", current_price=425.30),
            PortfolioOption(name="Gold ETF", symbol="GOLDBEES", asset_type=AssetType.ETF, risk_level=RiskProfile.LOW, description="Gold price tracking ETF", current_price=58.40),
            PortfolioOption(name="Nifty Next 50 ETF", symbol="JUNIORBEES", asset_type=AssetType.ETF, risk_level=RiskProfile.MEDIUM, description="Next 50 large companies", current_price=650.80),
            PortfolioOption(name="IT Sector ETF", symbol="ITBEES", asset_type=AssetType.ETF, risk_level=RiskProfile.MEDIUM, description="IT sector focused fund", current_price=285.90),
            PortfolioOption(name="Pharma ETF", symbol="PHARMABEES", asset_type=AssetType.ETF, risk_level=RiskProfile.MEDIUM, description="Pharmaceutical sector fund", current_price=890.50),
            PortfolioOption(name="Infrastructure ETF", symbol="INFRABEES", asset_type=AssetType.ETF, risk_level=RiskProfile.MEDIUM, description="Infrastructure sector fund", current_price=125.70),
            PortfolioOption(name="Consumption ETF", symbol="CONSUMERBEES", asset_type=AssetType.ETF, risk_level=RiskProfile.MEDIUM, description="Consumer goods sector", current_price=178.30),
            
            # Debt/Hybrid Funds (Low Risk)
            PortfolioOption(name="Liquid Fund", symbol="LIQUIDBEES", asset_type=AssetType.ETF, risk_level=RiskProfile.LOW, description="Short-term debt fund - Very safe", current_price=1000.50),
            PortfolioOption(name="Corporate Bond Fund", symbol="CORPBOND", asset_type=AssetType.ETF, risk_level=RiskProfile.LOW, description="High-quality corporate bonds", current_price=52.80),
            PortfolioOption(name="Government Securities", symbol="GILTBEES", asset_type=AssetType.ETF, risk_level=RiskProfile.LOW, description="Government bonds - Ultra safe", current_price=48.60),
        ]
        db.add_all(portfolio_options)
        db.commit()
    
    # Create milestones if not exist
    if db.query(Milestone).count() == 0:
        milestones = [
            Milestone(name="First Steps", description="Made your first transaction!", threshold=1.0, badge_icon="🎯"),
            Milestone(name="Penny Saver", description="Saved ₹10 in round-ups", threshold=10.0, badge_icon="💰"),
            Milestone(name="Growing Wealth", description="Saved ₹100 in round-ups", threshold=100.0, badge_icon="📈"),
            Milestone(name="Investment Pro", description="Saved ₹500 in round-ups", threshold=500.0, badge_icon="🏆"),
            Milestone(name="Wealth Builder", description="Saved ₹1000 in round-ups", threshold=1000.0, badge_icon="💎"),
        ]
        db.add_all(milestones)
        db.commit()
    
    db.close()
    
    # Start background price update task
    asyncio.create_task(update_stock_prices())

# Authentication Endpoints
@app.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@app.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    # Find user
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

# Transaction Endpoints
@app.post("/transaction", response_model=TransactionResponse)
async def create_transaction(
    transaction: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Calculate round-up
    roundup = calculate_roundup(transaction.amount, transaction.nearest)
    
    # Create transaction
    new_transaction = Transaction(
        user_id=current_user.id,
        amount=transaction.amount,
        roundup_amount=roundup,
        description=transaction.description
    )
    db.add(new_transaction)
    db.commit()
    db.refresh(new_transaction)
    
    # Check and award milestones
    total_roundups = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).with_entities(Transaction.roundup_amount).all()
    total_saved = sum([t[0] for t in total_roundups])
    
    milestones = db.query(Milestone).filter(Milestone.threshold <= total_saved).all()
    for milestone in milestones:
        existing = db.query(UserMilestone).filter(
            UserMilestone.user_id == current_user.id,
            UserMilestone.milestone_id == milestone.id
        ).first()
        if not existing:
            user_milestone = UserMilestone(
                user_id=current_user.id,
                milestone_id=milestone.id
            )
            db.add(user_milestone)
    
    db.commit()
    
    return new_transaction

@app.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.created_at.desc()).all()
    return transactions

@app.delete("/transaction/{transaction_id}")
async def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Find transaction
    transaction = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    ).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Delete transaction
    db.delete(transaction)
    db.commit()
    
    return {"status": "success", "message": "Transaction deleted successfully"}

# Portfolio Endpoints
@app.get("/portfolio-options", response_model=List[PortfolioOptionResponse])
async def get_portfolio_options(db: Session = Depends(get_db)):
    options = db.query(PortfolioOption).all()
    return options

@app.post("/select-portfolio", response_model=List[PortfolioSelectionResponse])
async def select_portfolio(
    selection: PortfolioSelectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Clear ALL existing selections (both user and auto-recommended)
    db.query(PortfolioSelection).filter(
        PortfolioSelection.user_id == current_user.id
    ).delete()
    
    # Add new selections
    selections = []
    for option_id in selection.portfolio_option_ids:
        new_selection = PortfolioSelection(
            user_id=current_user.id,
            portfolio_option_id=option_id,
            is_auto_recommended=False
        )
        db.add(new_selection)
        selections.append(new_selection)
    
    # Auto-recommend based on risk profile if no selections
    if not selection.portfolio_option_ids:
        portfolio_options = db.query(PortfolioOption).all()
        recommended = get_auto_recommended_portfolios(
            current_user.risk_profile.value,
            portfolio_options
        )
        for option in recommended:
            new_selection = PortfolioSelection(
                user_id=current_user.id,
                portfolio_option_id=option.id,
                is_auto_recommended=True
            )
            db.add(new_selection)
            selections.append(new_selection)
    
    db.commit()
    
    # Refresh and return
    result = db.query(PortfolioSelection).filter(
        PortfolioSelection.user_id == current_user.id
    ).all()
    return result

@app.get("/portfolio", response_model=List[PortfolioSelectionResponse])
async def get_portfolio(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    selections = db.query(PortfolioSelection).filter(
        PortfolioSelection.user_id == current_user.id
    ).all()
    
    # If no selections, auto-recommend
    if not selections:
        portfolio_options = db.query(PortfolioOption).all()
        recommended = get_auto_recommended_portfolios(
            current_user.risk_profile.value,
            portfolio_options
        )
        for option in recommended:
            new_selection = PortfolioSelection(
                user_id=current_user.id,
                portfolio_option_id=option.id,
                is_auto_recommended=True
            )
            db.add(new_selection)
        
        db.commit()
        
        selections = db.query(PortfolioSelection).filter(
            PortfolioSelection.user_id == current_user.id
        ).all()
    
    return selections

@app.get("/investments", response_model=List[InvestmentResponse])
async def get_investments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    investments = db.query(Investment).filter(
        Investment.user_id == current_user.id
    ).order_by(Investment.created_at.desc()).all()
    return investments

@app.post("/invest-roundups")
async def invest_roundups(
    amount: float,
    source: str = "roundups",  # "roundups" or "wallet"
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Invest from roundup savings or wallet balance"""
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")
    
    if source == "wallet":
        # Check wallet balance
        if amount > current_user.wallet_balance:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient wallet balance. Available: ₹{current_user.wallet_balance:.2f}"
            )
        # Deduct from wallet
        current_user.wallet_balance -= amount
    else:
        # Check available roundups
        roundups = db.query(Transaction.roundup_amount).filter(
            Transaction.user_id == current_user.id
        ).all()
        total_roundups = sum([r[0] for r in roundups]) if roundups else 0.0
        
        # Check existing investments from roundups
        investments = db.query(Investment).filter(
            Investment.user_id == current_user.id
        ).all()
        invested_from_roundups = sum([
            inv.amount for inv in investments 
            if inv.payment_id and (inv.payment_id.startswith('ROUNDUP_') or inv.payment_id.startswith('PAY'))
        ])
        
        available_roundups = total_roundups - invested_from_roundups
        
        if amount > available_roundups:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient roundups. Available: ₹{available_roundups:.2f}"
            )
    
    # Get user's portfolio selections
    selections = db.query(PortfolioSelection).filter(
        PortfolioSelection.user_id == current_user.id
    ).all()
    
    if not selections:
        # Auto-select based on risk profile
        portfolio_options = db.query(PortfolioOption).all()
        recommended = get_auto_recommended_portfolios(
            current_user.risk_profile.value,
            portfolio_options
        )
        for option in recommended:
            new_selection = PortfolioSelection(
                user_id=current_user.id,
                portfolio_option_id=option.id,
                is_auto_recommended=True
            )
            db.add(new_selection)
        db.flush()
        
        selections = db.query(PortfolioSelection).filter(
            PortfolioSelection.user_id == current_user.id
        ).all()
    
    # Distribute investment
    import uuid
    prefix = "WALLET" if source == "wallet" else "ROUNDUP"
    payment_id = f"{prefix}_{uuid.uuid4().hex[:10].upper()}"
    amount_per_selection = round(amount / len(selections), 2)
    
    for selection in selections:
        units = round(amount_per_selection / selection.portfolio_option.current_price, 6)
        
        investment = Investment(
            user_id=current_user.id,
            portfolio_option_id=selection.portfolio_option_id,
            amount=amount_per_selection,
            units=units,
            is_auto_recommended=selection.is_auto_recommended,
            payment_id=payment_id
        )
        db.add(investment)
    
    db.commit()
    
    return {
        "status": "success",
        "message": "Investment successful!",
        "amount_invested": amount,
        "distributed_across": len(selections)
    }

@app.get("/investments/detailed", response_model=List[InvestmentDetailResponse])
async def get_investments_detailed(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get investments with P&L calculation grouped by portfolio option"""
    investments = db.query(Investment).filter(
        Investment.user_id == current_user.id
    ).all()
    
    # Group investments by portfolio option
    grouped = {}
    for inv in investments:
        if inv.portfolio_option_id not in grouped:
            grouped[inv.portfolio_option_id] = {
                'portfolio_option': inv.portfolio_option,
                'total_amount': 0,
                'total_units': 0,
                'first_investment': inv.created_at
            }
        grouped[inv.portfolio_option_id]['total_amount'] += inv.amount
        grouped[inv.portfolio_option_id]['total_units'] += inv.units
    
    # Calculate P&L for each
    result = []
    for option_id, data in grouped.items():
        current_price = data['portfolio_option'].current_price
        current_value = data['total_units'] * current_price
        profit_loss = current_value - data['total_amount']
        profit_loss_pct = (profit_loss / data['total_amount'] * 100) if data['total_amount'] > 0 else 0
        
        result.append({
            'id': option_id,
            'portfolio_option_id': option_id,
            'portfolio_name': data['portfolio_option'].name,
            'portfolio_symbol': data['portfolio_option'].symbol,
            'asset_type': data['portfolio_option'].asset_type.value,
            'amount_invested': round(data['total_amount'], 2),
            'units': round(data['total_units'], 4),
            'current_price': round(current_price, 2),
            'current_value': round(current_value, 2),
            'profit_loss': round(profit_loss, 2),
            'profit_loss_percentage': round(profit_loss_pct, 2),
            'created_at': data['first_investment']
        })
    
    return result

@app.delete("/portfolio-selection/{option_id}")
async def remove_portfolio_selection(
    option_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a stock/crypto from portfolio selections"""
    selection = db.query(PortfolioSelection).filter(
        PortfolioSelection.user_id == current_user.id,
        PortfolioSelection.portfolio_option_id == option_id
    ).first()
    
    if not selection:
        raise HTTPException(status_code=404, detail="Selection not found")
    
    db.delete(selection)
    db.commit()
    
    return {"status": "success", "message": "Removed from portfolio"}

@app.post("/investments/exit/{option_id}")
async def exit_investment(
    option_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Exit/sell an investment and get money back to wallet"""
    # Get all investments for this option
    investments = db.query(Investment).filter(
        Investment.user_id == current_user.id,
        Investment.portfolio_option_id == option_id
    ).all()
    
    if not investments:
        raise HTTPException(status_code=404, detail="No investments found")
    
    # Calculate total units and current value
    total_units = sum(inv.units for inv in investments)
    total_invested = sum(inv.amount for inv in investments)
    current_price = investments[0].portfolio_option.current_price
    current_value = total_units * current_price
    profit_loss = current_value - total_invested
    
    # Credit wallet with current value
    current_user.wallet_balance += current_value
    
    # Delete all investments for this option
    for inv in investments:
        db.delete(inv)
    
    db.commit()
    
    return {
        "status": "success",
        "message": "Investment exited successfully",
        "total_invested": round(total_invested, 2),
        "current_value": round(current_value, 2),
        "profit_loss": round(profit_loss, 2),
        "credited_to_wallet": round(current_value, 2)
    }

# Dashboard Endpoint
@app.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Total transactions
    total_transactions = db.query(Transaction).filter(
        Transaction.user_id == current_user.id
    ).count()
    
    # Total round-ups
    roundups = db.query(Transaction.roundup_amount).filter(
        Transaction.user_id == current_user.id
    ).all()
    total_roundups = sum([r[0] for r in roundups]) if roundups else 0.0
    
    # Total invested
    investments = db.query(Investment.amount).filter(
        Investment.user_id == current_user.id
    ).all()
    total_invested = sum([i[0] for i in investments]) if investments else 0.0
    
    # Portfolio allocation
    portfolio_data = db.query(Investment).filter(
        Investment.user_id == current_user.id
    ).all()
    
    allocation = {}
    for inv in portfolio_data:
        asset_type = inv.portfolio_option.asset_type.value
        if asset_type in allocation:
            allocation[asset_type] += inv.amount
        else:
            allocation[asset_type] = inv.amount
    
    portfolio_allocation = [
        {"type": k, "amount": v, "percentage": (v/total_invested*100) if total_invested > 0 else 0}
        for k, v in allocation.items()
    ]
    
    # User selected vs auto-recommended
    user_selected = db.query(PortfolioSelection).filter(
        PortfolioSelection.user_id == current_user.id,
        PortfolioSelection.is_auto_recommended == False
    ).count()
    
    auto_recommended = db.query(PortfolioSelection).filter(
        PortfolioSelection.user_id == current_user.id,
        PortfolioSelection.is_auto_recommended == True
    ).count()
    
    return {
        "total_transactions": total_transactions,
        "total_roundups": round(total_roundups, 2),
        "total_invested": round(total_invested, 2),
        "portfolio_allocation": portfolio_allocation,
        "user_selected_count": user_selected,
        "auto_recommended_count": auto_recommended
    }

@app.get("/milestones", response_model=List[MilestoneResponse])
async def get_milestones(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    milestones = db.query(Milestone).all()
    user_milestones = db.query(UserMilestone).filter(
        UserMilestone.user_id == current_user.id
    ).all()
    
    user_milestone_ids = {um.milestone_id: um.achieved_at for um in user_milestones}
    
    result = []
    for milestone in milestones:
        achieved = milestone.id in user_milestone_ids
        result.append({
            "id": milestone.id,
            "name": milestone.name,
            "description": milestone.description,
            "threshold": milestone.threshold,
            "badge_icon": milestone.badge_icon,
            "achieved": achieved,
            "achieved_at": user_milestone_ids.get(milestone.id)
        })
    
    return result

# Razorpay Endpoints
@app.post("/create-order", response_model=OrderResponse)
async def create_razorpay_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user)
):
    # Convert to paise (1 rupee = 100 paise)
    amount_paise = int(order_data.amount * 100)
    
    # Create Razorpay order
    razorpay_order = razorpay_client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "payment_capture": 1
    })
    
    return {
        "order_id": razorpay_order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "razorpay_key": RAZORPAY_KEY_ID
    }

@app.post("/webhook/razorpay")
async def razorpay_webhook(request: Request, db: Session = Depends(get_db)):
    # Get webhook data
    body = await request.body()
    webhook_signature = request.headers.get("X-Razorpay-Signature", "")
    
    # Verify signature (in production)
    # For sandbox, we'll skip strict verification
    
    try:
        data = await request.json()
        
        if data.get("event") == "payment.captured":
            payment = data.get("payload", {}).get("payment", {}).get("entity", {})
            order_id = payment.get("order_id")
            payment_id = payment.get("id")
            amount = payment.get("amount", 0) / 100  # Convert paise to rupees
            
            # Here you would:
            # 1. Find the user associated with this order
            # 2. Get their portfolio selections
            # 3. Create investment records
            # For now, we'll return success
            
            return {"status": "success", "message": "Payment processed"}
        
        return {"status": "ignored"}
    
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/verify-payment")
async def verify_payment(
    payment_data: PaymentWebhook,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify signature
    generated_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        f"{payment_data.razorpay_order_id}|{payment_data.razorpay_payment_id}".encode(),
        hashlib.sha256
    ).hexdigest()
    
    if generated_signature != payment_data.razorpay_signature:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Get payment details
    payment = razorpay_client.payment.fetch(payment_data.razorpay_payment_id)
    amount = payment["amount"] / 100  # Convert to rupees
    
    # Get user's portfolio selections
    selections = db.query(PortfolioSelection).filter(
        PortfolioSelection.user_id == current_user.id
    ).all()
    
    if not selections:
        raise HTTPException(status_code=400, detail="No portfolio selected")
    
    # Distribute investment across selected portfolios
    amount_per_selection = amount / len(selections)
    
    for selection in selections:
        units = amount_per_selection / selection.portfolio_option.current_price
        
        investment = Investment(
            user_id=current_user.id,
            portfolio_option_id=selection.portfolio_option_id,
            amount=amount_per_selection,
            units=units,
            is_auto_recommended=selection.is_auto_recommended,
            payment_id=payment_data.razorpay_payment_id
        )
        db.add(investment)
    
    db.commit()
    
    return {"status": "success", "message": "Investment created successfully"}

# Money Transfer Endpoints
@app.post("/transfer", response_model=MoneyTransferResponse)
async def create_transfer(
    transfer_data: MoneyTransferCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate that at least one recipient method is provided
    if not transfer_data.recipient_upi and not transfer_data.recipient_mobile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide either UPI ID or Mobile number"
        )
    
    # Calculate amounts
    # Round to 2 decimal places to avoid floating point issues
    transfer_amount = round(transfer_data.amount, 2)
    roundup_amount = round(transfer_data.roundup_to_invest, 2) if transfer_data.roundup_to_invest else 0
    
    # Check wallet balance for transfer amount
    if transfer_amount > current_user.wallet_balance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient wallet balance. Available: ₹{current_user.wallet_balance:.2f}, Need: ₹{transfer_amount:.2f}"
        )
    
    # Check roundups for investment amount (if any)
    if roundup_amount > 0:
        roundups = db.query(Transaction.roundup_amount).filter(
            Transaction.user_id == current_user.id
        ).all()
        total_roundups = sum([r[0] for r in roundups]) if roundups else 0.0
        
        # Check existing investments from roundups
        investments = db.query(Investment).filter(
            Investment.user_id == current_user.id
        ).all()
        invested_from_roundups = sum([
            inv.amount for inv in investments 
            if inv.payment_id and (inv.payment_id.startswith('ROUNDUP_') or inv.payment_id.startswith('PAY'))
        ])
        
        available_roundups = total_roundups - invested_from_roundups
        
        if roundup_amount > available_roundups:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient roundups for investment. Available: ₹{available_roundups:.2f}, Need: ₹{roundup_amount:.2f}"
            )
    
    # Deduct ONLY transfer amount from wallet (roundup comes from accumulated roundups)
    current_user.wallet_balance -= transfer_amount
    
    # Create transfer record
    import uuid
    transaction_id = f"TXN{uuid.uuid4().hex[:10].upper()}"
    
    new_transfer = MoneyTransfer(
        user_id=current_user.id,
        recipient_upi=transfer_data.recipient_upi,
        recipient_mobile=transfer_data.recipient_mobile,
        recipient_name=transfer_data.recipient_name,
        amount=transfer_amount,  # Use rounded transfer amount
        status=TransferStatus.SUCCESS,  # In production, this would be async
        transaction_id=transaction_id,
        description=transfer_data.description
    )
    
    db.add(new_transfer)
    
    # If roundup amount provided, invest it in user's portfolio
    if roundup_amount > 0:
        # Get user's portfolio selections
        selections = db.query(PortfolioSelection).filter(
            PortfolioSelection.user_id == current_user.id
        ).all()
        
        if not selections:
            # Auto-select based on risk profile if no selections
            portfolio_options = db.query(PortfolioOption).all()
            recommended = get_auto_recommended_portfolios(
                current_user.risk_profile.value,
                portfolio_options
            )
            for option in recommended:
                new_selection = PortfolioSelection(
                    user_id=current_user.id,
                    portfolio_option_id=option.id,
                    is_auto_recommended=True
                )
                db.add(new_selection)
            db.flush()  # Flush to get the selections
            
            selections = db.query(PortfolioSelection).filter(
                PortfolioSelection.user_id == current_user.id
            ).all()
        
        if selections:
            # Distribute investment across selected portfolios
            amount_per_selection = round(roundup_amount / len(selections), 2)
            
            for selection in selections:
                units = round(amount_per_selection / selection.portfolio_option.current_price, 6)
                
                investment = Investment(
                    user_id=current_user.id,
                    portfolio_option_id=selection.portfolio_option_id,
                    amount=amount_per_selection,
                    units=units,
                    is_auto_recommended=selection.is_auto_recommended,
                    payment_id=f"ROUNDUP_{transaction_id}"
                )
                db.add(investment)
    
    db.commit()
    db.refresh(new_transfer)
    
    return new_transfer

@app.get("/transfers", response_model=List[MoneyTransferResponse])
async def get_transfers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    transfers = db.query(MoneyTransfer).filter(
        MoneyTransfer.user_id == current_user.id
    ).order_by(MoneyTransfer.created_at.desc()).all()
    return transfers

# Wallet Deposit Endpoints
@app.post("/wallet/create-order", response_model=OrderResponse)
async def create_wallet_order(
    deposit_data: WalletDepositCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create Razorpay order for wallet deposit"""
    if deposit_data.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be greater than 0"
        )
    
    # Convert to paise (1 rupee = 100 paise)
    amount_paise = int(deposit_data.amount * 100)
    
    # Create Razorpay order
    razorpay_order = razorpay_client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "payment_capture": 1,
        "notes": {
            "user_id": current_user.id,
            "description": deposit_data.description or "Wallet deposit"
        }
    })
    
    # Create pending deposit record
    new_deposit = WalletDeposit(
        user_id=current_user.id,
        amount=deposit_data.amount,
        method=DepositMethod.UPI,  # Will be updated after payment
        razorpay_order_id=razorpay_order["id"],
        status=TransferStatus.PENDING,
        description=deposit_data.description
    )
    
    db.add(new_deposit)
    db.commit()
    
    return {
        "order_id": razorpay_order["id"],
        "amount": amount_paise,
        "currency": "INR",
        "razorpay_key": RAZORPAY_KEY_ID
    }

@app.post("/wallet/verify-payment", response_model=WalletDepositResponse)
async def verify_wallet_payment(
    payment_data: WalletDepositVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify Razorpay payment and credit wallet"""
    # Verify signature
    generated_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        f"{payment_data.razorpay_order_id}|{payment_data.razorpay_payment_id}".encode(),
        hashlib.sha256
    ).hexdigest()
    
    if generated_signature != payment_data.razorpay_signature:
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Get payment details
    payment = razorpay_client.payment.fetch(payment_data.razorpay_payment_id)
    amount = payment["amount"] / 100  # Convert to rupees
    payment_method = payment.get("method", "upi")  # upi, card, netbanking, wallet
    
    # Find deposit record
    deposit = db.query(WalletDeposit).filter(
        WalletDeposit.razorpay_order_id == payment_data.razorpay_order_id,
        WalletDeposit.user_id == current_user.id
    ).first()
    
    if not deposit:
        raise HTTPException(status_code=404, detail="Deposit record not found")
    
    # Update deposit record
    deposit.payment_id = payment_data.razorpay_payment_id
    deposit.status = TransferStatus.SUCCESS
    deposit.method = DepositMethod(payment_method) if payment_method in ['upi', 'card', 'netbanking', 'wallet'] else DepositMethod.UPI
    
    # Credit wallet
    current_user.wallet_balance += amount
    
    db.commit()
    db.refresh(deposit)
    
    return deposit

@app.get("/wallet", response_model=WalletBalanceResponse)
async def get_wallet_balance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get roundup savings
    roundups = db.query(Transaction.roundup_amount).filter(
        Transaction.user_id == current_user.id
    ).all()
    total_roundups = sum([r[0] for r in roundups]) if roundups else 0.0
    
    # Get recent deposits
    recent_deposits = db.query(WalletDeposit).filter(
        WalletDeposit.user_id == current_user.id
    ).order_by(WalletDeposit.created_at.desc()).limit(10).all()
    
    return {
        "wallet_balance": current_user.wallet_balance,
        "roundup_savings": round(total_roundups, 2),
        "total_available": round(current_user.wallet_balance + total_roundups, 2),
        "recent_deposits": recent_deposits
    }

@app.get("/deposits", response_model=List[WalletDepositResponse])
async def get_deposits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    deposits = db.query(WalletDeposit).filter(
        WalletDeposit.user_id == current_user.id
    ).order_by(WalletDeposit.created_at.desc()).all()
    return deposits

@app.get("/investment-sources", response_model=InvestmentSourceResponse)
async def get_investment_sources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get breakdown of investments from roundups vs wallet"""
    # Get all investments
    investments = db.query(Investment).filter(
        Investment.user_id == current_user.id
    ).all()
    
    # Categorize investments by payment ID
    from_roundups = 0.0
    from_wallet = 0.0
    
    for inv in investments:
        if inv.payment_id and (inv.payment_id.startswith('ROUNDUP_') or inv.payment_id.startswith('PAY')):
            from_roundups += inv.amount
        else:
            from_wallet += inv.amount
    
    # Calculate total roundups generated
    roundups = db.query(Transaction.roundup_amount).filter(
        Transaction.user_id == current_user.id
    ).all()
    total_roundups = sum([r[0] for r in roundups]) if roundups else 0.0
    
    # Roundup pool available for investment
    roundup_pool_available = total_roundups - from_roundups
    
    return {
        "from_roundups": round(from_roundups, 2),
        "from_wallet": round(from_wallet, 2),
        "total_invested": round(from_roundups + from_wallet, 2),
        "roundup_pool_available": round(max(0, roundup_pool_available), 2)
    }

@app.post("/update-prices")
async def manual_price_update(db: Session = Depends(get_db)):
    """Manually trigger price update for testing (Admin only in production)"""
    try:
        portfolio_options = db.query(PortfolioOption).all()
        updates = []
        
        for option in portfolio_options:
            old_price = option.current_price
            # Simulate price change: -3% to +3% random change
            change_percent = random.uniform(-0.03, 0.03)
            new_price = option.current_price * (1 + change_percent)
            option.current_price = round(new_price, 2)
            
            updates.append({
                "name": option.name,
                "old_price": old_price,
                "new_price": option.current_price,
                "change_percent": round(change_percent * 100, 2)
            })
        
        db.commit()
        
        return {
            "status": "success",
            "message": f"Updated {len(updates)} stock prices",
            "updates": updates[:5]  # Show first 5 for brevity
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Micro-Investment API", "status": "running"}
