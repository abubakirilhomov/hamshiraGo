import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { I18nExceptionFilter } from './common/filters/i18n-exception.filter';
import { I18nService } from './common/i18n/i18n.service';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { MedicsModule } from './medics/medics.module';
import { ServicesModule } from './services/services.module';
import { RealtimeModule } from './realtime/realtime.module';
import { PaymentsModule } from './payments/payments.module';
import { ClientErrorsModule } from './client-errors/client-errors.module';
import { AppSettingsModule } from './app-settings/app-settings.module';
import { TelegramBotModule } from './telegram/telegram-bot.module';
import { FavoritesModule } from './favorites/favorites.module';
import { MedicalCardModule } from './medical-card/medical-card.module';
import { ReferralsModule } from './referrals/referrals.module';
import { TreatmentCoursesModule } from './treatment-courses/treatment-courses.module';
import { ReviewsModule } from './reviews/reviews.module';
import { LoyaltyModule } from './loyalty/loyalty.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { DoctorsModule } from './doctors/doctors.module';
import { NpsModule } from './nps/nps.module';
import { PromoModule } from './promo/promo.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { VoiceAgentModule } from './voice-agent/voice-agent.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true, singleLine: true } }
          : undefined,
        redact: {
          paths: [
            'req.headers.authorization',
            'req.body.password',
            'req.body.passwordHash',
          ],
          censor: '[REDACTED]',
        },
        serializers: {
          req(req) {
            return {
              method: req.method,
              url: req.url,
              id: req.id,
            };
          },
        },
        autoLogging: {
          ignore: (req) => req.url === '/health',
        },
      },
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,   // 1 minute window
        limit: 120,    // 120 requests/min globally
      },
    ]),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: parseInt(process.env.DB_PORT ?? '5432', 10),
        username: process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_NAME ?? 'hamshira_go',
        autoLoadEntities: true,
        synchronize: process.env.NODE_ENV !== 'production', // true in dev for auto-schema sync
        extra: { max: 20, min: 2, idleTimeoutMillis: 30000 },
      }),
    }),
    CommonModule,
    AuthModule,
    UsersModule,
    OrdersModule,
    MedicsModule,
    ServicesModule,
    RealtimeModule,
    PaymentsModule,
    ClientErrorsModule,
    AppSettingsModule,
    TelegramBotModule,
    FavoritesModule,
    MedicalCardModule,
    ReferralsModule,
    TreatmentCoursesModule,
    ReviewsModule,
    LoyaltyModule,
    SubscriptionsModule,
    ConsultationsModule,
    DoctorsModule,
    NpsModule,
    PromoModule,
    AnalyticsModule,
    VoiceAgentModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_FILTER, useFactory: (i18n: I18nService) => new I18nExceptionFilter(i18n), inject: [I18nService] },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
