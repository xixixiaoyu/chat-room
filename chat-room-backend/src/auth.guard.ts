import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';

// JWT 用户数据接口
interface JwtUserData {
  exp: number;
  userId: number;
  username: string;
}

// 扩展 Express 的 Request 接口，添加 user 属性
declare module 'express' {
  interface Request {
    user: JwtUserData;
  }
}

@Injectable()
export class AuthGuard implements CanActivate {
  @Inject()
  private reflector: Reflector;

  @Inject(JwtService)
  private jwtService: JwtService;

  // 实现 CanActivate 接口的 canActivate 方法
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const response: Response = context.switchToHttp().getResponse();

    // 检查是否需要登录
    const requireLogin = this.reflector.getAllAndOverride('require-login', [
      context.getClass(),
      context.getHandler(),
    ]);

    // 如果不需要登录，直接返回 true
    if (!requireLogin) {
      return true;
    }

    const authorization = request.headers.authorization;

    // 如果没有 authorization 头，抛出未登录异常
    if (!authorization) {
      throw new UnauthorizedException('用户未登录');
    }

    try {
      // 从 authorization 头中提取 token
      const token = authorization.split(' ')[1];
      // 验证 token
      const data = this.jwtService.verify<JwtUserData>(token);

      // 将用户信息添加到 request 对象
      request.user = {
        userId: data.userId,
        username: data.username,
        exp: data.exp,
      };

      // 修改 token 刷新逻辑
      const { exp } = data; // 过期时间
      const nowTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = exp - nowTime;

      // 只有当 token 还有效但即将在 24 小时内过期时才刷新
      if (timeUntilExpiry > 0 && timeUntilExpiry < 60 * 60 * 24) {
        const newToken = this.jwtService.sign(
          {
            userId: data.userId,
            username: data.username,
          },
          {
            expiresIn: '7d',
          },
        );

        // 将新 token 添加到响应头中
        response.setHeader('New-Token', newToken);
      }

      return true;
    } catch (e) {
      console.log(e);
      // 如果 token 验证失败，抛出异常
      throw new UnauthorizedException('token 失效，请重新登录');
    }
  }
}
