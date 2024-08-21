#!.env

/** @module write
 * Writes a data point to InfluxDB using the Javascript client library with Node.js.
**/

import { InfluxDB, Point } from '@influxdata/influxdb-client'
import 'dotenv/config'
import {readFileSync} from 'fs'
/** Environment variables **/
const url = process.env.INFLUX_URL
const token = process.env.INFLUX_TOKEN
const org = process.env.INFLUX_ORG
const bucket = process.env.INFLUX_BUCKET

const influxDB = new InfluxDB({ url, token })
const data = JSON.parse(readFileSync('weather.json', 'utf8'))
/**
 * Create a write client from the getWriteApi method.
 * Provide your `org` and `bucket`.
 **/
const writeApi = influxDB.getWriteApi(org, bucket)

/**
 * Apply default tags to all points.
 **/
writeApi.useDefaultTags({ region: 'west' })

/**
 * Create a point and write it to the buffer.
 **/
const point1 = new Point('testing')
    .tag('station', data.name)
    .intField('temperature', data.sensors.temperature)
    .intField('dew_point', data.sensors.dew_point)
    .intField('humidity', data.sensors.humidity)
    .intField('wind', data.sensors.wind)
    .stringField('direction', data.sensors.direction)
    .floatField('pressure', data.sensors.pressure)
console.log(` ${point1}`)

writeApi.writePoint(point1)

/**
 * Flush pending writes and close writeApi.
 **/
writeApi.close().then(() => {
  console.log('WRITE FINISHED')
})
