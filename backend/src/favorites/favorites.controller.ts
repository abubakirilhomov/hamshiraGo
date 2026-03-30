import { Controller, Post, Delete, Get, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientId } from '../auth/decorators/client-id.decorator';

@UseGuards(JwtAuthGuard)
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':medicId')
  async add(
    @ClientId() userId: string,
    @Param('medicId', ParseUUIDPipe) medicId: string,
  ): Promise<{ success: boolean }> {
    await this.favoritesService.add(userId, medicId);
    return { success: true };
  }

  @Delete(':medicId')
  async remove(
    @ClientId() userId: string,
    @Param('medicId', ParseUUIDPipe) medicId: string,
  ): Promise<{ success: boolean }> {
    await this.favoritesService.remove(userId, medicId);
    return { success: true };
  }

  @Get()
  async findAll(@ClientId() userId: string) {
    return this.favoritesService.findByUser(userId);
  }
}
