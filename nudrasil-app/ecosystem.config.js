module.exports = {
  apps: [
    {
      name: "nextjs-app",
      script: "server.js",
      cwd: "C:/Deploy/nudrasil-live",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
