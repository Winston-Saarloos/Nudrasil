'use client'

import { useEffect, useState } from 'react'
import { SensorData } from '@/models/sensorData'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface ChartPoint {
  time: string
  temp?: number
  humidity?: number
}

export default function SensorPage() {
  const [chartData, setChartData] = useState<ChartPoint[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/sensor')
        const text = await res.text()
        if (!text) return

        const json = JSON.parse(text)
        const data = json.data as SensorData[]

        // Sort by time descending, take last 10 entries
        const sorted = [...data].sort((a, b) => b.time - a.time)

        const last10 = sorted.slice(0, 50) // get a buffer of recent readings
        const grouped: { [timestamp: number]: ChartPoint } = {}

        for (const item of last10) {
          const time = new Date(item.time).toLocaleTimeString()
          if (!grouped[item.time]) {
            grouped[item.time] = { time }
          }
          if (item.sensor === 'dht22-temp') {
            grouped[item.time].temp = item.value
          } else if (item.sensor === 'dht22-humidity') {
            grouped[item.time].humidity = item.value
          }
        }

        const finalChartData = Object.values(grouped)
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
          .slice(-10) // final 10 unique timestamps

        setChartData(finalChartData)
      } catch (error) {
        console.error('Failed to fetch sensor data:', error)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Recent Sensor Readings</h1>

      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis yAxisId="left" label={{ value: '°C / %', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="temp"
              stroke="#8884d8"
              name="Temp (°C)"
              dot={{ r: 3 }}
              connectNulls={true}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="humidity"
              stroke="#82ca9d"
              name="Humidity (%)"
              dot={{ r: 3 }}
              connectNulls={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
