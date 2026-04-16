import { IsNumber, Max, Min } from 'class-validator';

export class SetWorkZoneDto {
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  lng!: number;

  /** Radius in km — must be between 0.5 and 50 */
  @IsNumber()
  @Min(0.5)
  @Max(50)
  radius!: number;
}
