from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends, Response, Query, Body, UploadFile, File, Header
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import secrets
import asyncio
import requests
import resend
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_hex(32))
JWT_ALGORITHM = "HS256"

# Resend Config
resend.api_key = os.environ.get("RESEND_API_KEY", "")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
ADMIN_NOTIFICATION_EMAIL = os.environ.get("ADMIN_NOTIFICATION_EMAIL", "admin@autoparts.com")

# PayPal Config
PAYPAL_ME_USERNAME = os.environ.get("PAYPAL_ME_USERNAME", "")

# Object Storage Config
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
APP_NAME = "autoparts"
storage_key = None

# Create the main app
app = FastAPI(title="AutoParts E-Commerce API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ========== OBJECT STORAGE ==========
def init_storage():
    global storage_key
    if storage_key:
        return storage_key
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json()["storage_key"]
        logger.info("Object Storage initialized")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120
    )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    if not key:
        raise HTTPException(status_code=500, detail="Storage not available")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key}, timeout=60
    )
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# ========== EMAIL (RESEND) ==========
async def send_email(to_email: str, subject: str, html_content: str):
    if not resend.api_key:
        logger.warning("Resend API key not configured, skipping email")
        return None
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"📧 Email sent to {to_email}: {result.get('id')}")
        return result
    except Exception as e:
        logger.error(f"Email send failed: {e}")
        return None

def order_confirmation_email_html(order):
    items_html = "".join([
        f"<tr><td style='padding:8px;border-bottom:1px solid #eee'>{item['title']}</td>"
        f"<td style='padding:8px;border-bottom:1px solid #eee;text-align:center'>{item['quantity']}</td>"
        f"<td style='padding:8px;border-bottom:1px solid #eee;text-align:right'>{item['subtotal']:.2f} €</td></tr>"
        for item in order.get("items", [])
    ])
    return f"""
    <!DOCTYPE html>
    <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
      <div style="background:#0A0F1C;color:white;padding:20px;text-align:center">
        <h1 style="margin:0">AUTO<span style="color:#FF3333">PARTS</span></h1>
      </div>
      <div style="padding:20px;background:#fff">
        <h2>Merci pour votre commande, {order['user_name']} !</h2>
        <p>Votre commande a été confirmée et est en cours de traitement.</p>
        <p><strong>Numéro de commande:</strong> #{order['id'][:8]}</p>
        <p><strong>Numéro de suivi:</strong> <span style="color:#FF3333;font-weight:bold">{order.get('tracking_number', 'N/A')}</span></p>
        <p>Suivez votre commande: <a href="https://auto-parts-shop-72.preview.emergentagent.com/suivi?number={order.get('tracking_number','')}">Cliquez ici</a></p>
        <h3>Articles commandés</h3>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Article</th><th style="padding:8px">Qté</th><th style="padding:8px;text-align:right">Total</th></tr></thead>
          <tbody>{items_html}</tbody>
          <tfoot><tr><td colspan="2" style="padding:12px;font-weight:bold;text-align:right">TOTAL</td><td style="padding:12px;font-weight:bold;text-align:right;color:#FF3333;font-size:18px">{order['total']:.2f} €</td></tr></tfoot>
        </table>
        <p style="margin-top:30px;color:#666">Mode de livraison: <strong>{'Retrait en magasin' if order.get('shipping_method')=='pickup' else 'Livraison à domicile'}</strong></p>
        <p style="color:#666">Mode de paiement: <strong>{order.get('payment_method','').upper()}</strong></p>
      </div>
      <div style="background:#f5f5f5;padding:20px;text-align:center;color:#666;font-size:12px">
        <p>© 2026 AutoParts. Tous droits réservés.</p>
      </div>
    </body></html>
    """

def admin_notification_email_html(order):
    return f"""
    <!DOCTYPE html>
    <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
      <div style="background:#FF3333;color:white;padding:20px;text-align:center">
        <h1>🔔 Nouvelle commande !</h1>
      </div>
      <div style="padding:20px;background:#fff">
        <h2>Commande #{order['id'][:8]}</h2>
        <p><strong>Client:</strong> {order['user_name']} ({order['user_email']})</p>
        <p><strong>Montant:</strong> <span style="color:#FF3333;font-size:24px;font-weight:bold">{order['total']:.2f} €</span></p>
        <p><strong>Paiement:</strong> {order.get('payment_method','').upper()}</p>
        <p><strong>Livraison:</strong> {'Retrait magasin' if order.get('shipping_method')=='pickup' else 'Livraison à domicile'}</p>
        <p><strong>Tracking:</strong> {order.get('tracking_number', 'N/A')}</p>
        <p><strong>Articles:</strong> {len(order.get('items', []))}</p>
        <hr>
        <p><a href="https://auto-parts-shop-72.preview.emergentagent.com/admin/orders" style="background:#0A0F1C;color:white;padding:12px 24px;text-decoration:none;display:inline-block">Voir dans l'admin</a></p>
      </div>
    </body></html>
    """

# ========== PASSWORD HASHING ==========
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# ========== JWT TOKEN MANAGEMENT ==========
def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id, 
        "email": email, 
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=60),
        "type": "access"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id, 
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

