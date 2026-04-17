import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('voice_sessions')
export class VoiceSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  clientId!: string | null;

  @Column({ type: 'varchar', length: 5, default: 'ru' })
  lang!: string;

  @Column({ type: 'jsonb', default: '[]' })
  messages!: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;

  @Column({ type: 'varchar', length: 20, default: 'ACTIVE' })
  status!: 'ACTIVE' | 'COMPLETED';

  @Column({ type: 'varchar', length: 20, nullable: true, default: null })
  recommendation!: 'DOCTOR' | 'NURSE' | 'NONE' | null;

  @Column({ type: 'varchar', length: 100, nullable: true, default: null })
  suggestedSpecialization!: string | null;

  @Column({ type: 'uuid', nullable: true, default: null })
  suggestedServiceId!: string | null;

  @Column({ type: 'int', default: 0 })
  exchangeCount!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
