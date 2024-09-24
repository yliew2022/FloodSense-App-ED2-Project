#!.env
/** From the Influx Documentation */
/** Had to mix code example from two different sections because only one of them worked */

import { InfluxDB, Point } from '@influxdata/influxdb-client'
import 'dotenv/config'
import {readFileSync} from 'fs'
import { spawn } from 'child_process';
/*const url = process.env.INFLUX_URL
const token = process.env.INFLUX_TOKEN
const org = process.env.INFLUX_ORG
const bucket = process.env.INFLUX_BUCKET
const influxDB = new InfluxDB({ url, token })
const data = JSON.parse(readFileSync('weather.json', 'utf8'))
const writeApi = influxDB.getWriteApi(org, bucket)
writeApi.useDefaultTags({ region: 'west' })
const point1 = new Point('sample')
    .tag('sensor_id', data.name)
    .stringField('timestamp', data.time_stamp)
    .floatField('distance_cm', data.distance_cm)
    .floatField('temperature_celsius', data.temperature_celsius)
    .stringField('status', data.status)
console.log(` ${point1}`)
writeApi.writePoint(point1)
writeApi.close().then(() => {
  console.log('WRITE FINISHED')
})*/



const url = process.env.INFLUX_URL;
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_BUCKET;
const influxDB = new InfluxDB({ url, token });
const writeApi = influxDB.getWriteApi(org, bucket);
writeApi.useDefaultTags({ region: 'west' });

// Spawn the Python script to generate the mock ultrasonic data
const pythonProcess = spawn('python', ['generate.py']);

// Listen to data output from the Python script
pythonProcess.stdout.on('data', (data) => {
  console.log('Received data from Python: ', data.toString());
  try {
      // Parse the incoming JSON data
      const sensorData = JSON.parse(data.toString());
      console.log('Parsed JSON data: ', sensorData);

      // Create a point for InfluxDB
      const point = new Point('test_data')
          .tag('sensor_id', sensorData.sensor_id)
          .stringField('timestamp', sensorData.timestamp)
          .floatField('distance_cm', sensorData.distance_cm)
          .floatField('temperature_celsius', sensorData.temperature_celsius)
          .stringField('status', sensorData.status);
      writeApi.writePoint(point);
      console.log(`Data written to InfluxDB: ${JSON.stringify(sensorData)}`);

  } catch (err) {
      console.error('Error parsing or writing data: ', err);
  }
});


pythonProcess.stderr.on('data', (data) => {
  console.error(`Python error: ${data.toString()}`);
});


const gracefulShutdown = () => {
  console.log('Received SIGINT. Flushing data to InfluxDB...');
  writeApi.close().then(() => {
      console.log('InfluxDB write finished, exiting process.');
      process.exit(0); 
  }).catch(err => {
      console.error('Error during write API close: ', err);
      process.exit(1); 
  });
};
process.on('SIGINT', gracefulShutdown);

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection: ', err);
  gracefulShutdown();
});


