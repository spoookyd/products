import {
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from 'generated/prisma';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger('ProductsService');
  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma client connect');
  }

  create(createProductDto: CreateProductDto) {
    return this.product.create({
      data: createProductDto,
    });
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
        throw new NotFoundException(`Product with id: ${id}, not found`);
      }
      return product;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Please check Logs');
    }
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id: __, ...res } = updateProductDto;
    try {
      const productUpdated = await this.product.update({
        where: { id, isActive: true },
        data: res,
      });

      return productUpdated;
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

      return productDeleted;
    } catch (error) {
      error.meta.cause = 'Product could not delete';
      this.handleErrors(error);
    }
  }

  private handleErrors(error: any) {
    const { code, meta } = error as { code: string; meta: { cause: string } };
    if (code === 'P2025') {
      throw new NotFoundException(meta.cause);
    }
  }
}
