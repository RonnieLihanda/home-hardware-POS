from fastapi import APIRouter, HTTPException
from database import ExcelDB
from models import PurchaseTransaction
import pandas as pd
from datetime import datetime
import uuid

router = APIRouter(prefix="/api/purchases", tags=["purchases"])

@router.post("/")
def add_purchase(purchase: PurchaseTransaction):
    inventory_df = ExcelDB.get_inventory()
    purchase_id = str(uuid.uuid4())[:8].upper()
    timestamp = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    
    if purchase.item_code not in inventory_df["Item Code"].values:
        raise HTTPException(status_code=404, detail=f"Item {purchase.item_code} not found in inventory. Please add it first.")
    
    idx = inventory_df.index[inventory_df["Item Code"] == purchase.item_code][0]
    
    # Update Inventory
    inventory_df.at[idx, "Quantity in Stock"] += purchase.quantity
    inventory_df.at[idx, "Last Restocked Date"] = datetime.now().strftime("%d/%m/%Y")
    inventory_df.at[idx, "Cost Price"] = purchase.unit_cost
    
    # Record Purchase
    purchase_row = {
        "Purchase ID": purchase_id,
        "Date & Time": timestamp,
        "Item Code": purchase.item_code,
        "Item Name": purchase.item_name,
        "Quantity Bought": purchase.quantity,
        "Unit Cost Price": purchase.unit_cost,
        "Total Purchase Amount": purchase.quantity * purchase.unit_cost,
        "Supplier Name": purchase.supplier_name,
        "Invoice Number": purchase.invoice_number,
        "Payment Method": purchase.payment_method,
        "Received By": purchase.received_by
    }
    
    ExcelDB.add_purchase(purchase_row)
    ExcelDB.update_inventory(inventory_df)
    
    return {"message": "Purchase recorded successfully", "purchase_id": purchase_id}

@router.get("/")
def get_purchases():
    df = ExcelDB.get_purchases()
    df = df.where(pd.notnull(df), None)
    return df.to_dict(orient="records")
