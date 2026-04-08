import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Doctor } from '../../consultations/entities/doctor.entity';

@Entity('doctor_slots')
export class DoctorSlot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  doctorId!: string;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: 'doctorId' })
  doctor!: Doctor;

  @Index()
  @Column({ type: 'timestamp' })
  startsAt!: Date;

  @Column({ type: 'timestamp' })
  endsAt!: Date;

  @Column({ type: 'boolean', default: false })
  isBooked!: boolean;

  @Column({ type: 'uuid', nullable: true, default: null })
  consultationId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
