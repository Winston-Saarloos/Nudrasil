# Plant Monitoring System

A small **web-based dashboard** for monitoring soil moisture, light, temperature, and humidity across multiple plants.
The system collects sensor data every 10 minutes, stores it in a PostgreSQL database, and visualizes trends as interactive line charts on the home page.
It also includes admin pages for managing sensors and provisioning new boards.

## Live Project

[app.nudrasil.com](https://app.nudrasil.com/)

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Drizzle (db migrations)
- **Backend**: Next.js API routes, PostgreSQL
- **Infrastructure**: Docker, Harbor (private self hosted container registry), GitHub Actions CI/CD, Cloudflare Tunnel, Ubuntu Server
- **Other Tools**: Portainer (container monitoring), Pi-hole (local DNS), nginx

## Development

- **IDEs**: VS Code, Platform.io (for Arduino)
- **Hosting**: Self-hosted Ubuntu machine with Docker + CI/CD pipeline
- **Deployment flow**:
  - GitHub Runner builds Docker images on merge → pushes to Harbor → deploys latest container
  - Cloudflare tunnel maps local services to the nudrasil.com domain securely

## System Architecture

- **Ubuntu Machine**: Host server for Docker containers
- **GitHub Runner + Actions**: CI/CD automation for building & deploying
- **Cloudflare Tunnel**: Secure remote access without router port forwarding
- **Harbor**: Private Docker image registry
- **Portainer**: Container monitoring & logs
- **nginx**: Reverse proxy for routing requests
- **Pi-hole**: Local DNS for custom domain resolution

## Hardware (Arduino Components)

- ESP8266 NodeMCU CP2102 (board, Wi-Fi enabled)
- TSL2561 Luminosity Sensor (light)
- ADS1115 ADC (analog-to-digital converter)
- DHT22/AM2302 (temperature & humidity)
- Gikfun Capacitive Soil Moisture Sensors ×3
  - _(these aren't high end sensors and therefore have less then adequate readings)_