# ========== AUTH HELPER ==========
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user_optional(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

async def require_admin(request: Request) -> dict:
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ========== PYDANTIC MODELS ==========
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    role: str

class AddressModel(BaseModel):
    street: str
    city: str
    postal_code: str
    country: str
    phone: Optional[str] = None

class ProductCreate(BaseModel):
    title: str
    description: str
    oem_reference: Optional[str] = None
    compatible_brands: List[str] = []
    compatible_models: List[str] = []
    compatible_years: List[int] = []
    category: str
    condition: str  # new, used, refurbished
    price: float
    stock: int
    images: List[str] = []
    is_auction: bool = False
    specifications: Dict[str, str] = {}  # Technical specs (key-value pairs, eBay style)

class ProductUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    oem_reference: Optional[str] = None
    compatible_brands: Optional[List[str]] = None
    compatible_models: Optional[List[str]] = None
    compatible_years: Optional[List[int]] = None
    category: Optional[str] = None
    condition: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    images: Optional[List[str]] = None
    is_auction: Optional[bool] = None
    is_featured: Optional[bool] = None
    specifications: Optional[Dict[str, str]] = None

class AuctionCreate(BaseModel):
    product_id: str
    starting_price: float
    end_time: datetime

class BidCreate(BaseModel):
    amount: float
    max_bid: Optional[float] = None  # For proxy bidding

class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = 1

class OrderCreate(BaseModel):
    shipping_address: AddressModel
    payment_method: str  # stripe, paypal, bank_transfer, installments_3x, installments_4x
    shipping_method: str = "delivery"  # delivery or pickup
    save_card: bool = False

class ChatStart(BaseModel):
    name: str
    email: EmailStr

class ChatMessage(BaseModel):
    content: str
    sender: str  # customer or admin
    sender_name: str

class QuestionCreate(BaseModel):
    product_id: str
    question: str

class AnswerCreate(BaseModel):
    answer: str

class OfferCreate(BaseModel):
    product_id: str
    amount: float
    message: Optional[str] = None

class OfferResponse(BaseModel):
    status: str  # accepted or rejected
    admin_message: Optional[str] = None

# ========== AUTH ROUTES ==========
@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    email = user_data.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "email": email,
        "password_hash": hash_password(user_data.password),
        "name": user_data.name,
        "role": "customer",
        "addresses": [],
        "wishlist": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    access_token = create_access_token(user_id, email, "customer")
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": user_data.name, "role": "customer"}

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response, request: Request):
    email = credentials.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    
    # Check brute force
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        lockout_time = attempt.get("locked_until")
        if lockout_time and datetime.fromisoformat(lockout_time) > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many login attempts. Try again later.")
    
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        # Increment failed attempts
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {
                "$inc": {"count": 1},
                "$set": {"locked_until": (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()}
            },
            upsert=True
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Clear failed attempts on success
    await db.login_attempts.delete_one({"identifier": identifier})
    
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email, user.get("role", "customer"))
    refresh_token = create_refresh_token(user_id)
    
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    
    return {"id": user_id, "email": email, "name": user["name"], "role": user.get("role", "customer")}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user

@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        access_token = create_access_token(str(user["_id"]), user["email"], user.get("role", "customer"))
        response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
        return {"message": "Token refreshed"}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@api_router.post("/auth/forgot-password")
async def forgot_password(email: str = Body(..., embed=True)):
    email = email.lower()
    user = await db.users.find_one({"email": email})
    if not user:
        return {"message": "If email exists, reset link sent"}  # Security: don't reveal if email exists
    
    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({
        "token": token,
        "user_id": str(user["_id"]),
        "expires_at": datetime.now(timezone.utc) + timedelta(hours=1),
        "used": False
    })
    
    # In production, send email. For now, log the token
    reset_link = f"/reset-password?token={token}"
    logger.info(f"Password reset link: {reset_link}")
    
    return {"message": "If email exists, reset link sent", "debug_token": token}

@api_router.post("/auth/reset-password")
async def reset_password(token: str = Body(...), new_password: str = Body(...)):
    reset_doc = await db.password_reset_tokens.find_one({"token": token, "used": False})
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    expires_at = reset_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token expired")
    
    await db.users.update_one(
        {"_id": ObjectId(reset_doc["user_id"])},
        {"$set": {"password_hash": hash_password(new_password)}}
    )
    await db.password_reset_tokens.update_one({"token": token}, {"$set": {"used": True}})
    
    return {"message": "Password reset successfully"}

# ========== PRODUCTS ROUTES ==========
@api_router.get("/products")
async def get_products(
    category: Optional[str] = None,
    brand: Optional[str] = None,
    model: Optional[str] = None,
    year: Optional[int] = None,
    condition: Optional[str] = None,
    oem: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    is_auction: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    sort: Optional[str] = "newest",
    page: int = 1,
    limit: int = 20
):
    query = {}
    
    if category:
        query["category"] = category
    if brand:
        query["compatible_brands"] = {"$in": [brand]}
    if model:
        query["compatible_models"] = {"$in": [model]}
    if year:
        query["compatible_years"] = {"$in": [year]}
    if condition:
        query["condition"] = condition
    if oem:
        query["oem_reference"] = {"$regex": oem, "$options": "i"}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"oem_reference": {"$regex": search, "$options": "i"}}
        ]
    if min_price is not None:
        query["price"] = {"$gte": min_price}
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price
    if is_auction is not None:
        query["is_auction"] = is_auction
    if is_featured is not None:
        query["is_featured"] = is_featured
    
    # Sort options
    sort_options = {
        "newest": [("created_at", -1)],
        "oldest": [("created_at", 1)],
        "price_low": [("price", 1)],
        "price_high": [("price", -1)],
        "title": [("title", 1)]
    }
    sort_order = sort_options.get(sort, [("created_at", -1)])
    
    skip = (page - 1) * limit
    total = await db.products.count_documents(query)
    products = await db.products.find(query, {"_id": 0}).sort(sort_order).skip(skip).limit(limit).to_list(limit)
    
    return {
        "products": products,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }

@api_router.get("/products/featured")
async def get_featured_products():
    products = await db.products.find({"is_featured": True, "is_auction": False}, {"_id": 0}).limit(8).to_list(8)
    return products

@api_router.get("/products/new-arrivals")
async def get_new_arrivals():
    products = await db.products.find({"is_auction": False}, {"_id": 0}).sort("created_at", -1).limit(8).to_list(8)
    return products

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Increment views
    await db.products.update_one({"id": product_id}, {"$inc": {"views": 1}})
    
    return product

@api_router.post("/products", dependencies=[Depends(require_admin)])
async def create_product(product: ProductCreate):
    product_doc = product.model_dump()
    product_doc["id"] = str(uuid.uuid4())
    product_doc["created_at"] = datetime.now(timezone.utc).isoformat()
    product_doc["views"] = 0
    product_doc["is_featured"] = False
    
    await db.products.insert_one(product_doc)
    product_doc.pop("_id", None)
    return product_doc

@api_router.put("/products/{product_id}", dependencies=[Depends(require_admin)])
async def update_product(product_id: str, update: ProductUpdate):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No update data provided")
    
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    
    return {"message": "Product updated"}

@api_router.delete("/products/{product_id}", dependencies=[Depends(require_admin)])
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted"}

# ========== CATEGORIES ==========
CATEGORIES = [
    {"id": "engine", "name": "Moteur", "icon": "engine"},
    {"id": "brakes", "name": "Freinage", "icon": "disc"},
    {"id": "suspension", "name": "Suspension", "icon": "suspension"},
    {"id": "electrical", "name": "Électricité", "icon": "zap"},
    {"id": "bodywork", "name": "Carrosserie", "icon": "car"},
    {"id": "transmission", "name": "Transmission", "icon": "cog"},
    {"id": "exhaust", "name": "Échappement", "icon": "wind"},
    {"id": "cooling", "name": "Refroidissement", "icon": "thermometer"},
    {"id": "interior", "name": "Intérieur", "icon": "sofa"},
    {"id": "accessories", "name": "Accessoires", "icon": "wrench"}
]

