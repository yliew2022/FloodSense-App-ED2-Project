import json
import random
import time
from datetime import datetime, timezone

def generate_mock_ultrasonic_data():
    while True:
        # Simulate distance in cm (mocking a range from 10cm to 40cm)
        distance = round(random.uniform(10.0, 40.0), 2)

        # Simulate temperature in Celsius
        temperature = round(random.uniform(20.0, 30.0), 1)

        # Get current timestamp (UTC, timezone-aware)
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

        # Create a dictionary for the sensor data
        data = {
            "sensor_id": "sensor-01",
            "timestamp": timestamp,
            "distance_cm": distance,
            "temperature_celsius": temperature,
            "status": "OK"
        }

        # Convert the dictionary to a JSON string
        json_data = json.dumps(data)

        # Print the JSON data to simulate a stream
        print(json_data, flush=True)  # Ensure immediate output

        # Wait for a second before generating the next data point (simulating real-time sensor readings)
        time.sleep(1)

# Call the function to start generating mock data
generate_mock_ultrasonic_data()
