import { Injectable, ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { Referral } from '../referrals/entities/referral.entity';
import * as bcrypt from 'bcrypt';
import { RegisterClientDto } from './dto/register-client.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
    @InjectRepository(Referral)
    private referralRepo: Repository<Referral>,
  ) {}

  private generateReferralCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  async registerClient(dto: RegisterClientDto) {
    const existing = await this.usersService.findByPhone(dto.phone);
    if (existing) {
      throw new ConflictException('User with this phone already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Validate referral code if provided
    let referrer: import('../users/entities/user.entity').User | null = null;
    if (dto.referredByCode) {
      referrer = await this.usersService.findByReferralCode(dto.referredByCode);
    }

    const user = await this.usersService.create({
      phone: dto.phone,
      passwordHash,
      name: dto.name ?? null,
      referredBy: dto.referredByCode ?? null,
    });

    // Generate unique referral code — retry once on collision
    let referralCode = this.generateReferralCode();
    const collision = await this.usersService.findByReferralCode(referralCode);
    if (collision) {
      referralCode = this.generateReferralCode();
    }
    await this.usersService.setReferralCode(user.id, referralCode);

    // Create referral record if referred by someone
    if (referrer) {
      await this.referralRepo.save(
        this.referralRepo.create({
          referrerId: referrer.id,
          referredId: user.id,
          bonusPaid: false,
          bonusAmount: 0,
        }),
      );
    }

    return {
      access_token: this.jwtService.sign({ sub: user.id, role: 'client' }),
      user: { id: user.id, phone: user.phone, name: user.name, referralCode },
    };
  }

  async loginClient(dto: LoginDto) {
    const user = await this.usersService.findByPhone(dto.phone);
    if (!user) {
      throw new UnauthorizedException('Invalid phone or password');
    }
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Invalid phone or password');
    }
    if (user.isBlocked) throw new ForbiddenException('Your account has been blocked. Contact support.');
    return { access_token: this.jwtService.sign({ sub: user.id, role: 'client' }), user: { id: user.id, phone: user.phone, name: user.name } };
  }

  /** Validates ADMIN_USERNAME + ADMIN_PASSWORD from env, returns a JWT with role "admin" */
  async adminLogin(username: string, password: string): Promise<{ access_token: string }> {
    const adminUsername = this.config.get<string>('ADMIN_USERNAME');
    const adminPassword = this.config.get<string>('ADMIN_PASSWORD');

    if (!adminUsername || !adminPassword) {
      throw new UnauthorizedException('Admin credentials are not configured on the server.');
    }

    // Timing-safe comparison to prevent timing attacks
    const userBuf = Buffer.from(username);
    const passBuf = Buffer.from(password);
    const expectedUserBuf = Buffer.from(adminUsername);
    const expectedPassBuf = Buffer.from(adminPassword);

    const userMatch =
      userBuf.length === expectedUserBuf.length &&
      crypto.timingSafeEqual(userBuf, expectedUserBuf);
    const passMatch =
      passBuf.length === expectedPassBuf.length &&
      crypto.timingSafeEqual(passBuf, expectedPassBuf);

    if (!userMatch || !passMatch) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const token = this.jwtService.sign(
      { sub: 'admin', role: 'admin' },
      { expiresIn: '12h' },
    );
    return { access_token: token };
  }
}
