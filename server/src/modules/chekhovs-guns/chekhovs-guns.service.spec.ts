import { NotFoundException, ForbiddenException } from '@nestjs/common'
import { ChekhovsGunsService } from './chekhovs-guns.service'

describe('ChekhovsGunsService', () => {
  let service: ChekhovsGunsService
  let prisma: any

  beforeEach(() => {
    prisma = {
      project: {
        findUnique: jest.fn(),
      },
      chekhovsGun: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    }

    service = new ChekhovsGunsService(prisma)
  })

  describe('create', () => {
    it('creates a new chekhovs gun', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'project-1' })
      prisma.chekhovsGun.create.mockResolvedValue({
        id: 'gun-1',
        projectId: 'project-1',
        name: '墙上的枪',
        description: '主角卧室墙上挂着的一把老式猎枪',
        setupText: '他卧室的墙上挂着一把猎枪',
        status: 'SETUP',
        importance: 'MAJOR',
      })

      const result = await service.create('project-1', {
        name: '墙上的枪',
        description: '主角卧室墙上挂着的一把老式猎枪',
        setupText: '他卧室的墙上挂着一把猎枪',
        status: 'SETUP',
        importance: 'MAJOR',
      })

      expect(prisma.chekhovsGun.create).toHaveBeenCalledWith({
        data: {
          projectId: 'project-1',
          name: '墙上的枪',
          description: '主角卧室墙上挂着的一把老式猎枪',
          setupText: '他卧室的墙上挂着一把猎枪',
          status: 'SETUP',
          importance: 'MAJOR',
        },
        include: {
          setupChapter: true,
          payoffChapter: true,
        },
      })
      expect(result.id).toBe('gun-1')
    })

    it('throws NotFoundException when project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null)

      await expect(
        service.create('project-1', {
          name: '墙上的枪',
          description: '描述',
          setupText: '埋设内容',
        }),
      ).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('findAll', () => {
    it('returns all chekhovs guns for a project', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'project-1' })
      prisma.chekhovsGun.findMany.mockResolvedValue([
        { id: 'gun-1', name: '墙上的枪', status: 'SETUP' },
        { id: 'gun-2', name: '神秘信件', status: 'REMINDER' },
      ])

      const result = await service.findAll('project-1')

      expect(prisma.chekhovsGun.findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-1' },
        include: {
          setupChapter: true,
          payoffChapter: true,
        },
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toHaveLength(2)
    })

    it('throws NotFoundException when project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null)

      await expect(service.findAll('project-1')).rejects.toBeInstanceOf(NotFoundException)
    })
  })

  describe('findOne', () => {
    it('returns a specific chekhovs gun', async () => {
      prisma.chekhovsGun.findUnique.mockResolvedValue({
        id: 'gun-1',
        projectId: 'project-1',
        name: '墙上的枪',
        status: 'SETUP',
      })

      const result = await service.findOne('project-1', 'gun-1')

      expect(result.id).toBe('gun-1')
    })

    it('throws NotFoundException when chekhovs gun does not exist', async () => {
      prisma.chekhovsGun.findUnique.mockResolvedValue(null)

      await expect(service.findOne('project-1', 'gun-1')).rejects.toBeInstanceOf(NotFoundException)
    })

    it('throws ForbiddenException when chekhovs gun belongs to different project', async () => {
      prisma.chekhovsGun.findUnique.mockResolvedValue({
        id: 'gun-1',
        projectId: 'other-project',
        name: '墙上的枪',
      })

      await expect(service.findOne('project-1', 'gun-1')).rejects.toBeInstanceOf(ForbiddenException)
    })
  })

  describe('update', () => {
    it('updates a chekhovs gun', async () => {
      prisma.chekhovsGun.findUnique.mockResolvedValue({
        id: 'gun-1',
        projectId: 'project-1',
        name: '墙上的枪',
        status: 'SETUP',
      })
      prisma.chekhovsGun.update.mockResolvedValue({
        id: 'gun-1',
        projectId: 'project-1',
        name: '墙上的枪（已更新）',
        status: 'PAYOFF',
      })

      const result = await service.update('project-1', 'gun-1', {
        name: '墙上的枪（已更新）',
        status: 'PAYOFF',
      })

      expect(prisma.chekhovsGun.update).toHaveBeenCalledWith({
        where: { id: 'gun-1' },
        data: {
          name: '墙上的枪（已更新）',
          status: 'PAYOFF',
        },
        include: {
          setupChapter: true,
          payoffChapter: true,
        },
      })
      expect(result.name).toBe('墙上的枪（已更新）')
    })

    it('throws NotFoundException when chekhovs gun does not exist', async () => {
      prisma.chekhovsGun.findUnique.mockResolvedValue(null)

      await expect(
        service.update('project-1', 'gun-1', { name: '新名称' }),
      ).rejects.toBeInstanceOf(NotFoundException)
    })

    it('throws ForbiddenException when chekhovs gun belongs to different project', async () => {
      prisma.chekhovsGun.findUnique.mockResolvedValue({
        id: 'gun-1',
        projectId: 'other-project',
        name: '墙上的枪',
      })

      await expect(
        service.update('project-1', 'gun-1', { name: '新名称' }),
      ).rejects.toBeInstanceOf(ForbiddenException)
    })
  })

  describe('remove', () => {
    it('deletes a chekhovs gun', async () => {
      prisma.chekhovsGun.findUnique.mockResolvedValue({
        id: 'gun-1',
        projectId: 'project-1',
        name: '墙上的枪',
      })
      prisma.chekhovsGun.delete.mockResolvedValue({ id: 'gun-1' })

      const result = await service.remove('project-1', 'gun-1')

      expect(prisma.chekhovsGun.delete).toHaveBeenCalledWith({
        where: { id: 'gun-1' },
      })
      expect(result.message).toBe('伏笔已删除')
    })

    it('throws NotFoundException when chekhovs gun does not exist', async () => {
      prisma.chekhovsGun.findUnique.mockResolvedValue(null)

      await expect(service.remove('project-1', 'gun-1')).rejects.toBeInstanceOf(NotFoundException)
    })

    it('throws ForbiddenException when chekhovs gun belongs to different project', async () => {
      prisma.chekhovsGun.findUnique.mockResolvedValue({
        id: 'gun-1',
        projectId: 'other-project',
        name: '墙上的枪',
      })

      await expect(service.remove('project-1', 'gun-1')).rejects.toBeInstanceOf(ForbiddenException)
    })
  })
})
