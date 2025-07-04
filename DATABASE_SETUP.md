# Database Setup Guide

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=langchain_chatbot
DB_USER=langchain_user
DB_PASSWORD=langchain_password
```

## Starting the Database

1. **Start PostgreSQL with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Check if the database is running:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   docker-compose logs postgres
   ```

## Database Access

### PgAdmin (Web Interface)
- URL: http://localhost:8080
- Email: admin@langchain.com
- Password: admin123

### Direct Connection
- Host: localhost
- Port: 5432
- Database: langchain_chatbot
- Username: langchain_user
- Password: langchain_password

## Sample Data

The database comes pre-loaded with sample data including:

### Tables
- `users` - User accounts and profiles
- `products` - Product catalog with categories and pricing
- `orders` - Customer orders with status tracking
- `order_items` - Individual items in each order
- `reviews` - Product reviews and ratings

### Views
- `order_summary` - Aggregated order information
- `product_analytics` - Product performance metrics

## Example Queries

You can test the database with these example queries:

```sql
-- Get all products
SELECT * FROM products;

-- Get user order history
SELECT u.username, o.total_amount, o.status 
FROM users u 
JOIN orders o ON u.id = o.user_id;

-- Get product reviews
SELECT p.name, r.rating, r.comment 
FROM products p 
JOIN reviews r ON p.id = r.product_id;

-- Get order summary
SELECT * FROM order_summary;

-- Get product analytics
SELECT * FROM product_analytics;
```

## Health Check

Test the database connection:
```bash
curl http://localhost:3000/chat/health
```

## Stopping the Database

```bash
docker-compose down
```

To remove all data:
```bash
docker-compose down -v
``` 