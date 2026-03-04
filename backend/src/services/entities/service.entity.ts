import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Display name shown to clients (Russian — default) */
  @Column({ type: 'varchar', length: 255 })
  title!: string;

  /** Uzbek translation of title */
  @Column({ type: 'varchar', length: 255, nullable: true, default: null })
  titleUz!: string | null;

  /** Short description (optional) */
  @Column({ type: 'text', nullable: true, default: null })
  description!: string | null;

  /** Uzbek translation of description */
  @Column({ type: 'text', nullable: true, default: null })
  descriptionUz!: string | null;

  /** Category for grouping (e.g. "Уколы", "Капельницы", "Анализы") */
  @Column({ type: 'varchar', length: 100, nullable: true, default: null })
  category!: string | null;

  /** Uzbek translation of category */
  @Column({ type: 'varchar', length: 100, nullable: true, default: null })
  categoryUz!: string | null;

  /** Base price in UZS (integer, no decimals) */
  @Column({ type: 'int' })
  price!: number;

  /** Duration estimate in minutes */
  @Column({ type: 'int', nullable: true, default: null })
  durationMinutes!: number | null;

  /** Whether the service is currently available to order */
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  /** Display order within category */
  @Column({ type: 'int', default: 0 })
  sortOrder!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
