import threading
from flask import Flask, request, jsonify, send_from_directory, render_template
import random
import os
from datetime import datetime
import pyodbc
import numpy as np
import math
import json
from read_post import main
from writerandomdata import *


app = Flask(__name__)
# Database connection string

# Replace these with real credentials and IP
server_ip = '192.168.2.246'
database = 'DemoPLCData'
username = 'testuser'
password = 'CTPL123123'

# conn_str = (
#     f"DRIVER={{ODBC Driver 17 for SQL Server}};"
#     f"SERVER={server_ip},1433;"
#     f"DATABASE={database};"
#     f"UID={username};"
#     f"PWD={password};"
#     f"Encrypt=no;"
# )
STATION_CONFIG = {
    # Zone 1
    ("Zone1", "Primer tightening gauging station"): {
        "database": "Zone01_Report",
        "table": "Zone01_Report_Dump",
        "columns": {
            "SPC_values": "Primer_Tightening_Gauging_Station_Depth_Avg_PV",
            "SPC_UCL": "Primer_Tightening_Gauging_Station_Max_Limit_SV",
            "SPC_LCL": "Primer_Tightening_Gauging_Station_Min_Limit_SV",
            "r": "Primer_Tightening_Gauging_Station_Depth_Avg_PV",
            "x": "Primer_Tightening_Gauging_Station_Depth_Avg_PV",
            "histogram": "Primer_Tightening_Gauging_Station_Depth_Avg_PV"
        }
    },
    ("Zone1", "Primer stabbing resistance check"): {
        "database": "Zone01_Report",
        "table": "Zone01_Report_Dump",
        "columns": {
            "SPC_values": "Resistance_Checking_Station_Resistance_Value_PV",
            "SPC_UCL": "Resistance_Checking_Station_Max_Limit_SV",
            "SPC_LCL": "Resistance_Checking_Station_Min_Limit_SV",
            "r": "Resistance_Checking_Station_Resistance_Value_PV",
            "x": "Resistance_Checking_Station_Resistance_Value_PV",
            "histogram": "Resistance_Checking_Station_Resistance_Value_PV"
        }
    },
    ("Zone1", "Primer stabbing gauging station"): {
        "database": "Zone01_Report",
        "table": "Zone01_Report_Dump",
        "columns": {
            "SPC_values": "Primer_Stabbing_Gauging_Station_Depth_Avg_PV",
            "SPC_UCL": "Primer_Stabbing_Gauging_Station_Max_Limit_SV",
            "SPC_LCL": "Primer_Stabbing_Gauging_Station_Min_Limit_SV",
            "r": "Primer_Stabbing_Gauging_Station_Depth_Avg_PV",
            "x": "Primer_Stabbing_Gauging_Station_Depth_Avg_PV",
            "histogram": "Primer_Stabbing_Gauging_Station_Depth_Avg_PV"
        }
    },

    # Zone 2
    ("Zone2", "Propellant automatic filling station"): {
        "database": "Zone02_Report",
        "table": "Zone02_Report_Dump",
        "columns": {
            "SPC_values": "Propallent_Filling_Weighing_Station_Final_Weight_PV",
            "SPC_UCL": "Resistance_Checking_Station_Max_Limit_SV",
            "SPC_LCL": "Resistance_Checking_Station_Min_Limit_SV",
            "r": "Propallent_Filling_Weighing_Station_Final_Weight_PV",
            "x": "Propallent_Filling_Weighing_Station_Final_Weight_PV",
            "histogram": "Propallent_Filling_Weighing_Station_Final_Weight_PV"
        }
    },
    ("Zone2", "Shell & cartridge case assembly 1"): {
        "database": "Zone02_Report",
        "table": "Zone02_Report_Dump",
        "columns": {
            "SPC_values": "Shell_Cartridge_Assembly_Station01_Actual_Force_PV",
            "SPC_UCL": "Resistance_Checking_Station_Max_Limit_SV",
            "SPC_LCL": "Resistance_Checking_Station_Min_Limit_SV",
            "r": "Shell_Cartridge_Assembly_Station01_Actual_Force_PV",
            "x": "Shell_Cartridge_Assembly_Station01_Actual_Force_PV",
            "histogram": "Shell_Cartridge_Assembly_Station01_Actual_Force_PV"
        }
    },
    ("Zone2", "Shell & cartridge case assembly 2"): {
        "database": "Zone02_Report",
        "table": "Zone02_Report_Dump",
        "columns": {
            "SPC_values": "Shell_Cartridge_Assembly_Station02_Actual_Force_PV",
            "SPC_UCL": "Resistance_Checking_Station_Max_Limit_SV",
            "SPC_LCL": "Resistance_Checking_Station_Min_Limit_SV",
            "r": "Shell_Cartridge_Assembly_Station02_Actual_Force_PV",
            "x": "Shell_Cartridge_Assembly_Station02_Actual_Force_PV",
            "histogram": "Shell_Cartridge_Assembly_Station02_Actual_Force_PV"
        }
    },
    ("Zone2", "Crimping assembly"): {
        "database": "Zone02_Report",
        "table": "Zone02_Report_Dump",
        "columns": {
            "SPC_values": "Shell_Cartridge_Crimping_Station01_Actual_Force_PV",
            "SPC_UCL": "Resistance_Checking_Station_Max_Limit_SV",
            "SPC_LCL": "Resistance_Checking_Station_Min_Limit_SV",
            "r": "Shell_Cartridge_Crimping_Station01_Actual_Force_PV",
            "x": "Shell_Cartridge_Crimping_Station01_Actual_Force_PV",
            "histogram": "Shell_Cartridge_Crimping_Station01_Actual_Force_PV"
        }
    },

    # Zone 3
    ("Zone3", "Total Height gauging"): {
        "database": "Zone03_Report",
        "table": "Zone03_Report_Dump",
        "columns": {
            "SPC_values": "Z3_Auto_Height_Gauging_Station_Actual_Height_Value_PV",
            "SPC_UCL": "Auto_Height_Gauging_Station_Height_Max_Lim_SV",
            "SPC_LCL": "Auto_Height_Gauging_Station_Height_Min_Lim_SV",
            "r": "Z3_Auto_Height_Gauging_Station_Actual_Height_Value_PV",
            "x": "Z3_Auto_Height_Gauging_Station_Actual_Height_Value_PV",
            "histogram": "Z3_Auto_Height_Gauging_Station_Actual_Height_Value_PV"
        }
    },
    ("Zone3", "Total Weighing station"): {
        "database": "Zone03_Report",
        "table": "Zone03_Report_Dump",
        "columns": {
            "SPC_values": "Z3_Round_Weighing_Station_Actual_Weight_Value_PV",
            "SPC_UCL": "Auto_Round_Weighing_Station_Height_Max_Lim_SV",
            "SPC_LCL": "Auto_Round_Weighing_Station_Height_Min_Lim_SV",
            "r": "Z3_Round_Weighing_Station_Actual_Weight_Value_PV",
            "x": "Z3_Round_Weighing_Station_Actual_Weight_Value_PV",
            "histogram": "Z3_Round_Weighing_Station_Actual_Weight_Value_PV"
        }
    },
    ("Zone3", "Final resistance check"): {
        "database": "Zone03_Resistance_Report",
        "table": "Zone03_Resistance_Report_Dump",
        "columns": {
            "SPC_values": "Shell_Resistance_Value",
            "SPC_UCL": "Resistance_Value_Set_Max",
            "SPC_LCL": "Resistance_Value_Set_Min",
            "r": "Shell_Resistance_Value",
            "x": "Shell_Resistance_Value",
            "histogram": "Shell_Resistance_Value"
        }
    },

    # Zone 4
    ("Zone4", "Press-1 Station First Pellet Press"): {
        "database": "Zone04_Report",
        "table": "UAPR012_FINAL_REPORT",
        "columns": {
            "SPC_values": "C_1_Pellet_Press_First_Pellet_Force_PV",
            "SPC_UCL": "C_1_Pellet_Press_First_Pellet_Force_PV",
            "SPC_LCL": "C_1_Pellet_Press_First_Pellet_Force_PV",
            "r": "C_1_Pellet_Press_First_Pellet_Force_PV",
            "x": "C_1_Pellet_Press_First_Pellet_Force_PV",
            "histogram": "C_1_Pellet_Press_First_Pellet_Force_PV"
        }
    },
    ("Zone4", "Press-1 Station Second Pellet Press"): {
        "database": "Zone04_Report",
        "table": "UAPR012_FINAL_REPORT",
        "columns": {
            "SPC_values": "C_1_Pellet_Press_Second_Pellet_Force_PV",
            "SPC_UCL": "C_1_Pellet_Press_Second_Pellet_Force_PV",
            "SPC_LCL": "C_1_Pellet_Press_Second_Pellet_Force_PV",
            "r": "C_1_Pellet_Press_Second_Pellet_Force_PV",
            "x": "C_1_Pellet_Press_Second_Pellet_Force_PV",
            "histogram": "C_1_Pellet_Press_Second_Pellet_Force_PV"
        }
    },
    ("Zone4", "Press-2 Station First Pellet Press"): {
        "database": "Zone04_Report",
        "table": "UAPR012_FINAL_REPORT",
        "columns": {
            "SPC_values": "C_2_Pellet_Press_First_Pellet_Force_PV",
            "SPC_UCL": "C_2_Pellet_Press_First_Pellet_Force_PV",
            "SPC_LCL": "C_2_Pellet_Press_First_Pellet_Force_PV",
            "r": "C_2_Pellet_Press_First_Pellet_Force_PV",
            "x": "C_2_Pellet_Press_First_Pellet_Force_PV",
            "histogram": "C_2_Pellet_Press_First_Pellet_Force_PV"
        }
    },
    ("Zone4", "Press-2 Station Second Pellet Press"): {
        "database": "Zone04_Report",
        "table": "UAPR012_FINAL_REPORT",
        "columns": {
            "SPC_values": "C_2_Pellet_Press_Second_Pellet_Force_PV",
            "SPC_UCL": "C_2_Pellet_Press_Second_Pellet_Force_PV",
            "SPC_LCL": "C_2_Pellet_Press_Second_Pellet_Force_PV",
            "r": "C_2_Pellet_Press_Second_Pellet_Force_PV",
            "x": "C_2_Pellet_Press_Second_Pellet_Force_PV",
            "histogram": "C_2_Pellet_Press_Second_Pellet_Force_PV"
        }
    },
    ("Zone4", "Press-3 Station First Pellet Press"): {
        "database": "Zone04_Report",
        "table": "UAPR012_FINAL_REPORT",
        "columns": {
            "SPC_values": "C_3_Pellet_Press_First_Pellet_Force_PV",
            "SPC_UCL": "C_3_Pellet_Press_First_Pellet_Force_PV",
            "SPC_LCL": "C_3_Pellet_Press_First_Pellet_Force_PV",
            "r": "C_3_Pellet_Press_First_Pellet_Force_PV",
            "x": "C_3_Pellet_Press_First_Pellet_Force_PV",
            "histogram": "C_3_Pellet_Press_First_Pellet_Force_PV"
        }
    },
    ("Zone4", "Depth gauging station"): {
        "database": "Zone04_Report",
        "table": "UAPR012_FINAL_REPORT",
        "columns": {
            "SPC_values": "Gauging_Station_Depth_Gauging_PV",
            "SPC_UCL": "Gauging_Station_Depth_Gauging_PV",
            "SPC_LCL": "Gauging_Station_Depth_Gauging_PV",
            "r": "Gauging_Station_Depth_Gauging_PV",
            "x": "Gauging_Station_Depth_Gauging_PV",
            "histogram": "Gauging_Station_Depth_Gauging_PV"
        }
    },
    ("Zone4", "OD1(Shell) gauging station"): {
        "database": "Zone04_Report",
        "table": "UAPR012_FINAL_REPORT",
        "columns": {
            "SPC_values": "Gauging_Station_OD_1_Gauging_PV",
            "SPC_UCL": "Gauging_Station_OD_1_Gauging_PV",
            "SPC_LCL": "Gauging_Station_OD_1_Gauging_PV",
            "r": "Gauging_Station_OD_1_Gauging_PV",
            "x": "Gauging_Station_OD_1_Gauging_PV",
            "histogram": "Gauging_Station_OD_1_Gauging_PV"
        }
    },
    ("Zone4", "OD2(Copper Band) gauging station"): {
        "database": "Zone04_Report",
        "table": "UAPR012_FINAL_REPORT",
        "columns": {
            "SPC_values": "Gauging_Station_OD_2_Gauging_PV",
            "SPC_UCL": "Gauging_Station_OD_2_Gauging_PV",
            "SPC_LCL": "Gauging_Station_OD_2_Gauging_PV",
            "r": "Gauging_Station_OD_2_Gauging_PV",
            "x": "Gauging_Station_OD_2_Gauging_PV",
            "histogram": "Gauging_Station_OD_2_Gauging_PV"
        }
    }

}

