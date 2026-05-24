import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common'
import { CharactersService } from './characters.service'

describe('CharactersService', () => {
  let service: CharactersService
  let prisma: any

  beforeEach(() => {
    prisma = {
      project: {
        findUnique: jest.fn(),
      },
      character: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    }

    service = new CharactersService(prisma)
  })

  describe('create', () => {
    it('creates a new character', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'project-1' })
      prisma.character.create.mockResolvedValue({
        id: 'char-1',
        projectId: 'project-1',
        name: '张三',
        role: 'PROTAGONIST',
      })

      const result = await service.create('project-1', {
        name: '张三',
        role: 'PROTAGONIST',
      })

      expect(prisma.character.create).toHaveBeenCalledWith({
        data: {
          projectId: 'project-1',
          name: '张三',
          role: 'PROTAGONIST',
        },
      })
      expect(result.id).toBe('char-1')
    })

    it('throws NotFoundException when project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null)

      await expect(
        service.create('project-1', {
          name: '张三',
          role: 'PROTAGONIST',
        }),
      ).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('findAll', () => {
    it('returns all characters for a project', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'project-1' })
      prisma.character.findMany.mockResolvedValue([
        { id: 'char-1', name: '张三', role: 'PROTAGONIST', relationshipsFrom: [], relationshipsTo: [] },
        { id: 'char-2', name: '李四', role: 'ANTAGONIST', relationshipsFrom: [], relationshipsTo: [] },
      ])

      const result = await service.findAll('project-1')

      expect(prisma.character.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-1' },
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
      expect(result).toHaveLength(2)
    })

    it('throws NotFoundException when project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null)

      await expect(service.findAll('project-1')).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('findOne', () => {
    it('returns a specific character', async () => {
      prisma.character.findUnique.mockResolvedValue({
        id: 'char-1',
        projectId: 'project-1',
        name: '张三',
        role: 'PROTAGONIST',
        relationshipsFrom: [],
        relationshipsTo: [],
      })

      const result = await service.findOne('project-1', 'char-1')

      expect(result.id).toBe('char-1')
      expect(result.name).toBe('张三')
    })

    it('throws NotFoundException when character does not exist', async () => {
      prisma.character.findUnique.mockResolvedValue(null)

      await expect(service.findOne('project-1', 'char-1')).rejects.toBeInstanceOf(NotFoundException)
    })

    it('throws ForbiddenException when character belongs to different project', async () => {
      prisma.character.findUnique.mockResolvedValue({
        id: 'char-1',
        projectId: 'other-project',
        name: '张三',
        relationshipsFrom: [],
        relationshipsTo: [],
      })

      await expect(service.findOne('project-1', 'char-1')).rejects.toBeInstanceOf(ForbiddenException)
    })
  })

  describe('update', () => {
    it('updates a character', async () => {
      prisma.character.findUnique.mockResolvedValue({
        id: 'char-1',
        projectId: 'project-1',
        name: '张三',
        relationshipsFrom: [],
        relationshipsTo: [],
      })
      prisma.character.update.mockResolvedValue({
        id: 'char-1',
        projectId: 'project-1',
        name: '张三（已更新）',
        role: 'SUPPORTING',
      })

      const result = await service.update('project-1', 'char-1', {
        name: '张三（已更新）',
        role: 'SUPPORTING',
      })

      expect(prisma.character.update).toHaveBeenCalledWith({
        where: { id: 'char-1' },
        data: {
          name: '张三（已更新）',
          role: 'SUPPORTING',
        },
      })
      expect(result.name).toBe('张三（已更新）')
    })

    it('throws NotFoundException when character does not exist', async () => {
      prisma.character.findUnique.mockResolvedValue(null)

      await expect(
        service.update('project-1', 'char-1', { name: '新名称' }),
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it('throws ForbiddenException when character belongs to different project', async () => {
      prisma.character.findUnique.mockResolvedValue({
        id: 'char-1',
        projectId: 'other-project',
        name: '张三',
        relationshipsFrom: [],
        relationshipsTo: [],
      })

      await expect(
        service.update('project-1', 'char-1', { name: '新名称' }),
      ).rejects.toBeInstanceOf(ForbiddenException)
    })
  })

  describe('remove', () => {
    it('deletes a character', async () => {
      prisma.character.findUnique.mockResolvedValue({
        id: 'char-1',
        projectId: 'project-1',
        name: '张三',
        relationshipsFrom: [],
        relationshipsTo: [],
      })
      prisma.character.delete.mockResolvedValue({ id: 'char-1' })

      const result = await service.remove('project-1', 'char-1')

      expect(prisma.character.delete).toHaveBeenCalledWith({
        where: { id: 'char-1' },
      })
      expect(result.message).toBe('人物已删除')
    })

    it('throws NotFoundException when character does not exist', async () => {
      prisma.character.findUnique.mockResolvedValue(null)

      await expect(service.remove('project-1', 'char-1')).rejects.toBeInstanceOf(NotFoundException)
    })

    it('throws ForbiddenException when character belongs to different project', async () => {
      prisma.character.findUnique.mockResolvedValue({
        id: 'char-1',
        projectId: 'other-project',
        name: '张三',
        relationshipsFrom: [],
        relationshipsTo: [],
      })

      await expect(service.remove('project-1', 'char-1')).rejects.toBeInstanceOf(ForbiddenException)
    })
  })

  describe('bulkCreate', () => {
    it('creates multiple characters', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'project-1' })
      prisma.character.create.mockResolvedValue({
        id: 'char-new',
        projectId: 'project-1',
        name: '新角色',
        role: 'MINOR',
      })

      const characters = [
        { name: '新角色1', role: 'MINOR' },
        { name: '新角色2', role: 'MINOR' },
      ]

      const result = await service.bulkCreate('project-1', characters)

      expect(prisma.character.create).toHaveBeenCalledTimes(2)
      expect(result).toHaveLength(2)
    })

    it('throws BadRequestException when characters array is empty', async () => {
      await expect(service.bulkCreate('project-1', [])).rejects.toBeInstanceOf(BadRequestException)
    })

    it('throws NotFoundException when project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null)

      await expect(
        service.bulkCreate('project-1', [{ name: '新角色', role: 'MINOR' }]),
      ).rejects.toBeInstanceOf(NotFoundException)
    })
  })
})
