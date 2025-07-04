import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database.service';
import * as entities from './entities';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USER', 'langchain_user'),
        password: configService.get('DB_PASSWORD', 'langchain_password'),
        database: configService.get('DB_NAME', 'langchain_chatbot'),
        entities: Object.values(entities),
        synchronize: true, // Keep false for production
        logging: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(Object.values(entities)),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService, TypeOrmModule],
})
export class DatabaseModule {}
