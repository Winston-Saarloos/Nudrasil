import { NextRequest, NextResponse } from 'next/server'
import { SensorData } from '@/models/sensorData'

let memoryStore: SensorData[] = []

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json()

    console.log(body)
    if (typeof body.sensor !== 'string' || typeof body.value !== 'number') {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
    }

    const entry: SensorData = {
      sensor: body.sensor,
      value: body.value,
      time: Date.now()
    }

    memoryStore.push(entry)
    return NextResponse.json({ success: true, entry })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}

export async function GET(): Promise<NextResponse> {
  // SAFETY: Always return valid JSON
  console.log(memoryStore)
  return NextResponse.json({ data: memoryStore })
}

// [
//   { sensor: 'dht22-temp', value: 23.1, time: 1744867910508 },
//   { sensor: 'dht22-humidity', value: 31.8, time: 1744867910553 },
//   { sensor: 'dht22-temp', value: 23.1, time: 1744867970597 },
//   { sensor: 'dht22-humidity', value: 31.9, time: 1744867970628 },
//   { sensor: 'dht22-temp', value: 23.1, time: 1744868030671 },
//   { sensor: 'dht22-humidity', value: 31.8, time: 1744868030702 },
//   { sensor: 'dht22-temp', value: 23.1, time: 1744868090744 },
//   { sensor: 'dht22-humidity', value: 31.7, time: 1744868090774 },
//   { sensor: 'dht22-temp', value: 23.1, time: 1744868150809 },
//   { sensor: 'dht22-humidity', value: 31.8, time: 1744868150841 },
//   { sensor: 'dht22-temp', value: 23.1, time: 1744868210880 },
//   { sensor: 'dht22-humidity', value: 31.8, time: 1744868210915 },
//   { sensor: 'dht22-temp', value: 23.1, time: 1744868270957 },
//   { sensor: 'dht22-humidity', value: 31.7, time: 1744868270988 },
//   { sensor: 'dht22-temp', value: 23.1, time: 1744868331025 },
//   { sensor: 'dht22-humidity', value: 31.9, time: 1744868331056 },
//   { sensor: 'dht22-temp', value: 23.1, time: 1744868391094 },
//   { sensor: 'dht22-humidity', value: 31.8, time: 1744868391127 },
//   { sensor: 'dht22-temp', value: 23.1, time: 1744868451164 },
//   { sensor: 'dht22-humidity', value: 31.6, time: 1744868451196 },
//   { sensor: 'dht22-temp', value: 23.1, time: 1744868511234 },
//   { sensor: 'dht22-humidity', value: 31.6, time: 1744868511269 },
//   { sensor: 'dht22-temp', value: 23.1, time: 1744868571309 },
//   { sensor: 'dht22-humidity', value: 31.9, time: 1744868571350 },
//   { sensor: 'dht22-temp', value: 23.2, time: 1744868631389 },
//   { sensor: 'dht22-humidity', value: 31.6, time: 1744868631421 }
// ]