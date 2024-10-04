module.exports = {
  apps: [{
    name: 'sharedLocker-product',
    script: './public/dist/server.js',
    env: {
      NODE_ENV: 'production'
    },
    output: './logs/pm2/console.log',
    error: './logs/pm2/error.log',
  }, {
    name: 'sharedLocker-dev',
    script: './public/dist/server.js',
    env: {
      NODE_ENV: 'development'
    },
    output: './logs/pm2/dev/console.log',
    error: './logs/pm2/dev/error.log'
  }],
};
