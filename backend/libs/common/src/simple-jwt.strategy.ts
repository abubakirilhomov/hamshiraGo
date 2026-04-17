import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

/**
 * Simplified JWT strategy for microservices.
 * Only validates and decodes the token — no DB lookup.
 * The main API service does full user validation.
 */
@Injectable()
export class SimpleJwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { id: string; role?: string; companyId?: string; clinicRole?: string }) {
    return {
      id: payload.id,
      role: payload.role ?? 'client',
      companyId: payload.companyId,
      clinicRole: payload.clinicRole,
    };
  }
}
