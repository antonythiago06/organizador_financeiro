import { ConflictException, Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  ADMIN_ROLE,
  USER_ROLE,
  getAdminEmail,
  isAdminEmail,
} from './admin.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase();

    // O e-mail do administrador é reservado: ninguém cria conta comum com ele.
    if (isAdminEmail(email)) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado');
    }

    const senhaHash = await bcrypt.hash(dto.password, 10);
    const nomeRandom = email.split('@')[0];

    const usuario = await this.usersService.create({
      nome: nomeRandom.charAt(0).toUpperCase() + nomeRandom.slice(1),
      email,
      senhaHash,
    });

    return this.generateToken(usuario);
  }
  async validateGoogleUser(googleUser: {
  googleId: string;
  email: string;
  emailVerified?: boolean;
  name: string;
  avatar: string | null;
}) {
  const email = googleUser.email.trim().toLowerCase();

  // Conta Google do administrador: só entra se o e-mail for verificado pelo
  // Google. Não é criada/consultada na tabela `usuario`.
  if (isAdminEmail(email)) {
    if (!googleUser.emailVerified) {
      throw new UnauthorizedException('E-mail do Google não verificado');
    }

    return this.generateAdminToken();
  }

  let usuario = await this.usersService.findByEmail(email);

  if (!usuario) {
    usuario = await this.usersService.create({
      nome: googleUser.name,
      email: email,
      senhaHash: '',
    });
  }

  async forgotPassword(email: string) {
    const usuario = await this.usersService.findByEmail(email);
    if (!usuario) {
      return { message: 'Se o e-mail existir, enviaremos um código de recuperação.' };
    }

    const code = Math.floor(10000 + Math.random() * 90000).toString();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15);

    // Login por e-mail/senha do administrador (opcional): usa o hash bcrypt
    // guardado em ADMIN_PASSWORD_HASH. Sem essa variável, o admin só entra
    // pelo Google.
    if (isAdminEmail(email)) {
      const adminHash = process.env.ADMIN_PASSWORD_HASH;

      if (!adminHash) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      const adminSenhaValida = await bcrypt.compare(dto.password, adminHash);

      if (!adminSenhaValida) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      return this.generateAdminToken();
    }

    const usuario = await this.usersService.findByEmail(email);
    this.validarResetToken(usuario, code);

    return { message: 'Código válido com sucesso.' };
  }

  async resetPassword(email: string, code: string, novaSenha: string) {
    const usuario = await this.usersService.findForPasswordReset(email);

    if (!usuario) {
      throw new BadRequestException('Utilizador não encontrado.');
    }

    this.validarResetToken(usuario, code);

    if (usuario.senhaHash) {
      const isSamePassword = await bcrypt.compare(novaSenha, usuario.senhaHash);
      if (isSamePassword) {
        throw new BadRequestException('A nova senha não pode ser igual à senha anterior.');
      }
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await this.usersService.updatePasswordAndClearToken(usuario.id, senhaHash);

    return { message: 'Senha redefinida com sucesso!' };
  }

  private validarResetToken(usuario: any, code: string) {
    if (!usuario || usuario.resetToken !== code) {
      throw new BadRequestException('Código inválido.');
    }
    if (usuario.resetTokenExpires && new Date() > usuario.resetTokenExpires) {
      throw new BadRequestException('Este código expirou.');
    }
  }

  async validateGoogleUser(googleUser: { googleId: string; email: string; name: string; avatar: string | null }) {
    const email = googleUser.email.trim().toLowerCase();
    let usuario = await this.usersService.findByEmail(email);

    if (!usuario) {
      usuario = await this.usersService.create({
        nome: googleUser.name,
        email: email,
        senhaHash: '',
      });
    }

    return this.generateToken(usuario);
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase();
    const usuario = await this.usersService.findByEmail(email);

    if (!usuario || !(await bcrypt.compare(dto.password, usuario.senhaHash))) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.generateToken(usuario);
  }

  generateToken(usuario: { id: number; nome: string; email: string }) {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      role: USER_ROLE,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: USER_ROLE,
      },
    };
  }

  generateAdminToken() {
    const email = getAdminEmail();

    const payload = {
      sub: 0,
      email,
      nome: 'Administrador',
      role: ADMIN_ROLE,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: 0,
        nome: 'Administrador',
        email,
        role: ADMIN_ROLE,
      },
    };
  }
}
