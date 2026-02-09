from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class InventoryItem(BaseModel):
    item_code: str
    item_name: str
    category: str
    unit_of_measure: str
    quantity_in_stock: float
    reorder_level: float
    cost_price: float
    selling_price: float
    supplier_name: Optional[str] = None
    last_restocked_date: Optional[str] = None
    location_shelf_number: Optional[str] = None

class CartItem(BaseModel):
    item_code: str
    item_name: str
    quantity: float
    unit_price: float
    total: float

class SaleTransaction(BaseModel):
    items: List[CartItem]
    payment_method: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    served_by: str
    discount: Optional[float] = 0

class PurchaseTransaction(BaseModel):
    item_code: str
    item_name: str
    quantity: float
    unit_cost: float
    supplier_name: str
    invoice_number: str
    payment_method: str
    received_by: str
