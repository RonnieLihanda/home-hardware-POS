from fastapi import APIRouter, HTTPException
from database import ExcelDB
from models import SaleTransaction
import pandas as pd
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/sales", tags=["sales"])

@router.post("/")
def process_sale(sale: SaleTransaction):
    inventory_df = ExcelDB.get_inventory()
    sale_id = str(uuid.uuid4())[:8].upper()
    timestamp = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    
    for item in sale.items:
        if item.item_code not in inventory_df["Item Code"].values:
            raise HTTPException(status_code=404, detail=f"Item {item.item_code} not found")
        
        idx = inventory_df.index[inventory_df["Item Code"] == item.item_code][0]
        current_stock = inventory_df.at[idx, "Quantity in Stock"]
        
        if current_stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {item.item_name}")
        
        # Update Inventory
        inventory_df.at[idx, "Quantity in Stock"] -= item.quantity
        
        # Record Sale
        sale_row = {
            "Sale ID": sale_id,
            "Date & Time": timestamp,
            "Item Code": item.item_code,
            "Item Name": item.item_name,
            "Quantity Sold": item.quantity,
            "Unit Selling Price": item.unit_price,
            "Total Sale Amount": item.total,
            "Payment Method": sale.payment_method,
            "Customer Name": sale.customer_name,
            "Customer Phone": sale.customer_phone,
            "Served By": sale.served_by
        }
        ExcelDB.add_sale(sale_row)

    ExcelDB.update_inventory(inventory_df)
    
    # Update Daily Summary (simplified logic)
    # In a real app, this would be more robust
    return {"message": "Sale processed successfully", "sale_id": sale_id}

@router.get("/")
def get_sales():
    df = ExcelDB.get_sales()
    df = df.where(pd.notnull(df), None)
    return df.to_dict(orient="records")
