
import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { entitiesToLoad } from '@/config/options';

dotenv.config();

const dataSourceOptions: DataSourceOptions = {
  type: process.env.DB_TYPE as 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: entitiesToLoad,
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: "migrations",
  logging: true,
  maxQueryExecutionTime: 10000,
}

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;