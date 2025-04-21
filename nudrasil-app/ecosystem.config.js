module.exports = {
  apps: [
    {
      name: "nextjs-app",
      script: "server.js",
      interpreter: "node",
      cwd: "C:/Deploy/nudrasil-live",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
}
