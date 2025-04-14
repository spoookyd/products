import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from 'generated/prisma';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('ProductsService');
  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma client connect ');
  }

  async create(createProductDto: CreateProductDto) {
    try {
      const product = await this.product.create({
        data: createProductDto,
      });
      return {
        data: [product],
      };
    } catch (error) {
      this.handleErrors(error);
    }
  }

  async findAll(paginationDto: PaginationDto) {
    const { limit, page } = paginationDto;
    const skip = page * limit - limit;
    try {
      const totalProducts = await this.product.count();
      const totalPages = Math.ceil(totalProducts / limit);

      const products = await this.product.findMany({
        where: { isActive: true },
        take: limit,
        skip,
      });

      return {
        metaData: {
          totalProducts,
          page,
          totalPages,
        },
        data: products,
      };
    } catch (error) {
      throw new InternalServerErrorException('Please check Logs: ' + error);
    }
  }

  async findOne(id: number) {
    try {
      const product = await this.product.findFirst({
        where: { id, isActive: true },
      });

      if (!product) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: `Product with id: ${id}, not found`,
        });
      }

      return {
        data: [product],
      };
    } catch (error) {
      this.handleErrors(error);
    }
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: __, ...res } = updateProductDto;
    try {
      const productUpdated = await this.product.update({
        where: { id, isActive: true },
        data: res,
      });

      return {
        data: [productUpdated],
      };
    } catch (error) {
      this.handleErrors(error);
    }
  }

  async remove(id: number) {
    try {
      const productDeleted = await this.product.update({
        data: { isActive: false },
        where: { id, isActive: true },
      });

      return {
        data: [productDeleted],
      };
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      error.meta.cause = 'Product could not delete';
      this.handleErrors(error);
    }
  }

  async validateProducts(id: number[]) {
    id = [...new Set(id)];
    try {
      const product = await this.product.findMany({
        where: {
          id: {
            in: id,
          },
        },
      });

      if (product.length !== id.length) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Some products were not found',
        });
      }

      return { data: product };
    } catch (error) {
      this.handleErrors(error);
    }
  }

  private handleErrors(error: any) {
    const { code, meta } = error as { code: string; meta: { cause: string } };
    if (code === 'P2025') {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: meta.cause,
      });
    }

    if (error instanceof RpcException) throw error;
    throw new InternalServerErrorException('Please check Logs');
  }
}
