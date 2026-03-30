import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Order } from '../../orders/entities/order.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  phone!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  pushToken!: string | null;

  @Column({ type: 'boolean', default: false, nullable: true })
  isBlocked!: boolean;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 10, nullable: true, default: null })
  referralCode!: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true, default: null })
  referredBy!: string | null;

  @Column({ type: 'boolean', default: false, nullable: true })
  referralBonusUsed!: boolean;

  @Column({ type: 'int', default: 0, nullable: true })
  pendingReferralDiscount!: number;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @OneToMany(() => Order, (order) => order.client)
  orders!: Order[];
}
