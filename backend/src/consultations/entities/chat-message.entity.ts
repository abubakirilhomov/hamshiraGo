import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Consultation ID (nullable for pre-consultation triage) */
  @Column('uuid', { nullable: true })
  @Index()
  consultationId!: string | null;

  /** Order ID (for client ↔ medic chat within an order) */
  @Column('uuid', { nullable: true })
  @Index()
  orderId!: string | null;

  /** Who sent this message */
  @Column('uuid')
  userId!: string;

  @Column({ type: 'varchar', length: 10 })
  role!: 'user' | 'assistant' | 'doctor';

  @Column({ type: 'text' })
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
