module.exports = {
  apps: [
    {
      name: "admin-rbs",
      script: "server.js",
      instances: 1,
      exec_mode: "cluster",
      watch: false,
      env: {
        PORT: 3001,
        NODE_ENV: "production",
      },
      env_production: {
        PORT: 3001,
        NODE_ENV: "production",
      },
    },
  ],
};
