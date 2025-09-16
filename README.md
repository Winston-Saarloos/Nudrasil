This project is a small soil moisture, light, temperature, and humidity monitoring system for a few plants in my home. It runs on an Arduino board connected to three moisture sensors and one luminance sensor. Data is collected every 10 minutes, stored in a database, and visualized as three line charts on the home page.

The app also includes admin pages for managing sensors and setting up new boards.

### IDEs:

- Platform.io (for Arduino)
- VS Code

### Tech Stack:

- Postgres Database
- Next.js web app and API routes

### Parts Used:

- (1) HiLetgo TSL2561 Luminosity Sensor Infrared Light Brightness Sensor Luminance Sensor
- (1) ADS1115 16 Bit 16 Byte 4 Channel I2C IIC Analog-to-Digital ADC PGA Converter with Programmable Gain Amplifier High Precision ADC Converter Development Board for Arduino Raspberry Pi
- (3) Gikfun Capacitive Soil Moisture Sensor Corrosion Resistant for Arduino Moisture Detection Garden Watering DIY EK1940 (these aren't super high quality and provide less than accurate readings)
- (1) HiLetgo DHT22/AM2302 Digital Temperature And Humidity Sensor Module Temperature Humidity Monitor Sensor Replace SHT11 SHT15 for Arduino Electronic Practice DIY
- (1) HiLetgo ESP8266 NodeMCU CP2102 ESP-12E Development Board Open Source Serial Module Works Great for Arduino IDE/Micropython

### The System:

This project utilizes a Cloudflare tunnel and Github Actions CI/CD pipeline. This allows me to host it locally on a Ubuntu machine in my home. It is setup to automatically deploy changes when new commits are made to the respository. Arduino updates are made manually since I have to physically connect it to my PC.

- Ubuntu Machine: Host machine
- Github Runner: Listens for updates to the repository. Builds the code (in this case a Docker container) and uploads the Docker image to the Harbor repository. Once uploaded the Docker image is started on the host machine.
- Cloudflared tunnel: Allows me to point the domain at my Ubuntu machine without port forwarding on my router.
- Docker: Allows me to run multiple micro services on a single machine in isolated environments.
- Harbor: Open source Docker repository.
- Portainer: Open source Docker container monitoring interface. Allows me to view container health and logs from within the container running on the host machine.
- nginx
- pihole: Local DNS server running on Raspberry Pi 5 8GB.  This allows me to specify "harbor.luma.home.arpa" for the domain instead of the literal IP address. This will be handy in the future if I ever have to move things around.

You can view the live project here:
https://app.nudrasil.com/
