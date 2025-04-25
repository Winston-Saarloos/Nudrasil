module.exports = {
  apps: [
    {
      name: "nextjs-app",
      script: "server.js",
      cwd: "/home/rocko/deploy/nudrasil-live",
      watch: false,
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
}
