import { Tool } from '@langchain/core/tools';
import { DatabaseService } from './database.service';

export class GetUsersTool extends Tool {
  name = 'get_users';
  description = 'Get all users from the database with their basic information.';

  constructor(private databaseService: DatabaseService) {
    super();
  }

  async _call(): Promise<string> {
    try {
      const users = await this.databaseService.getUsers();
      return JSON.stringify(users, null, 2);
    } catch (error) {
      return `Error getting users: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
    }
  }
}

export class GetProductsTool extends Tool {
  name = 'get_products';
  description = 'Get all products from the database with their details and pricing.';

  constructor(private databaseService: DatabaseService) {
    super();
  }

  async _call(): Promise<string> {
    try {
      const products = await this.databaseService.getProducts();
      return JSON.stringify(products, null, 2);
    } catch (error) {
      return `Error getting products: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
    }
  }
}

export class GetOrdersTool extends Tool {
  name = 'get_orders';
  description = 'Get all orders with user details and order items.';

  constructor(private databaseService: DatabaseService) {
    super();
  }

  async _call(): Promise<string> {
    try {
      const orders = await this.databaseService.getOrders();
      return JSON.stringify(orders, null, 2);
    } catch (error) {
      return `Error getting orders: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
    }
  }
}

export class GetReviewsTool extends Tool {
  name = 'get_reviews';
  description = 'Get all product reviews with user and product information.';

  constructor(private databaseService: DatabaseService) {
    super();
  }

  async _call(): Promise<string> {
    try {
      const reviews = await this.databaseService.getReviews();
      return JSON.stringify(reviews, null, 2);
    } catch (error) {
      return `Error getting reviews: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
    }
  }
}

export class SearchProductsTool extends Tool {
  name = 'search_products';
  description =
    'Search products by name, category, or price range. Input format: "category:Electronics" or "price_min:100,price_max:500" or "name:Laptop".';

  constructor(private databaseService: DatabaseService) {
    super();
  }

  async _call(input: string): Promise<string> {
    try {
      const products = await this.databaseService.getProducts();
      const searchTerms = input
        .toLowerCase()
        .split(',')
        .map((s) => s.trim());

      let filteredProducts = products;

      for (const term of searchTerms) {
        if (term.startsWith('category:')) {
          const category = term.split(':')[1];
          filteredProducts = filteredProducts.filter((p) =>
            p.category?.toLowerCase().includes(category),
          );
        } else if (term.startsWith('name:')) {
          const name = term.split(':')[1];
          filteredProducts = filteredProducts.filter((p) =>
            p.name.toLowerCase().includes(name),
          );
        } else if (term.startsWith('price_min:')) {
          const minPrice = parseFloat(term.split(':')[1]);
          filteredProducts = filteredProducts.filter(
            (p) => p.price >= minPrice,
          );
        } else if (term.startsWith('price_max:')) {
          const maxPrice = parseFloat(term.split(':')[1]);
          filteredProducts = filteredProducts.filter(
            (p) => p.price <= maxPrice,
          );
        }
      }

      return JSON.stringify(filteredProducts, null, 2);
    } catch (error) {
      return `Error searching products: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`;
    }
  }
} 