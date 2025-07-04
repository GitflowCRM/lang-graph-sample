import { DataSource } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Product } from '../database/entities/product.entity';
import { Order } from '../database/entities/order.entity';
import { OrderItem } from '../database/entities/order-item.entity';
import { Review } from '../database/entities/review.entity';
import { UserEvent } from '../database/entities/user-event.entity';
import { faker } from '@faker-js/faker';

const NUM_USERS = 50;
const NUM_PRODUCTS = 100;
const NUM_ORDERS = 200;
const NUM_ORDER_ITEMS = 400;
const NUM_REVIEWS = 200;
const NUM_EVENTS = 1000;

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'langchain_user',
  password: process.env.DB_PASSWORD || 'langchain_password',
  database: process.env.DB_NAME || 'langchain_chatbot',
  entities: [User, Product, Order, OrderItem, Review, UserEvent],
  synchronize: false,
});

async function seed() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);
  const productRepo = AppDataSource.getRepository(Product);
  const orderRepo = AppDataSource.getRepository(Order);
  const orderItemRepo = AppDataSource.getRepository(OrderItem);
  const reviewRepo = AppDataSource.getRepository(Review);
  const eventRepo = AppDataSource.getRepository(UserEvent);

  // USERS
  const users: User[] = [];
  for (let i = 0; i < NUM_USERS; i++) {
    const user = userRepo.create({
      username: faker.internet.userName() + i,
      email: faker.internet.email(),
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      last_login: faker.date.recent({ days: 90 }),
      is_active: true,
    });
    users.push(user);
  }
  await userRepo.save(users);

  // PRODUCTS
  const categories = [
    'Electronics',
    'Home',
    'Sports',
    'Fashion',
    'Toys',
    'Books',
    'Garden',
    'Automotive',
  ];
  const products: Product[] = [];
  for (let i = 0; i < NUM_PRODUCTS; i++) {
    const product = productRepo.create({
      name: faker.commerce.productName() + ' ' + i,
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 10, max: 2000 })),
      category: faker.helpers.arrayElement(categories),
      stock_quantity: faker.number.int({ min: 0, max: 100 }),
    });
    products.push(product);
  }
  await productRepo.save(products);

  // ORDERS
  const orders: Order[] = [];
  for (let i = 0; i < NUM_ORDERS; i++) {
    const user = faker.helpers.arrayElement(users);
    const order = orderRepo.create({
      user,
      total_amount: 0, // will update after order items
      status: faker.helpers.arrayElement([
        'pending',
        'completed',
        'shipped',
        'cancelled',
      ]),
      created_at: faker.date.recent({ days: 180 }),
      updated_at: faker.date.recent({ days: 90 }),
    });
    orders.push(order);
  }
  await orderRepo.save(orders);

  // ORDER ITEMS
  const orderItems: OrderItem[] = [];
  for (let i = 0; i < NUM_ORDER_ITEMS; i++) {
    const order = faker.helpers.arrayElement(orders);
    const product = faker.helpers.arrayElement(products);
    const quantity = faker.number.int({ min: 1, max: 5 });
    const unit_price = product.price;
    const orderItem = orderItemRepo.create({
      order,
      product,
      quantity,
      unit_price,
    });
    orderItems.push(orderItem);
    order.total_amount += quantity * unit_price;
  }
  await orderItemRepo.save(orderItems);
  await orderRepo.save(orders); // update total_amounts

  // REVIEWS
  const reviews: Review[] = [];
  for (let i = 0; i < NUM_REVIEWS; i++) {
    const user = faker.helpers.arrayElement(users);
    const product = faker.helpers.arrayElement(products);
    const review = reviewRepo.create({
      user,
      product,
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: faker.lorem.sentence(),
      created_at: faker.date.recent({ days: 180 }),
    });
    reviews.push(review);
  }
  await reviewRepo.save(reviews);

  // USER EVENTS
  const eventTypes = [
    'login',
    'logout',
    'view_product',
    'add_to_cart',
    'purchase',
    'wishlist',
    'search',
    'review',
  ];
  const events: UserEvent[] = [];
  for (let i = 0; i < NUM_EVENTS; i++) {
    const user = faker.helpers.arrayElement(users);
    const event_type = faker.helpers.arrayElement(eventTypes);
    const event_data: Record<string, unknown> = {};
    if (
      event_type === 'view_product' ||
      event_type === 'wishlist' ||
      event_type === 'review'
    ) {
      event_data.product_id = faker.helpers.arrayElement(products).id;
      if (event_type === 'review') {
        event_data.rating = faker.number.int({ min: 1, max: 5 });
      }
    } else if (event_type === 'add_to_cart') {
      event_data.product_id = faker.helpers.arrayElement(products).id;
      event_data.quantity = faker.number.int({ min: 1, max: 3 });
    } else if (event_type === 'purchase') {
      event_data.order_id = faker.helpers.arrayElement(orders).id;
    } else if (event_type === 'login') {
      event_data.ip = faker.internet.ip();
    } else if (event_type === 'search') {
      event_data.query = faker.commerce.product();
    }
    const event = eventRepo.create({
      user,
      event_type,
      event_data,
      created_at: faker.date.recent({ days: 180 }),
    });
    events.push(event);
  }
  await eventRepo.save(events);

  console.log('Demo data seeded successfully!');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
