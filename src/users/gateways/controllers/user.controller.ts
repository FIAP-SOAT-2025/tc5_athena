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
} from '@nestjs/common';
import { CreateUserUseCase } from '../../usecases/createUser.usecase';
import { CreateUserDto } from './dtos/create.dto';
import { GetUserUseCase } from 'src/users/usecases/getUser.usecase';

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
  async findOne(@Param('identifier') identifier: string) {
    return await this.getUserUseCase.execute(identifier);
  }
}
