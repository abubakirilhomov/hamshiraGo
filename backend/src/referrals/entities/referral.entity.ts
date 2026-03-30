import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('referrals')
export class Referral {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  referrerId!: string; // who invited

  @Column()
  referredId!: string; // who was invited

  @Column({ default: false })
  bonusPaid!: boolean;

  @Column({ type: 'int', default: 0 })
  bonusAmount!: number; // UZS discount given

  @CreateDateColumn()
  createdAt!: Date;
}
