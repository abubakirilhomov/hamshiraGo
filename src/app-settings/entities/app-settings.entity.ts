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

  @UpdateDateColumn()
  updatedAt!: Date;
}
