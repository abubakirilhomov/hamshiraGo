import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Doctor } from './doctor.entity';

@Entity('consultations')
export class Consultation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  @Index()
  clientId!: string;

  @Column('uuid')
  doctorId!: string;

  @ManyToOne(() => Doctor, { eager: true })
  @JoinColumn({ name: 'doctorId' })
  doctor!: Doctor;

  @Column({ type: 'varchar', length: 20, default: 'PENDING' })
  status!: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELED';

  /** AI-generated symptom summary */
  @Column({ type: 'text', nullable: true })
  symptoms!: string | null;

  /** Specialization suggested by AI triage */
  @Column({ type: 'varchar', length: 100, nullable: true })
  suggestedSpecialization!: string | null;

  /** Doctor's recommendations after consultation */
  @Column({ type: 'text', nullable: true })
  doctorNotes!: string | null;

  /** Auto-created nursing order (if any) */
  @Column('uuid', { nullable: true })
  createdOrderId!: string | null;

  /** Price in UZS */
  @Column({ type: 'int' })
  price!: number;

  /** Platform commission (15%) */
  @Column({ type: 'int', default: 0 })
  platformFee!: number;

  /** LiveKit room name for video call */
  @Column({ type: 'varchar', length: 255, nullable: true })
  videoRoomName!: string | null;

  /** Video call status */
  @Column({ type: 'varchar', length: 20, nullable: true, default: null })
  videoStatus!: 'CALLING' | 'ACTIVE' | 'ENDED' | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
