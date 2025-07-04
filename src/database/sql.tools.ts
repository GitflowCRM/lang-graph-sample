import { Tool } from '@langchain/core/tools';
import { DatabaseService } from './database.service';

export class QueryDatabaseTool extends Tool {
  name = 'query_database';
  description =
    'Execute SQL queries on the database. Use this to get data from tables like users, products, orders, reviews, order_summary, and product_analytics. Always use parameterized queries for safety.';

  constructor(private databaseService: DatabaseService) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const result = await this.databaseService.executeQuery(input);
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return `Error executing query: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

export class ListTablesTool extends Tool {
  name = 'list_tables';
  description = 'List all available tables in the database.';

  constructor(private databaseService: DatabaseService) {
    super();
  }

  async _call(): Promise<string> {
    try {
      const tables = await this.databaseService.listTables();
      return `Available tables: ${tables.join(', ')}`;
    } catch (error) {
      return `Error listing tables: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

export class GetTableInfoTool extends Tool {
  name = 'get_table_info';
  description =
    'Get information about a specific table including column names, data types, and constraints.';

  constructor(private databaseService: DatabaseService) {
    super();
  }

  async _call(tableName: string): Promise<string> {
    try {
      const info: Record<string, unknown>[] =
        await this.databaseService.getTableInfo(tableName);
      return JSON.stringify(info, null, 2);
    } catch (error) {
      return `Error getting table info: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

export class GetSampleDataTool extends Tool {
  name = 'get_sample_data';
  description =
    'Get sample data from a specific table. Use this to understand the structure and content of tables.';

  constructor(private databaseService: DatabaseService) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const [tableName, limitStr] = input.split(',').map((s) => s.trim());
      const limit = limitStr ? parseInt(limitStr, 10) : 5;
      const data = await this.databaseService.getSampleData(tableName, limit);
      return JSON.stringify(data, null, 2);
    } catch (error) {
      return `Error getting sample data: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

export class GetProductAnalyticsTool extends Tool {
  name = 'get_product_analytics';
  description =
    'Get product analytics including sales, ratings, and performance metrics.';

  constructor(private databaseService: DatabaseService) {
    super();
  }

  async _call(): Promise<string> {
    try {
      const result = await this.databaseService.executeQuery(
        'SELECT * FROM product_analytics ORDER BY total_quantity_sold DESC',
      );
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return `Error getting product analytics: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

export class GetOrderSummaryTool extends Tool {
  name = 'get_order_summary';
  description =
    'Get order summary information including user details, order amounts, and status.';

  constructor(private databaseService: DatabaseService) {
    super();
  }

  async _call(): Promise<string> {
    try {
      const result = await this.databaseService.executeQuery(
        'SELECT * FROM order_summary ORDER BY created_at DESC',
      );
      return JSON.stringify(result, null, 2);
    } catch (error) {
      return `Error getting order summary: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

export class SayAlohaTool extends Tool {
  name = 'say_aloha';
  description = 'Returns a friendly greeting: Aloha!';

  _call(): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('Aloha! This is a test of tool chaining.');
      }, 1000);
    });
  }
}
