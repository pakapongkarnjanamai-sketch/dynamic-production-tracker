module.exports = {
  apps: [
    {
      name: 'vs-mes-backend',
      cwd: '/srv/dynamic-production-tracker/backend',
      script: 'src/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
    },
  ],
};
