import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../prisma/prisma.service'
import * as bcrypt from 'bcrypt'
import { RegisterDto, LoginDto } from './dto'

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, name } = registerDto

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new ConflictException('该邮箱已被注册')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    })

    const token = this.generateToken(user.id, user.email)

    return {
      user: this.sanitizeUser(user),
      accessToken: token,
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto

    const user = await this.prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      throw new UnauthorizedException('邮箱或密码错误')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      throw new UnauthorizedException('邮箱或密码错误')
    }

    const token = this.generateToken(user.id, user.email)

    return {
      user: this.sanitizeUser(user),
      accessToken: token,
    }
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new UnauthorizedException('用户不存在')
    }

    return user
  }

  sanitizeUser(user: any) {
    const { password, ...result } = user
    return result
  }

  private generateToken(userId: string, email: string): string {
    const payload = { sub: userId, email }
    return this.jwtService.sign(payload)
  }
}
