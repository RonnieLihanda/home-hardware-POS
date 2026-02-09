from fastapi import APIRouter
from database import ExcelDB
import pandas as pd
from datetime import datetime

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("/summary")
def get_dashboard_summary():
    inventory_df = ExcelDB.get_inventory()
    sales_df = ExcelDB.get_sales()
    purchases_df = ExcelDB.get_purchases()
    
    total_sales = sales_df["Total Sale Amount"].sum() if not sales_df.empty else 0
    total_purchases = purchases_df["Total Purchase Amount"].sum() if not purchases_df.empty else 0
    
    inventory_value_cost = (inventory_df["Quantity in Stock"] * inventory_df["Cost Price"]).sum()
    inventory_value_selling = (inventory_df["Quantity in Stock"] * inventory_df["Selling Price"]).sum()
    
    low_stock_items = inventory_df[inventory_df["Quantity in Stock"] <= inventory_df["Reorder Level"]]
    out_of_stock_items = inventory_df[inventory_df["Quantity in Stock"] == 0]
    
    # Today's Sales
    today_str = datetime.now().strftime("%d/%m/%Y")
    # Note: Date & Time format in sales is "DD/MM/YYYY HH:MM:S"
    today_sales_mask = sales_df["Date & Time"].str.startswith(today_str) if not sales_df.empty else pd.Series([False])
    today_sales_df = sales_df[today_sales_mask]
    today_sales_total = today_sales_df["Total Sale Amount"].sum() if not today_sales_df.empty else 0
    today_transactions_count = len(today_sales_df["Sale ID"].unique()) if not today_sales_df.empty else 0

    return {
        "today": {
            "total_sales": float(today_sales_total),
            "transactions": int(today_transactions_count)
        },
        "inventory": {
            "total_items": int(len(inventory_df)),
            "low_stock_count": int(len(low_stock_items)),
            "out_of_stock_count": int(len(out_of_stock_items)),
            "total_value_cost": float(inventory_value_cost),
            "total_value_selling": float(inventory_value_selling)
        },
        "overall": {
            "total_sales": float(total_sales),
            "total_purchases": float(total_purchases)
        }
    }

@router.get("/daily-summary")
def get_daily_summaries():
    df = ExcelDB.get_daily_summary()
    df = df.where(pd.notnull(df), None)
    return df.to_dict(orient="records")
