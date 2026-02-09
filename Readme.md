# Hardware POS | Modern Retail Management

A premium, modern Point of Sale (POS) system designed for hardware shops and retail businesses. Built with FastAPI, Pandas, and a high-performance glassmorphism UI.

## 🚀 Features
- **Modern POS Interface**: Efficient side-by-side layout with grid-based item selection.
- **Inventory Management**: Full CRUD operations with low-stock alerts and category filtering.
- **Purchases & Sales Tracking**: Real-time updates and historical reporting.
- **Excel Database**: Zero-configuration persistence using localized Excel files.
- **Real-time Synchronization**: Dashboard and inventory state stay in sync across all views.

## ⚙️ Setup & Installation

1. **Clone the repository**:
   ```bash
   git clone [your-repo-url]
   cd POS
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Initialize the database** (Optional - if first run):
   ```bash
   python init_db.py
   ```

4. **Run the application**:
   ```bash
   python main.py
   ```
   Open [http://localhost:8000](http://localhost:8000) in your browser.

## 🛠 Tech Stack
- **Backend**: FastAPI (Python)
- **Data Engine**: Pandas + Openpyxl
- **Frontend**: Vanilla JS + Modern CSS (Glassmorphism)
- **Icons**: Lucide Icons

## 📝 Usage Notes
- Ensure the `hardware_pos_data.xlsx` file is **closed** in Excel before performing save or delete operations in the POS.
- The system uses a memory cache for performance, synced automatically with the Excel file on every mutation.

Developed with ❤️ for Modern Retail.