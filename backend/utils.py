def calculate_roundup(amount: float, nearest: int = 1) -> float:
    """
    Calculate round-up to nearest ₹1 or ₹10
    
    Args:
        amount: Transaction amount
        nearest: Round up to nearest value (1 or 10)
    
    Returns:
        Round-up amount
    """
    rounded = (int(amount // nearest) + 1) * nearest
    return round(rounded - amount, 2)

def get_auto_recommended_portfolios(risk_profile: str, portfolio_options: list, count: int = 3) -> list:
    """
    Get auto-recommended portfolio options based on user's risk profile
    
    Args:
        risk_profile: User's risk profile (low, medium, high)
        portfolio_options: List of available portfolio options
        count: Number of recommendations to return
    
    Returns:
        List of recommended portfolio options
    """
    # Filter by matching risk level
    matching = [p for p in portfolio_options if p.risk_level.value == risk_profile]
    
    # If not enough matching, add similar risk levels
    if len(matching) < count:
        remaining = [p for p in portfolio_options if p.risk_level.value != risk_profile]
        matching.extend(remaining[:count - len(matching)])
    
    return matching[:count]
