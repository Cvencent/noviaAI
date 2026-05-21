import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import { LorebookService } from './lorebook.service'

@Controller('lorebook')
@UseGuards(JwtAuthGuard)
export class LorebookController {
  constructor(private lorebookService: LorebookService) {}

  @Get(':projectId')
  async getEntries(
    @Param('projectId') projectId: string,
    @Query('category') category?: string
  ) {
    return this.lorebookService.getLoreEntries(projectId, category)
  }

  @Get('entry/:entryId')
  async getEntry(@Param('entryId') entryId: string) {
    return this.lorebookService.getLoreEntryById(entryId)
  }

  @Post(':projectId')
  async createEntry(
    @Param('projectId') projectId: string,
    @Body() body: {
      name: string
      category: string
      description: string
      content?: string
      keywords: string[]
      priority?: number
      triggerCondition?: string
      relatedCharacterIds?: string[]
      relatedLocationIds?: string[]
    }
  ) {
    return this.lorebookService.createLoreEntry(projectId, body)
  }

  @Put('entry/:entryId')
  async updateEntry(
    @Param('entryId') entryId: string,
    @Body() body: {
      name?: string
      category?: string
      description?: string
      content?: string
      keywords?: string[]
      priority?: number
      isActive?: boolean
      triggerCondition?: string
      relatedCharacterIds?: string[]
      relatedLocationIds?: string[]
    }
  ) {
    return this.lorebookService.updateLoreEntry(entryId, body)
  }

  @Delete('entry/:entryId')
  async deleteEntry(@Param('entryId') entryId: string) {
    return this.lorebookService.deleteLoreEntry(entryId)
  }

  @Post(':projectId/match')
  async matchLore(
    @Param('projectId') projectId: string,
    @Body() body: {
      text: string
      maxResults?: number
      minScore?: number
      includeCategories?: string[]
    }
  ) {
    return this.lorebookService.matchLoreToText(
      projectId,
      body.text,
      {
        maxResults: body.maxResults,
        minScore: body.minScore,
        includeCategories: body.includeCategories
      }
    )
  }

  @Post(':projectId/context')
  async generateContext(
    @Param('projectId') projectId: string,
    @Body() body: {
      text: string
      maxEntries?: number
      format?: 'compact' | 'detailed'
    }
  ) {
    const context = await this.lorebookService.generateLoreContext(
      projectId,
      body.text,
      {
        maxEntries: body.maxEntries,
        format: body.format
      }
    )
    return { context }
  }

  @Get(':projectId/stats')
  async getUsageStats(@Param('projectId') projectId: string) {
    return this.lorebookService.getLoreUsageStats(projectId)
  }
}
