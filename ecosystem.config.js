// ecosystem.config.js
// PM2 process manager config for VPS deployment
// Usage: pm2 start ecosystem.config.js

module.exports = {
  apps: [
    {
      name: 'fxa-music-bot',
      script: 'index.js',
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
      },
      // Auto-restart on crash
      autorestart: true,
      restart_delay: 5000,
      // Logging
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
