import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from '../../users/users.service';
import { MedicsService } from '../../medics/medics.service';
import { DoctorsService } from '../../doctors/doctors.service';

export type JwtPayload = {
  sub: string;
  role: 'client' | 'medic' | 'admin' | 'doctor' | 'clinic';
  companyId?: string;
  clinicRole?: 'CEO' | 'RECEPTION' | 'DOCTOR';
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
    private medicsService: MedicsService,
    private doctorsService: DoctorsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => (req as any)?.cookies?.token ?? null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.role === 'admin') {
      return { id: payload.sub, role: 'admin' as const };
    }
    if (payload.role === 'clinic') {
      return {
        id: payload.sub,
        role: 'clinic' as const,
        companyId: payload.companyId,
        clinicRole: payload.clinicRole,
      };
    }
    if (payload.role === 'medic') {
      const medic = await this.medicsService.findById(payload.sub);
      if (!medic) throw new UnauthorizedException();
      if (medic.isBlocked) throw new ForbiddenException('ACCOUNT_BLOCKED');
      return { id: medic.id, role: 'medic' as const };
    }
    if (payload.role === 'doctor') {
      const doctor = await this.doctorsService.findById(payload.sub);
      if (!doctor) throw new UnauthorizedException();
      if (doctor.isBlocked) throw new ForbiddenException('ACCOUNT_BLOCKED');
      return { id: doctor.id, role: 'doctor' as const };
    }
    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new UnauthorizedException();
    if (user.isBlocked) throw new ForbiddenException('ACCOUNT_BLOCKED');
    return { id: user.id, role: 'client' as const };
  }
}
