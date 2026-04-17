import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ClientErrorStatus } from './client-error-status.enum';

@Entity('client_errors')
export class ClientError {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** User ID if the user was authenticated */
  @Column({ type: 'varchar', length: 36, nullable: true, default: null })
  userId!: string | null;

  /** App type: 'mobile' | 'medic' */
  @Column({ type: 'varchar', length: 20, nullable: true, default: null })
  appType!: string | null;

  /** Screen/route where the error occurred */
  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  screen!: string | null;

  /** Short error message */
  @Column({ type: 'varchar', length: 500, nullable: true, default: null })
  message!: string | null;

  /** Full stack trace */
  @Column({ type: 'text', nullable: true, default: null })
  stacktrace!: string | null;

  /** Extra metadata (JSON string) */
  @Column({ type: 'text', nullable: true, default: null })
  meta!: string | null;

  /** Triage status */
  @Column({
    type: 'varchar',
    length: 20,
    default: ClientErrorStatus.NEW,
    nullable: true,
  })
  status!: ClientErrorStatus;

  /** Device model/OS info */
  @Column({ type: 'varchar', length: 200, nullable: true, default: null })
  deviceInfo!: string | null;

  /** App version string (e.g. "1.2.3") */
  @Column({ type: 'varchar', length: 50, nullable: true, default: null })
  appVersion!: string | null;

  /** Machine-readable error code for grouping (e.g. "FETCH_FAILED") */
  @Column({ type: 'varchar', length: 100, nullable: true, default: null })
  errorCode!: string | null;

  /** Number of times this error has been reported (auto-incremented on grouping) */
  @Column({ type: 'int', default: 1, nullable: true })
  count!: number;

  /** Timestamp when the issue was resolved (FIXED or IGNORED) */
  @Column({ type: 'timestamp', nullable: true, default: null })
  resolvedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
