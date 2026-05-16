import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateCharacterDto, UpdateCharacterDto } from './dto'

@Injectable()
export class CharactersService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, createCharacterDto: CreateCharacterDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    const character = await this.prisma.character.create({
      data: {
        ...createCharacterDto,
        projectId,
      },
    })

    return character
  }

  async findAll(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      throw new NotFoundException('项目不存在')
    }

    const characters = await this.prisma.character.findMany({
      where: { projectId },
      include: {
        relationshipsFrom: {
          include: {
            toCharacter: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        relationshipsTo: {
          include: {
            fromCharacter: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    return characters
  }

  async findOne(projectId: string, characterId: string) {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
      include: {
        relationshipsFrom: {
          include: {
            toCharacter: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        relationshipsTo: {
          include: {
            fromCharacter: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    if (!character) {
      throw new NotFoundException('人物不存在')
    }

    if (character.projectId !== projectId) {
      throw new ForbiddenException('没有权限访问此人物')
    }

    return character
  }

  async update(
    projectId: string,
    characterId: string,
    updateCharacterDto: UpdateCharacterDto,
  ) {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    })

    if (!character) {
      throw new NotFoundException('人物不存在')
    }

    if (character.projectId !== projectId) {
      throw new ForbiddenException('没有权限修改此人物')
    }

    const updatedCharacter = await this.prisma.character.update({
      where: { id: characterId },
      data: updateCharacterDto,
    })

    return updatedCharacter
  }

  async remove(projectId: string, characterId: string) {
    const character = await this.prisma.character.findUnique({
      where: { id: characterId },
    })

    if (!character) {
      throw new NotFoundException('人物不存在')
    }

    if (character.projectId !== projectId) {
      throw new ForbiddenException('没有权限删除此人物')
    }

    await this.prisma.character.delete({
      where: { id: characterId },
    })

    return { message: '人物已删除' }
  }

  async createRelationship(
    projectId: string,
    fromId: string,
    toId: string,
    relationship: string,
    description?: string,
  ) {
    if (fromId === toId) {
      throw new BadRequestException('不能创建自身的关系')
    }

    const fromCharacter = await this.prisma.character.findUnique({
      where: { id: fromId },
    })

    const toCharacter = await this.prisma.character.findUnique({
      where: { id: toId },
    })

    if (!fromCharacter || !toCharacter) {
      throw new NotFoundException('人物不存在')
    }

    if (fromCharacter.projectId !== projectId || toCharacter.projectId !== projectId) {
      throw new ForbiddenException('人物不属于当前项目')
    }

    const existingRelationship = await this.prisma.characterRelationship.findFirst({
      where: {
        fromId,
        toId,
        relationship,
      },
    })

    if (existingRelationship) {
      throw new BadRequestException('关系已存在')
    }

    const newRelationship = await this.prisma.characterRelationship.create({
      data: {
        fromId,
        toId,
        relationship,
        description,
      },
      include: {
        fromCharacter: {
          select: {
            id: true,
            name: true,
          },
        },
        toCharacter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return newRelationship
  }

  async updateRelationship(
    projectId: string,
    relationshipId: string,
    relationship: string,
    description?: string,
  ) {
    const existingRelationship = await this.prisma.characterRelationship.findUnique({
      where: { id: relationshipId },
      include: {
        fromCharacter: true,
        toCharacter: true,
      },
    })

    if (!existingRelationship) {
      throw new NotFoundException('关系不存在')
    }

    if (
      existingRelationship.fromCharacter.projectId !== projectId ||
      existingRelationship.toCharacter.projectId !== projectId
    ) {
      throw new ForbiddenException('没有权限修改此关系')
    }

    const updatedRelationship = await this.prisma.characterRelationship.update({
      where: { id: relationshipId },
      data: {
        relationship,
        description,
      },
      include: {
        fromCharacter: {
          select: {
            id: true,
            name: true,
          },
        },
        toCharacter: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return updatedRelationship
  }

  async removeRelationship(projectId: string, relationshipId: string) {
    const relationship = await this.prisma.characterRelationship.findUnique({
      where: { id: relationshipId },
      include: {
        fromCharacter: true,
        toCharacter: true,
      },
    })

    if (!relationship) {
      throw new NotFoundException('关系不存在')
    }

    if (
      relationship.fromCharacter.projectId !== projectId ||
      relationship.toCharacter.projectId !== projectId
    ) {
      throw new ForbiddenException('没有权限删除此关系')
    }

    await this.prisma.characterRelationship.delete({
      where: { id: relationshipId },
    })

    return { message: '关系已删除' }
  }
}
