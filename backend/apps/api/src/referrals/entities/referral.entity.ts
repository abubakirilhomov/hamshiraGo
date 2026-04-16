import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column()
  referrerId!: string; // who invited

  @Index()
  @Column()
  referredId!: string; // who was invited

  @Column({ default: false })
  bonusPaid!: boolean;

  @Column({ type: 'int', default: 0 })
  bonusAmount!: number; // UZS discount given

  @CreateDateColumn()
  createdAt!: Date;
}