@api_router.get("/categories")
async def get_categories():
    return CATEGORIES

# ========== AUCTIONS ROUTES ==========
@api_router.get("/auctions")
async def get_auctions(active_only: bool = True):
    query = {}
    if active_only:
        query["end_time"] = {"$gt": datetime.now(timezone.utc).isoformat()}
        query["status"] = "active"
    
    auctions = await db.auctions.find(query, {"_id": 0}).sort("end_time", 1).to_list(100)
    
    # Enrich with product data
    for auction in auctions:
        product = await db.products.find_one({"id": auction["product_id"]}, {"_id": 0})
        if product:
            auction["product"] = product
    
    return auctions

@api_router.get("/auctions/{auction_id}")
async def get_auction(auction_id: str):
    auction = await db.auctions.find_one({"id": auction_id}, {"_id": 0})
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    product = await db.products.find_one({"id": auction["product_id"]}, {"_id": 0})
    auction["product"] = product
    
    return auction

@api_router.post("/auctions", dependencies=[Depends(require_admin)])
async def create_auction(auction: AuctionCreate):
    product = await db.products.find_one({"id": auction.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Mark product as auction
    await db.products.update_one({"id": auction.product_id}, {"$set": {"is_auction": True}})
    
    auction_doc = {
        "id": str(uuid.uuid4()),
        "product_id": auction.product_id,
        "starting_price": auction.starting_price,
        "current_price": auction.starting_price,
        "highest_bidder_id": None,
        "end_time": auction.end_time.isoformat(),
        "status": "active",
        "bids": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.auctions.insert_one(auction_doc)
    auction_doc.pop("_id", None)
    return auction_doc

@api_router.post("/auctions/{auction_id}/bid")
async def place_bid(auction_id: str, bid: BidCreate, user: dict = Depends(get_current_user)):
    auction = await db.auctions.find_one({"id": auction_id})
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    end_time = datetime.fromisoformat(auction["end_time"])
    if end_time < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Auction has ended")
    
    if bid.amount <= auction["current_price"]:
        raise HTTPException(status_code=400, detail="Bid must be higher than current price")
    
    # Handle proxy bidding
    max_bid = bid.max_bid or bid.amount
    actual_bid = bid.amount
    
    # Check if there's a proxy bid to outbid
    if auction.get("proxy_bid") and auction["proxy_bid"]["user_id"] != user["_id"]:
        proxy = auction["proxy_bid"]
        if max_bid > proxy["max_bid"]:
            # New bidder wins
            actual_bid = min(max_bid, proxy["max_bid"] + 1)
        else:
            # Proxy bidder auto-outbids
            actual_bid = min(proxy["max_bid"], max_bid + 1)
            # Update with proxy bidder winning
            await db.auctions.update_one(
                {"id": auction_id},
                {
                    "$set": {"current_price": actual_bid, "highest_bidder_id": proxy["user_id"]},
                    "$push": {"bids": {
                        "user_id": user["_id"],
                        "amount": bid.amount,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "outbid": True
                    }}
                }
            )
            return {"message": "You have been outbid", "current_price": actual_bid}
    
    bid_doc = {
        "user_id": user["_id"],
        "user_name": user["name"],
        "amount": actual_bid,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    update_data = {
        "$set": {
            "current_price": actual_bid,
            "highest_bidder_id": user["_id"]
        },
        "$push": {"bids": bid_doc}
    }
    
    if bid.max_bid:
        update_data["$set"]["proxy_bid"] = {"user_id": user["_id"], "max_bid": bid.max_bid}
    
    await db.auctions.update_one({"id": auction_id}, update_data)
    
    return {"message": "Bid placed successfully", "current_price": actual_bid}

# ========== CART ROUTES ==========
@api_router.get("/cart")
async def get_cart(user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["_id"]}, {"_id": 0})
    if not cart:
        return {"items": [], "total": 0}
    
    # Enrich with product data
    items_with_products = []
    total = 0
    for item in cart.get("items", []):
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            item["product"] = product
            item["subtotal"] = product["price"] * item["quantity"]
            total += item["subtotal"]
            items_with_products.append(item)
    
    return {"items": items_with_products, "total": total}

@api_router.post("/cart/add")
async def add_to_cart(item: CartItemAdd, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": item.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product.get("stock", 0) < item.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    cart = await db.carts.find_one({"user_id": user["_id"]})
    
    if cart:
        # Check if product already in cart
        existing_item = next((i for i in cart.get("items", []) if i["product_id"] == item.product_id), None)
        if existing_item:
            new_qty = existing_item["quantity"] + item.quantity
            if new_qty > product.get("stock", 0):
                raise HTTPException(status_code=400, detail="Insufficient stock")
            await db.carts.update_one(
                {"user_id": user["_id"], "items.product_id": item.product_id},
                {"$set": {"items.$.quantity": new_qty}}
            )
        else:
            await db.carts.update_one(
                {"user_id": user["_id"]},
                {"$push": {"items": {"product_id": item.product_id, "quantity": item.quantity}}}
            )
    else:
        await db.carts.insert_one({
            "user_id": user["_id"],
            "items": [{"product_id": item.product_id, "quantity": item.quantity}],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {"message": "Added to cart"}

@api_router.put("/cart/update")
async def update_cart_item(product_id: str = Body(...), quantity: int = Body(...), user: dict = Depends(get_current_user)):
    if quantity <= 0:
        # Remove item
        await db.carts.update_one(
            {"user_id": user["_id"]},
            {"$pull": {"items": {"product_id": product_id}}}
        )
    else:
        product = await db.products.find_one({"id": product_id})
        if product and quantity > product.get("stock", 0):
            raise HTTPException(status_code=400, detail="Insufficient stock")
        
        await db.carts.update_one(
            {"user_id": user["_id"], "items.product_id": product_id},
            {"$set": {"items.$.quantity": quantity}}
        )
    
    return {"message": "Cart updated"}

@api_router.delete("/cart/remove/{product_id}")
async def remove_from_cart(product_id: str, user: dict = Depends(get_current_user)):
    await db.carts.update_one(
        {"user_id": user["_id"]},
        {"$pull": {"items": {"product_id": product_id}}}
    )
    return {"message": "Removed from cart"}

@api_router.delete("/cart/clear")
async def clear_cart(user: dict = Depends(get_current_user)):
    await db.carts.delete_one({"user_id": user["_id"]})
    return {"message": "Cart cleared"}

# ========== ORDERS ROUTES ==========
@api_router.get("/orders")
async def get_orders(user: dict = Depends(get_current_user)):
    query = {"user_id": user["_id"]}
    if user.get("role") == "admin":
        query = {}  # Admin sees all orders
    
    orders = await db.orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    return orders

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if user.get("role") != "admin" and order["user_id"] != user["_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return order

@api_router.post("/orders")
async def create_order(order_data: OrderCreate, user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": user["_id"]})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    # Calculate total and validate stock
    items = []
    total = 0
    for cart_item in cart["items"]:
        product = await db.products.find_one({"id": cart_item["product_id"]})
        if not product:
            raise HTTPException(status_code=400, detail=f"Product not found")
        if product.get("stock", 0) < cart_item["quantity"]:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['title']}")
        
        subtotal = product["price"] * cart_item["quantity"]
        items.append({
            "product_id": cart_item["product_id"],
            "title": product["title"],
            "price": product["price"],
            "quantity": cart_item["quantity"],
            "subtotal": subtotal
        })
        total += subtotal
    
    # Apply pickup discount (15%)
    discount = 0
    if order_data.shipping_method == "pickup":
        discount = total * 0.15
        total = total - discount
    
    # Shipping cost
    shipping_cost = 0
    if order_data.shipping_method == "delivery" and total < 99:
        shipping_cost = 9.90
        total += shipping_cost
    
    # Generate tracking number
    tracking_number = f"AUTO-{str(uuid.uuid4())[:6].upper()}-{str(uuid.uuid4())[:4].upper()}"
    
    order_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["_id"],
        "user_email": user["email"],
        "user_name": user["name"],
        "items": items,
        "subtotal": total - shipping_cost + discount,
        "discount": discount,
        "shipping_cost": shipping_cost,
        "total": total,
        "shipping_address": order_data.shipping_address.model_dump(),
        "shipping_method": order_data.shipping_method,
        "payment_method": order_data.payment_method,
        "save_card": order_data.save_card,
        "status": "pending_payment",
        "tracking_number": tracking_number,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    
    # Update stock
    for cart_item in cart["items"]:
        await db.products.update_one(
            {"id": cart_item["product_id"]},
            {"$inc": {"stock": -cart_item["quantity"]}}
        )
    
    # Clear cart
    await db.carts.delete_one({"user_id": user["_id"]})
    
    # Send emails
    order_doc.pop("_id", None)
    try:
        # Confirmation email to customer
        await send_email(
            to_email=user["email"],
            subject=f"Confirmation de commande #{order_doc['id'][:8]} - AutoParts",
            html_content=order_confirmation_email_html(order_doc)
        )
        # Notification email to admin
        await send_email(
            to_email=ADMIN_NOTIFICATION_EMAIL,
            subject=f"🔔 Nouvelle commande {order_doc['total']:.2f}€ - #{order_doc['id'][:8]}",
            html_content=admin_notification_email_html(order_doc)
        )
    except Exception as e:
        logger.error(f"Email sending failed (non-blocking): {e}")
    
    # Notify admin (log)
    logger.info(f"🔔 ADMIN NOTIFICATION: New order {order_doc['id']} from {user['email']} - Total: {total}€ - Method: {order_data.payment_method}")
    
    # Generate PayPal.me URL if PayPal selected
    if order_data.payment_method == "paypal" and PAYPAL_ME_USERNAME:
        order_doc["paypal_url"] = f"https://www.paypal.me/{PAYPAL_ME_USERNAME}/{total:.2f}EUR"
    
    return order_doc

@api_router.put("/orders/{order_id}/status", dependencies=[Depends(require_admin)])
async def update_order_status(order_id: str, status: str = Body(..., embed=True), tracking_number: Optional[str] = Body(None)):
    update_data = {"status": status}
    if tracking_number:
        update_data["tracking_number"] = tracking_number
    
    result = await db.orders.update_one({"id": order_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Order status updated"}

# ========== PAYMENTS ROUTES ==========
@api_router.post("/payments/create-checkout")
async def create_checkout_session(
    request: Request,
    order_id: str = Body(...),
    origin_url: str = Body(...),
    user: dict = Depends(get_current_user)
):
    order = await db.orders.find_one({"id": order_id, "user_id": user["_id"]})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    api_key = os.environ.get("STRIPE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Payment not configured")
    
    host_url = str(request.base_url).rstrip("/")
    webhook_url = f"{host_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    success_url = f"{origin_url}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/checkout/cancel"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(order["total"]),
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": order_id,
            "user_id": user["_id"],
            "user_email": user["email"]
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "order_id": order_id,
        "user_id": user["_id"],
        "session_id": session.session_id,
        "amount": order["total"],
        "currency": "eur",
        "method": "stripe",
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, user: dict = Depends(get_current_user)):
    api_key = os.environ.get("STRIPE_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Payment not configured")
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
    
    try:
        status = await stripe_checkout.get_checkout_status(session_id)
        
        # Update payment transaction
        update_data = {
            "status": status.status,
            "payment_status": status.payment_status
        }
        
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        # If paid, update order status
        if status.payment_status == "paid":
            transaction = await db.payment_transactions.find_one({"session_id": session_id})
            if transaction:
                await db.orders.update_one(
                    {"id": transaction["order_id"]},
                    {"$set": {"status": "confirmed", "paid_at": datetime.now(timezone.utc).isoformat()}}
                )
        
        return {
            "status": status.status,
            "payment_status": status.payment_status,
            "amount_total": status.amount_total,
            "currency": status.currency
        }
    except Exception as e:
        logger.error(f"Error checking payment status: {e}")
        raise HTTPException(status_code=500, detail="Error checking payment status")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    api_key = os.environ.get("STRIPE_API_KEY")
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            order_id = webhook_response.metadata.get("order_id")
            if order_id:
                await db.orders.update_one(
                    {"id": order_id},
                    {"$set": {"status": "confirmed", "paid_at": datetime.now(timezone.utc).isoformat()}}
                )
                await db.payment_transactions.update_one(
                    {"session_id": webhook_response.session_id},
                    {"$set": {"status": "completed", "payment_status": "paid"}}
                )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}

# ========== WISHLIST ROUTES ==========
@api_router.get("/wishlist")
async def get_wishlist(user: dict = Depends(get_current_user)):
    user_doc = await db.users.find_one({"_id": ObjectId(user["_id"])})
    wishlist_ids = user_doc.get("wishlist", [])
    
    products = []
    for pid in wishlist_ids:
        product = await db.products.find_one({"id": pid}, {"_id": 0})
        if product:
            products.append(product)
    
    return products

@api_router.post("/wishlist/{product_id}")
async def add_to_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$addToSet": {"wishlist": product_id}}
    )
    return {"message": "Added to wishlist"}

@api_router.delete("/wishlist/{product_id}")
async def remove_from_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$pull": {"wishlist": product_id}}
    )
    return {"message": "Removed from wishlist"}

# ========== QUESTIONS & ANSWERS ==========
@api_router.get("/products/{product_id}/questions")
async def get_product_questions(product_id: str):
    questions = await db.questions.find({"product_id": product_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return questions

@api_router.post("/products/{product_id}/questions")
async def ask_question(product_id: str, question_data: QuestionCreate, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    question_doc = {
        "id": str(uuid.uuid4()),
        "product_id": product_id,
        "user_id": user["_id"],
        "user_name": user["name"],
        "question": question_data.question,
        "answer": None,
        "answered_at": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.questions.insert_one(question_doc)
    question_doc.pop("_id", None)
    return question_doc

@api_router.post("/questions/{question_id}/answer", dependencies=[Depends(require_admin)])
async def answer_question(question_id: str, answer_data: AnswerCreate):
    result = await db.questions.update_one(
        {"id": question_id},
        {"$set": {"answer": answer_data.answer, "answered_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Question not found")
    return {"message": "Answer posted"}

# ========== FILE UPLOAD ==========
@api_router.post("/upload/image", dependencies=[Depends(require_admin)])
async def upload_image(file: UploadFile = File(...)):
    """Upload an image file (admin only). Returns public URL."""
    # Validate content type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Get extension
    ext = "jpg"
    if file.filename and "." in file.filename:
        ext = file.filename.split(".")[-1].lower()
    if ext not in ["jpg", "jpeg", "png", "gif", "webp"]:
        raise HTTPException(status_code=400, detail="Unsupported image format")
    
    # Read file data
    data = await file.read()
    
    # Check size (max 5MB)
    if len(data) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    
    # Upload to Object Storage
    file_id = str(uuid.uuid4())
    path = f"{APP_NAME}/products/{file_id}.{ext}"
    
    try:
        result = put_object(path, data, file.content_type)
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail="Upload failed")
    
    # Store reference in DB
    await db.files.insert_one({
        "id": file_id,
        "storage_path": result["path"],
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Return the URL that frontend can use
    backend_url = os.environ.get("BACKEND_URL", "https://auto-parts-shop-72.preview.emergentagent.com")
    file_url = f"{backend_url}/api/files/{file_id}"
    
    return {"url": file_url, "id": file_id, "path": result["path"]}

@api_router.get("/files/{file_id}")
async def download_file(file_id: str):
    """Public endpoint to serve uploaded images."""
    record = await db.files.find_one({"id": file_id, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        data, content_type = get_object(record["storage_path"])
        return Response(
            content=data, 
            media_type=record.get("content_type", content_type),
            headers={"Cache-Control": "public, max-age=86400"}
        )
    except Exception as e:
        logger.error(f"File download failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve file")

# ========== ADMIN AUCTIONS MANAGEMENT ==========
@api_router.get("/admin/auctions", dependencies=[Depends(require_admin)])
async def get_all_auctions_admin():
    auctions = await db.auctions.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for auction in auctions:
        product = await db.products.find_one({"id": auction["product_id"]}, {"_id": 0})
        if product:
            auction["product"] = product
    return auctions

@api_router.post("/admin/auctions/{auction_id}/close", dependencies=[Depends(require_admin)])
async def close_auction(auction_id: str):
    auction = await db.auctions.find_one({"id": auction_id})
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    await db.auctions.update_one(
        {"id": auction_id},
        {"$set": {"status": "closed", "end_time": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Unmark product as auction
    await db.products.update_one(
        {"id": auction["product_id"]},
        {"$set": {"is_auction": False}}
    )
    
    return {"message": "Auction closed"}

@api_router.delete("/admin/auctions/{auction_id}", dependencies=[Depends(require_admin)])
async def delete_auction(auction_id: str):
    auction = await db.auctions.find_one({"id": auction_id})
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    
    await db.auctions.delete_one({"id": auction_id})
    await db.products.update_one(
        {"id": auction["product_id"]},
        {"$set": {"is_auction": False}}
    )
    
    return {"message": "Auction deleted"}

# ========== ADMIN STATS ==========
@api_router.get("/admin/stats", dependencies=[Depends(require_admin)])
async def get_admin_stats():
    # Total revenue
    pipeline = [
        {"$match": {"status": {"$in": ["confirmed", "shipped", "delivered"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Order counts
    total_orders = await db.orders.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending_payment"})
    confirmed_orders = await db.orders.count_documents({"status": "confirmed"})
    shipped_orders = await db.orders.count_documents({"status": "shipped"})
    delivered_orders = await db.orders.count_documents({"status": "delivered"})
    
    # Product stats
    total_products = await db.products.count_documents({})
    low_stock = await db.products.count_documents({"stock": {"$lt": 5}})
    
    # Active auctions
    active_auctions = await db.auctions.count_documents({
        "status": "active",
        "end_time": {"$gt": datetime.now(timezone.utc).isoformat()}
    })
    
    # Total users
    total_users = await db.users.count_documents({})
    
    # Recent orders
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "revenue": total_revenue,
        "orders": {
            "total": total_orders,
            "pending": pending_orders,
            "confirmed": confirmed_orders,
            "shipped": shipped_orders,
            "delivered": delivered_orders
        },
        "products": {
            "total": total_products,
            "low_stock": low_stock
        },
        "active_auctions": active_auctions,
        "total_users": total_users,
        "recent_orders": recent_orders
    }

@api_router.get("/admin/export-orders", dependencies=[Depends(require_admin)])
async def export_orders():
    from fastapi.responses import StreamingResponse
    import csv
    import io

    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(10000)

    output = io.StringIO()
    output.write('\ufeff')  # UTF-8 BOM for Excel
    writer = csv.writer(output, delimiter=';')

    # Header (French for user)
    writer.writerow([
        "Numéro commande", "Date", "Client", "Email", "Téléphone",
        "Total (€)", "Statut", "Mode paiement", "Mode livraison",
        "Numéro de suivi", "Adresse", "Ville", "Code postal", "Pays"
    ])

    for order in orders:
        addr = order.get("shipping_address") or {}
        writer.writerow([
            order.get("id", ""),
            order.get("created_at", ""),
            order.get("user_name", ""),
            order.get("user_email", ""),
            addr.get("phone", ""),
            order.get("total", 0),
            order.get("status", ""),
            order.get("payment_method", ""),
            order.get("shipping_method", ""),
            order.get("tracking_number", ""),
            addr.get("street", ""),
            addr.get("city", ""),
            addr.get("postal_code", ""),
            addr.get("country", ""),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={
            "Content-Disposition": f'attachment; filename="commandes_autoparts_{datetime.now().strftime("%Y%m%d")}.csv"'
        }
    )

@api_router.get("/admin/sales-chart", dependencies=[Depends(require_admin)])
async def admin_sales_chart():
    """Return last 30 days revenue + order counts per day."""
    from collections import defaultdict
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    cursor = db.orders.find(
        {
            "created_at": {"$gte": cutoff.isoformat()},
            "status": {"$in": ["confirmed", "shipped", "delivered", "pending_payment"]}
        },
        {"_id": 0, "created_at": 1, "total": 1, "status": 1}
    )
    daily_rev = defaultdict(float)
    daily_count = defaultdict(int)
    async for o in cursor:
        try:
            day = o["created_at"][:10]  # YYYY-MM-DD
        except Exception:
            continue
        daily_count[day] += 1
        if o.get("status") in ("confirmed", "shipped", "delivered"):
            daily_rev[day] += float(o.get("total") or 0)
    # Build complete 30-day series (zero-fill missing days)
    series = []
    today = datetime.now(timezone.utc).date()
    for i in range(29, -1, -1):
        d = (today - timedelta(days=i)).isoformat()
        series.append({
            "date": d,
            "revenue": round(daily_rev.get(d, 0), 2),
            "orders": daily_count.get(d, 0)
        })
    return {"series": series}

# ========== NEWSLETTER ==========
class NewsletterSubscribe(BaseModel):
    email: EmailStr

@api_router.post("/newsletter/subscribe")
async def newsletter_subscribe(data: NewsletterSubscribe):
    existing = await db.newsletter.find_one({"email": data.email})
    if existing:
        return {"message": "Vous êtes déjà inscrit", "already": True}
    await db.newsletter.insert_one({
        "email": data.email,
        "subscribed_at": datetime.now(timezone.utc).isoformat()
    })
    logger.info(f"📧 Newsletter subscription: {data.email}")
    return {"message": "Inscription confirmée", "already": False}

# ========== TRACKING (PUBLIC) ==========
@api_router.get("/tracking/{tracking_number}")
async def get_tracking(tracking_number: str):
    order = await db.orders.find_one({"tracking_number": tracking_number}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Tracking number not found")
    # Return limited info (no user_id for security)
    return {
        "id": order["id"],
        "tracking_number": order["tracking_number"],
        "status": order["status"],
        "items": order.get("items", []),
        "total": order.get("total", 0),
        "shipping_address": {
            "city": order.get("shipping_address", {}).get("city"),
            "postal_code": order.get("shipping_address", {}).get("postal_code"),
            "country": order.get("shipping_address", {}).get("country"),
            "street": order.get("shipping_address", {}).get("street", "").split(" ")[0] + " ***"  # Partial street
        },
        "shipping_method": order.get("shipping_method", "delivery"),
        "created_at": order["created_at"]
    }

# ========== CHAT ==========
@api_router.post("/chat/start")
async def start_chat(data: ChatStart):
    chat_doc = {
        "id": str(uuid.uuid4()),
        "customer_name": data.name,
        "customer_email": data.email,
        "status": "active",
        "messages": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    await db.chats.insert_one(chat_doc)
    logger.info(f"🔔 NEW CHAT from {data.name} ({data.email}) - Chat ID: {chat_doc['id']}")
    chat_doc.pop("_id", None)
    return chat_doc

@api_router.get("/chat/{chat_id}")
async def get_chat(chat_id: str):
    chat = await db.chats.find_one({"id": chat_id}, {"_id": 0})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat

@api_router.post("/chat/{chat_id}/message")
async def send_chat_message(chat_id: str, message: ChatMessage):
    chat = await db.chats.find_one({"id": chat_id})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    msg_doc = {
        "sender": message.sender,
        "sender_name": message.sender_name,
        "content": message.content,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    
    await db.chats.update_one(
        {"id": chat_id},
        {
            "$push": {"messages": msg_doc},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    if message.sender == "customer":
        logger.info(f"🔔 NEW MESSAGE in chat {chat_id} from {message.sender_name}: {message.content[:50]}")
    
    return msg_doc

@api_router.get("/admin/chats", dependencies=[Depends(require_admin)])
async def get_all_chats():
    chats = await db.chats.find({}, {"_id": 0}).sort("updated_at", -1).to_list(100)
    return chats

# ========== OFFERS (Faire une offre) ==========
@api_router.post("/offers")
async def create_offer(offer_data: OfferCreate, user: dict = Depends(get_current_user)):
    product = await db.products.find_one({"id": offer_data.product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if offer_data.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")
    
    offer_doc = {
        "id": str(uuid.uuid4()),
        "product_id": offer_data.product_id,
        "product_title": product.get("title"),
        "product_price": product.get("price"),
        "user_id": user["_id"],
        "user_name": user["name"],
        "user_email": user["email"],
        "amount": offer_data.amount,
        "message": offer_data.message or "",
        "status": "pending",
        "admin_message": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.offers.insert_one(offer_doc)
    offer_doc.pop("_id", None)
    
    # Notify admin
    logger.info(f"🔔 NEW OFFER: {user['name']} offers {offer_data.amount}€ for {product.get('title')}")
    try:
        await send_email(
            to_email=ADMIN_NOTIFICATION_EMAIL,
            subject=f"💰 Nouvelle offre {offer_data.amount}€ - {product.get('title', '')[:40]}",
            html_content=f"""
            <div style="font-family:Arial;max-width:600px;margin:auto;padding:20px">
              <h1 style="color:#FF3333">💰 Nouvelle offre reçue</h1>
              <p><strong>Produit:</strong> {product.get('title')}</p>
              <p><strong>Prix demandé:</strong> {product.get('price')}€</p>
              <p><strong>Offre client:</strong> <span style="color:#FF3333;font-size:24px;font-weight:bold">{offer_data.amount}€</span></p>
              <p><strong>Client:</strong> {user['name']} ({user['email']})</p>
              <p><strong>Message:</strong> {offer_data.message or 'Aucun'}</p>
              <p><a href="https://auto-parts-shop-72.preview.emergentagent.com/admin/offers" style="background:#0A0F1C;color:white;padding:12px 24px;text-decoration:none;display:inline-block">Valider ou refuser</a></p>
            </div>
            """
        )
    except Exception as e:
        logger.error(f"Offer email failed: {e}")
    
    return offer_doc

@api_router.get("/offers/my")
async def get_my_offers(user: dict = Depends(get_current_user)):
    offers = await db.offers.find({"user_id": user["_id"]}, {"_id": 0}).sort("created_at", -1).to_list(100)
    return offers

@api_router.get("/admin/offers", dependencies=[Depends(require_admin)])
async def get_all_offers():
    offers = await db.offers.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return offers

@api_router.post("/admin/offers/{offer_id}/respond", dependencies=[Depends(require_admin)])
async def respond_to_offer(offer_id: str, response: OfferResponse):
    if response.status not in ["accepted", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    offer = await db.offers.find_one({"id": offer_id})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    await db.offers.update_one(
        {"id": offer_id},
        {"$set": {
            "status": response.status,
            "admin_message": response.admin_message,
            "responded_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Notify customer
    try:
        subject = "✅ Votre offre a été acceptée !" if response.status == "accepted" else "❌ Votre offre a été refusée"
        color = "#10B981" if response.status == "accepted" else "#EF4444"
        status_text = "acceptée" if response.status == "accepted" else "refusée"
        admin_msg_html = f"<p><strong>Message de l'admin:</strong> {response.admin_message}</p>" if response.admin_message else ""
        cta_html = f'<p><a href="https://auto-parts-shop-72.preview.emergentagent.com/products/{offer["product_id"]}" style="background:#10B981;color:white;padding:12px 24px;text-decoration:none;display:inline-block">Finaliser mon achat</a></p>' if response.status == "accepted" else ""
        await send_email(
            to_email=offer["user_email"],
            subject=subject,
            html_content=f"""
            <div style="font-family:Arial;max-width:600px;margin:auto;padding:20px">
              <h1 style="color:{color}">{subject}</h1>
              <p>Bonjour {offer['user_name']},</p>
              <p>Votre offre de <strong>{offer['amount']}€</strong> pour <strong>{offer['product_title']}</strong> a été <strong>{status_text}</strong>.</p>
              {admin_msg_html}
              {cta_html}
            </div>
            """
        )
    except Exception as e:
        logger.error(f"Offer response email failed: {e}")
    
    return {"message": "Response sent"}

# ========== BANK INFO ==========
@api_router.get("/bank-info")
async def get_bank_info(user: dict = Depends(get_current_user)):
    return {
        "iban": os.environ.get("BANK_IBAN", ""),
        "bic": os.environ.get("BANK_BIC", ""),
        "holder": os.environ.get("BANK_HOLDER", "")
    }

# ========== VIEW COUNTER ==========
@api_router.post("/products/{product_id}/view")
async def increment_view(product_id: str):
    await db.products.update_one({"id": product_id}, {"$inc": {"views": 1}})
    return {"ok": True}

# ========== USER PROFILE ==========
@api_router.get("/profile")
async def get_profile(user: dict = Depends(get_current_user)):
    return user

@api_router.put("/profile")
async def update_profile(
    name: Optional[str] = Body(None),
    phone: Optional[str] = Body(None),
    user: dict = Depends(get_current_user)
):
    update_data = {}
    if name:
        update_data["name"] = name
    if phone:
        update_data["phone"] = phone
    
    if update_data:
        await db.users.update_one({"_id": ObjectId(user["_id"])}, {"$set": update_data})
    
    return {"message": "Profile updated"}

@api_router.post("/profile/address")
async def add_address(address: AddressModel, user: dict = Depends(get_current_user)):
    address_doc = address.model_dump()
    address_doc["id"] = str(uuid.uuid4())
    
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$push": {"addresses": address_doc}}
    )
    
    return {"message": "Address added", "address": address_doc}

@api_router.delete("/profile/address/{address_id}")
async def delete_address(address_id: str, user: dict = Depends(get_current_user)):
    await db.users.update_one(
        {"_id": ObjectId(user["_id"])},
        {"$pull": {"addresses": {"id": address_id}}}
    )
    return {"message": "Address removed"}

# ========== SEED DATA ==========
async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@autoparts.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "addresses": [],
            "wishlist": [],
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        logger.info(f"Admin user created: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one(
            {"email": admin_email},
            {"$set": {"password_hash": hash_password(admin_password)}}
        )
        logger.info("Admin password updated")

async def seed_sample_products():
    count = await db.products.count_documents({})
    if count > 0:
        return
    
    sample_products = [
        {
            "id": str(uuid.uuid4()),
            "title": "Kit de freins Brembo GT",
            "description": "Kit de freins haute performance Brembo GT avec disques percés et étriers 6 pistons. Parfait pour usage circuit et route.",
            "oem_reference": "1N2.9505A",
            "compatible_brands": ["BMW", "Audi", "Mercedes"],
            "compatible_models": ["M3", "RS4", "C63 AMG"],
            "compatible_years": [2018, 2019, 2020, 2021, 2022, 2023],
            "category": "brakes",
            "condition": "new",
            "price": 2499.99,
            "stock": 5,
            "images": ["https://images.unsplash.com/photo-1763087978864-fe5b2778c9f7?w=800"],
            "is_auction": False,
            "is_featured": True,
            "views": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Turbo Garrett GTX3582R",
            "description": "Turbocompresseur Garrett GTX3582R Gen II. Technologie de pointe pour une réponse rapide et une puissance maximale.",
            "oem_reference": "856801-5007S",
            "compatible_brands": ["Universal"],
            "compatible_models": ["Custom"],
            "compatible_years": list(range(2010, 2025)),
            "category": "engine",
            "condition": "new",
            "price": 1899.00,
            "stock": 3,
            "images": ["https://images.unsplash.com/photo-1717068341307-454cd5d662a1?w=800"],
            "is_auction": False,
            "is_featured": True,
            "views": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Suspension KW V3 Coilover",
            "description": "Kit suspension réglable KW Variant 3. Réglage en compression et détente séparés pour un comportement optimal.",
            "oem_reference": "35210097",
            "compatible_brands": ["Volkswagen", "Audi", "Seat", "Skoda"],
            "compatible_models": ["Golf GTI", "A3", "Leon", "Octavia"],
            "compatible_years": [2019, 2020, 2021, 2022, 2023, 2024],
            "category": "suspension",
            "condition": "new",
            "price": 2199.00,
            "stock": 8,
            "images": ["https://images.unsplash.com/photo-1760836395716-7dd00b71311a?w=800"],
            "is_auction": False,
            "is_featured": True,
            "views": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "ECU Bosch ME7.5 (Occasion)",
            "description": "Calculateur moteur Bosch ME7.5 d'occasion en parfait état. Testé et garanti 6 mois.",
            "oem_reference": "0261206832",
            "compatible_brands": ["Volkswagen", "Audi"],
            "compatible_models": ["Golf IV", "A3 8L", "Bora"],
            "compatible_years": [1999, 2000, 2001, 2002, 2003, 2004],
            "category": "electrical",
            "condition": "used",
            "price": 299.00,
            "stock": 2,
            "images": ["https://images.unsplash.com/photo-1717068341695-9d33ffb66968?w=800"],
            "is_auction": False,
            "is_featured": False,
            "views": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Échappement Akrapovic Slip-On",
            "description": "Silencieux sport Akrapovic en titane. Son racing et gain de puissance garanti.",
            "oem_reference": "S-B10SO14-HASZ",
            "compatible_brands": ["BMW"],
            "compatible_models": ["S1000RR"],
            "compatible_years": [2019, 2020, 2021, 2022, 2023],
            "category": "exhaust",
            "condition": "new",
            "price": 1599.00,
            "stock": 4,
            "images": ["https://images.unsplash.com/photo-1664565239977-997eb1cdde86?w=800"],
            "is_auction": False,
            "is_featured": True,
            "views": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Radiateur Mishimoto Performance",
            "description": "Radiateur aluminium haute capacité Mishimoto. Refroidissement optimal pour usage intensif.",
            "oem_reference": "MMRAD-MUS-05",
            "compatible_brands": ["Ford"],
            "compatible_models": ["Mustang GT"],
            "compatible_years": [2005, 2006, 2007, 2008, 2009, 2010],
            "category": "cooling",
            "condition": "new",
            "price": 449.00,
            "stock": 6,
            "images": ["https://images.pexels.com/photos/34277926/pexels-photo-34277926.jpeg?w=800"],
            "is_auction": False,
            "is_featured": False,
            "views": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Pare-chocs avant M Performance",
            "description": "Pare-chocs avant style M Performance en fibre de carbone. Kit complet avec grilles.",
            "oem_reference": "51118064586",
            "compatible_brands": ["BMW"],
            "compatible_models": ["Serie 3 F30", "Serie 3 F31"],
            "compatible_years": [2012, 2013, 2014, 2015, 2016, 2017, 2018],
            "category": "bodywork",
            "condition": "new",
            "price": 899.00,
            "stock": 3,
            "images": ["https://images.unsplash.com/photo-1711386689622-1cda23e10217?w=800"],
            "is_auction": False,
            "is_featured": False,
            "views": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "title": "Volant Sparco L575 (Reconditionné)",
            "description": "Volant sport Sparco L575 reconditionné. Cuir refait à neuf, moyeu universel inclus.",
            "oem_reference": "015L575SNR",
            "compatible_brands": ["Universal"],
            "compatible_models": ["Custom"],
            "compatible_years": list(range(1990, 2025)),
            "category": "interior",
            "condition": "refurbished",
            "price": 189.00,
            "stock": 2,
            "images": ["https://images.unsplash.com/photo-1760317890283-540a468b86f6?w=800"],
            "is_auction": False,
            "is_featured": False,
            "views": 0,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.products.insert_many(sample_products)
    logger.info(f"Seeded {len(sample_products)} sample products")
    
    # Create sample auction
    auction_product = sample_products[1]  # Turbo
    auction_doc = {
        "id": str(uuid.uuid4()),
        "product_id": auction_product["id"],
        "starting_price": 1500.00,
        "current_price": 1650.00,
        "highest_bidder_id": None,
        "end_time": (datetime.now(timezone.utc) + timedelta(days=3)).isoformat(),
        "status": "active",
        "bids": [
            {"user_name": "Jean D.", "amount": 1550.00, "timestamp": (datetime.now(timezone.utc) - timedelta(hours=5)).isoformat()},
            {"user_name": "Marie L.", "amount": 1650.00, "timestamp": (datetime.now(timezone.utc) - timedelta(hours=2)).isoformat()}
        ],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.products.update_one({"id": auction_product["id"]}, {"$set": {"is_auction": True}})
    await db.auctions.insert_one(auction_doc)
    logger.info("Seeded sample auction")

# ========== STARTUP EVENTS ==========
@app.on_event("startup")
async def startup_event():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.products.create_index("category")
    await db.products.create_index("oem_reference")
    await db.products.create_index([("title", "text"), ("description", "text")])
    await db.orders.create_index("user_id")
    await db.auctions.create_index("product_id")
    await db.login_attempts.create_index("identifier")
    
    # Initialize Object Storage
    try:
        init_storage()
    except Exception as e:
        logger.error(f"Storage init failed at startup: {e}")
    
    # Delete old admin if exists (migration)
    old_admin = await db.users.find_one({"email": "admin@autoparts.com"})
    if old_admin:
        await db.users.delete_one({"email": "admin@autoparts.com"})
        logger.info("Old admin (admin@autoparts.com) removed")
    
    # Seed data
    await seed_admin()
    await seed_sample_products()
    
    # Write test credentials
    import os
    os.makedirs("/app/memory", exist_ok=True)
    with open("/app/memory/test_credentials.md", "w") as f:
        f.write("# Test Credentials\n\n")
        f.write("## Admin Account\n")
        f.write(f"- Email: {os.environ.get('ADMIN_EMAIL', 'admin@autoparts.com')}\n")
        f.write(f"- Password: {os.environ.get('ADMIN_PASSWORD', 'admin123')}\n")
        f.write("- Role: admin\n\n")
        f.write("## Auth Endpoints\n")
        f.write("- POST /api/auth/register\n")
        f.write("- POST /api/auth/login\n")
        f.write("- POST /api/auth/logout\n")
        f.write("- GET /api/auth/me\n")
        f.write("- POST /api/auth/refresh\n")
    
    logger.info("Application started successfully")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Include the router in the main app
app.include_router(api_router)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@api_router.get("/")
async def root():
    return {"message": "AutoParts E-Commerce API", "version": "1.0.0"}
