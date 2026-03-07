import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @CreateDateColumn()
  createdAt!: Date;
}
