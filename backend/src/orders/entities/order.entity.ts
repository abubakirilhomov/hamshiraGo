import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Medic } from '../../medics/entities/medic.entity';
import { OrderLocation } from './order-location.entity';
import { OrderStatus } from './order-status.enum';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  clientId!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  medicId!: string | null;

  /** UUID of the service from catalog — nullable for legacy rows created before catalog */
  @Column({ type: 'varchar', length: 255, nullable: true })
  serviceId!: string | null;

  /** Snapshot of service title at the time of order */
  @Column({ type: 'varchar', length: 255, nullable: true })
  serviceTitle!: string | null;

  /** Price taken from service catalog at order time */
  @Column({ type: 'int', nullable: true })
  priceAmount!: number | null;

  @Column({ type: 'int', default: 0, nullable: true })
  discountAmount!: number | null;

  /** Platform commission (10% of net price), credited to platform account */
  @Column({ type: 'int', default: 0, nullable: true })
  platformFee!: number;

  @Index()
  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.CREATED,
  })
  status!: OrderStatus;

  /** Internal dispatch state — does not replace order status */
  @Column({ type: 'varchar', length: 50, nullable: true, default: null })
  dispatchStatus!: 'SEARCHING' | 'ASSIGNED' | 'NO_MEDICS' | 'FAILED' | null;

  /** Reason for cancellation — set when status transitions to CANCELED */
  @Column({ type: 'varchar', length: 500, nullable: true })
  cancelReason?: string | null;

  /** Rating left by client after order completion (1-5), null if not rated yet */
  @Column({ type: 'smallint', nullable: true, default: null })
  clientRating!: number | null;

  /** Optional text review left by client */
  @Column({ type: 'varchar', length: 1000, nullable: true, default: null })
  clientReview!: string | null;

  @Index()
  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;

  @ManyToOne(() => User, (u) => u.orders, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client!: User;

  @ManyToOne(() => Medic, (m) => m.orders, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'medicId' })
  medic!: Medic | null;

  @OneToOne(() => OrderLocation, (loc) => loc.order, { cascade: true })
  location!: OrderLocation;
}
