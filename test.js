#!.env
/** From the Influx Documentation */
/** Had to mix code example from two different sections because only one of them worked */

import { InfluxDB, Point } from '@influxdata/influxdb-client'
import 'dotenv/config'
import {readFileSync} from 'fs'

const url = process.env.INFLUX_URL
const token = process.env.INFLUX_TOKEN
const org = process.env.INFLUX_ORG
const bucket = process.env.INFLUX_BUCKET
const influxDB = new InfluxDB({ url, token })
const data = JSON.parse(readFileSync('weather.json', 'utf8'))
const writeApi = influxDB.getWriteApi(org, bucket)
writeApi.useDefaultTags({ region: 'west' })
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
writeApi.close().then(() => {
  console.log('WRITE FINISHED')
})
