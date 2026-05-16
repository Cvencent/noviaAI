import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common'
import { CharactersService } from './characters.service'
import { CreateCharacterDto, UpdateCharacterDto } from './dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('projects/:projectId/characters')
@UseGuards(JwtAuthGuard)
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() createCharacterDto: CreateCharacterDto,
  ) {
    return this.charactersService.create(projectId, createCharacterDto)
  }

  @Get()
  async findAll(@Param('projectId') projectId: string) {
    return this.charactersService.findAll(projectId)
  }

  @Get(':id')
  async findOne(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.charactersService.findOne(projectId, id)
  }

  @Put(':id')
  async update(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateCharacterDto: UpdateCharacterDto,
  ) {
    return this.charactersService.update(projectId, id, updateCharacterDto)
  }

  @Delete(':id')
  async remove(
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.charactersService.remove(projectId, id)
  }

  @Post('relationships')
  async createRelationship(
    @Param('projectId') projectId: string,
    @Body() data: { fromId: string; toId: string; relationship: string; description?: string },
  ) {
    return this.charactersService.createRelationship(
      projectId,
      data.fromId,
      data.toId,
      data.relationship,
      data.description,
    )
  }

  @Put('relationships/:relationshipId')
  async updateRelationship(
    @Param('projectId') projectId: string,
    @Param('relationshipId') relationshipId: string,
    @Body() data: { relationship: string; description?: string },
  ) {
    return this.charactersService.updateRelationship(
      projectId,
      relationshipId,
      data.relationship,
      data.description,
    )
  }

  @Delete('relationships/:relationshipId')
  async removeRelationship(
    @Param('projectId') projectId: string,
    @Param('relationshipId') relationshipId: string,
  ) {
    return this.charactersService.removeRelationship(projectId, relationshipId)
  }
}
