module.exports = {
  apps: [{
    name: 'ticket-backend',
    script: 'src/index.js',
    interpreter: 'node',
    env: {
      NODE_ENV: 'production',
      HTTPS: 'true',
      PORT: 5000,
      FRONTEND_URL: 'https://ticket.sunvalleycyprus.com'
    },
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 5,
    restart_delay: 4000,
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
