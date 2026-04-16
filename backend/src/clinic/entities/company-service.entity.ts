import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('company_services')
export class CompanyService {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  category!: string; // CONSULTATION | LAB | DIAGNOSTIC | PROCEDURE

  @Column({ type: 'int' })
  price!: number; // UZS

  /** Minimum price for variable-price operations (overrides Service.priceMin) */
  @Column({ type: 'int', nullable: true, default: null })
  priceMin!: number | null;

  /** Maximum price for variable-price operations (overrides Service.priceMax) */
  @Column({ type: 'int', nullable: true, default: null })
  priceMax!: number | null;

  @Column({ type: 'int', nullable: true })
  durationMinutes!: number | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
