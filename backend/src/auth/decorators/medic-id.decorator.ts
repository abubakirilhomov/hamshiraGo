import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const MedicId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ user?: { id: string } }>();
    if (!request.user?.id) throw new UnauthorizedException('MEDIC_NOT_AUTHENTICATED');
    return request.user.id;
  },
);
