-- Initialize database with sample data for LangGraph SQL tools

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Create products table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50),
    stock_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL
);

-- Create reviews table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample users
INSERT INTO users (username, email, first_name, last_name, last_login) VALUES
('john_doe', 'john@example.com', 'John', 'Doe', '2024-01-15 10:30:00'),
('jane_smith', 'jane@example.com', 'Jane', 'Smith', '2024-01-16 14:20:00'),
('bob_wilson', 'bob@example.com', 'Bob', 'Wilson', '2024-01-14 09:15:00'),
('alice_brown', 'alice@example.com', 'Alice', 'Brown', '2024-01-17 16:45:00'),
('charlie_davis', 'charlie@example.com', 'Charlie', 'Davis', '2024-01-13 11:30:00');

-- Insert sample products
INSERT INTO products (name, description, price, category, stock_quantity) VALUES
('Laptop Pro', 'High-performance laptop for professionals', 1299.99, 'Electronics', 25),
('Smartphone X', 'Latest smartphone with advanced features', 799.99, 'Electronics', 50),
('Wireless Headphones', 'Noise-cancelling wireless headphones', 199.99, 'Electronics', 30),
('Coffee Maker', 'Automatic coffee maker with timer', 89.99, 'Home & Kitchen', 15),
('Running Shoes', 'Comfortable running shoes for athletes', 129.99, 'Sports', 40),
('Backpack', 'Durable backpack for daily use', 59.99, 'Fashion', 60),
('Gaming Mouse', 'High-precision gaming mouse', 79.99, 'Electronics', 20),
('Yoga Mat', 'Non-slip yoga mat for workouts', 29.99, 'Sports', 35);

-- Insert sample orders
INSERT INTO orders (user_id, total_amount, status) VALUES
(1, 1299.99, 'completed'),
(2, 999.98, 'completed'),
(3, 189.98, 'pending'),
(4, 259.98, 'completed'),
(5, 79.99, 'shipped'),
(1, 199.99, 'completed'),
(2, 129.99, 'pending'),
(3, 89.99, 'completed');

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
(1, 1, 1, 1299.99),
(2, 2, 1, 799.99),
(2, 3, 1, 199.99),
(3, 4, 1, 89.99),
(3, 6, 1, 59.99),
(4, 5, 2, 129.99),
(5, 7, 1, 79.99),
(6, 3, 1, 199.99),
(7, 5, 1, 129.99),
(8, 4, 1, 89.99);

-- Insert sample reviews
INSERT INTO reviews (user_id, product_id, rating, comment) VALUES
(1, 1, 5, 'Excellent laptop, very fast and reliable!'),
(2, 2, 4, 'Great phone, camera quality is amazing'),
(3, 3, 5, 'Best headphones I have ever used'),
(4, 4, 3, 'Good coffee maker, but could be quieter'),
(5, 5, 5, 'Perfect for my daily runs'),
(1, 3, 4, 'Good sound quality, comfortable fit'),
(2, 1, 5, 'Worth every penny, highly recommend'),
(3, 6, 4, 'Durable and spacious backpack');

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Create a view for order summary
CREATE VIEW order_summary AS
SELECT 
    o.id as order_id,
    u.username,
    u.email,
    o.total_amount,
    o.status,
    o.created_at,
    COUNT(oi.id) as item_count
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, u.username, u.email, o.total_amount, o.status, o.created_at;

-- Create a view for product analytics
CREATE VIEW product_analytics AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.price,
    p.stock_quantity,
    COUNT(oi.id) as total_orders,
    SUM(oi.quantity) as total_quantity_sold,
    AVG(r.rating) as avg_rating,
    COUNT(r.id) as review_count
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
LEFT JOIN reviews r ON p.id = r.product_id
GROUP BY p.id, p.name, p.category, p.price, p.stock_quantity; 