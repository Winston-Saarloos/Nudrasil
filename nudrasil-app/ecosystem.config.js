module.exports = {
  apps: [
    {
      name: "nextjs-app",
      script: "cmd",
      args: "/c yarn start",
      cwd: "C:/GitHubRunners/actions-runner/_work/Nudrasil/Nudrasil/nudrasil-app",
      watch: ["./.next"],
      ignore_watch: ["node_modules", ".git", ".yarn"],
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
