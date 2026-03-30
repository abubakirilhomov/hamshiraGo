import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoriteMedic } from './entities/favorite-medic.entity';
import { Medic } from '../medics/entities/medic.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(FavoriteMedic)
    private favRepo: Repository<FavoriteMedic>,
    @InjectRepository(Medic)
    private medicRepo: Repository<Medic>,
  ) {}

  /** Add medic to favorites — no-op if already exists */
  async add(userId: string, medicId: string): Promise<void> {
    await this.favRepo
      .createQueryBuilder()
      .insert()
      .into(FavoriteMedic)
      .values({ userId, medicId })
      .orIgnore()
      .execute();
  }

  /** Remove medic from favorites — no-op if not exists */
  async remove(userId: string, medicId: string): Promise<void> {
    await this.favRepo.delete({ userId, medicId });
  }

  /** Returns list of favorites with medic info */
  async findByUser(userId: string): Promise<Array<{
    id: string;
    medicId: string;
    createdAt: Date;
    medic: { id: string; name: string; phone: string; rating: number | null; profilePhotoUrl: string | null };
  }>> {
    const favs = await this.favRepo.find({ where: { userId } });
    if (!favs.length) return [];

    const medicIds = favs.map((f) => f.medicId);
    const medics = await this.medicRepo
      .createQueryBuilder('m')
      .select(['m.id', 'm.name', 'm.phone', 'm.rating', 'm.profilePhotoUrl'])
      .where('m.id IN (:...ids)', { ids: medicIds })
      .getMany();

    const medicMap = new Map(medics.map((m) => [m.id, m]));

    return favs.map((f) => {
      const m = medicMap.get(f.medicId);
      return {
        id: f.id,
        medicId: f.medicId,
        createdAt: f.createdAt,
        medic: m
          ? { id: m.id, name: m.name, phone: m.phone, rating: m.rating, profilePhotoUrl: m.profilePhotoUrl }
          : { id: f.medicId, name: 'Unknown', phone: '', rating: null, profilePhotoUrl: null },
      };
    });
  }

  async isFavorite(userId: string, medicId: string): Promise<boolean> {
    const count = await this.favRepo.count({ where: { userId, medicId } });
    return count > 0;
  }

  /** Returns favorite medicId for user that is currently online/approved/unblocked, or null */
  async findActiveFavoriteMedicId(userId: string): Promise<string | null> {
    const fav = await this.favRepo.findOne({ where: { userId } });
    if (!fav) return null;

    // Check all favorites — return the first active one
    const favs = await this.favRepo.find({ where: { userId } });
    if (!favs.length) return null;

    const medicIds = favs.map((f) => f.medicId);
    const activeMedic = await this.medicRepo
      .createQueryBuilder('m')
      .where('m.id IN (:...ids)', { ids: medicIds })
      .andWhere('m.isOnline = true')
      .andWhere('m.verificationStatus = :status', { status: 'APPROVED' })
      .andWhere('m.isBlocked = false')
      .andWhere('m.latitude IS NOT NULL')
      .andWhere('m.longitude IS NOT NULL')
      .andWhere('m.profilePhotoUrl IS NOT NULL')
      .orderBy('m.rating', 'DESC', 'NULLS LAST')
      .getOne();

    return activeMedic?.id ?? null;
  }
}
