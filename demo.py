# import snap7
# from snap7.util import get_int
# import pyodbc
# import time


# # SQL_SERVER = 'CONTU2-09'
# # DATABASE = 'DemoPLCData'
# # USERNAME = 'sa'
# # PASSWORD = 'your_password'
# TABLE = 'DemoValues'
# # Database connection string
# # conn_str = (
# #     "DRIVER={ODBC Driver 17 for SQL Server};"
# #     "SERVER=CONTU2-09;"  # Update with your SQL Server name
# #     "DATABASE=DemoPLCData;"
# #     "Trusted_Connection=yes;"
# # )
# conn_str = (
#     "DRIVER={ODBC Driver 17 for SQL Server};"
#     "SERVER=192.168.1.45,1433;"  # Replace with Laptop2's IP and port
#     "DATABASE=DemoPLCData;"
#     "UID=YourUsername;"
#     "PWD=YourPassword;"
#     "Encrypt=no;"
# )


# def connect_sql():
#     try:
#         conn = pyodbc.connect(conn_str)
#         cursor = conn.cursor()
#         print("✅ Connected to SQL Server")
#         return conn, cursor
#     except Exception as e:
#         print(f"Database connection error: {e}")
#         return None, None
    

# # ---- Main Execution ----
# def main():
#     # plc = connect_plc(PLC_IP)
#     conn, cursor = connect_sql()


#     try:
#         print(conn)
#         print(cursor)
#     except KeyboardInterrupt:
#         print("🛑 Stopped by user.")

#     finally:
#         cursor.close()
#         conn.close()
#         print("🔒 Connections closed.")

# if __name__ == '__main__':
#     main()


import pyodbc

# Replace these with real credentials and IP
server_ip = '192.168.2.246'
database = 'DemoPLCData'
username = 'testuser'
password = 'CTPL123123'

conn_str = (
    f"DRIVER={{ODBC Driver 17 for SQL Server}};"
    f"SERVER={server_ip},1433;"
    f"DATABASE={database};"
    f"UID={username};"
    f"PWD={password};"
    f"Encrypt=no;"
)

try:
    conn = pyodbc.connect(conn_str)
    cursor = conn.cursor()
    cursor.execute("SELECT TOP 5 * FROM DemoValuesdiff")
    for row in cursor.fetchall():
        print(row)
except Exception as e:
    print("Connection failed:", e)
