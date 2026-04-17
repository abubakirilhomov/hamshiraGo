import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('company_room_doctors')
export class CompanyRoomDoctor {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  roomId!: string;

  @Column({ type: 'uuid' })
  doctorId!: string;

  @Column({ type: 'int' })
  dayOfWeek!: number; // 1=Monday ... 7=Sunday

  @Column({ type: 'varchar', length: 5 })
  startTime!: string; // "09:00"

  @Column({ type: 'varchar', length: 5 })
  endTime!: string; // "18:00"

  @CreateDateColumn()
  createdAt!: Date;
}
