import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Order } from './order.entity';
import { Review } from './review.entity';
import { UserEvent } from './user-event.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  first_name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  last_name: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_login: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @OneToMany(() => Order, (order: Order) => order.user)
  orders: Order[];

  @OneToMany(() => Review, (review: Review) => review.user)
  reviews: Review[];

  @OneToMany(() => UserEvent, (event: UserEvent) => event.user)
  events: UserEvent[];
}
