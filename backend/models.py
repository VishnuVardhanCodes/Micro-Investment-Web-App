from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class RiskProfile(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class AssetType(str, enum.Enum):
    STOCK = "stock"
    CRYPTO = "crypto"
    ETF = "etf"

class TransferStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCESS = "success"
    FAILED = "failed"

class DepositMethod(str, enum.Enum):
    UPI = "upi"
    CARD = "card"
    NETBANKING = "netbanking"
    WALLET = "wallet"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    risk_profile = Column(Enum(RiskProfile), default=RiskProfile.MEDIUM)
    wallet_balance = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    transactions = relationship("Transaction", back_populates="user")
    portfolio_selections = relationship("PortfolioSelection", back_populates="user")
    investments = relationship("Investment", back_populates="user")
    milestones = relationship("UserMilestone", back_populates="user")
    transfers = relationship("MoneyTransfer", back_populates="user")
    deposits = relationship("WalletDeposit", back_populates="user")

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float, nullable=False)
    roundup_amount = Column(Float, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="transactions")

class PortfolioOption(Base):
    __tablename__ = "portfolio_options"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    symbol = Column(String, nullable=False)
    asset_type = Column(Enum(AssetType), nullable=False)
    risk_level = Column(Enum(RiskProfile), nullable=False)
    description = Column(String)
    current_price = Column(Float, default=0.0)

class PortfolioSelection(Base):
    __tablename__ = "portfolio_selections"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    portfolio_option_id = Column(Integer, ForeignKey("portfolio_options.id"))
    is_auto_recommended = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="portfolio_selections")
    portfolio_option = relationship("PortfolioOption")

class Investment(Base):
    __tablename__ = "investments"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    portfolio_option_id = Column(Integer, ForeignKey("portfolio_options.id"))
    amount = Column(Float, nullable=False)
    units = Column(Float, default=0.0)
    is_auto_recommended = Column(Boolean, default=False)
    payment_id = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="investments")
    portfolio_option = relationship("PortfolioOption")

class Milestone(Base):
    __tablename__ = "milestones"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    threshold = Column(Float, nullable=False)
    badge_icon = Column(String)

class UserMilestone(Base):
    __tablename__ = "user_milestones"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    milestone_id = Column(Integer, ForeignKey("milestones.id"))
    achieved_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="milestones")
    milestone = relationship("Milestone")

class MoneyTransfer(Base):
    __tablename__ = "money_transfers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    recipient_upi = Column(String, nullable=True)
    recipient_mobile = Column(String, nullable=True)
    recipient_name = Column(String)
    amount = Column(Float, nullable=False)
    status = Column(Enum(TransferStatus), default=TransferStatus.PENDING)
    transaction_id = Column(String)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="transfers")

class WalletDeposit(Base):
    __tablename__ = "wallet_deposits"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(Float, nullable=False)
    method = Column(Enum(DepositMethod), nullable=False)
    payment_id = Column(String)
    razorpay_order_id = Column(String)
    status = Column(Enum(TransferStatus), default=TransferStatus.PENDING)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="deposits")
