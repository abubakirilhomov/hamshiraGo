import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('treatment_courses')
export class TreatmentCourse {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  clientId!: string;

  @Column()
  title!: string; // e.g. "Курс инъекций"

  @Column()
  serviceId!: string; // linked service

  @Column({ type: 'int' })
  totalProcedures!: number;

  @Column({ type: 'int', default: 0 })
  completedProcedures!: number;

  @Column({ type: 'int' })
  intervalDays!: number; // days between procedures

  @Column({ type: 'timestamp', nullable: true })
  nextDate!: Date | null;

  @Column({ default: 'ACTIVE' })
  status!: string; // ACTIVE | COMPLETED | PAUSED

  /** Reminder already sent for current nextDate — reset when nextDate advances */
  @Column({ type: 'boolean', default: false, nullable: true })
  reminderSentToday!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
