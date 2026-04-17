import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('clinic_prescriptions')
export class ClinicPrescription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid' })
  appointmentId!: string;

  @Column({ type: 'uuid' })
  doctorId!: string;

  @Column({ type: 'varchar', length: 255 })
  patientName!: string;

  @Column({ type: 'varchar', length: 30 })
  patientPhone!: string;

  @Column({ type: 'uuid', nullable: true })
  patientId!: string | null;

  @Column({ type: 'text' })
  content!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status!: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

  @CreateDateColumn()
  createdAt!: Date;
}
