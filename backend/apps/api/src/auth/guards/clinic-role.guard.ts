import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  mixin,
  Type,
} from '@nestjs/common';

export const ClinicRoleGuard = (
  ...roles: string[]
): Type<CanActivate> => {
  class ClinicRoleGuardMixin implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
      const request = context
        .switchToHttp()
        .getRequest<{
          user?: { clinicRole?: string };
        }>();
      const clinicRole = request.user?.clinicRole;
      if (!clinicRole || !roles.includes(clinicRole)) {
        throw new ForbiddenException('CLINIC_INSUFFICIENT_ROLE');
      }
      return true;
    }
  }

  return mixin(ClinicRoleGuardMixin);
};
