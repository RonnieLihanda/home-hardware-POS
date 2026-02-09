import pandas as pd
from database import DB_FILE, ExcelDB
import os

def check_db():
    print(f"Checking DB_FILE: {DB_FILE}")
    if not os.path.exists(DB_FILE):
        print("DB File does not exist!")
        return

    try:
        df = ExcelDB.get_inventory()
        print("\nCurrent Inventory from Cache/File:")
        print(df.head())
        
        # Test write
        print("\nTesting Write Operation...")
        # Create a tiny dummy change
        df_copy = df.copy()
        ExcelDB.update_inventory(df_copy)
        print("Write Operation Success (Update Cache & Disk)")
        
    except Exception as e:
        print(f"Error during check: {e}")

if __name__ == "__main__":
    check_db()
