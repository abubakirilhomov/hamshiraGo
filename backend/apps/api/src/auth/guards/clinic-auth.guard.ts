import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ClinicAuthGuard extends AuthGuard('jwt') implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { id: string; role: string } }>();
    if (!request.user) throw new UnauthorizedException('CLINIC_NOT_AUTHENTICATED');
    if (request.user.role !== 'clinic')
      throw new ForbiddenException('CLINIC_ACCESS_ONLY');
    return true;
  }
}
