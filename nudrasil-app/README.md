If app becomes stuck, or fails after automatic deployment:

# Optional: clean up old broken app

pm2 delete nextjs-app

# Start fresh

- cd C:\Deploy\nudrasil-live
- pm2 start ecosystem.config.js
- pm2 save

# Extensions Used

Firmware (/firmware):

- C/C++
- PlatformIO IDE

Web App (/nudrasil-app):

- ESLint
- Prettier
- Tailwind CSS IntelliSense
