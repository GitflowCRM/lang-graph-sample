import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pool } from 'pg';
import {
  QueryDatabaseTool,
  ListTablesTool,
  GetTableInfoTool,
  GetSampleDataTool,
  GetProductAnalyticsTool,
  GetOrderSummaryTool,
  GetDatabaseSchemaTool,
  CountRowsTool,
  GetRowWithExtremeValueTool,
  SayAlohaTool,
} from './sql.tools';
import {
  GetUsersTool,
  GetProductsTool,
  GetOrdersTool,
  GetReviewsTool,
  SearchProductsTool,
} from './typeorm.tools';
import { User, Product, Order, OrderItem, Review } from './entities';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private pool: Pool;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {
    this.pool = new Pool({
      host: this.configService.get('DB_HOST', 'localhost'),
      port: this.configService.get('DB_PORT', 5432),
      database: this.configService.get('DB_NAME', 'langchain_chatbot'),
      user: this.configService.get('DB_USER', 'langchain_user'),
      password: this.configService.get('DB_PASSWORD', 'langchain_password'),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  // TypeORM Repository methods
  getUsers() {
    return this.userRepository.find();
  }

  getProducts() {
    return this.productRepository.find();
  }

  getOrders() {
    return this.orderRepository.find({
      relations: ['user', 'orderItems', 'orderItems.product'],
    });
  }

  getReviews() {
    return this.reviewRepository.find({
      relations: ['user', 'product'],
    });
  }

  // Legacy pool methods for SQL tools
  getPool(): Pool {
    return this.pool;
  }

  async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      return false;
    }
  }

  async executeQuery(query: string): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(query);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async getTableInfo(tableName: string): Promise<Record<string, unknown>[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `,
        [tableName],
      );
      return result.rows as Record<string, unknown>[];
    } finally {
      client.release();
    }
  }

  async getSampleData(tableName: string, limit: number = 5): Promise<any[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`SELECT * FROM ${tableName} LIMIT $1`, [
        limit,
      ]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async listTables(): Promise<string[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      return result.rows.map((row: { table_name: string }) => row.table_name);
    } finally {
      client.release();
    }
  }

  getAllTools() {
    return [
      // SQL Tools
      new QueryDatabaseTool(this),
      new ListTablesTool(this),
      new GetTableInfoTool(this),
      new GetSampleDataTool(this),
      new GetProductAnalyticsTool(this),
      new GetOrderSummaryTool(this),
      new GetDatabaseSchemaTool(this),
      new CountRowsTool(this),
      new GetRowWithExtremeValueTool(this),
      new SayAlohaTool(),
      // TypeORM Tools
      new GetUsersTool(this),
      new GetProductsTool(this),
      new GetOrdersTool(this),
      new GetReviewsTool(this),
      new SearchProductsTool(this),
    ];
  }

  // Keep the old method for backward compatibility
  getSqlTools() {
    return this.getAllTools();
  }
}
