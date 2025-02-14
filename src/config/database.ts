import mongoose, { ConnectOptions } from 'mongoose';
import logger from '../utils/logger';
import processEnv from './env';

const connectDB = async (): Promise<void> => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as ConnectOptions;

    const conn = await mongoose.connect(processEnv.MONGODB_URL, options);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Handle errors after initial connection
    mongoose.connection.on('error', err => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.info('MongoDB disconnected');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      process.exit(0);
    });

  } catch (error) {
    logger.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
};

export default connectDB; 