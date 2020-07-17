const path = require('path');
// For use running outside of docker.
// if you want more cores to be utilized within docker
// then spin up more containers. `npm run start`
module.exports = {
  apps: [{
    name: 'api_server',
    script: 'app.js',
    instances: 'max',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      SERVER_PORT: 3000,
      DB_USERNAME: 'postgres',
      DB_PASSWORD: '123',
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_DATABASE: 'qcdb'
    }
  }]
};
