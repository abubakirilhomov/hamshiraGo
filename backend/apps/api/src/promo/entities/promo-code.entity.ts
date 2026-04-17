import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('promo_codes')
export class PromoCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  @Index()
  code!: string;

  /** Discount in UZS (fixed amount) */
  @Column({ type: 'int', default: 0 })
  discountAmount!: number;

  /** Discount in percent (0–100). If both set, amount takes priority */
  @Column({ type: 'int', default: 0 })
  discountPercent!: number;

  /** Max number of times this code can be used (0 = unlimited) */
  @Column({ type: 'int', default: 0 })
  maxUses!: number;

  /** How many times it's been used */
  @Column({ type: 'int', default: 0 })
  usedCount!: number;

  /** Expiration date (null = never expires) */
  @Column({ type: 'timestamp', nullable: true })
  expiresAt!: Date | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
