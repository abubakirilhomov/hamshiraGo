import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('medic_schedules')
export class MedicSchedule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  medicId!: string;

  @Column({ type: 'int' })
  dayOfWeek!: number; // 0=Sunday, 1=Monday, ..., 6=Saturday

  @Column({ type: 'int' })
  startHour!: number; // 0-23

  @Column({ type: 'int' })
  endHour!: number; // 0-23

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
