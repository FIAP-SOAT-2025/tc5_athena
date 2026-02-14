import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Param, 
  HttpCode, 
  HttpStatus, 
  UsePipes, 
  ValidationPipe 
} from '@nestjs/common';
import { CreateUserUseCase } from '../../usecases/createUser.usecase';
import { CreateUserDto } from './dtos/create.dto';

@Controller('users')
export class UserController {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.createUserUseCase.execute(createUserDto);
  }


  @Get(':id')
  async findOne(@Param('id') id: string) {
    return { message: 'Busca de usuário por ID ainda não implementada no Use Case.' };
  }
}