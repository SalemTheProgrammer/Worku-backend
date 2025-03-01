import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from '../../interfaces/user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: TokenPayload) {
    // Here you would typically verify the user still exists in your database
    if (!payload.userId || !payload.email) {
      throw new UnauthorizedException('Token invalide');
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      companyId: payload.companyId,
    };
  }
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.refreshSecret'),
    });
  }

  async validate(payload: TokenPayload) {
    if (!payload.userId || !payload.email) {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
      companyId: payload.companyId,
    };
  }
}