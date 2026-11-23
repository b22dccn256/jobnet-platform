import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Populate req.user when a valid Bearer token is present, without rejecting anonymous requests. */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser | null {
    return user || null;
  }
}
