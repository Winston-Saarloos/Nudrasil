module.exports = {
    apps: [
      {
        name: "nextjs-app",
        script: "yarn",
        args: "start",
        watch: false,
        env: {
          NODE_ENV: "production",
          PORT: 3000,
        },
      },
    ],
  };
  