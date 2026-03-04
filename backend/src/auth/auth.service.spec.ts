import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

const mockUser = {
  id: 'user-uuid-1',
  phone: '+998901234567',
  name: 'Алишер',
  passwordHash: '',
  isBlocked: false,
};

const mockUsersService = {
  findByPhone: jest.fn(),
  create: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
};

const mockConfigService = {
  get: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Generate a real hash for the test password
    mockUser.passwordHash = await bcrypt.hash('secret123', 10);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ── registerClient ────────────────────────────────────────────────────────

  describe('registerClient', () => {
    it('creates a new user and returns access_token', async () => {
      mockUsersService.findByPhone.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await service.registerClient({
        phone: '+998901234567',
        password: 'secret123',
        name: 'Алишер',
      });

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.phone).toBe('+998901234567');
      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ phone: '+998901234567' }),
      );
    });

    it('throws ConflictException when phone already registered', async () => {
      mockUsersService.findByPhone.mockResolvedValue(mockUser);

      await expect(
        service.registerClient({ phone: '+998901234567', password: 'secret123' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── loginClient ───────────────────────────────────────────────────────────

  describe('loginClient', () => {
    it('returns access_token on valid credentials', async () => {
      mockUsersService.findByPhone.mockResolvedValue(mockUser);

      const result = await service.loginClient({
        phone: '+998901234567',
        password: 'secret123',
      });

      expect(result.access_token).toBe('mock-jwt-token');
      expect(result.user.id).toBe('user-uuid-1');
    });

    it('throws UnauthorizedException when user not found', async () => {
      mockUsersService.findByPhone.mockResolvedValue(null);

      await expect(
        service.loginClient({ phone: '+998909999999', password: 'secret123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException on wrong password', async () => {
      mockUsersService.findByPhone.mockResolvedValue(mockUser);

      await expect(
        service.loginClient({ phone: '+998901234567', password: 'wrongpass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws ForbiddenException when user is blocked', async () => {
      mockUsersService.findByPhone.mockResolvedValue({ ...mockUser, isBlocked: true });

      await expect(
        service.loginClient({ phone: '+998901234567', password: 'secret123' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
