module.exports = {
  apps: [{
    name: 'madhu-portfolio',
    script: 'serve',
    env_production: {
      NODE_ENV: 'production',
      PORT: 8898,
    },
    env_development: {
      PM2_SERVE_PATH: 'build',
      PM2_SERVE_PORT: 8898,
      PM2_SERVE_SPA: 'true',
      // NODE_ENV: 'development',
      // PORT: 8898,
    },
    watch: false,
    instances: 1,
  }],
  deploy: {
    production: {
      host: 'vps-79tech-deploy',
      ref: 'origin/production',
      repo: 'git@github.com:madhusudansinghrathore/madhusudansingh_portfolio.git',
      path: '/var/www/madhusudansingh_rathore_portfolio/production',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 startOrRestart ecosystem.config.js --env production --only madhu-portfolio',
      'pre-setup': 'echo "Deploying from local machine..."'
    },
    development: {
      host: 'vps-79tech-deploy',
      ref: 'origin/development',
      repo: 'git@github.com:madhusudansinghrathore/madhusudansingh_portfolio.git',
      path: '/var/www/madhusudansingh_rathore_portfolio/staging',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 startOrRestart ecosystem.config.js --env development --only madhu-portfolio',
      'pre-setup': 'echo "Deploying from local machine..."'
    }
  }
};
