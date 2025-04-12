import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
// import { Request } from 'express';
import { map, Observable } from 'rxjs';
import { Product } from '../product-interfaces/product.interface';
import { Request } from 'express';

@Injectable()
export class ProductInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // console.log(context.getHandler());
    const req = context.switchToHttp().getRequest<Request>();

    const query = req.url;
    console.log(query);

    return next.handle().pipe(
      map((response: Product) => {
        const { isActive, ...data } = response;
        return {
          ...data,
        };
      }),
    );
  }
}
