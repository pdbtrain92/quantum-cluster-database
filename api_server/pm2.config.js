module.exports = {
  apps: [{
    name: 'api_server',
    script: 'app.js',
    instances: 3,
    autorestart: true,
    min_uptime: '2s',
    max_restarts: 3,
    watch: false,
    max_memory_restart: '1G',
    exec_mode: 'cluster'
  }]
};
