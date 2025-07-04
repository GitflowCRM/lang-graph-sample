# TypeORM Integration Guide

## Overview

We've successfully integrated TypeORM into the LangChain chatbot project, providing:
- **Type-safe database operations** with TypeORM entities
- **Repository pattern** for clean data access
- **Enhanced tools** for LangGraph workflows
- **Better query performance** with optimized database connections

## Database Entities

### 1. User Entity (`src/database/entities/user.entity.ts`)
```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  // ... other fields
}
```

### 2. Product Entity (`src/database/entities/product.entity.ts`)
```typescript
@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  // ... other fields
}
```

### 3. Order Entity (`src/database/entities/order.entity.ts`)
```typescript
@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => OrderItem, (orderItem) => orderItem.order)
  orderItems: OrderItem[];
}
```

### 4. OrderItem Entity (`src/database/entities/order-item.entity.ts`)
```typescript
@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.orderItems)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => Product, (product) => product.orderItems)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
```

### 5. Review Entity (`src/database/entities/review.entity.ts`)
```typescript
@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.reviews)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Product, (product) => product.reviews)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
```

## Available Tools

### SQL Tools (Raw SQL Queries)
1. **`query_database`** - Execute custom SQL queries
2. **`list_tables`** - List all available tables
3. **`get_table_info`** - Get table schema information
4. **`get_sample_data`** - Get sample data from tables
5. **`get_product_analytics`** - Get product analytics view
6. **`get_order_summary`** - Get order summary view

### TypeORM Tools (Repository-based)
1. **`get_users`** - Get all users with TypeORM
2. **`get_products`** - Get all products with TypeORM
3. **`get_orders`** - Get orders with relations
4. **`get_reviews`** - Get reviews with relations
5. **`search_products`** - Search products by criteria

## Usage Examples

### Chat with Database Queries
```bash
# Get all products
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me all products"}'

# Search for electronics
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Find electronics products under $200"}'

# Get user orders
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me all orders with user details"}'

# Get product reviews
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me product reviews with ratings"}'
```

### Example Tool Usage in LangGraph
```typescript
// The model can now use tools like:
// - get_products (TypeORM)
// - search_products (TypeORM with filtering)
// - query_database (Raw SQL)
// - get_orders (TypeORM with relations)
```

## Database Service Methods

### TypeORM Repository Methods
```typescript
// Get all users
const users = await databaseService.getUsers();

// Get all products
const products = await databaseService.getProducts();

// Get orders with relations
const orders = await databaseService.getOrders();

// Get reviews with relations
const reviews = await databaseService.getReviews();
```

### Legacy Pool Methods (for SQL tools)
```typescript
// Execute raw SQL
const result = await databaseService.executeQuery('SELECT * FROM users');

// Get table info
const tableInfo = await databaseService.getTableInfo('products');

// List tables
const tables = await databaseService.listTables();
```

## Configuration

### Environment Variables
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=langchain_chatbot
DB_USER=langchain_user
DB_PASSWORD=langchain_password
```

### TypeORM Configuration
```typescript
TypeOrmModule.forRootAsync({
  useFactory: (configService: ConfigService) => ({
    type: 'postgres',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5432),
    username: configService.get('DB_USER', 'langchain_user'),
    password: configService.get('DB_PASSWORD', 'langchain_password'),
    database: configService.get('DB_NAME', 'langchain_chatbot'),
    entities: Object.values(entities),
    synchronize: false, // Keep false for production
    logging: true,
  }),
  inject: [ConfigService],
})
```

## Benefits of TypeORM Integration

1. **Type Safety**: Full TypeScript support with entity types
2. **Relations**: Easy handling of database relationships
3. **Query Builder**: Powerful query building capabilities
4. **Migrations**: Database schema versioning
5. **Repository Pattern**: Clean separation of data access logic
6. **Performance**: Optimized queries with eager/lazy loading
7. **Maintainability**: Better code organization and structure

## Next Steps

1. **Add Migrations**: Create TypeORM migrations for schema changes
2. **Add Validation**: Implement DTOs with class-validator
3. **Add Caching**: Implement Redis caching for frequently accessed data
4. **Add Pagination**: Implement pagination for large datasets
5. **Add Search**: Implement full-text search capabilities

## Testing

Test the integration:
```bash
# Start the database
docker-compose up -d

# Start the application
bun run start:dev

# Test database health
curl http://localhost:3000/chat/health

# Test chat with database queries
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What products do you have in the database?"}'
``` 