import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Company } from './company.entity';

@Entity('company_users')
export class CompanyUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  companyId!: string;

  @ManyToOne(() => Company)
  @JoinColumn({ name: 'companyId' })
  company!: Company;

  @Column({ type: 'uuid', nullable: true })
  branchId!: string | null;

  @Column({ type: 'varchar', length: 20 })
  role!: 'CEO' | 'RECEPTION' | 'DOCTOR';

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 30 })
  phone!: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'uuid', nullable: true })
  doctorId!: string | null;

  @Column({ type: 'varchar', nullable: true })
  pushToken!: string | null;

  @Column({ type: 'varchar', nullable: true })
  telegramChatId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
