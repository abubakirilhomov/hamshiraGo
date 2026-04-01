import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('doctors')
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nameUz!: string | null;

  /** e.g. "Терапевт", "Кардиолог", "Невролог" */
  @Column({ type: 'varchar', length: 100 })
  specialization!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  specializationUz!: string | null;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  photoUrl!: string | null;

  /** Price per consultation in UZS */
  @Column({ type: 'int' })
  pricePerConsultation!: number;

  /** Phone for Telegram video call */
  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  rating!: number;

  @Column({ type: 'int', default: 0 })
  consultationCount!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
