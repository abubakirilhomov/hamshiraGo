import { DataSource } from 'typeorm';
import { Service } from './entities/service.entity';

export const SERVICES_SEED: Partial<Service>[] = [
  // ── Уколы ──────────────────────────────────────────────────────────────────
  {
    title: 'Внутримышечный укол',
    titleUz: 'Mushak ichiga ukol',
    description: 'Введение лекарства внутримышечно',
    descriptionUz: 'Dori mushak ichiga yuboriladi',
    category: 'Уколы',
    categoryUz: 'Ukollar',
    price: 35000,
    durationMinutes: 15,
    sortOrder: 1,
  },
  {
    title: 'Внутривенный укол',
    titleUz: 'Vena ichiga ukol',
    description: 'Введение лекарства внутривенно (струйно)',
    descriptionUz: 'Dori vena ichiga (oqim usulida) yuboriladi',
    category: 'Уколы',
    categoryUz: 'Ukollar',
    price: 50000,
    durationMinutes: 20,
    sortOrder: 2,
  },
  // ── Капельницы ─────────────────────────────────────────────────────────────
  {
    title: 'Капельница (1 флакон)',
    titleUz: 'Tomchilatgich (1 shisha)',
    description: 'Внутривенное капельное введение, 1 флакон',
    descriptionUz: 'Vena ichiga tomchilatib yuborish, 1 shisha',
    category: 'Капельницы',
    categoryUz: 'Tomchilatgichlar',
    price: 80000,
    durationMinutes: 60,
    sortOrder: 1,
  },
  {
    title: 'Капельница (2 флакона)',
    titleUz: 'Tomchilatgich (2 shisha)',
    description: 'Внутривенное капельное введение, 2 флакона',
    descriptionUz: 'Vena ichiga tomchilatib yuborish, 2 shisha',
    category: 'Капельницы',
    categoryUz: 'Tomchilatgichlar',
    price: 140000,
    durationMinutes: 120,
    sortOrder: 2,
  },
  // ── Анализы ────────────────────────────────────────────────────────────────
  {
    title: 'Забор крови из вены',
    titleUz: 'Venadan qon olish',
    description: 'Венозная кровь на анализы',
    descriptionUz: 'Tahlil uchun venadan qon olinadi',
    category: 'Анализы',
    categoryUz: 'Tahlillar',
    price: 40000,
    durationMinutes: 10,
    sortOrder: 1,
  },
  {
    title: 'Забор крови из пальца',
    titleUz: 'Barmoqdan qon olish',
    description: 'Капиллярная кровь на общий анализ',
    descriptionUz: 'Umumiy tahlil uchun kapillyar qon olinadi',
    category: 'Анализы',
    categoryUz: 'Tahlillar',
    price: 25000,
    durationMinutes: 10,
    sortOrder: 2,
  },
  // ── Перевязки ──────────────────────────────────────────────────────────────
  {
    title: 'Перевязка',
    titleUz: 'Bog\'lam almashtirish',
    description: 'Смена повязки, обработка раны',
    descriptionUz: 'Bog\'lam almashtiriladi, yara ishlanadi',
    category: 'Перевязки',
    categoryUz: 'Bog\'lam',
    price: 60000,
    durationMinutes: 20,
    sortOrder: 1,
  },
  // ── Измерения ──────────────────────────────────────────────────────────────
  {
    title: 'Измерение давления и пульса',
    titleUz: 'Bosim va puls o\'lchash',
    description: 'Тонометрия + ЧСС',
    descriptionUz: 'Tonometriya + yurak urish tezligi',
    category: 'Измерения',
    categoryUz: 'O\'lchashlar',
    price: 20000,
    durationMinutes: 10,
    sortOrder: 1,
  },
  {
    title: 'ЭКГ на дому',
    titleUz: 'Uyda EKG',
    description: 'Электрокардиограмма с расшифровкой',
    descriptionUz: 'Izohlash bilan elektrokardiogramma',
    category: 'Измерения',
    categoryUz: 'O\'lchashlar',
    price: 150000,
    durationMinutes: 30,
    sortOrder: 2,
  },
  // ── Уход ───────────────────────────────────────────────────────────────────
  {
    title: 'Уход за лежачим пациентом (1 час)',
    titleUz: 'Yotgan bemor parvarishi (1 soat)',
    description: 'Гигиенические процедуры, помощь с питанием',
    descriptionUz: 'Gigienik tartib-qoidalar, ovqatlanishda yordam',
    category: 'Уход',
    categoryUz: 'Parvarish',
    price: 100000,
    durationMinutes: 60,
    sortOrder: 1,
  },
];

export async function seedServices(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository(Service);
  for (const item of SERVICES_SEED) {
    const exists = await repo.findOne({ where: { title: item.title } });
    if (!exists) {
      await repo.save(repo.create(item));
    } else if (!exists.titleUz && item.titleUz) {
      // Back-fill i18n fields for existing rows
      await repo.update(exists.id, {
        titleUz: item.titleUz,
        descriptionUz: item.descriptionUz ?? null,
        categoryUz: item.categoryUz ?? null,
      });
    }
  }
  console.log(`[Seed] Services table seeded (${SERVICES_SEED.length} entries)`);
}
