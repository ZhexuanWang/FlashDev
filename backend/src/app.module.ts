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
import { BlogPostsModule } from './blog-posts/blog-posts.module'
import { BlogBlocksModule } from './blog-blocks/blog-blocks.module'
import { MarketModule } from './market/market.module'
import { ForumModule } from './forum/forum.module'
import { ForumSectionsModule } from './forum-sections/forum-sections.module'
import { ForumGroupsModule } from './forum-groups/forum-groups.module'
import { ForumColumnsModule } from './forum-columns/forum-columns.module'

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
        BlogPostsModule,
        BlogBlocksModule,
        MarketModule,
        ForumModule,
        ForumSectionsModule,
        ForumGroupsModule,
        ForumColumnsModule,
    ],
})
export class AppModule {}