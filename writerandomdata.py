import random
import snap7
from snap7.util import get_int, get_real, get_bool, set_int, set_real, set_bool
import pyodbc
import time
from datetime import datetime
import json
import numpy as np

# ---- Configuration ----
PLC_IP = '192.168.0.1'

TABLE = 'DemoValuesdiff'
# # Database connection string
# conn_str = (
#     "DRIVER={ODBC Driver 17 for SQL Server};"
#     "SERVER=CONTU2-09;"  # Update with your SQL Server name
#     "DATABASE=DemoPLCData;"
#     "Trusted_Connection=yes;"
# )

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
# ---- Connect to SQL Server ----
def connect_sql():
    try:
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        print("✅ Connected to SQL Server")
        return conn, cursor
    except Exception as e:
        print(f"Database connection error: {e}")
        return None, None
def generate_spc_data():
    # SPC values in range 0.050 to 0.490
    spc_values = [round(random.uniform(0.050, 0.490), 3) for _ in range(5)]

    # SPC_UCL values in range 0.590 to 0.790
    spc_ucl = [round(random.uniform(0.560, 0.590), 3) for _ in range(5)]

    # SPC_LCL values in range 0.010 to 0.030
    spc_lcl = [round(random.uniform(0.010, 0.030), 3) for _ in range(5)]

    # R chart: range (max - min) from SPC values
    r_value = round(max(spc_values) - min(spc_values), 3)
    r = [r_value]

    # x chart: same as SPC values
    x = spc_values.copy()

    # Histogram of SPC values
    histogram_counts, bin_edges = np.histogram(spc_values, bins=7)
    histogram = histogram_counts.tolist()

    # Normal distribution (mocked using standard normal shape)
    mean = sum(spc_values) / len(spc_values)
    std_dev = np.std(spc_values)
    normal_x = [round(mean + std_dev * i, 2) for i in range(-3, 4)]
    normal_y = [round((1 / (std_dev * (2 * 3.14)**0.5)) * 
                      (2.71828 ** (-0.5 * ((x - mean) / std_dev) ** 2)), 4) for x in normal_x]

    return {
        "SPC_values": spc_values,
        "SPC_UCL": spc_ucl,
        "SPC_LCL": spc_lcl,
        "r": r,
        "x": x,
        "histogram": histogram,
        "normal": normal_y
    }

def insert_random_data():
    conn, cursor = connect_sql()
    try:
        while True:
            spc_data = generate_spc_data()
            current_time = datetime.now()

            print("Inserting at:", current_time)
            print("SPC values:", spc_data["SPC_values"])

            insert_query = """
                INSERT INTO [DemoPLCData].[dbo].[actualvalues] (
                    Recordtime,
                    SPC_values,
                    SPC_UCL,
                    SPC_LCL,
                    r,
                    x,
                    histogram,
                    normal
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """

            # Convert list data to JSON strings
            values_to_insert = (
                current_time,
                spc_data["SPC_values"][0],
                spc_data["SPC_UCL"][0],
                spc_data["SPC_LCL"][0],
                spc_data["r"][0],
                spc_data["x"][0],
                spc_data["histogram"][0],
                spc_data["normal"][0]
            )


            cursor.execute(insert_query, values_to_insert)
            conn.commit()
            time.sleep(3)

    except Exception as e:
        print(f"❌ DB insert error: {e}")
        print("⛔️ Stopped by user.")
    finally:
        cursor.close()
        conn.close()
        print("✅ DB Connection closed.")

if __name__ == "__main__":
    insert_random_data()