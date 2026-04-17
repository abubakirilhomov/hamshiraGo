import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
  ParseUUIDPipe,
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface RequestUser {
  id: string;
  role: 'client' | 'medic' | 'admin';
}

/** Extracts the full { id, role } object from the JWT-populated request.user */
const GetUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser => {
    const req = ctx.switchToHttp().getRequest<{ user?: RequestUser }>();
    if (!req.user) throw new UnauthorizedException('NOT_AUTHENTICATED');
    return req.user;
  },
);

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /**
   * POST /reviews
   * Authenticated endpoint — client or medic submits a review.
   * authorRole is derived from JWT (not from body).
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@GetUser() user: RequestUser, @Body() dto: CreateReviewDto) {
    const role = user.role === 'medic' ? 'medic' : 'client';
    return this.reviewsService.create(dto, user.id, role);
  }

  /**
   * GET /reviews/medic/:medicId
   * Public — paginated list of reviews for a medic, newest first.
   */
  @Get('medic/:medicId')
  findByMedic(
    @Param('medicId', ParseUUIDPipe) medicId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.reviewsService.findByMedic(medicId, query);
  }

  /**
   * GET /reviews/client/:clientId
   * Authenticated — returns reviews targeting a client.
   * Accessible by the client themselves or any medic.
   */
  @UseGuards(JwtAuthGuard)
  @Get('client/:clientId')
  findByClient(
    @Param('clientId', ParseUUIDPipe) clientId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.reviewsService.findByClient(clientId, query);
  }

  /**
   * GET /reviews/order/:orderId
   * Authenticated — returns both reviews for an order (if any).
   */
  @UseGuards(JwtAuthGuard)
  @Get('order/:orderId')
  findByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.reviewsService.findByOrder(orderId);
  }
}
