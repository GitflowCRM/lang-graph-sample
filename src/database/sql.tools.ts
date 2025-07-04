import { Tool } from '@langchain/core/tools';
import { DatabaseService } from './database.service';

export class QueryDatabaseTool extends Tool {
  name = 'query_database';
  description =
    'Execute SQL queries on the database. Use list_tables first to see available tables, then get_table_info to understand table structure before writing queries. Available tables include: users, products, orders, reviews, order_items, order_summary, and product_analytics. Always use parameterized queries for safety.';

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
  description =
    'List all available tables in the database. Use this first to understand what tables are available before writing SQL queries.';

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
    'Get detailed information about a specific table including column names, data types, and constraints. Use this to understand the structure of a table before writing SQL queries. Input should be the table name.';

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

export class GetDatabaseSchemaTool extends Tool {
  name = 'get_database_schema';
  description =
    'Get a comprehensive overview of the database schema including all tables, their columns, and relationships. Use this to understand the overall database structure before writing queries.';

  constructor(private databaseService: DatabaseService) {
    super();
  }

  async _call(): Promise<string> {
    try {
      const tables = await this.databaseService.listTables();
      let schemaInfo = 'Database Schema Overview:\n\n';

      for (const tableName of tables) {
        const tableInfo = await this.databaseService.getTableInfo(tableName);
        schemaInfo += `Table: ${tableName}\n`;
        schemaInfo += 'Columns:\n';
        tableInfo.forEach(
          (column: {
            column_name: string;
            data_type: string;
            is_nullable: string;
          }) => {
            schemaInfo += `  - ${column.column_name} (${column.data_type})${column.is_nullable === 'NO' ? ' NOT NULL' : ''}\n`;
          },
        );
        schemaInfo += '\n';
      }

      return schemaInfo;
    } catch (error) {
      return `Error getting database schema: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

export class CountRowsTool extends Tool {
  name = 'count_rows';
  description =
    'Count the number of rows in a specific table. Input should be the table name. Use this to answer questions like "How many users/orders/products are there?" Always use this tool for factual counts.';

  constructor(private databaseService: DatabaseService) {
    super();
  }

  async _call(tableName: string): Promise<string> {
    try {
      const client = await this.databaseService.getPool().connect();
      try {
        const result = await client.query(
          `SELECT COUNT(*) AS count FROM ${tableName}`,
        );
        const count = (result.rows[0] as { count: string }).count;
        return `There are ${count} rows in the ${tableName} table.`;
      } finally {
        client.release();
      }
    } catch (error) {
      return `Error counting rows: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

export class GetRowWithExtremeValueTool extends Tool {
  name = 'get_row_with_extreme_value';
  description =
    'Get the row with the maximum (highest, most) or minimum (lowest, least) value in a specific column of a table. Use for questions like "Which product has the highest stock?" or "Which order has the lowest total amount?" Input should be: table name, column name, and either "max" (for highest/maximum/most) or "min" (for lowest/minimum/least). Example: "products, stock_quantity, max" for highest stock product, or "products, price, min" for lowest price product.';

  constructor(private databaseService: DatabaseService) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const [table, column, extreme = 'max'] = input
        .split(',')
        .map((s) => s.trim());
      if (!table || !column) {
        return 'Error: Please provide both table name and column name.';
      }
      const direction = extreme.toLowerCase() === 'min' ? 'ASC' : 'DESC';
      const query = `SELECT * FROM ${table} ORDER BY ${column} ${direction} LIMIT 1`;
      const result = await this.databaseService.executeQuery(query);
      return result.length > 0
        ? JSON.stringify(result[0], null, 2)
        : `No rows found in ${table}.`;
    } catch (error) {
      return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
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
