import { InfluxDB, Point } from '@influxdata/influxdb-client'
import 'dotenv/config'

const url = process.env.INFLUX_URL
const token = process.env.INFLUX_TOKEN
const org = process.env.INFLUX_ORG
const bucket = process.env.INFLUX_BUCKET
const influxDB = new InfluxDB({ url, token })
const writeApi = influxDB.getWriteApi(org, bucket)
const point1 = new Point('temperature')
  .tag('sensor_id', 'TLM01')
  .floatField('value', 24.0)
console.log(` ${point1}`)
writeApi.writePoint(point1)
writeApi.close().then(() => {
  console.log('WRITE FINISHED')
})