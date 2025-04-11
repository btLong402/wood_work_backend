import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD as string,
  {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT as string, 10),
    dialect: 'mysql',
    logging: false, // Disable SQL query logging
    pool: {
      max: 5,
      min: 0,
      acquire: 60000, // Increased from 30000 to 60000
      idle: 10000
    },
    dialectOptions: {
      connectTimeout: 60000 // Added explicit connection timeout of 60 seconds
    }
  }
);

const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Kết nối cơ sở dữ liệu thành công.');
  } catch (error) {
    console.error('Không thể kết nối đến cơ sở dữ liệu:', error);
    process.exit(1);
  }
};

export { sequelize, connectDB };