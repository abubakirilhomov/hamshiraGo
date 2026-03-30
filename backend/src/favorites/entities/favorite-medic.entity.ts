import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('favorite_medics')
@Index(['userId', 'medicId'], { unique: true })
export class FavoriteMedic {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  medicId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
