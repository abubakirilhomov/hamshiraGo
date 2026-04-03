import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('admin_audit_logs')
export class AdminAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Admin user ID or 'admin' for singleton admin */
  @Column({ type: 'varchar', length: 100 })
  @Index()
  adminId!: string;

  /** Action performed */
  @Column({ type: 'varchar', length: 100 })
  @Index()
  action!: string;

  /** Target entity type (order, medic, user, etc.) */
  @Column({ type: 'varchar', length: 50, nullable: true })
  targetType!: string | null;

  /** Target entity ID */
  @Column({ type: 'varchar', length: 100, nullable: true })
  targetId!: string | null;

  /** Additional details (JSON) */
  @Column({ type: 'text', nullable: true })
  details!: string | null;

  /** IP address */
  @Column({ type: 'varchar', length: 50, nullable: true })
  ip!: string | null;

  @CreateDateColumn()
  @Index()
  createdAt!: Date;
}
