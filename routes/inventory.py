from fastapi import APIRouter, HTTPException
from database import ExcelDB
from models import InventoryItem
import pandas as pd

router = APIRouter(prefix="/api/inventory", tags=["inventory"])

@router.get("/")
def get_inventory():
    df = ExcelDB.get_inventory()
    # Convert empty/NaN to None for JSON visibility
    df = df.where(pd.notnull(df), None)
    return df.to_dict(orient="records")

@router.post("/")
def add_item(item: InventoryItem):
    df = ExcelDB.get_inventory()
    if str(item.item_code) in df["Item Code"].astype(str).values:
        raise HTTPException(status_code=400, detail="Item code already exists")
    
    new_item_row = {
        "Item Code": item.item_code,
        "Item Name": item.item_name,
        "Category": item.category,
        "Unit of Measure": item.unit_of_measure,
        "Quantity in Stock": item.quantity_in_stock,
        "Reorder Level": item.reorder_level,
        "Cost Price": item.cost_price,
        "Selling Price": item.selling_price,
        "Supplier Name": item.supplier_name,
        "Last Restocked Date": item.last_restocked_date,
        "Location/Shelf Number": item.location_shelf_number
    }
    
    df = pd.concat([df, pd.DataFrame([new_item_row])], ignore_index=True)
    ExcelDB.update_inventory(df)
    return {"message": "Item added successfully"}

@router.put("/{item_code}")
def update_item(item_code: str, item: InventoryItem):
    df = ExcelDB.get_inventory()
    if str(item_code) not in df["Item Code"].astype(str).values:
        raise HTTPException(status_code=404, detail="Item not found")
    
    idx = df.index[df["Item Code"].astype(str) == str(item_code)][0]
    df.at[idx, "Item Name"] = item.item_name
    df.at[idx, "Category"] = item.category
    df.at[idx, "Unit of Measure"] = item.unit_of_measure
    df.at[idx, "Quantity in Stock"] = item.quantity_in_stock
    df.at[idx, "Reorder Level"] = item.reorder_level
    df.at[idx, "Cost Price"] = item.cost_price
    df.at[idx, "Selling Price"] = item.selling_price
    df.at[idx, "Supplier Name"] = item.supplier_name
    df.at[idx, "Last Restocked Date"] = item.last_restocked_date
    df.at[idx, "Location/Shelf Number"] = item.location_shelf_number
    
    ExcelDB.update_inventory(df)
    return {"message": "Item updated successfully"}

@router.delete("/{item_code}")
def delete_item(item_code: str):
    df = ExcelDB.get_inventory()
    if item_code not in df["Item Code"].values:
        raise HTTPException(status_code=404, detail="Item not found")
    
    df = df[df["Item Code"].astype(str) != str(item_code)]
    ExcelDB.update_inventory(df)
    return {"message": "Item deleted successfully"}
