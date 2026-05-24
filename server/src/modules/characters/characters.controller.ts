import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common'
import { CharactersService } from './characters.service'
import { CharacterExtractorService } from './character-extractor.service'
import { ProgressiveCharacterContextService } from './progressive-character-context.service'
import { CreateCharacterDto, UpdateCharacterDto } from './dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'

@Controller('projects/:projectId/characters')
@UseGuards(JwtAuthGuard)
export class CharactersController {
  constructor(
    private readonly charactersService: CharactersService,
    private readonly characterExtractor: CharacterExtractorService,
    private readonly progressiveContext: ProgressiveCharacterContextService,
  ) {}

  @Post()
  async create(
    @Param('projectId') projectId: string,
    @Body() createCharacterDto: CreateCharacterDto,
  ) {
    return this.charactersService.create(projectId, createCharacterDto)
  }

  @Get()
  async findAll(@Param('projectId') projectId: string) {
    return this.charactersService.findAllWithoutPagination(projectId)
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

  @Post('extract')
  async extractCharacters(
    @Param('projectId') projectId: string,
    @Body() body: { text: string },
  ) {
    return this.characterExtractor.analyzeTextForCharacters(projectId, body.text)
  }

  @Post('analyze-comprehensive')
  async analyzeComprehensive(
    @Param('projectId') projectId: string,
    @Body() body: { text: string },
  ) {
    return this.characterExtractor.analyzeTextComprehensively(projectId, body.text)
  }

  @Post('generate')
  async generateCharacter(
    @Body() body: { description: string },
  ) {
    return this.characterExtractor.generateCharacterProfile(body.description)
  }

  @Post('suggest-details')
  async suggestDetails(
    @Body() body: { characterName: string; context: string },
  ) {
    return this.characterExtractor.suggestCharacterDetails(body.characterName, body.context)
  }

  @Post('analyze-relationships')
  async analyzeRelationships(
    @Param('projectId') projectId: string,
    @Body() body: { text: string },
  ) {
    return this.characterExtractor.analyzeRelationships(projectId, body.text)
  }

  @Get('progressive-context')
  async getProgressiveContext(
    @Param('projectId') projectId: string,
    @Query('currentContent') currentContent?: string,
    @Query('priority') priority?: 'basic' | 'standard' | 'detailed',
    @Query('maxTokens') maxTokens?: string,
  ) {
    return this.progressiveContext.buildProgressiveCharacterContext(projectId, currentContent, {
      priority: priority || 'standard',
      maxTokens: maxTokens ? parseInt(maxTokens) : undefined,
    })
  }

  @Get('hierarchy')
  async getCharacterHierarchy(@Param('projectId') projectId: string) {
    return this.progressiveContext.getCharacterHierarchy(projectId)
  }
}
