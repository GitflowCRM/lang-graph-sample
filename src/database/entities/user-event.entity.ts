import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_events')
export class UserEvent {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.events, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 50 })
  event_type: string;

  @Column({ type: 'jsonb', nullable: true })
  event_data: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
} 