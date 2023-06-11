
import * as dotenv from 'dotenv';
import { Tweet } from './../src/modules/tweets/entities/tweet.entity';
import { User } from './../src/modules/users/entities/user.entity';
import { DataSource, DataSourceOptions } from 'typeorm';

dotenv.config();

const dataSourceOptions: DataSourceOptions = {
  type: process.env.DB_TYPE as 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Tweet],
  migrations: ['dist/migrations/*.js'],
  migrationsTableName: "migrations",
  logging: true
}

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;