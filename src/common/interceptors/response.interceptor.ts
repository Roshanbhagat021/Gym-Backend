import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: any;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((res) => {
        // If the response is already in the expected format (e.g., from custom return), return as is
        if (res && res.success !== undefined && res.message !== undefined) {
          return res;
        }

        // Wrap standard responses
        return {
          success: true,
          message: 'Operation successful',
          data: res?.data ? res.data : res,
          meta: res?.meta ? res.meta : undefined,
        };
      }),
    );
  }
}
