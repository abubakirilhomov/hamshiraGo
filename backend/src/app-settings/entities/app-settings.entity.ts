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
   * When true: medic must have balance >= platformFee to accept an order.
   * platformFee is deducted at accept; full netPrice is credited at DONE.
   * When false: no wallet check; platformFee deducted at DONE as before.
   */
  @Column({ type: 'boolean', default: false })
  isPaidMode!: boolean;

  @UpdateDateColumn()
  updatedAt!: Date;
}
