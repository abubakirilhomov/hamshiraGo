import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export interface ClinicUserPayload {
  userId: string;
  companyId: string;
  role: string; // CEO | RECEPTION | DOCTOR
}

export const ClinicUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ClinicUserPayload => {
    const request = ctx
      .switchToHttp()
      .getRequest<{
        user?: { id: string; companyId?: string; clinicRole?: string };
      }>();
    if (!request.user?.id || !request.user.companyId) {
      throw new UnauthorizedException('CLINIC_NOT_AUTHENTICATED');
    }
    return {
      userId: request.user.id,
      companyId: request.user.companyId,
      role: request.user.clinicRole ?? 'RECEPTION',
    };
  },
);
