require('dotenv').config();

const connectDB = require('./src/config/db'); 

const app = require('./src/app');

const PORT = process.env.PORT || 5000;
connectDB();

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

const server = app.listen(PORT, () => {
  console.log(`\n Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(` Finance Dashboard Backend API`);
  console.log(`http://localhost:${PORT}/api/v1`);
});

module.exports = server;