SETTINGS_FILE = 'settings.json'

@app.route('/')
def home():
    return render_template('indexsidebar.html')

@app.route('/sidebar')
def sidbar():
    return render_template('indexsidebar.html')

@app.route('/settings')
def settings_page():
    return render_template('settings.html')

@app.route("/api/settings", methods=["GET", "POST"])
def settings_api():
    if request.method == "GET":
        if os.path.exists(SETTINGS_FILE):
            with open(SETTINGS_FILE, "r") as f:
                return jsonify(json.load(f))
        return jsonify({})  # Empty if not found

    if request.method == "POST":
        try:
            settings = request.get_json()
            with open(SETTINGS_FILE, "w") as f:
                json.dump(settings, f, indent=4)
            return jsonify({"success": True})
        except Exception as e:
            return jsonify({"error": str(e)}), 400
        
@app.route('/get-settings', methods=['GET'])
def get_settings():
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, 'r') as f:
            return jsonify(json.load(f))
    else:
        return jsonify({})
    
@app.route('/api/data', methods=['GET'])
def get_data():
    zone = request.args.get('zone')
    station = request.args.get('station')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    if not (zone and station and start_date and end_date):
        return jsonify({"error": "zone, station, start_date, and end_date are required"}), 400

    try:
        start_date = datetime.strptime(start_date, "%Y-%m-%d")
        end_date = datetime.strptime(end_date, "%Y-%m-%d")
    except ValueError:
        return jsonify({"error": "Date format must be YYYY-MM-DD"}), 400

    config = STATION_CONFIG.get((zone, station))
    if not config:
        return jsonify({"error": f"No configuration for zone {zone} and station {station}"}), 400
    # print(f"Fetching data for {zone} - {station} from {start_date} to {end_date}")
    # print(f"Config: {config}")

    db = config["database"]
    table = config["table"]
    columns_map = config["columns"]
    try:
        conn_str = (
            "DRIVER={ODBC Driver 17 for SQL Server};"
            "SERVER=UAPR206-PC\\SQLEXPRESS;"
            f"DATABASE={db};"
            "Trusted_Connection=yes;"
        )
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()

        selected_cols = ", ".join(set(columns_map.values()))
        query = f"""
            SELECT {selected_cols}
            FROM {table}
            WHERE Date_And_Time BETWEEN ? AND ?
            ORDER BY Date_And_Time ASC
        """
        cursor.execute(query, start_date, end_date)
        rows = cursor.fetchall()
        col_names = [desc[0] for desc in cursor.description]
        data = [dict(zip(col_names, row)) for row in rows]
    except Exception as e:
        print(f"DB fetch error: {e}")
        return jsonify({"error": "Database fetch failed"}), 500

    if not data:
        return jsonify({"error": "No data found"}), 200

    def extract(col_alias):
        real_col = columns_map[col_alias]
        return [row[real_col] for row in data if row.get(real_col) is not None]

    spc_values = extract("SPC_values")
    spc_ucl = extract("SPC_UCL")
    spc_lcl = extract("SPC_LCL")
    r_data = extract("r")
    x_data = extract("x")
    histogram = extract("histogram")

    histogram_counts, bins = np.histogram(histogram, bins=10)
    # histogram_bins = [f"{round(bins[i], 1)} - {round(bins[i+1], 1)}" for i in range(len(bins) - 1)]
    histogram_bins = [f"{bins[i]:.2g} - {bins[i+1]:.2g}" for i in range(len(bins) - 1)]

    if not spc_values or not spc_ucl:
        return jsonify({"error": "Not enough SPC data to calculate normal distribution"}), 200

    try:
        normal_x = [round(spc_values[0] + spc_ucl[0] * i, 2) for i in range(-3, 4)]
        normal_y = [
            round((1 / (spc_ucl[0] * math.sqrt(2 * math.pi))) *
                  math.exp(-0.5 * ((x - spc_values[0]) / spc_ucl[0]) ** 2), 4)
            for x in normal_x
        ]
    except Exception as e:
        print("Error calculating normal distribution:", e)
        normal_x, normal_y = [], []

    chartdata = {
        "spc": spc_values,
        "spc_ucl": spc_ucl,
        "spc_lcl": spc_lcl,
        "r": r_data,
        "x": x_data,
        "histogram": histogram_counts.tolist(),
        "histogram_bins": histogram_bins,
        "normal": normal_y,
        "normal_x": normal_x
    } 
    

    return jsonify(chartdata)

@app.route('/api/plc-status', methods=['GET'])
def plc_status():
    return jsonify([{"status": "connected"}, {"status": "connected"}, {"status": "connected"}])

if __name__ == '__main__':
    # threading.Thread(target=insert_random_data).start()
    # app.run(debug=True)
    app.run(host='0.0.0.0', port=5000, debug=True)
