module.exports = {
  apps: [
    {
      name: "aps-asrama-prod",
      script: "server.js",
      cwd: "./.next/standalone",
      instances: "max", // Run as many instances as CPU cores
      exec_mode: "cluster",
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0"
      },
      log_date_format: "YYYY-MM-DD HH:mm Z",
      error_file: "../../logs/pm2/error.log",
      out_file: "../../logs/pm2/out.log",
      merge_logs: true,
    }
  ]
};
