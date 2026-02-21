import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserUseCase } from '../../usecases/createUser.usecase';
import { CreateUserDto } from './dtos/create.dto';
import { GetUserUseCase } from 'src/users/usecases/getUser.usecase';
import { JwtAuthGuard } from 'src/auth/gateways/jwt/jwtAuth.guard';

@Controller('users')
export class UserController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.createUserUseCase.execute(createUserDto);
  }

  @Get(':identifier')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async findOne(@Param('identifier') identifier: string) {
    return await this.getUserUseCase.execute(identifier);
  }
}
