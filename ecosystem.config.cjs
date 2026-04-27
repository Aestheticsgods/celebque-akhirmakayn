module.exports = {
  apps: [
    {
      name: 'celebque',
      cwd: __dirname,
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      time: true,
    },
  ],
};
