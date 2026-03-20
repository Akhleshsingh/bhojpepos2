from pydantic import BaseModel
from typing import Optional, List


class CheckoutSessionRequest(BaseModel):
    amount: float
    currency: str = "usd"
    success_url: str
    cancel_url: str
    metadata: Optional[dict] = None


class CheckoutSessionResponse(BaseModel):
    session_id: str
    url: str
    status: str = "open"


class CheckoutStatusResponse(BaseModel):
    session_id: str
    status: str
    payment_status: str
    amount: Optional[float] = None
    currency: Optional[str] = None


class StripeCheckout:
    def __init__(self, api_key: str, webhook_url: str = None):
        self.api_key = api_key
        self.webhook_url = webhook_url

    async def create_checkout_session(self, request: CheckoutSessionRequest) -> CheckoutSessionResponse:
        raise NotImplementedError("Stripe integration not configured. Please set STRIPE_API_KEY.")

    async def get_checkout_status(self, session_id: str) -> CheckoutStatusResponse:
        raise NotImplementedError("Stripe integration not configured. Please set STRIPE_API_KEY.")
