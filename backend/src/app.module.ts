import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { SiteConfigModule } from './site-config/site-config.module'
import { ProjectsModule } from './projects/projects.module'
import { ProjectCategoriesModule } from './project-categories/project-categories.module'
import { TeamModule } from './team/team.module'
import { MailModule } from './mail/mail.module'
import { ContactModule } from './contact/contact.module'
import { PostersModule } from './posters/posters.module'
import { ProjectBlocksModule } from './project-blocks/project-blocks.module'

@Module({
    imports: [
        PrismaModule,
        AuthModule,
        UsersModule,
        SiteConfigModule,
        ProjectsModule,
        ProjectCategoriesModule,
        TeamModule,
        MailModule,
        ContactModule,
        PostersModule,
        ProjectBlocksModule,
    ],
})
export class AppModule {}