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
import { ChaptersService } from './chapters.service'
import {
  CreateChapterDto,
  UpdateChapterDto,
  AddContentDto,
  AddSummaryDto,
  ReorderChaptersDto,
  UpdateContentDto,
} from './dto'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'

@Controller('projects/:projectId/chapters')
@UseGuards(JwtAuthGuard)
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Post()
  async create(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() createChapterDto: CreateChapterDto,
  ) {
    return this.chaptersService.create(user.id, projectId, createChapterDto)
  }

  @Get()
  async findAll(@CurrentUser() user: any, @Param('projectId') projectId: string) {
    return this.chaptersService.findAll(user.id, projectId)
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.chaptersService.findOne(user.id, projectId, id)
  }

  @Put(':id')
  async update(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() updateChapterDto: UpdateChapterDto,
  ) {
    return this.chaptersService.update(user.id, projectId, id, updateChapterDto)
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    return this.chaptersService.remove(user.id, projectId, id)
  }

  @Put('reorder')
  async reorder(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() reorderDto: ReorderChaptersDto,
  ) {
    return this.chaptersService.reorder(user.id, projectId, reorderDto)
  }

  @Post(':id/contents')
  async addContent(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() addContentDto: AddContentDto,
  ) {
    return this.chaptersService.addContent(user.id, projectId, id, addContentDto)
  }

  @Put(':id/contents')
  async updateAllContents(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() body: { title: string; contents: Array<{ content: string; order: number }> },
  ) {
    return this.chaptersService.updateAllContents(user.id, projectId, id, body)
  }

  @Put(':id/contents/:contentId')
  async updateContent(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Param('contentId') contentId: string,
    @Body() updateContentDto: UpdateContentDto,
  ) {
    return this.chaptersService.updateContent(user.id, projectId, id, contentId, updateContentDto)
  }

  @Delete(':id/contents/:contentId')
  async removeContent(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Param('contentId') contentId: string,
  ) {
    return this.chaptersService.removeContent(user.id, projectId, id, contentId)
  }

  @Post(':id/summaries')
  async addSummary(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() addSummaryDto: AddSummaryDto,
  ) {
    return this.chaptersService.addSummary(user.id, projectId, id, addSummaryDto)
  }

  @Delete(':id/summaries/:summaryId')
  async removeSummary(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Param('summaryId') summaryId: string,
  ) {
    return this.chaptersService.removeSummary(user.id, projectId, id, summaryId)
  }

  @Get(':id/word-count')
  async getWordCount(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    const wordCount = await this.chaptersService.getChapterWordCount(user.id, projectId, id)
    return { wordCount }
  }

  @Get('stats/total-words')
  async getProjectWordCount(@CurrentUser() user: any, @Param('projectId') projectId: string) {
    const wordCount = await this.chaptersService.getProjectWordCount(user.id, projectId)
    return { wordCount }
  }
}
