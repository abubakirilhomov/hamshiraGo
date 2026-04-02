import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Consultation } from './consultation.entity';

@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  consultationId!: string;

  @Column({ type: 'uuid' })
  @Index()
  clientId!: string;

  @Column({ type: 'uuid' })
  serviceId!: string;

  @Column({ type: 'varchar', length: 255 })
  serviceTitle!: string;

  @Column({ type: 'int' })
  servicePrice!: number;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'PENDING',
  })
  status!: 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'EXPIRED';

  @Column({ type: 'uuid', nullable: true })
  orderId!: string | null;

  @Column({ type: 'text', nullable: true })
  doctorNotes!: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt!: Date;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @ManyToOne(() => Consultation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'consultationId' })
  consultation!: Consultation;
}
