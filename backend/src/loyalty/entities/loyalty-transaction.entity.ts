import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('loyalty_transactions')
export class LoyaltyTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  userId!: string;

  @Column('uuid', { nullable: true })
  orderId!: string | null;

  @Column({ type: 'varchar', length: 20 })
  type!: 'EARNED' | 'SPENT' | 'BONUS' | 'MILESTONE';

  @Column('int')
  points!: number; // positive for earned, negative for spent

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
