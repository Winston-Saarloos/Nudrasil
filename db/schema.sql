-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Reusable trigger function to auto-update `updated_at`
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Boards Table
CREATE TABLE boards (
  id SERIAL PRIMARY KEY,
  identifier UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC'),
  updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE TRIGGER set_updated_at_boards
BEFORE UPDATE ON boards
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Sensor Types Table
CREATE TABLE sensor_types (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE TRIGGER set_updated_at_sensor_types
BEFORE UPDATE ON sensor_types
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Sensors Table
CREATE TABLE sensors (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type_id INTEGER NOT NULL REFERENCES sensor_types(id) ON DELETE RESTRICT,
  location TEXT NOT NULL,
  board_id INTEGER REFERENCES boards(id) ON DELETE SET NULL,
  min_calibrated_value DOUBLE PRECISION,
  max_calibrated_value DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC'),
  updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE TRIGGER set_updated_at_sensors
BEFORE UPDATE ON sensors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Sensor Readings Table
CREATE TABLE sensor_readings (
  id SERIAL PRIMARY KEY,
  sensor_id INTEGER NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  value DOUBLE PRECISION NOT NULL,
  reading_time TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
  updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE TRIGGER set_updated_at_sensor_readings
BEFORE UPDATE ON sensor_readings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Index to speed up time-based queries
CREATE INDEX idx_sensor_readings_time ON sensor_readings(reading_time);

-- New: Device Configs Table
CREATE TABLE device_configs (
  id SERIAL PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC'),
  updated_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'UTC')
);

CREATE TRIGGER set_updated_at_device_configs
BEFORE UPDATE ON device_configs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
