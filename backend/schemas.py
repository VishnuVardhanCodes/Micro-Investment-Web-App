from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from models import RiskProfile, AssetType, TransferStatus, DepositMethod

# User Schemas
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    risk_profile: RiskProfile
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Transaction Schemas
class TransactionCreate(BaseModel):
    amount: float
    description: Optional[str] = None
    nearest: int = 1  # Round-up to nearest 1 or 10

class TransactionResponse(BaseModel):
    id: int
    amount: float
    roundup_amount: float
    description: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Portfolio Schemas
class PortfolioOptionResponse(BaseModel):
    id: int
    name: str
    symbol: str
    asset_type: AssetType
    risk_level: RiskProfile
    description: Optional[str]
    current_price: float
    
    class Config:
        from_attributes = True

class PortfolioSelectionCreate(BaseModel):
    portfolio_option_ids: List[int]

class PortfolioSelectionResponse(BaseModel):
    id: int
    portfolio_option: PortfolioOptionResponse
    is_auto_recommended: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Investment Schemas
class InvestmentResponse(BaseModel):
    id: int
    portfolio_option_id: int
    amount: float
    units: float
    created_at: datetime
    
    class Config:
        from_attributes = True

class InvestmentDetailResponse(BaseModel):
    id: int
    portfolio_option_id: int
    portfolio_name: str
    portfolio_symbol: str
    asset_type: str
    amount_invested: float
    units: float
    current_price: float
    current_value: float
    profit_loss: float
    profit_loss_percentage: float
    created_at: datetime

# Dashboard Schemas
class DashboardStats(BaseModel):
    total_transactions: int
    total_roundups: float
    total_invested: float
    portfolio_allocation: List[dict]
    user_selected_count: int
    auto_recommended_count: int

class MilestoneResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    threshold: float
    badge_icon: Optional[str]
    achieved: bool
    achieved_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Razorpay Schemas
class OrderCreate(BaseModel):
    amount: float  # Amount in rupees

class OrderResponse(BaseModel):
    order_id: str
    amount: int  # Amount in paise
    currency: str
    razorpay_key: str

class PaymentWebhook(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

# Money Transfer Schemas
class MoneyTransferCreate(BaseModel):
    recipient_upi: Optional[str] = None
    recipient_mobile: Optional[str] = None
    recipient_name: str
    amount: float
    roundup_to_invest: Optional[float] = None  # Extra amount to invest
    description: Optional[str] = None

class MoneyTransferResponse(BaseModel):
    id: int
    recipient_upi: Optional[str]
    recipient_mobile: Optional[str]
    recipient_name: str
    amount: float
    status: TransferStatus
    transaction_id: Optional[str]
    description: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Wallet Deposit Schemas
class WalletDepositCreate(BaseModel):
    amount: float
    description: Optional[str] = None

class WalletDepositVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class WalletDepositResponse(BaseModel):
    id: int
    amount: float
    method: DepositMethod
    payment_id: Optional[str]
    status: TransferStatus
    description: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class WalletBalanceResponse(BaseModel):
    wallet_balance: float
    roundup_savings: float
    total_available: float
    recent_deposits: List[WalletDepositResponse]

class InvestmentSourceResponse(BaseModel):
    from_roundups: float  # Investments made from transaction roundups
    from_wallet: float    # Investments made from wallet deposits
    total_invested: float
    roundup_pool_available: float  # Remaining roundups not yet invested
