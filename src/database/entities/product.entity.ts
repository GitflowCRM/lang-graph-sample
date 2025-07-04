import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { Review } from './review.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string;

  @Column({ type: 'int', default: 0 })
  stock_quantity: number;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => OrderItem, (orderItem: OrderItem) => orderItem.product)
  orderItems: OrderItem[];

  @OneToMany(() => Review, (review: Review) => review.product)
  reviews: Review[];
}
