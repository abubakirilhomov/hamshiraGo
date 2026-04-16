import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * Single-row table — always has exactly one record with id = 'singleton'.
 * Use AppSettingsService.get() / AppSettingsService.patch() to read/write.
 */
@Entity('app_settings')
export class AppSettings {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  id!: string; // always 'singleton'

  /**
   * When true: medic must have balance >= fee to accept an order.
   * Fee is deducted from balance at accept; netPrice is credited to earnings at DONE.
   * When false: no wallet check, earnings are still credited at DONE.
   */
  @Column({ type: 'boolean', default: false })
  isPaidMode!: boolean;

  /**
   * Commission rate as integer percent (e.g. 10 = 10%).
   * Deducted from medic's balance when they accept an order in paid mode.
   */
  @Column({ type: 'int', default: 10 })
  commissionRate!: number;

  /**
   * Urgent fee markup as integer percent (e.g. 50 = 50% surcharge on service price).
   * Applied when client marks order as urgent OR current hour falls in night window.
   */
  @Column({ type: 'int', nullable: true })
  urgentFeePercent!: number | null;

  @Column({ type: 'int', nullable: true })
  urgentStartHour!: number | null;

  @Column({ type: 'int', nullable: true })
  urgentEndHour!: number | null;

  /** Loyalty: flat points awarded per completed order (default 100) */
  @Column({ type: 'int', nullable: true })
  loyaltyPointsPerOrder!: number | null;

  /** Loyalty: points needed to reach SILVER tier (default 500) */
  @Column({ type: 'int', nullable: true })
  loyaltySilverThreshold!: number | null;

  /** Loyalty: points needed to reach GOLD tier (default 2000) */
  @Column({ type: 'int', nullable: true })
  loyaltyGoldThreshold!: number | null;

  /** Loyalty: 100 points = X UZS discount (default 1000) */
  @Column({ type: 'int', nullable: true })
  loyaltyRedemptionRate!: number | null;

  @UpdateDateColumn()
  updatedAt!: Date;
}
