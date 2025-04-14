import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
// import { Request } from 'express';
import { map, Observable } from 'rxjs';
import { Product } from '../product-interfaces/product.interface';
// import { Request } from 'express';

@Injectable()
export class ProductInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // console.log(context.getHandler());
    // const req = context.switchToHttp().getRequest<Request>();

    // const query = req.url;
    // console.log(context.getType(), 'getType');
    // este es el bueno

    return next.handle().pipe(
      map(
        (response: {
          metaData: { totalProducts: number; page: number; totalPages: number };
          data: Product[];
        }) => {
          const products: any[] = [];
          for (const { createdAt, id, name, price } of response.data) {
            products.push({
              id,
              createdAt,
              name,
              price,
            });
          }

          return {
            metadata: response.metaData,
            data: products,
          };
        },
      ),
    );
  }
}
