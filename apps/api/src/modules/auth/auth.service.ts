import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // I5: Limpar refresh tokens expirados a cada 6 horas
  @Cron('0 */6 * * *')
  async cleanExpiredTokens() {
    const result = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    if (result.count > 0) {
      this.logger.log(`Limpeza: ${result.count} refresh tokens expirados removidos`);
    }
  }

  async register(email: string, password: string, name?: string) {
    if (!email || !password) {
      throw new BadRequestException('Email e senha são obrigatórios');
    }

    if (password.length < 6) {
      throw new BadRequestException('A senha deve ter pelo menos 6 caracteres');
    }

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, password: hashedPassword, name },
    });

    return { message: 'Conta criada com sucesso', user: this.sanitizeUser(user) };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.plan);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async refreshToken(refreshToken: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Token inválido ou expirado');
    }

    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    const accessToken = this.jwtService.sign({ sub: user.id, email: user.email, plan: user.plan });
    return { accessToken, expiresIn: 900 };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    return { message: 'Logout realizado com sucesso' };
  }

  private async generateTokens(userId: string, email: string, plan: string) {
    const accessToken = this.jwtService.sign({ sub: userId, email, plan });
    const refreshToken = this.jwtService.sign({ sub: userId }, { expiresIn: '7d' });

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken, expiresIn: 900 };
  }

  private sanitizeUser(user: any) {
    const { password, ...rest } = user;
    return rest;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    return this.sanitizeUser(user);
  }

  async updateProfile(userId: string, data: { name?: string; avatar?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.avatar && { avatar: data.avatar }),
      },
    });

    return { message: 'Perfil atualizado com sucesso', user: this.sanitizeUser(updatedUser) };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Não revelar se o email existe ou não
      return { message: 'Se o email estiver cadastrado, você receberá um link de recuperação' };
    }

    // Invalidar tokens anteriores
    await this.prisma.passwordReset.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Gerar token
    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.passwordReset.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
      },
    });

    // Enviar email
    const rawFrontendUrl = this.configService.get('FRONTEND_URL') || 'https://expertskills.com.br';
    const frontendUrl = rawFrontendUrl.split(',')[0].trim();
    const resetLink = `${frontendUrl}/resetar-senha?token=${token}`;

    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: this.configService.get('SMTP_USER') || 'experthebest@gmail.com',
          pass: this.configService.get('SMTP_PASS'),
        },
      });

      await transporter.sendMail({
        from: '"Expert Skills" <experthebest@gmail.com>',
        to: email,
        subject: 'Recuperação de Senha - Expert Skills',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0D0D0F; padding: 40px; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #fff; margin: 0;"><span style="color: #a855f7;">Expert</span> Skills</h1>
            </div>
            <div style="background: #1a1a1f; padding: 30px; border-radius: 8px; border: 1px solid #2a2a2f;">
              <h2 style="color: #fff; margin-top: 0;">Recuperação de Senha</h2>
              <p style="color: #a1a1aa;">Olá${user.name ? ` ${user.name}` : ''},</p>
              <p style="color: #a1a1aa;">Recebemos uma solicitação para redefinir sua senha. Clique no botão abaixo para criar uma nova senha:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" style="background: linear-gradient(to right, #9333ea, #a855f7); color: #fff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Redefinir Senha</a>
              </div>
              <p style="color: #71717a; font-size: 14px;">Este link expira em 30 minutos.</p>
              <p style="color: #71717a; font-size: 14px;">Se você não solicitou a recuperação de senha, ignore este email.</p>
            </div>
            <p style="color: #52525b; font-size: 12px; text-align: center; margin-top: 20px;">Expert Skills © ${new Date().getFullYear()}</p>
          </div>
        `,
      });

      this.logger.log(`Email de recuperação enviado para ${email}`);
    } catch (err) {
      this.logger.error('Erro ao enviar email de recuperação', err);
      throw new BadRequestException('Erro ao enviar email. Tente novamente.');
    }

    return { message: 'Se o email estiver cadastrado, você receberá um link de recuperação' };
  }

  async resetPassword(token: string, newPassword: string) {
    const reset = await this.prisma.passwordReset.findUnique({ where: { token } });
    if (!reset || reset.used || reset.expiresAt < new Date()) {
      throw new BadRequestException('Link de recuperação inválido ou expirado');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('A nova senha deve ter pelo menos 6 caracteres');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: reset.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordReset.update({
        where: { id: reset.id },
        data: { used: true },
      }),
    ]);

    return { message: 'Senha redefinida com sucesso' };
  }

  async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('Senha atual incorreta');
    }

    if (newPassword.length < 6) {
      throw new BadRequestException('A nova senha deve ter pelo menos 6 caracteres');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Senha alterada com sucesso' };
  }
}
