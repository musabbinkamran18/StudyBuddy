module.exports = {
  apps: [
    {
      name: "studybuddy",
      script: ".output/server/index.mjs",
      interpreter: "node",
      interpreter_args: "--env-file=.env",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "6000",
        HOST: "127.0.0.1",
      },
    },
  ],
};
