import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import kafka from 'kafka-node';
import { InfluxDB, Point } from '@influxdata/influxdb-client';
import 'dotenv/config';
const url = process.env.INFLUX_URL;
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_BUCKET;
const kafkaIP = process.env.kafkaIP;
const influxDB = new InfluxDB({ url, token });
const writeApi = influxDB.getWriteApi(org, bucket);
writeApi.useDefaultTags({ region: 'west' });

// Kafka setup
const client = new kafka.KafkaClient({ kafkaHost: kafkaIP });
client.setMaxListeners(50);
const producer = new kafka.Producer(client);

// Serial port setup
const port = new SerialPort({
  path: 'COM3',
  baudRate: 115200,
});

// Setup the parser to read serial data line by line
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

let lastSensorData = null; 

// Handle errors with the Kafka producer
producer.on('error', (err) => {
  console.error('Kafka Producer Error:', err);
});

// Handle errors with the serial port
port.on('error', (err) => {
  console.error('Serial Port Error:', err.message);
});

// Function to convert the serial data into JSON
function parseSerialData(data) {
  const regex = /distance:\s*(\d+)\s*mm/;
  const match = data.match(regex);

  if (match) {
    return {
      sensor_id: 'ultrasonic_sensor_1',
      distance_cm: parseInt(match[1], 10),
    };
  } else {
    console.error('Invalid data format:', data);
    return null;
  }
}

// Polling function to fetch data every 5 seconds
setInterval(() => {
  if (lastSensorData) {
    console.log('Sending data to Kafka and InfluxDB:', lastSensorData);

    // Kafka payload
    const payloads = [
      {
        topic: 'cluster',
        messages: JSON.stringify(lastSensorData),
        partition: 0,
      },
    ];

    producer.send(payloads, (err, data) => {
      if (err) {
        console.error('Error sending data to Kafka:', err);
      } else {
        console.log('Data sent to Kafka:', data);
      }
    });

    // InfluxDB point creation and writing
    const point = new Point('sensor1')
      .tag('sensor_id', lastSensorData.sensor_id)
      .floatField('distance_cm', lastSensorData.distance_cm)
      .stringField('timestamp', new Date().toISOString());

    writeApi.writePoint(point);
    writeApi.flush().then(() => {
      console.log('Data flushed to InfluxDB immediately');
    }).catch((err) => {
      console.error('Error during data flush: ', err);
    });

    console.log(`Data written to InfluxDB: ${JSON.stringify(lastSensorData)}`);
  }
}, 5000);

// Handle incoming data from the serial port
parser.on('data', (data) => {
  try {
    const sensorData = parseSerialData(data.trim());
    if (sensorData) {
      lastSensorData = sensorData; // Store the latest data from serial
      console.log('Received sensor data:', sensorData);
    }
  } catch (err) {
    console.error('Error parsing or writing data: ', err);
  }
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('Received SIGINT. Flushing data to InfluxDB...');
  writeApi.close().then(() => {
    console.log('InfluxDB write finished, exiting process.');
    process.exit(0);
  }).catch((err) => {
    console.error('Error during write API close: ', err);
    process.exit(1);
  });
};

process.on('SIGINT', gracefulShutdown);

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection: ', err);
  gracefulShutdown();
});
