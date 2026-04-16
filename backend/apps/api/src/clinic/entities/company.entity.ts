import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  legalName!: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 30 })
  phone!: string;

  @Column({ type: 'text', nullable: true })
  address!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat!: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng!: number | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  logoUrl!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  licenseNumber!: string | null;

  @Column({ type: 'date', nullable: true })
  licenseExpiry!: Date | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ type: 'uuid', nullable: true })
  parentId!: string | null;

  @Column({ type: 'jsonb', nullable: true, default: '{}' })
  settings!: Record<string, unknown>;

  @Column({ type: 'boolean', default: false, nullable: true })
  pilotEnded!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
