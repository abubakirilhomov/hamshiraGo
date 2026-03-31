import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  Unique,
} from 'typeorm';

export type AuthorRole = 'client' | 'medic';
export type TargetRole = 'medic' | 'client';

/**
 * Composite unique: one review per order per author role
 * (client reviews medic once, medic reviews client once)
 */
@Entity('reviews')
@Unique(['orderId', 'authorRole'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** UUID of the completed order */
  @Index()
  @Column({ type: 'varchar', length: 255 })
  orderId!: string;

  /** UUID of the reviewer (userId or medicId) */
  @Index()
  @Column({ type: 'varchar', length: 255 })
  authorId!: string;

  /** Role of the reviewer */
  @Column({ type: 'varchar', length: 10 })
  authorRole!: AuthorRole;

  /** UUID of the reviewed party */
  @Index()
  @Column({ type: 'varchar', length: 255 })
  targetId!: string;

  /** Role of the reviewed party */
  @Column({ type: 'varchar', length: 10 })
  targetRole!: TargetRole;

  /** Rating 1–5 */
  @Column({ type: 'smallint' })
  rating!: number;

  /** Optional text comment, up to 1000 chars */
  @Column({ type: 'varchar', length: 1000, nullable: true, default: null })
  comment!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}
