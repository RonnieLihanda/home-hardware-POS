import pandas as pd
import os

DB_FILE = "hardware_pos_data.xlsx"

def initialize_db(force=False):
    if os.path.exists(DB_FILE) and not force:
        print(f"{DB_FILE} already exists.")
        return

    # Sheet 1: Inventory
    inventory_columns = [
        "Item Code", "Item Name", "Category", "Unit of Measure", 
        "Quantity in Stock", "Reorder Level", "Cost Price", 
        "Selling Price", "Supplier Name", "Last Restocked Date", "Location/Shelf Number"
    ]
    
    # Sheet 2: Sales
    sales_columns = [
        "Sale ID", "Date & Time", "Item Code", "Item Name", 
        "Quantity Sold", "Unit Selling Price", "Total Sale Amount", 
        "Payment Method", "Customer Name", "Customer Phone", "Served By"
    ]
    
    # Sheet 3: Purchases
    purchases_columns = [
        "Purchase ID", "Date & Time", "Item Code", "Item Name", 
        "Quantity Bought", "Unit Cost Price", "Total Purchase Amount", 
        "Supplier Name", "Invoice Number", "Payment Method", "Received By"
    ]
    
    # Sheet 4: Daily Summary
    summary_columns = [
        "Date", "Total Sales", "Total Purchases", "Daily Profit/Loss", 
        "Number of Transactions", "Cash in Hand", "M-Pesa Transactions"
    ]

    with pd.ExcelWriter(DB_FILE, engine="openpyxl") as writer:
        # Sample Inventory Data
        sample_inventory = [
            ["C001", "Bamburi Cement (50kg)", "Cement", "bags", 100, 20, 850, 950, "Bamburi Cement Ltd", "2024-01-01", "Shelf A1"],
            ["P001", "Crown Paints High Gloss (4L)", "Paint", "tins", 50, 10, 2200, 2600, "Crown Paints", "2024-01-05", "Shelf B2"],
            ["T001", "Steel Hammer (1.5kg)", "Tools", "pieces", 25, 5, 800, 1100, "General Hardware Suppliers", "2024-01-10", "Shelf C3"],
            ["Pl01", "PVC Pipe 1/2 inch (6m)", "Plumbing", "pieces", 80, 15, 350, 480, "Plumbing World", "2024-01-12", "Shelf D4"]
        ]
        inventory_df = pd.DataFrame(sample_inventory, columns=inventory_columns)
        inventory_df.to_excel(writer, sheet_name="Inventory", index=False)
        
        pd.DataFrame(columns=sales_columns).to_excel(writer, sheet_name="Sales", index=False)
        pd.DataFrame(columns=purchases_columns).to_excel(writer, sheet_name="Purchases", index=False)
        pd.DataFrame(columns=summary_columns).to_excel(writer, sheet_name="Daily Summary", index=False)

    print(f"Created {DB_FILE} with required sheets.")

if __name__ == "__main__":
    initialize_db(force=True)
