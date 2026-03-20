"""
Bhojpe POS SaaS Backend - FastAPI Server
Complete backend with RBAC, Multi-tenant, Module Management, WebSockets, and Stripe Payments
"""

from fastapi import FastAPI, HTTPException, Depends, status, Query, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
from bson import ObjectId
import os
import jwt
import hashlib
import secrets
import json
import asyncio
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Stripe Integration
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

# Environment
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "bhojpe_pos")
JWT_SECRET = os.environ.get("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24
STRIPE_API_KEY = os.environ.get("STRIPE_API_KEY")

# MongoDB Connection
client = MongoClient(MONGO_URL)
db = client[DB_NAME]

# Collections
users_col = db["users"]
restaurants_col = db["restaurants"]
modules_col = db["modules"]
menu_col = db["menu"]
orders_col = db["orders"]
customers_col = db["customers"]
tables_col = db["tables"]
reservations_col = db["reservations"]
waiter_requests_col = db["waiter_requests"]
activity_logs_col = db["activity_logs"]
payment_transactions_col = db["payment_transactions"]
kot_col = db["kot"]

# FastAPI App
app = FastAPI(
    title="Bhojpe POS SaaS API",
    description="Enterprise POS System with RBAC, Multi-tenant, and WebSocket Support",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# ======================== WEBSOCKET CONNECTION MANAGER ========================

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.user_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, restaurant_id: str, user_id: str = None):
        await websocket.accept()
        if restaurant_id not in self.active_connections:
            self.active_connections[restaurant_id] = []
        self.active_connections[restaurant_id].append(websocket)
        if user_id:
            self.user_connections[user_id] = websocket
    
    def disconnect(self, websocket: WebSocket, restaurant_id: str, user_id: str = None):
        if restaurant_id in self.active_connections:
            if websocket in self.active_connections[restaurant_id]:
                self.active_connections[restaurant_id].remove(websocket)
        if user_id and user_id in self.user_connections:
            del self.user_connections[user_id]
    
    async def broadcast_to_restaurant(self, restaurant_id: str, message: dict):
        if restaurant_id in self.active_connections:
            for connection in self.active_connections[restaurant_id]:
                try:
                    await connection.send_json(message)
                except:
                    pass
    
    async def send_to_user(self, user_id: str, message: dict):
        if user_id in self.user_connections:
            try:
                await self.user_connections[user_id].send_json(message)
            except:
                pass
    
    async def broadcast_all(self, message: dict):
        for restaurant_id in self.active_connections:
            await self.broadcast_to_restaurant(restaurant_id, message)

manager = ConnectionManager()

# ======================== RBAC DEFINITIONS ========================

ROLES = {
    "super_admin": {
        "name": "Super Admin",
        "level": 100,
        "description": "Manages all restaurants and system settings"
    },
    "admin": {
        "name": "Admin/Restaurant Owner",
        "level": 90,
        "description": "Manages their restaurant"
    },
    "manager": {
        "name": "Manager",
        "level": 70,
        "description": "Manages daily operations"
    },
    "cashier": {
        "name": "Cashier",
        "level": 50,
        "description": "Handles POS and payments"
    },
    "waiter": {
        "name": "Waiter",
        "level": 30,
        "description": "Takes orders and serves customers"
    },
    "chef": {
        "name": "Chef",
        "level": 40,
        "description": "Prepares food and manages kitchen"
    },
    "delivery_boy": {
        "name": "Delivery Boy",
        "level": 20,
        "description": "Handles deliveries"
    }
}

PERMISSIONS = {
    "super_admin": ["*"],
    "admin": [
        "dashboard", "pos", "orders", "kot", "tables", "reservations",
        "customers", "menu", "staff", "reports", "settings", "modules"
    ],
    "manager": [
        "dashboard", "pos", "orders", "kot", "tables", "reservations",
        "customers", "menu", "staff.view", "reports", "settings.view"
    ],
    "cashier": [
        "dashboard.view", "pos", "orders", "customers.view", "reports.basic"
    ],
    "waiter": [
        "pos", "orders.view", "orders.create", "tables", "reservations.view"
    ],
    "chef": [
        "orders.view", "kot"
    ],
    "delivery_boy": [
        "orders.view", "orders.delivery"
    ]
}

DEFAULT_MODULES = [
    {"key": "pos", "name": "Point of Sale", "description": "POS Terminal", "icon": "PointOfSale", "active": True, "core": True},
    {"key": "orders", "name": "Orders", "description": "Order Management", "icon": "Receipt", "active": True, "core": True},
    {"key": "kot", "name": "Kitchen Display", "description": "Kitchen Order Tickets", "icon": "Kitchen", "active": True, "core": False},
    {"key": "tables", "name": "Tables", "description": "Table Management", "icon": "TableRestaurant", "active": True, "core": False},
    {"key": "reservations", "name": "Reservations", "description": "Booking System", "icon": "BookOnline", "active": True, "core": False},
    {"key": "customers", "name": "Customers", "description": "Customer Database", "icon": "People", "active": True, "core": False},
    {"key": "menu", "name": "Menu", "description": "Menu Management", "icon": "Restaurant", "active": True, "core": True},
    {"key": "staff", "name": "Staff", "description": "Staff Management", "icon": "Group", "active": True, "core": False},
    {"key": "reports", "name": "Reports", "description": "Analytics & Reports", "icon": "BarChart", "active": True, "core": False},
    {"key": "settings", "name": "Settings", "description": "System Settings", "icon": "Settings", "active": True, "core": True},
    {"key": "delivery", "name": "Delivery", "description": "Delivery Management", "icon": "LocalShipping", "active": True, "core": False},
]

# ======================== PYDANTIC MODELS ========================

class LoginRequest(BaseModel):
    username: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    username: str
    password: str
    role: str = "admin"
    restaurant_name: Optional[str] = None

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    username: str
    role: str
    permissions: List[str]
    restaurant_id: Optional[str] = None
    restaurant_name: Optional[str] = None
    color: Optional[str] = None
    modules: List[Dict] = []

class RestaurantCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    gstin: Optional[str] = None
    currency: str = "₹"
    timezone: str = "Asia/Kolkata"

class StaffCreate(BaseModel):
    name: str
    email: str
    username: str
    password: str
    role: str
    phone: Optional[str] = None
    shift: Optional[str] = "Morning"

class MenuItemCreate(BaseModel):
    name: str
    category: str
    price: float
    cost: Optional[float] = 0
    tax: float = 5
    type: str = "veg"
    description: Optional[str] = None
    available: bool = True

class OrderCreate(BaseModel):
    items: List[Dict]
    orderType: str = "dine"
    tableNo: Optional[str] = None
    note: Optional[str] = None
    customerId: Optional[str] = None
    customerName: Optional[str] = None
    paymentMethod: str = "cash"
    subtotal: float
    tax: float
    total: float

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class TableCreate(BaseModel):
    name: str
    capacity: int = 4
    floor: str = "Ground"

class ReservationCreate(BaseModel):
    name: str
    phone: str
    date: str
    time: str
    guests: int
    tableId: Optional[str] = None
    notes: Optional[str] = None

class ModuleUpdate(BaseModel):
    active: bool

# ======================== UTILITY FUNCTIONS ========================

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def create_token(user_id: str, role: str, restaurant_id: str = None) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "restaurant_id": restaurant_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> Dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def serialize_doc(doc: Dict) -> Dict:
    if doc is None:
        return None
    doc = dict(doc)
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    for key, value in doc.items():
        if isinstance(value, ObjectId):
            doc[key] = str(value)
        elif isinstance(value, datetime):
            doc[key] = value.isoformat()
    return doc

def serialize_docs(docs) -> List[Dict]:
    return [serialize_doc(d) for d in docs]

def get_random_color():
    colors = ["#FF3D01", "#1a4fcc", "#186b35", "#7a5a00", "#7e22ce", "#b81c1c"]
    return secrets.choice(colors)

# ======================== AUTH DEPENDENCY ========================

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    user = users_col.find_one({"_id": ObjectId(payload["user_id"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return serialize_doc(user)

def require_permission(permission: str):
    async def check_permission(user: Dict = Depends(get_current_user)):
        user_permissions = PERMISSIONS.get(user["role"], [])
        # Super admin has all permissions
        if "*" in user_permissions:
            return user
        
        # Check exact match
        if permission in user_permissions:
            return user
        
        # Check prefix match (e.g., "orders" grants "orders.view", "orders.create")
        base_permission = permission.split('.')[0]
        if base_permission in user_permissions:
            return user
        
        # Check if user has a more specific permission that covers this
        for p in user_permissions:
            # e.g., "orders.view" should match when checking "orders.view"
            if permission == p:
                return user
            # e.g., "orders.view" grants access when we only need "orders"
            if p.startswith(base_permission + '.'):
                return user
        
        raise HTTPException(status_code=403, detail=f"Permission denied: {permission}")
    return check_permission

def require_role(allowed_roles: List[str]):
    async def check_role(user: Dict = Depends(get_current_user)):
        if user["role"] not in allowed_roles and user["role"] != "super_admin":
            raise HTTPException(status_code=403, detail="Role not authorized")
        return user
    return check_role

# ======================== INITIALIZATION ========================

def init_database():
    users_col.create_index("username", unique=True)
    users_col.create_index("email", unique=True)
    
    if not users_col.find_one({"role": "super_admin"}):
        super_admin = {
            "name": "Super Admin",
            "email": "superadmin@bhojpe.com",
            "username": "superadmin",
            "password": hash_password("admin123"),
            "role": "super_admin",
            "restaurant_id": None,
            "color": "#FF3D01",
            "active": True,
            "created_at": datetime.now(timezone.utc)
        }
        users_col.insert_one(super_admin)
        print("Created default super admin: superadmin / admin123")
    
    # Create demo restaurant and admin if not exists
    if not restaurants_col.find_one({"name": "Bhojpe Restaurant"}):
        restaurant = {
            "name": "Bhojpe Restaurant",
            "address": "123 Food Street, Indore, MP",
            "phone": "+91 98765 43210",
            "currency": "₹",
            "timezone": "Asia/Kolkata",
            "created_at": datetime.now(timezone.utc)
        }
        result = restaurants_col.insert_one(restaurant)
        restaurant_id = str(result.inserted_id)
        
        # Initialize modules for restaurant
        for module in DEFAULT_MODULES:
            module_doc = {
                **module,
                "restaurant_id": restaurant_id,
                "created_at": datetime.now(timezone.utc)
            }
            modules_col.insert_one(module_doc)
        
        # Create demo admin
        if not users_col.find_one({"username": "admin"}):
            admin = {
                "name": "Admin User",
                "email": "admin@bhojpe.com",
                "username": "admin",
                "password": hash_password("demo123"),
                "role": "admin",
                "restaurant_id": restaurant_id,
                "color": "#FF3D01",
                "active": True,
                "created_at": datetime.now(timezone.utc)
            }
            users_col.insert_one(admin)
        
        # Create demo staff
        demo_staff = [
            {"name": "Sanjay Kumar", "email": "manager@bhojpe.com", "username": "manager", "role": "manager"},
            {"name": "Pooja Verma", "email": "cashier@bhojpe.com", "username": "cashier", "role": "cashier"},
            {"name": "Raju Singh", "email": "waiter@bhojpe.com", "username": "waiter", "role": "waiter"},
            {"name": "Ramesh Chef", "email": "chef@bhojpe.com", "username": "chef", "role": "chef"},
            {"name": "Delivery Boy", "email": "delivery@bhojpe.com", "username": "delivery", "role": "delivery_boy"},
        ]
        for staff in demo_staff:
            if not users_col.find_one({"username": staff["username"]}):
                users_col.insert_one({
                    **staff,
                    "password": hash_password("demo123"),
                    "restaurant_id": restaurant_id,
                    "color": get_random_color(),
                    "active": True,
                    "created_at": datetime.now(timezone.utc)
                })
        
        # Seed demo menu
        demo_menu = [
            {"name": "Paneer Butter Masala", "category": "Main Course", "price": 320, "type": "veg", "available": True},
            {"name": "Dal Makhani", "category": "Main Course", "price": 250, "type": "veg", "available": True},
            {"name": "Butter Naan", "category": "Breads", "price": 60, "type": "veg", "available": True},
            {"name": "Chicken Tikka", "category": "Starters", "price": 420, "type": "non-veg", "available": True},
            {"name": "Mango Lassi", "category": "Beverages", "price": 120, "type": "veg", "available": True},
            {"name": "Gulab Jamun", "category": "Desserts", "price": 100, "type": "veg", "available": True},
            {"name": "Chicken Biryani", "category": "Rice & Biryani", "price": 380, "type": "non-veg", "available": True},
            {"name": "Masala Chai", "category": "Beverages", "price": 60, "type": "veg", "available": True},
            {"name": "Samosa", "category": "Starters", "price": 80, "type": "veg", "available": True},
            {"name": "Fish Curry", "category": "Main Course", "price": 450, "type": "non-veg", "available": True},
            {"name": "Veg Biryani", "category": "Rice & Biryani", "price": 280, "type": "veg", "available": True},
            {"name": "Tandoori Roti", "category": "Breads", "price": 40, "type": "veg", "available": True},
        ]
        for item in demo_menu:
            item["restaurant_id"] = restaurant_id
            item["created_at"] = datetime.now(timezone.utc)
        menu_col.insert_many(demo_menu)
        
        # Seed demo tables
        demo_tables = [
            {"name": "T-01", "capacity": 2, "floor": "Ground", "status": "available"},
            {"name": "T-02", "capacity": 4, "floor": "Ground", "status": "available"},
            {"name": "T-03", "capacity": 4, "floor": "Ground", "status": "occupied"},
            {"name": "T-04", "capacity": 6, "floor": "Ground", "status": "available"},
            {"name": "T-05", "capacity": 8, "floor": "Ground", "status": "reserved"},
            {"name": "T-06", "capacity": 2, "floor": "First", "status": "available"},
            {"name": "T-07", "capacity": 4, "floor": "First", "status": "available"},
            {"name": "T-08", "capacity": 6, "floor": "First", "status": "available"},
        ]
        for table in demo_tables:
            table["restaurant_id"] = restaurant_id
            table["created_at"] = datetime.now(timezone.utc)
        tables_col.insert_many(demo_tables)
        
        # Seed demo customers
        demo_customers = [
            {"name": "Rajesh Gupta", "phone": "9876501234", "email": "rajesh@gmail.com", "totalOrders": 12, "totalSpent": 8640, "loyaltyPoints": 86},
            {"name": "Sneha Patil", "phone": "9811234567", "email": "sneha@gmail.com", "totalOrders": 6, "totalSpent": 3240, "loyaltyPoints": 32},
            {"name": "Mohammed Ali", "phone": "9999888777", "email": "mali@gmail.com", "totalOrders": 24, "totalSpent": 18600, "loyaltyPoints": 186},
        ]
        for customer in demo_customers:
            customer["restaurant_id"] = restaurant_id
            customer["created_at"] = datetime.now(timezone.utc)
        customers_col.insert_many(demo_customers)
        
        print("Created demo restaurant: Bhojpe Restaurant")
        print("Demo credentials: admin/demo123, manager/demo123, cashier/demo123, waiter/demo123, chef/demo123")

# ======================== WEBSOCKET ENDPOINTS ========================

@app.websocket("/api/ws/{restaurant_id}")
async def websocket_endpoint(websocket: WebSocket, restaurant_id: str):
    user_id = websocket.query_params.get("user_id")
    await manager.connect(websocket, restaurant_id, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            event_type = data.get("type")
            
            if event_type == "ORDER_UPDATE":
                await manager.broadcast_to_restaurant(restaurant_id, {
                    "type": "ORDER_UPDATE",
                    "data": data.get("data")
                })
            elif event_type == "KOT_UPDATE":
                await manager.broadcast_to_restaurant(restaurant_id, {
                    "type": "KOT_UPDATE",
                    "data": data.get("data")
                })
            elif event_type == "TABLE_UPDATE":
                await manager.broadcast_to_restaurant(restaurant_id, {
                    "type": "TABLE_UPDATE",
                    "data": data.get("data")
                })
            elif event_type == "PING":
                await websocket.send_json({"type": "PONG"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, restaurant_id, user_id)

# ======================== AUTH ENDPOINTS ========================

@app.post("/api/auth/login")
async def login(request: LoginRequest):
    user = users_col.find_one({
        "$or": [
            {"username": request.username},
            {"email": request.username}
        ]
    })
    
    if not user or not verify_password(request.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("active", True):
        raise HTTPException(status_code=401, detail="Account is inactive")
    
    restaurant_id = user.get("restaurant_id")
    restaurant = None
    modules = []
    
    if restaurant_id:
        restaurant = restaurants_col.find_one({"_id": ObjectId(restaurant_id)})
        modules = serialize_docs(modules_col.find({"restaurant_id": restaurant_id}))
    
    if user["role"] == "super_admin":
        modules = DEFAULT_MODULES
    
    token = create_token(str(user["_id"]), user["role"], str(restaurant_id) if restaurant_id else None)
    
    user_data = serialize_doc(user)
    user_data.pop("password", None)
    user_data["permissions"] = PERMISSIONS.get(user["role"], [])
    user_data["restaurant_name"] = restaurant["name"] if restaurant else None
    user_data["modules"] = modules
    
    activity_logs_col.insert_one({
        "user_id": str(user["_id"]),
        "action": "LOGIN",
        "description": f"{user['name']} logged in",
        "module": "auth",
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {"user": user_data, "token": token}

@app.post("/api/auth/register")
async def register(request: RegisterRequest):
    existing = users_col.find_one({
        "$or": [
            {"username": request.username},
            {"email": request.email}
        ]
    })
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    restaurant_id = None
    if request.restaurant_name:
        restaurant = {
            "name": request.restaurant_name,
            "owner_email": request.email,
            "currency": "₹",
            "timezone": "Asia/Kolkata",
            "created_at": datetime.now(timezone.utc)
        }
        result = restaurants_col.insert_one(restaurant)
        restaurant_id = result.inserted_id
        
        for module in DEFAULT_MODULES:
            module_doc = {
                **module,
                "restaurant_id": str(restaurant_id),
                "created_at": datetime.now(timezone.utc)
            }
            modules_col.insert_one(module_doc)
    
    user = {
        "name": request.name,
        "email": request.email,
        "username": request.username,
        "password": hash_password(request.password),
        "role": request.role,
        "restaurant_id": str(restaurant_id) if restaurant_id else None,
        "color": get_random_color(),
        "active": True,
        "created_at": datetime.now(timezone.utc)
    }
    result = users_col.insert_one(user)
    
    token = create_token(str(result.inserted_id), request.role, str(restaurant_id) if restaurant_id else None)
    
    user_data = serialize_doc(users_col.find_one({"_id": result.inserted_id}))
    user_data.pop("password", None)
    user_data["permissions"] = PERMISSIONS.get(request.role, [])
    user_data["restaurant_name"] = request.restaurant_name
    
    modules = serialize_docs(modules_col.find({"restaurant_id": str(restaurant_id)})) if restaurant_id else []
    user_data["modules"] = modules
    
    return {"user": user_data, "token": token}

@app.get("/api/auth/me")
async def get_me(user: Dict = Depends(get_current_user)):
    user.pop("password", None)
    user["permissions"] = PERMISSIONS.get(user["role"], [])
    
    if user.get("restaurant_id"):
        restaurant = restaurants_col.find_one({"_id": ObjectId(user["restaurant_id"])})
        user["restaurant_name"] = restaurant["name"] if restaurant else None
        user["modules"] = serialize_docs(modules_col.find({"restaurant_id": user["restaurant_id"]}))
    else:
        user["modules"] = DEFAULT_MODULES if user["role"] == "super_admin" else []
    
    return user

# ======================== RESTAURANT MANAGEMENT ========================

@app.get("/api/restaurants")
async def get_restaurants(user: Dict = Depends(require_role(["super_admin"]))):
    return serialize_docs(restaurants_col.find())

@app.post("/api/restaurants")
async def create_restaurant(data: RestaurantCreate, user: Dict = Depends(require_role(["super_admin"]))):
    restaurant = {**data.model_dump(), "created_at": datetime.now(timezone.utc)}
    result = restaurants_col.insert_one(restaurant)
    
    for module in DEFAULT_MODULES:
        modules_col.insert_one({**module, "restaurant_id": str(result.inserted_id), "created_at": datetime.now(timezone.utc)})
    
    return serialize_doc(restaurants_col.find_one({"_id": result.inserted_id}))

# ======================== MODULE MANAGEMENT ========================

@app.get("/api/modules")
async def get_modules(user: Dict = Depends(get_current_user)):
    if user["role"] == "super_admin":
        return DEFAULT_MODULES
    
    restaurant_id = user.get("restaurant_id")
    if not restaurant_id:
        return []
    
    return serialize_docs(modules_col.find({"restaurant_id": restaurant_id}))

@app.put("/api/modules/{module_key}")
async def update_module(module_key: str, data: ModuleUpdate, user: Dict = Depends(require_role(["super_admin", "admin"]))):
    restaurant_id = user.get("restaurant_id")
    
    if user["role"] == "super_admin":
        modules_col.update_many({"key": module_key}, {"$set": {"active": data.active, "updated_at": datetime.now(timezone.utc)}})
    else:
        module = modules_col.find_one({"key": module_key, "restaurant_id": restaurant_id})
        if module and module.get("core"):
            raise HTTPException(status_code=400, detail="Cannot disable core module")
        modules_col.update_one({"key": module_key, "restaurant_id": restaurant_id}, {"$set": {"active": data.active, "updated_at": datetime.now(timezone.utc)}})
    
    return {"success": True, "module": module_key, "active": data.active}

# ======================== STAFF MANAGEMENT ========================

@app.get("/api/staff")
async def get_staff(user: Dict = Depends(require_permission("staff.view"))):
    restaurant_id = user.get("restaurant_id")
    
    if user["role"] == "super_admin":
        staff = serialize_docs(users_col.find({"role": {"$ne": "super_admin"}}))
    else:
        staff = serialize_docs(users_col.find({"restaurant_id": restaurant_id}))
    
    for s in staff:
        s.pop("password", None)
        s["permissions"] = PERMISSIONS.get(s.get("role", ""), [])
    
    return staff

@app.post("/api/staff")
async def create_staff(data: StaffCreate, user: Dict = Depends(require_role(["super_admin", "admin", "manager"]))):
    if data.role not in ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role: {data.role}")
    
    user_level = ROLES.get(user["role"], {}).get("level", 0)
    new_role_level = ROLES.get(data.role, {}).get("level", 0)
    if new_role_level >= user_level and user["role"] != "super_admin":
        raise HTTPException(status_code=403, detail="Cannot create user with equal or higher role")
    
    existing = users_col.find_one({"$or": [{"username": data.username}, {"email": data.email}]})
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    staff_member = {
        "name": data.name,
        "email": data.email,
        "username": data.username,
        "password": hash_password(data.password),
        "role": data.role,
        "phone": data.phone,
        "shift": data.shift,
        "restaurant_id": user.get("restaurant_id"),
        "color": get_random_color(),
        "active": True,
        "created_at": datetime.now(timezone.utc),
        "created_by": user["id"]
    }
    result = users_col.insert_one(staff_member)
    
    staff_data = serialize_doc(users_col.find_one({"_id": result.inserted_id}))
    staff_data.pop("password", None)
    staff_data["permissions"] = PERMISSIONS.get(data.role, [])
    
    return staff_data

@app.put("/api/staff/{staff_id}")
async def update_staff(staff_id: str, data: Dict[str, Any], user: Dict = Depends(require_role(["super_admin", "admin", "manager"]))):
    staff = users_col.find_one({"_id": ObjectId(staff_id)})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    update_data = {k: v for k, v in data.items() if k not in ["_id", "id", "password", "role"]}
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    users_col.update_one({"_id": ObjectId(staff_id)}, {"$set": update_data})
    
    updated = serialize_doc(users_col.find_one({"_id": ObjectId(staff_id)}))
    updated.pop("password", None)
    return updated

@app.delete("/api/staff/{staff_id}")
async def delete_staff(staff_id: str, user: Dict = Depends(require_role(["super_admin", "admin"]))):
    staff = users_col.find_one({"_id": ObjectId(staff_id)})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    
    if staff["role"] == "super_admin":
        raise HTTPException(status_code=403, detail="Cannot delete super admin")
    
    users_col.delete_one({"_id": ObjectId(staff_id)})
    return {"success": True}

# ======================== MENU MANAGEMENT ========================

@app.get("/api/menu")
async def get_menu(user: Dict = Depends(get_current_user)):
    restaurant_id = user.get("restaurant_id")
    
    if user["role"] == "super_admin":
        return serialize_docs(menu_col.find())
    
    return serialize_docs(menu_col.find({"restaurant_id": restaurant_id}))

@app.post("/api/menu")
async def create_menu_item(data: MenuItemCreate, user: Dict = Depends(require_permission("menu"))):
    item = {**data.model_dump(), "restaurant_id": user.get("restaurant_id"), "created_at": datetime.now(timezone.utc)}
    result = menu_col.insert_one(item)
    return serialize_doc(menu_col.find_one({"_id": result.inserted_id}))

@app.put("/api/menu/{item_id}")
async def update_menu_item(item_id: str, data: Dict[str, Any], user: Dict = Depends(require_permission("menu"))):
    update_data = {k: v for k, v in data.items() if k not in ["_id", "id"]}
    update_data["updated_at"] = datetime.now(timezone.utc)
    menu_col.update_one({"_id": ObjectId(item_id)}, {"$set": update_data})
    return serialize_doc(menu_col.find_one({"_id": ObjectId(item_id)}))

@app.delete("/api/menu/{item_id}")
async def delete_menu_item(item_id: str, user: Dict = Depends(require_permission("menu"))):
    menu_col.delete_one({"_id": ObjectId(item_id)})
    return {"success": True}

# ======================== ORDERS ========================

@app.get("/api/orders")
async def get_orders(status: Optional[str] = None, limit: int = Query(default=50, le=200), user: Dict = Depends(require_permission("orders"))):
    restaurant_id = user.get("restaurant_id")
    query = {}
    
    if user["role"] != "super_admin":
        query["restaurant_id"] = restaurant_id
    
    if status:
        query["status"] = status
    
    return serialize_docs(orders_col.find(query).sort("created_at", -1).limit(limit))

@app.post("/api/orders")
async def create_order(data: OrderCreate, user: Dict = Depends(require_permission("orders"))):
    order_number = f"#{secrets.randbelow(90000) + 10000}"
    restaurant_id = user.get("restaurant_id")
    
    order = {
        **data.model_dump(),
        "orderNumber": order_number,
        "status": "pending",
        "restaurant_id": restaurant_id,
        "waiter": user.get("name"),
        "waiter_id": user.get("id"),
        "created_at": datetime.now(timezone.utc)
    }
    result = orders_col.insert_one(order)
    
    order_data = serialize_doc(orders_col.find_one({"_id": result.inserted_id}))
    
    # Broadcast to restaurant via WebSocket
    if restaurant_id:
        asyncio.create_task(manager.broadcast_to_restaurant(restaurant_id, {
            "type": "NEW_ORDER",
            "data": order_data
        }))
    
    activity_logs_col.insert_one({
        "user_id": user["id"],
        "action": "ORDER_CREATED",
        "description": f"Order {order_number} created - ₹{data.total}",
        "module": "orders",
        "timestamp": datetime.now(timezone.utc)
    })
    
    return order_data

@app.put("/api/orders/{order_id}/status")
async def update_order_status(order_id: str, data: Dict[str, str], user: Dict = Depends(require_permission("orders"))):
    status = data.get("status")
    if not status:
        raise HTTPException(status_code=400, detail="Status required")
    
    orders_col.update_one({"_id": ObjectId(order_id)}, {"$set": {"status": status, "updated_at": datetime.now(timezone.utc)}})
    
    order_data = serialize_doc(orders_col.find_one({"_id": ObjectId(order_id)}))
    
    # Broadcast status update via WebSocket
    restaurant_id = user.get("restaurant_id")
    if restaurant_id:
        asyncio.create_task(manager.broadcast_to_restaurant(restaurant_id, {
            "type": "ORDER_STATUS_UPDATE",
            "data": order_data
        }))
    
    return order_data

# ======================== CUSTOMERS ========================

@app.get("/api/customers")
async def get_customers(user: Dict = Depends(require_permission("customers"))):
    restaurant_id = user.get("restaurant_id")
    
    if user["role"] == "super_admin":
        return serialize_docs(customers_col.find())
    
    return serialize_docs(customers_col.find({"restaurant_id": restaurant_id}))

@app.post("/api/customers")
async def create_customer(data: CustomerCreate, user: Dict = Depends(require_permission("customers"))):
    customer = {**data.model_dump(), "restaurant_id": user.get("restaurant_id"), "totalOrders": 0, "totalSpent": 0, "loyaltyPoints": 0, "created_at": datetime.now(timezone.utc)}
    result = customers_col.insert_one(customer)
    return serialize_doc(customers_col.find_one({"_id": result.inserted_id}))

@app.put("/api/customers/{customer_id}")
async def update_customer(customer_id: str, data: Dict[str, Any], user: Dict = Depends(require_permission("customers"))):
    update_data = {k: v for k, v in data.items() if k not in ["_id", "id"]}
    update_data["updated_at"] = datetime.now(timezone.utc)
    customers_col.update_one({"_id": ObjectId(customer_id)}, {"$set": update_data})
    return serialize_doc(customers_col.find_one({"_id": ObjectId(customer_id)}))

# ======================== TABLES ========================

@app.get("/api/tables")
async def get_tables(user: Dict = Depends(require_permission("pos"))):
    restaurant_id = user.get("restaurant_id")
    
    if user["role"] == "super_admin":
        return serialize_docs(tables_col.find())
    
    return serialize_docs(tables_col.find({"restaurant_id": restaurant_id}))

@app.post("/api/tables")
async def create_table(data: TableCreate, user: Dict = Depends(require_permission("pos"))):
    table = {**data.model_dump(), "status": "available", "restaurant_id": user.get("restaurant_id"), "created_at": datetime.now(timezone.utc)}
    result = tables_col.insert_one(table)
    return serialize_doc(tables_col.find_one({"_id": result.inserted_id}))

@app.put("/api/tables/{table_id}")
async def update_table(table_id: str, data: Dict[str, Any], user: Dict = Depends(require_permission("pos"))):
    update_data = {k: v for k, v in data.items() if k not in ["_id", "id"]}
    update_data["updated_at"] = datetime.now(timezone.utc)
    tables_col.update_one({"_id": ObjectId(table_id)}, {"$set": update_data})
    
    table_data = serialize_doc(tables_col.find_one({"_id": ObjectId(table_id)}))
    
    # Broadcast table update via WebSocket
    restaurant_id = user.get("restaurant_id")
    if restaurant_id:
        asyncio.create_task(manager.broadcast_to_restaurant(restaurant_id, {
            "type": "TABLE_UPDATE",
            "data": table_data
        }))
    
    return table_data

# ======================== RESERVATIONS ========================

@app.get("/api/reservations")
async def get_reservations(user: Dict = Depends(require_permission("reservations"))):
    restaurant_id = user.get("restaurant_id")
    
    if user["role"] == "super_admin":
        return serialize_docs(reservations_col.find())
    
    return serialize_docs(reservations_col.find({"restaurant_id": restaurant_id}))

@app.post("/api/reservations")
async def create_reservation(data: ReservationCreate, user: Dict = Depends(require_permission("reservations"))):
    reservation = {**data.model_dump(), "status": "pending", "restaurant_id": user.get("restaurant_id"), "created_at": datetime.now(timezone.utc)}
    result = reservations_col.insert_one(reservation)
    return serialize_doc(reservations_col.find_one({"_id": result.inserted_id}))

@app.put("/api/reservations/{reservation_id}")
async def update_reservation(reservation_id: str, data: Dict[str, Any], user: Dict = Depends(require_permission("reservations"))):
    update_data = {k: v for k, v in data.items() if k not in ["_id", "id"]}
    update_data["updated_at"] = datetime.now(timezone.utc)
    reservations_col.update_one({"_id": ObjectId(reservation_id)}, {"$set": update_data})
    return serialize_doc(reservations_col.find_one({"_id": ObjectId(reservation_id)}))

# ======================== REPORTS ========================

@app.get("/api/reports/dashboard")
async def get_dashboard_stats(user: Dict = Depends(require_permission("dashboard"))):
    restaurant_id = user.get("restaurant_id")
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    


# ======================== WAITER REQUESTS ========================

class WaiterRequestCreate(BaseModel):
    table_id: str
    table_name: str
    request_type: str
    urgency: Optional[str] = "normal"
    note: Optional[str] = None

@app.get("/api/waiter-requests")
async def get_waiter_requests(
    status: Optional[str] = "pending",
    user: Dict = Depends(require_permission("orders"))
):
    restaurant_id = user.get("restaurant_id")
    query = {"restaurant_id": restaurant_id}
    
    if status:
        query["status"] = status
    
    requests_list = serialize_docs(waiter_requests_col.find(query).sort("created_at", -1))
    
    # Calculate stats
    all_requests = serialize_docs(waiter_requests_col.find({"restaurant_id": restaurant_id}))
    total = len(all_requests)
    pending = len([r for r in all_requests if r.get("status") == "pending"])
    resolved = len([r for r in all_requests if r.get("status") == "resolved"])
    high_urgency = len([r for r in all_requests if r.get("urgency") == "high" and r.get("status") == "pending"])
    
    return {
        "requests": requests_list,
        "stats": {
            "total": total,
            "pending": pending,
            "resolved": resolved,
            "high_urgency": high_urgency
        }
    }

@app.post("/api/waiter-requests")
async def create_waiter_request(
    data: WaiterRequestCreate,
    user: Dict = Depends(require_permission("orders"))
):
    request_data = {
        **data.model_dump(),
        "status": "pending",
        "restaurant_id": user.get("restaurant_id"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user.get("username", "customer")
    }
    result = waiter_requests_col.insert_one(request_data)
    return serialize_doc(waiter_requests_col.find_one({"_id": result.inserted_id}))

@app.put("/api/waiter-requests/{request_id}/resolve")
async def resolve_waiter_request(
    request_id: str,
    user: Dict = Depends(require_permission("orders"))
):
    update_data = {
        "status": "resolved",
        "resolved_at": datetime.now(timezone.utc).isoformat(),
        "resolved_by": user.get("username")
    }
    waiter_requests_col.update_one({"_id": ObjectId(request_id)}, {"$set": update_data})
    return serialize_doc(waiter_requests_col.find_one({"_id": ObjectId(request_id)}))

@app.delete("/api/waiter-requests/{request_id}")
async def delete_waiter_request(
    request_id: str,
    user: Dict = Depends(require_permission("orders"))
):
    result = waiter_requests_col.delete_one({"_id": ObjectId(request_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"success": True, "message": "Request deleted"}

# ======================== ENHANCED CUSTOMER & STAFF STATS ========================

@app.get("/api/customers/stats")
async def get_customer_stats(user: Dict = Depends(require_permission("customers"))):
    restaurant_id = user.get("restaurant_id")
    
    customers = serialize_docs(customers_col.find({"restaurant_id": restaurant_id}))
    orders = serialize_docs(orders_col.find({"restaurant_id": restaurant_id, "status": {"$in": ["completed", "paid"]}}))
    
    total_customers = len(customers)
    customers_with_orders = len(set([o.get("customer_phone") for o in orders if o.get("customer_phone")]))
    total_revenue = sum([o.get("total", 0) for o in orders])
    
    return {
        "total": total_customers,
        "with_orders": customers_with_orders,
        "revenue": total_revenue
    }

@app.get("/api/customers/{customer_id}/orders")
async def get_customer_orders(
    customer_id: str,
    user: Dict = Depends(require_permission("customers"))
):
    customer = serialize_doc(customers_col.find_one({"_id": ObjectId(customer_id)}))
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    orders = serialize_docs(orders_col.find({"customer_phone": customer.get("phone")}).sort("created_at", -1))
    
    return {"customer": customer, "orders": orders}

@app.get("/api/staff/stats")
async def get_staff_stats(user: Dict = Depends(require_permission("staff"))):
    restaurant_id = user.get("restaurant_id")
    
    staff = serialize_docs(users_col.find({"restaurant_id": restaurant_id, "role": {"$ne": "superadmin"}}))
    
    total_staff = len(staff)
    active_staff = len([s for s in staff if s.get("status") != "inactive"])
    
    roles = {}
    for s in staff:
        role = s.get("role", "unknown")
        roles[role] = roles.get(role, 0) + 1
    
    return {
        "total": total_staff,
        "active": active_staff,
        "roles": roles
    }

    query = {}
    if user["role"] != "super_admin":
        query["restaurant_id"] = restaurant_id
    
    today_query = {**query, "created_at": {"$gte": today}}
    
    today_orders = list(orders_col.find(today_query))
    today_revenue = sum(o.get("total", 0) for o in today_orders if o.get("status") == "completed")
    active_orders = orders_col.count_documents({**query, "status": {"$in": ["pending", "preparing"]}})
    today_reservations = reservations_col.count_documents({**query, "date": today.strftime("%Y-%m-%d")})
    active_staff = users_col.count_documents({**query, "active": True}) if restaurant_id else 0
    
    return {
        "todayRevenue": today_revenue,
        "activeOrders": active_orders,
        "todayReservations": today_reservations,
        "activeStaff": active_staff,
        "totalOrders": len(today_orders)
    }

# ======================== ROLES INFO ========================

@app.get("/api/roles")
async def get_roles(user: Dict = Depends(get_current_user)):
    roles_list = []
    for key, value in ROLES.items():
        roles_list.append({"key": key, **value, "permissions": PERMISSIONS.get(key, [])})
    return roles_list

# ======================== ACTIVITY LOGS ========================

@app.get("/api/activity-logs")
async def get_activity_logs(limit: int = Query(default=50, le=200), user: Dict = Depends(require_permission("reports"))):
    return serialize_docs(activity_logs_col.find().sort("timestamp", -1).limit(limit))

# ======================== STRIPE PAYMENT INTEGRATION ========================

class PaymentRequest(BaseModel):
    order_id: str
    origin_url: str

class PaymentStatusRequest(BaseModel):
    session_id: str

@app.post("/api/payments/checkout")
async def create_checkout_session(request: Request, data: PaymentRequest, user: Dict = Depends(get_current_user)):
    """Create Stripe checkout session for an order"""
    # Get the order
    order = orders_col.find_one({"_id": ObjectId(data.order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Get amount from the order (server-side, not from frontend)
    amount = float(order.get("total", 0))
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid order amount")
    
    # Initialize Stripe
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Build URLs from provided origin
    success_url = f"{data.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{data.origin_url}/pos"
    
    # Create checkout session
    checkout_request = CheckoutSessionRequest(
        amount=amount,
        currency="inr",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": data.order_id,
            "order_number": order.get("orderNumber", ""),
            "user_id": user.get("id", ""),
            "restaurant_id": user.get("restaurant_id", "")
        }
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record BEFORE redirect
    payment_transaction = {
        "session_id": session.session_id,
        "order_id": data.order_id,
        "order_number": order.get("orderNumber", ""),
        "amount": amount,
        "currency": "inr",
        "user_id": user.get("id"),
        "restaurant_id": user.get("restaurant_id"),
        "payment_status": "initiated",
        "status": "pending",
        "created_at": datetime.now(timezone.utc)
    }
    payment_transactions_col.insert_one(payment_transaction)
    
    return {"url": session.url, "session_id": session.session_id}

@app.get("/api/payments/status/{session_id}")
async def get_payment_status(request: Request, session_id: str, user: Dict = Depends(get_current_user)):
    """Get payment status for a checkout session"""
    # Check if already processed
    transaction = payment_transactions_col.find_one({"session_id": session_id})
    if transaction and transaction.get("payment_status") == "paid":
        return serialize_doc(transaction)
    
    # Initialize Stripe and check status
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction status
    new_status = checkout_status.payment_status
    update_data = {
        "payment_status": new_status,
        "status": checkout_status.status,
        "updated_at": datetime.now(timezone.utc)
    }
    
    # If paid, update the order status
    if new_status == "paid" and transaction:
        # Prevent duplicate processing
        if transaction.get("payment_status") != "paid":
            # Update order to completed
            orders_col.update_one(
                {"_id": ObjectId(transaction.get("order_id"))},
                {"$set": {"status": "completed", "paymentStatus": "paid", "updated_at": datetime.now(timezone.utc)}}
            )
            
            # Broadcast payment success via WebSocket
            restaurant_id = transaction.get("restaurant_id")
            if restaurant_id:
                asyncio.create_task(manager.broadcast_to_restaurant(restaurant_id, {
                    "type": "PAYMENT_SUCCESS",
                    "data": {"order_id": transaction.get("order_id"), "session_id": session_id}
                }))
    
    payment_transactions_col.update_one(
        {"session_id": session_id},
        {"$set": update_data}
    )
    
    updated_transaction = payment_transactions_col.find_one({"session_id": session_id})
    return serialize_doc(updated_transaction) if updated_transaction else {"payment_status": new_status, "status": checkout_status.status}

@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction based on webhook event
        if webhook_response.session_id:
            payment_transactions_col.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": webhook_response.payment_status,
                    "webhook_event_type": webhook_response.event_type,
                    "updated_at": datetime.now(timezone.utc)
                }}
            )
            
            # If payment completed, update order
            if webhook_response.payment_status == "paid":
                transaction = payment_transactions_col.find_one({"session_id": webhook_response.session_id})
                if transaction:
                    orders_col.update_one(
                        {"_id": ObjectId(transaction.get("order_id"))},
                        {"$set": {"status": "completed", "paymentStatus": "paid"}}
                    )
        
        return {"status": "success"}
    except Exception as e:
        print(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

# ======================== KOT (KITCHEN ORDER TICKETS) ========================

class KOTCreate(BaseModel):
    order_id: str
    items: List[Dict]
    priority: str = "normal"
    notes: Optional[str] = None

@app.get("/api/kot")
async def get_kot_items(status: Optional[str] = None, user: Dict = Depends(require_permission("kot"))):
    """Get KOT items for kitchen display"""
    restaurant_id = user.get("restaurant_id")
    query = {}
    
    if user["role"] != "super_admin":
        query["restaurant_id"] = restaurant_id
    
    if status:
        query["status"] = status
    else:
        query["status"] = {"$in": ["pending", "preparing"]}
    
    kots = serialize_docs(kot_col.find(query).sort("created_at", 1))
    return kots

@app.post("/api/kot")
async def create_kot(data: KOTCreate, user: Dict = Depends(require_permission("orders"))):
    """Create a new KOT ticket"""
    restaurant_id = user.get("restaurant_id")
    
    kot = {
        "order_id": data.order_id,
        "items": data.items,
        "priority": data.priority,
        "notes": data.notes,
        "status": "pending",
        "restaurant_id": restaurant_id,
        "created_by": user.get("id"),
        "created_at": datetime.now(timezone.utc)
    }
    result = kot_col.insert_one(kot)
    
    kot_data = serialize_doc(kot_col.find_one({"_id": result.inserted_id}))
    
    # Broadcast new KOT to kitchen
    if restaurant_id:
        asyncio.create_task(manager.broadcast_to_restaurant(restaurant_id, {
            "type": "NEW_KOT",
            "data": kot_data
        }))
    
    return kot_data

@app.put("/api/kot/{kot_id}/status")
async def update_kot_status(kot_id: str, data: Dict[str, str], user: Dict = Depends(require_permission("kot"))):
    """Update KOT status (pending -> preparing -> ready -> served)"""
    status = data.get("status")
    valid_statuses = ["pending", "preparing", "ready", "served", "cancelled"]
    
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    update_data = {"status": status, "updated_at": datetime.now(timezone.utc)}
    
    if status == "preparing":
        update_data["started_at"] = datetime.now(timezone.utc)
        update_data["started_by"] = user.get("id")
    elif status == "ready":
        update_data["completed_at"] = datetime.now(timezone.utc)
        update_data["completed_by"] = user.get("id")
    
    kot_col.update_one({"_id": ObjectId(kot_id)}, {"$set": update_data})
    
    kot_data = serialize_doc(kot_col.find_one({"_id": ObjectId(kot_id)}))
    
    # Broadcast KOT status update
    restaurant_id = user.get("restaurant_id")
    if restaurant_id:
        asyncio.create_task(manager.broadcast_to_restaurant(restaurant_id, {
            "type": "KOT_STATUS_UPDATE",
            "data": kot_data
        }))
    
    return kot_data

# ======================== RECEIPT GENERATION ========================

@app.get("/api/orders/{order_id}/receipt")
async def get_order_receipt(order_id: str, user: Dict = Depends(require_permission("orders"))):
    """Generate receipt data for an order"""
    order = orders_col.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    restaurant_id = user.get("restaurant_id")
    restaurant = restaurants_col.find_one({"_id": ObjectId(restaurant_id)}) if restaurant_id else None
    
    receipt = {
        "restaurant": {
            "name": restaurant.get("name", "Bhojpe Restaurant") if restaurant else "Bhojpe Restaurant",
            "address": restaurant.get("address", "") if restaurant else "",
            "phone": restaurant.get("phone", "") if restaurant else "",
            "gstin": restaurant.get("gstin", "") if restaurant else ""
        },
        "order": {
            "number": order.get("orderNumber", ""),
            "type": order.get("orderType", "dine"),
            "table": order.get("tableNo", ""),
            "date": order.get("created_at", datetime.now(timezone.utc)).isoformat() if isinstance(order.get("created_at"), datetime) else order.get("created_at", ""),
            "waiter": order.get("waiter", ""),
            "customer": order.get("customerName", "Walk-in")
        },
        "items": order.get("items", []),
        "summary": {
            "subtotal": order.get("subtotal", 0),
            "tax": order.get("tax", 0),
            "total": order.get("total", 0),
            "payment_method": order.get("paymentMethod", "cash"),
            "payment_status": order.get("paymentStatus", "pending")
        },
        "footer": {
            "message": "Thank you for dining with us!",
            "generated_at": datetime.now(timezone.utc).isoformat()
        }
    }
    
    return receipt

# ======================== TABLE MERGE & MANAGEMENT ========================

class TableMergeRequest(BaseModel):
    source_table_ids: List[str]
    target_table_id: str

class KOTMoveRequest(BaseModel):
    kot_id: str
    source_table_id: str
    target_table_id: str

class BillSplitRequest(BaseModel):
    order_id: str
    splits: List[Dict]  # [{"items": [item_ids], "payment_method": "cash"}]

@app.post("/api/tables/merge")
async def merge_tables(data: TableMergeRequest, user: Dict = Depends(require_permission("pos"))):
    """Merge multiple tables into one"""
    restaurant_id = user.get("restaurant_id")
    
    # Get target table
    target_table = tables_col.find_one({"_id": ObjectId(data.target_table_id)})
    if not target_table:
        raise HTTPException(status_code=404, detail="Target table not found")
    
    # Get source tables
    source_tables = list(tables_col.find({
        "_id": {"$in": [ObjectId(tid) for tid in data.source_table_ids]}
    }))
    
    if len(source_tables) != len(data.source_table_ids):
        raise HTTPException(status_code=404, detail="Some source tables not found")
    
    # Collect all orders from source tables
    merged_orders = []
    total_items = 0
    total_amount = 0
    
    for table in source_tables:
        # Find active orders for this table
        table_orders = list(orders_col.find({
            "tableNo": table.get("name"),
            "restaurant_id": restaurant_id,
            "status": {"$in": ["pending", "preparing"]}
        }))
        for order in table_orders:
            merged_orders.append(order)
            total_items += len(order.get("items", []))
            total_amount += order.get("total", 0)
        
        # Update orders to point to target table
        orders_col.update_many(
            {"tableNo": table.get("name"), "restaurant_id": restaurant_id, "status": {"$in": ["pending", "preparing"]}},
            {"$set": {"tableNo": target_table.get("name"), "mergedFrom": table.get("name"), "updated_at": datetime.now(timezone.utc)}}
        )
        
        # Mark source table as available
        tables_col.update_one(
            {"_id": table["_id"]},
            {"$set": {"status": "available", "guestCount": 0, "mergedInto": data.target_table_id, "updated_at": datetime.now(timezone.utc)}}
        )
    
    # Update target table
    tables_col.update_one(
        {"_id": ObjectId(data.target_table_id)},
        {"$set": {
            "status": "occupied",
            "mergedTables": data.source_table_ids,
            "itemCount": total_items,
            "orderAmount": total_amount,
            "updated_at": datetime.now(timezone.utc)
        }}
    )
    
    # Broadcast update via WebSocket
    if restaurant_id:
        asyncio.create_task(manager.broadcast_to_restaurant(restaurant_id, {
            "type": "TABLE_MERGE",
            "data": {
                "target_table_id": data.target_table_id,
                "source_table_ids": data.source_table_ids
            }
        }))
    
    activity_logs_col.insert_one({
        "user_id": user["id"],
        "action": "TABLE_MERGE",
        "description": f"Merged tables {[t.get('name') for t in source_tables]} into {target_table.get('name')}",
        "module": "tables",
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {"success": True, "merged_tables": len(source_tables), "target_table": target_table.get("name")}

@app.post("/api/tables/unmerge/{table_id}")
async def unmerge_table(table_id: str, user: Dict = Depends(require_permission("pos"))):
    """Unmerge a table - restore original tables"""
    table = tables_col.find_one({"_id": ObjectId(table_id)})
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    merged_tables = table.get("mergedTables", [])
    if not merged_tables:
        raise HTTPException(status_code=400, detail="Table is not merged")
    
    # Restore merged tables
    for tid in merged_tables:
        tables_col.update_one(
            {"_id": ObjectId(tid)},
            {"$unset": {"mergedInto": ""}, "$set": {"status": "available", "updated_at": datetime.now(timezone.utc)}}
        )
    
    # Clear merge info from target table
    tables_col.update_one(
        {"_id": ObjectId(table_id)},
        {"$unset": {"mergedTables": ""}, "$set": {"updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"success": True, "unmerged_tables": len(merged_tables)}

@app.post("/api/kot/move")
async def move_kot(data: KOTMoveRequest, user: Dict = Depends(require_permission("kot"))):
    """Move KOT items from one table to another"""
    restaurant_id = user.get("restaurant_id")
    
    # Get KOT
    kot = kot_col.find_one({"_id": ObjectId(data.kot_id)})
    if not kot:
        raise HTTPException(status_code=404, detail="KOT not found")
    
    # Get source and target tables
    source_table = tables_col.find_one({"_id": ObjectId(data.source_table_id)})
    target_table = tables_col.find_one({"_id": ObjectId(data.target_table_id)})
    
    if not source_table or not target_table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    # Update KOT with new table reference
    kot_col.update_one(
        {"_id": ObjectId(data.kot_id)},
        {"$set": {
            "tableNo": target_table.get("name"),
            "movedFrom": source_table.get("name"),
            "moved_by": user.get("id"),
            "moved_at": datetime.now(timezone.utc)
        }}
    )
    
    # Update associated order if exists
    if kot.get("order_id"):
        orders_col.update_one(
            {"_id": ObjectId(kot["order_id"])},
            {"$set": {"tableNo": target_table.get("name"), "updated_at": datetime.now(timezone.utc)}}
        )
    
    # Broadcast via WebSocket
    if restaurant_id:
        asyncio.create_task(manager.broadcast_to_restaurant(restaurant_id, {
            "type": "KOT_MOVED",
            "data": {
                "kot_id": data.kot_id,
                "from_table": source_table.get("name"),
                "to_table": target_table.get("name")
            }
        }))
    
    return {"success": True, "kot_id": data.kot_id, "moved_to": target_table.get("name")}

@app.post("/api/orders/{order_id}/split")
async def split_bill(order_id: str, data: BillSplitRequest, user: Dict = Depends(require_permission("orders"))):
    """Split bill into multiple payments"""
    order = orders_col.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    restaurant_id = user.get("restaurant_id")
    splits_created = []
    
    for idx, split in enumerate(data.splits):
        # Calculate split amount
        split_items = [item for item in order.get("items", []) if item.get("id") in split.get("items", [])]
        split_subtotal = sum(item.get("price", 0) * item.get("qty", 1) for item in split_items)
        split_tax = split_subtotal * 0.05
        split_total = split_subtotal + split_tax
        
        # Create split order
        split_order = {
            "orderNumber": f"{order.get('orderNumber')}-{idx + 1}",
            "originalOrderId": order_id,
            "items": split_items,
            "orderType": order.get("orderType"),
            "tableNo": order.get("tableNo"),
            "subtotal": split_subtotal,
            "tax": split_tax,
            "total": split_total,
            "paymentMethod": split.get("payment_method", "cash"),
            "status": "pending",
            "isSplit": True,
            "splitIndex": idx + 1,
            "restaurant_id": restaurant_id,
            "waiter": user.get("name"),
            "created_at": datetime.now(timezone.utc)
        }
        result = orders_col.insert_one(split_order)
        splits_created.append({
            "id": str(result.inserted_id),
            "order_number": split_order["orderNumber"],
            "total": split_total,
            "items_count": len(split_items)
        })
    
    # Mark original order as split
    orders_col.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": "split", "splitInto": [s["id"] for s in splits_created], "updated_at": datetime.now(timezone.utc)}}
    )
    
    activity_logs_col.insert_one({
        "user_id": user["id"],
        "action": "BILL_SPLIT",
        "description": f"Split order {order.get('orderNumber')} into {len(splits_created)} parts",
        "module": "orders",
        "timestamp": datetime.now(timezone.utc)
    })
    
    return {"success": True, "splits": splits_created}

# ======================== TABLE QUICK VIEW ========================

@app.get("/api/tables/{table_id}/details")
async def get_table_details(table_id: str, user: Dict = Depends(require_permission("pos"))):
    """Get detailed info for a table including active orders and KOTs"""
    table = tables_col.find_one({"_id": ObjectId(table_id)})
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    
    table_name = table.get("name")
    restaurant_id = user.get("restaurant_id")
    
    # Get active orders for this table
    orders = list(orders_col.find({
        "tableNo": table_name,
        "restaurant_id": restaurant_id,
        "status": {"$in": ["pending", "preparing", "ready"]}
    }).sort("created_at", -1))
    
    # Get active KOTs for this table
    kots = list(kot_col.find({
        "restaurant_id": restaurant_id,
        "status": {"$in": ["pending", "preparing"]}
    }))
    # Filter KOTs that belong to orders on this table
    order_ids = [str(o["_id"]) for o in orders]
    table_kots = [k for k in kots if k.get("order_id") in order_ids]
    
    # Calculate totals
    total_items = sum(len(o.get("items", [])) for o in orders)
    total_amount = sum(o.get("total", 0) for o in orders)
    
    # Get elapsed time since first order
    first_order_time = min((o.get("created_at") for o in orders), default=None)
    elapsed_minutes = 0
    if first_order_time:
        if isinstance(first_order_time, datetime):
            elapsed_minutes = int((datetime.now(timezone.utc) - first_order_time.replace(tzinfo=timezone.utc)).total_seconds() / 60)
    
    return {
        "table": serialize_doc(table),
        "orders": serialize_docs(orders),
        "kots": serialize_docs(table_kots),
        "summary": {
            "total_items": total_items,
            "total_amount": total_amount,
            "elapsed_minutes": elapsed_minutes,
            "orders_count": len(orders),
            "pending_kots": len([k for k in table_kots if k.get("status") == "pending"])
        }
    }

# ======================== THERMAL PRINTER / ESC-POS ========================

@app.get("/api/orders/{order_id}/print-data")
async def get_print_data(order_id: str, print_type: str = "receipt", user: Dict = Depends(require_permission("orders"))):
    """
    Get ESC/POS formatted print data for thermal printers
    print_type: 'receipt', 'kot', or 'bill'
    """
    order = orders_col.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    restaurant_id = user.get("restaurant_id")
    restaurant = restaurants_col.find_one({"_id": ObjectId(restaurant_id)}) if restaurant_id else None
    
    # ESC/POS commands
    ESC = chr(27)
    GS = chr(29)
    
    # Commands dictionary
    commands = {
        "init": ESC + "@",  # Initialize printer
        "cut": GS + "V" + chr(66) + chr(0),  # Paper cut
        "center": ESC + "a" + chr(1),  # Center alignment
        "left": ESC + "a" + chr(0),  # Left alignment
        "right": ESC + "a" + chr(2),  # Right alignment
        "bold_on": ESC + "E" + chr(1),  # Bold on
        "bold_off": ESC + "E" + chr(0),  # Bold off
        "double_height": ESC + "!" + chr(16),  # Double height
        "normal": ESC + "!" + chr(0),  # Normal text
        "line": "-" * 32 + "\n",
        "double_line": "=" * 32 + "\n",
    }
    
    lines = []
    
    if print_type == "receipt":
        # Header
        lines.append(commands["center"])
        lines.append(commands["bold_on"])
        lines.append(commands["double_height"])
        lines.append((restaurant.get("name", "Bhojpe Restaurant") if restaurant else "Bhojpe Restaurant") + "\n")
        lines.append(commands["normal"])
        lines.append(commands["bold_off"])
        if restaurant and restaurant.get("address"):
            lines.append(restaurant.get("address") + "\n")
        if restaurant and restaurant.get("phone"):
            lines.append("Tel: " + restaurant.get("phone") + "\n")
        lines.append(commands["double_line"])
        
        # Order info
        lines.append(commands["left"])
        lines.append(f"Order: {order.get('orderNumber', '')}\n")
        lines.append(f"Date: {datetime.now().strftime('%d/%m/%Y %H:%M')}\n")
        lines.append(f"Type: {order.get('orderType', 'dine').upper()}\n")
        if order.get("tableNo"):
            lines.append(f"Table: {order.get('tableNo')}\n")
        lines.append(commands["line"])
        
        # Items
        lines.append(commands["bold_on"])
        lines.append(f"{'ITEM':<18}{'QTY':>4}{'AMT':>10}\n")
        lines.append(commands["bold_off"])
        lines.append(commands["line"])
        
        for item in order.get("items", []):
            name = item.get("name", "")[:18]
            qty = item.get("qty", 1)
            amt = item.get("price", 0) * qty
            lines.append(f"{name:<18}{qty:>4}{amt:>10.2f}\n")
        
        lines.append(commands["line"])
        
        # Totals
        subtotal = order.get("subtotal", 0)
        tax = order.get("tax", 0)
        total = order.get("total", 0)
        
        lines.append(f"{'Subtotal:':<22}{subtotal:>10.2f}\n")
        lines.append(f"{'Tax (GST):':<22}{tax:>10.2f}\n")
        lines.append(commands["double_line"])
        lines.append(commands["bold_on"])
        lines.append(commands["double_height"])
        lines.append(f"{'TOTAL:':<22}{total:>10.2f}\n")
        lines.append(commands["normal"])
        lines.append(commands["bold_off"])
        
        # Footer
        lines.append(commands["line"])
        lines.append(commands["center"])
        lines.append("Thank you for dining with us!\n")
        lines.append("Powered by Bhojpe POS\n")
        lines.append("\n\n\n")
        lines.append(commands["cut"])
    
    elif print_type == "kot":
        # KOT Header
        lines.append(commands["center"])
        lines.append(commands["bold_on"])
        lines.append(commands["double_height"])
        lines.append("*** KOT ***\n")
        lines.append(commands["normal"])
        lines.append(commands["bold_off"])
        lines.append(commands["double_line"])
        
        lines.append(commands["left"])
        lines.append(f"Order: {order.get('orderNumber', '')}\n")
        lines.append(f"Table: {order.get('tableNo', 'N/A')}\n")
        lines.append(f"Time: {datetime.now().strftime('%H:%M')}\n")
        lines.append(f"Waiter: {order.get('waiter', '')}\n")
        lines.append(commands["double_line"])
        
        # Items (larger font for kitchen)
        for item in order.get("items", []):
            lines.append(commands["bold_on"])
            lines.append(commands["double_height"])
            lines.append(f"{item.get('qty', 1)}x {item.get('name', '')}\n")
            lines.append(commands["normal"])
            lines.append(commands["bold_off"])
            if item.get("note"):
                lines.append(f"   Note: {item.get('note')}\n")
        
        if order.get("note"):
            lines.append(commands["line"])
            lines.append(f"ORDER NOTE: {order.get('note')}\n")
        
        lines.append("\n\n\n")
        lines.append(commands["cut"])
    
    return {
        "print_type": print_type,
        "order_number": order.get("orderNumber"),
        "raw_commands": "".join(lines),
        "lines": lines,
        "encoding": "utf-8"
    }

# ======================== HEALTH CHECK ========================

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat(), "version": "1.0.0"}

@app.on_event("startup")
async def startup_event():
    init_database()
    print("Bhojpe POS Backend started successfully!")
    print("Demo credentials:")
    print("  Super Admin: superadmin / admin123")
    print("  Admin: admin / demo123")
    print("  Manager: manager / demo123")
    print("  Cashier: cashier / demo123")
    print("  Waiter: waiter / demo123")
    print("  Chef: chef / demo123")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
