import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const DoctorId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ user?: { id: string } }>();
    if (!request.user?.id) throw new UnauthorizedException('DOCTOR_NOT_AUTHENTICATED');
    return request.user.id;
  },
);
