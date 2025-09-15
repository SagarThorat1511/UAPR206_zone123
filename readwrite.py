import random
import snap7
from snap7.util import get_int, get_real, get_bool, set_int, set_real, set_bool
# from snap7.types import Areas
import time

# ---- PLC Configuration ----
PLC_IP = '192.168.0.1'

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


# ---- Main Execution ----
def main():
    plc = connect_plc(PLC_IP)

    try:
        while True:
            random_intdata = random.randint(0, 100)
            # Reading examples (You can change DB and byte index accordingly)
            int_val = read_int(plc, db=2, byte_index=6)
            real_val = read_real(plc, db=3, byte_index=4)
            bool_val = read_bool(plc, db=4, byte_index=8, bit_index=0)
            print(f"📥 INT: {int_val}, REAL: {real_val}, BOOL: {bool_val}")

            # # Example writing
            write_value(plc, db_number=2, byte_index=6, value=random_intdata, value_type='int')
            write_value(plc, db_number=3, byte_index=4, value=random_intdata+0.34, value_type='real')
            write_value(plc, db_number=4, byte_index=8, value=(random_intdata%2==0), value_type='bool', bit_index=0)

            time.sleep(1)

    except KeyboardInterrupt:
        print("🛑 Stopped by user.")

    finally:
        plc.disconnect()
        print("🔒 PLC Disconnected")

if __name__ == '__main__':
    main()
