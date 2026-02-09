import pandas as pd
import os
from datetime import datetime

DB_FILE = "hardware_pos_data.xlsx"

class ExcelDB:
    _cache = {}

    @classmethod
    def load_all_to_memory(cls):
        """Loads all sheets into memory. Run this on app startup."""
        if not os.path.exists(DB_FILE):
            return
        
        with pd.ExcelFile(DB_FILE) as xls:
            for sheet_name in xls.sheet_names:
                cls._cache[sheet_name] = pd.read_excel(xls, sheet_name=sheet_name)
        print("Excel database loaded into memory cache.")

    @classmethod
    def _read_sheet(cls, sheet_name):
        if sheet_name not in cls._cache:
            df = pd.read_excel(DB_FILE, sheet_name=sheet_name)
            # Force "Item Code" to string to prevent matching issues between numbers and text
            if "Item Code" in df.columns:
                df["Item Code"] = df["Item Code"].astype(str)
            cls._cache[sheet_name] = df
        return cls._cache[sheet_name].copy()

    @classmethod
    def _write_sheet(cls, df, sheet_name):
        # Update Cache
        cls._cache[sheet_name] = df.copy()
        
        # Persist to Disk
        try:
            with pd.ExcelWriter(DB_FILE, engine="openpyxl", mode="a", if_sheet_exists="replace") as writer:
                df.to_excel(writer, sheet_name=sheet_name, index=False)
        except PermissionError:
            from fastapi import HTTPException
            raise HTTPException(
                status_code=500, 
                detail="PERMISSION DENIED: The Excel database file is open in another program. Please close it and try again."
            )
        except Exception as e:
            from fastapi import HTTPException
            raise HTTPException(status_code=500, detail=f"Database Write Error: {str(e)}")

    @classmethod
    def get_inventory(cls):
        return cls._read_sheet("Inventory")

    @classmethod
    def update_inventory(cls, df):
        cls._write_sheet(df, "Inventory")

    @classmethod
    def get_sales(cls):
        return cls._read_sheet("Sales")

    @classmethod
    def add_sale(cls, sale_data):
        sales_df = cls.get_sales()
        new_sale = pd.DataFrame([sale_data])
        sales_df = pd.concat([sales_df, new_sale], ignore_index=True)
        cls._write_sheet(sales_df, "Sales")

    @classmethod
    def get_purchases(cls):
        return cls._read_sheet("Purchases")

    @classmethod
    def add_purchase(cls, purchase_data):
        purchases_df = cls.get_purchases()
        new_purchase = pd.DataFrame([purchase_data])
        purchases_df = pd.concat([purchases_df, new_purchase], ignore_index=True)
        cls._write_sheet(purchases_df, "Purchases")

    @classmethod
    def get_daily_summary(cls):
        return cls._read_sheet("Daily Summary")

    @classmethod
    def update_daily_summary(cls, summary_data):
        summary_df = cls.get_daily_summary()
        date_str = summary_data["Date"]
        
        if date_str in summary_df["Date"].values:
            idx = summary_df.index[summary_df["Date"] == date_str][0]
            for key, value in summary_data.items():
                summary_df.at[idx, key] = value
        else:
            summary_df = pd.concat([summary_df, pd.DataFrame([summary_data])], ignore_index=True)
        
        cls._write_sheet(summary_df, "Daily Summary")
