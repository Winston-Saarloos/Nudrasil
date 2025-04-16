module.exports = {
  apps: [
    {
      name: "nextjs-app",
      script: "cmd",
      args: "/c yarn start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      node_args: "--no-daemon"
    },
  ],
};
