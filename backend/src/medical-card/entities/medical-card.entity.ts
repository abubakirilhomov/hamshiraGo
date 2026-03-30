import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('medical_cards')
export class MedicalCard {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  userId!: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  bloodType!: string | null;

  @Column({ type: 'text', nullable: true })
  allergies!: string | null;

  @Column({ type: 'text', nullable: true })
  chronicDiseases!: string | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @UpdateDateColumn()
  updatedAt!: Date;
}
