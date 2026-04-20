import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { SiteConfigModule } from './site-config/site-config.module'
import { ProjectsModule } from './projects/projects.module'
import { ProjectCategoriesModule } from './project-categories/project-categories.module'
import { TeamModule } from './team/team.module'
import { MailModule } from './mail/mail.module'         // 新增
import { ContactModule } from './contact/contact.module' // 新增

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        UsersModule,
        SiteConfigModule,
        ProjectsModule,
        ProjectCategoriesModule,
        TeamModule,
        MailModule,      // 新增
        ContactModule,   // 新增
    ],
})
export class AppModule {}