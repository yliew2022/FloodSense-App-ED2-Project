import 'dotenv/config'
import { InfluxDB, Point } from '@influxdata/influxdb-client'
const url = process.env.INFLUX_URL
const token = process.env.INFLUX_TOKEN
const org = process.env.INFLUX_ORG
const bucket = process.env.TOMORROW_BUCKET
const tomorrowApi = process.env.TOMORROW_TOKEN
const influxDB = new InfluxDB({ url, token })
const writeApi = influxDB.getWriteApi(org, bucket)
//const location = "26.373798, -80.101921";
const location = "777 Glades Rd";
const options = {method: 'GET', headers: {accept: 'application/json'}};
fetch(`https://api.tomorrow.io/v4/weather/realtime?location=${location}&apikey=${tomorrowApi}`, options)
  .then(response => response.json())
  .then(data => {
    writeApi.useDefaultTags({ region: 'west' })
    const writeWeather = new Point('weatherData')
        .tag('location', location)
        .floatField('cloudBase', data.data.values.cloudBase)
        .floatField('cloudCeiling', data.data.values.cloudCeiling)
        .floatField('cloudCover', data.data.values.cloudCover)
        .floatField('dewPoint', data.data.values.dewPoint)
        .floatField('freezingRainIntensity', data.data.values.freezingRainIntensity)
        .floatField('humidity', data.data.values.humidity)
        .floatField('precipitationProbability', data.data.values.precipitationProbability)
        .floatField('pressureSurfaceLevel', data.data.values.pressureSurfaceLevel)
        .floatField('rainIntensity', data.data.values.rainIntensity)
        .floatField('sleetIntensity:', data.data.values.sleetIntensity)
        .floatField('snowIntensity', data.data.values.snowIntensity)
        .floatField('temperature', data.data.values.temperature)
        .floatField('temperatureApparent', data.data.values.temperatureApparent)
        .floatField('uvHealthConcern', data.data.values.uvHealthConcern)
        .floatField('uvIndex', data.data.values.uvIndex)
        .floatField('visibility', data.data.values.visibility)
        .floatField('weatherCode', data.data.values.weatherCode)
        .floatField('windDirection', data.data.values.windDirection)
        .floatField('windGust', data.data.values.windGust)
        .floatField('windSpeed', data.data.values.windSpeed)
    console.log(` ${writeWeather}`)
    writeApi.writePoint(writeWeather)
    writeApi.close().then(() => {
    console.log('WRITE FINISHED')
    })
  })
  .then(response => console.log(response))
  .catch(err => console.error(err));
