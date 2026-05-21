import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { ApiKeysService, CreateApiKeyDto, UpdateApiKeyDto } from './api-keys.service'

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  async create(@CurrentUser() user: any, @Body() createApiKeyDto: CreateApiKeyDto) {
    return this.apiKeysService.create(user.id, createApiKeyDto)
  }

  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.apiKeysService.findAll(user.id)
  }

  @Get(':id')
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.apiKeysService.findOne(user.id, id)
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateApiKeyDto: UpdateApiKeyDto,
  ) {
    return this.apiKeysService.update(user.id, id, updateApiKeyDto)
  }

  @Delete(':id')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.apiKeysService.remove(user.id, id)
  }
}
