module.exports = {
  apps: [{
    name: 'sv-meeting-frontend',
    script: 'serve',
    args: '-s build -l 3000 -n --host 0.0.0.0',
    interpreter: 'none',
    env: {
      NODE_ENV: 'production'
    },
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 5,
    restart_delay: 4000
  }]
}; 