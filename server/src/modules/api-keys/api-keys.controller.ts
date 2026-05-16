import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../modules/auth/decorators/current-user.decorator'
import { ApiKeysService } from './api-keys.service'

@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  async create(
    @CurrentUser() user: any,
    @Body()
    body: {
      provider: 'openai' | 'claude'
      name: string
      apiKey: string
    },
  ) {
    return this.apiKeysService.create(user.id, {
      provider: body.provider,
      name: body.name,
      apiKey: body.apiKey,
    })
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
    @Body()
    body: {
      name?: string
      apiKey?: string
      isActive?: boolean
    },
  ) {
    return this.apiKeysService.update(user.id, id, {
      name: body.name,
      apiKey: body.apiKey,
      isActive: body.isActive,
    })
  }

  @Delete(':id')
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.apiKeysService.remove(user.id, id)
  }
}
