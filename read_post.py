import random
import snap7
from snap7.util import get_int, get_real, get_bool, set_int, set_real, set_bool
import pyodbc
import time
from datetime import datetime

# ---- Configuration ----
PLC_IP = '192.168.0.1'

TABLE = 'DemoValues'
# Database connection string
conn_str = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=UAPR206-PC\\SQLEXPRESS;"  # Update with your SQL Server name
    "DATABASE=DemoPLCData;"
    "Trusted_Connection=yes;"
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

# ---- Connect to PLC ----
def connect_plc(ip):
    plc = snap7.client.Client()
    plc.connect(ip, 0, 1)
    print("✅ Connected to Siemens PLC")
    return plc

# ---- Read Functions ----
def read_int(plc, db, byte_index):
    data = plc.db_read(db, byte_index, 2)
    return get_int(data, 0)
# ---- Read INT values from DB ----
def read_multiple_ints(plc, db, start_byte, count):
    total_bytes = count * 2
    data = plc.db_read(db, start_byte, total_bytes)
    values = [get_int(data, i * 2) for i in range(count)]
    return values
def read_all_20_values(plc, db, start_byte=0):
    int_values = []
    real_values = []
    negative_values = []
    bool_values = []

    # Read enough bytes for everything (5*2 + 5*4 + 5*2 + 1 = 35 bytes approx)
    data = plc.db_read(db, start_byte, 40)

    offset = 0

    # Read 5 INTs
    for _ in range(5):
        int_values.append(get_int(data, offset))
        offset += 2

    # Read 5 REALs
    for _ in range(5):
        real_values.append(round(get_real(data, offset), 2))
        offset += 4

    # Read 5 Negative INTs
    for _ in range(5):
        negative_values.append(get_int(data, offset))
        offset += 2

    # Read 5 BOOLs (assuming they are packed in one byte, bits 0–4)
    bool_byte_index = offset
    for i in range(5):
        # bool_values.append(get_bool(data, bool_byte_index, i))
        bool_values.append(i%2 == 0)  # Example: just alternating True/False for demo

    return int_values, real_values, negative_values, bool_values

def read_real(plc, db, byte_index):
    data = plc.db_read(db, byte_index, 4)
    return get_real(data, 0)

def read_bool(plc, db, byte_index, bit_index):
    data = plc.db_read(db, byte_index, 1)
    return get_bool(data, 0, bit_index)

# ---- Write Function ----
def write_value(plc, db_number, byte_index, value, value_type='int', bit_index=0):
    if value_type == 'int':
        data = bytearray(2)
        set_int(data, 0, value)
        plc.db_write(db_number, byte_index, data)

    elif value_type == 'real':
        data = bytearray(4)
        set_real(data, 0, value)
        plc.db_write(db_number, byte_index, data)

    elif value_type == 'bool':
        data = plc.db_read(db_number, byte_index, 1)  # Read the current byte
        set_bool(data, 0, bit_index, value)
        plc.db_write(db_number, byte_index, data)

    print(f"✅ Wrote {value_type.upper()} value '{value}' to DB{db_number}, byte {byte_index}")

def write_20_random_values(plc):
    db_number = 2  # Example DB number
    byte_index = 0  # Start at byte 0

    # 1. Write 5 random positive integers
    for _ in range(5):
        value = random.randint(10, 100)
        write_value(plc, db_number, byte_index, value, 'int')
        byte_index += 2  # Integers use 2 bytes

    # 2. Write 5 random floats
    for _ in range(5):
        value = round(random.uniform(10.0, 99.9), 2)
        write_value(plc, db_number, byte_index, value, 'real')
        byte_index += 4  # Floats (REAL) use 4 bytes

    # 3. Write 5 random negative integers
    for _ in range(5):
        value = random.randint(-100, -1)
        write_value(plc, db_number, byte_index, value, 'int')
        byte_index += 4

    # 4. Write 5 random boolean values
    for i in range(5):
        value = random.choice([True, False])
        write_value(plc, db_number, byte_index, value, 'bool', bit_index=i)
        # You may want to increment byte_index after 8 bits (1 byte), optional here
    print("✅ Finished writing all 20 values")
def insert_values_to_db(values_tuple):
    int_values, real_values, neg_values, bool_values = values_tuple
    try:
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()

        query = """
        INSERT INTO DemoValuesdiff (
            Int1, Int2, Int3, Int4, Int5,
            Real1, Real2, Real3, Real4, Real5,
            Neg1, Neg2, Neg3, Neg4, Neg5,
            Bool1, Bool2, Bool3, Bool4, Bool5
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """

        all_values = int_values + real_values + neg_values + bool_values
        cursor.execute(query, all_values)
        conn.commit()
        print("✅ Values inserted into SQL database")
    except Exception as e:
        print(f"❌ DB insert error: {e}")
# ---- Main Execution ----
def main():
    # plc = connect_plc(PLC_IP)
    conn, cursor = connect_sql()
    VALUE_COUNT = 20  # Number of values to read from PLC

    column_names = ', '.join([f'DemoValue{i}' for i in range(1, VALUE_COUNT + 1)] + ['RecordTime'])
    placeholders = ', '.join(['?'] * VALUE_COUNT + ['?'])
    insert_query = f"INSERT INTO {TABLE} ({column_names}) VALUES ({placeholders})"


    try:
        while True:
            # data= read_real(plc, 2, 42)
            # print("PLC Data:", data)
            # 1. Write 20 random values to PLC
            # write_20_random_values(plc)
            values = read_all_20_values(plc, db=2)
            print(values)
            insert_values_to_db(values)
            # values = read_multiple_ints(plc, 2, 2, VALUE_COUNT)
            # print("📥 PLC Data:", values)

            # current_time = datetime.now()
            # cursor.execute(insert_query, *values, current_time)
            # conn.commit()

            time.sleep(1)

    except KeyboardInterrupt:
        print("Stopped by user.")

    finally:
        # plc.disconnect()
        cursor.close()
        conn.close()
        print("Connections closed.")

if __name__ == '__main__':
    main()
