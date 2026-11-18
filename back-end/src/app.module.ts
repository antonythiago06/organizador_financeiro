import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
    type: 'postgres',
    host: process.env.DB_HOST || 'postgres', 
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'rootpassword',
    database: process.env.DB_NAME || 'organizador_financeiro',
    autoLoadEntities: true,
    synchronize: true,
    }),
    AuthModule,
    MailModule,
  ],
})
export class AppModule {}