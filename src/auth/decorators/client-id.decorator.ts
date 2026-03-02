import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

export const ClientId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<{ user?: { id: string } }>();
    if (!request.user?.id) throw new UnauthorizedException('Client not authenticated');
    return request.user.id;
  },
);
