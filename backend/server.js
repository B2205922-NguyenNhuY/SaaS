const app = require('./src/app');
const { sequelize } = require('./src/models');
const planController = require('./src/controllers/plan.controller');
const cron = require('node-cron');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    if (process.env.NODE_ENV === 'development') {
      console.log('Database synced');
    }

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });

    setupCronJobs();

  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
}


function setupCronJobs() {
  cron.schedule('0 0 * * *', async () => {
    console.log('Running subscription expiry check...');
    try {
      await planController.checkExpiredSubscriptions();
      console.log('Subscription expiry check completed');
    } catch (error) {
      console.error('Error in subscription expiry check:', error);
    }
  });

  cron.schedule('0 1 * * *', async () => {
    console.log('Running daily collection period generation...');
  });

  console.log('Cron jobs scheduled');
}

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
