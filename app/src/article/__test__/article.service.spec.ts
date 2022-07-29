import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { classToPlain } from 'class-transformer';
import { User } from 'src/user/entities/user.entity';
import { DataSource, QueryBuilder, Repository } from 'typeorm';
import { CreateArticleDTO } from '../dto/createArticle.dto';
import { Article } from '../entities/article.entity';
import { ArticleHashtag } from '../entities/article_hashtag.entity';
import { Hashtag } from '../entities/hashtag.entity';
import { ArticleService } from '../service/article.service';

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const MockRepository = () => ({
  insert: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  softDelete: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockReturnThis(),
    withDeleted: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    execute: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
  }),
});
const qb = {
  connection: {},
} as QueryBuilder<Article>;

class MockDataSource {
  createQueryBuilder(): QueryBuilder<Article> {
    return qb;
  }
}
describe('ArticleService', () => {
  let articleService: ArticleService;
  let articleRepository: MockRepository<Article>;
  let hashtagRepository: MockRepository<Hashtag>;
  let articleHashtagRepository: MockRepository<ArticleHashtag>;

  let dataSource: DataSource;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        { provide: 'ArticleRepository', useFactory: MockRepository },
        { provide: 'HashtagRepository', useFactory: MockRepository },
        { provide: 'ArticleHashtagRepository', useFactory: MockRepository },
        {
          provide: DataSource,
          useClass: MockDataSource,
        },
      ],
    }).compile();

    articleService = module.get<ArticleService>(ArticleService);
    articleRepository = module.get(
      'ArticleRepository',
    ) as MockRepository<Article>;
    hashtagRepository = module.get(
      'HashtagRepository',
    ) as MockRepository<Hashtag>;
    articleHashtagRepository = module.get(
      'ArticleHashtagRepository',
    ) as MockRepository<ArticleHashtag>;
    dataSource = module.get<DataSource>(DataSource);
  });

  it('should be defined', () => {
    expect(articleService).toBeDefined();
  });

  let id;
  let article: Article;
  let user1: User;
  let user2: User;
  // let createArticleDto: CreateArticleDTO;

  beforeEach(() => {
    id = 1;
    user1 = {
      id: 1,
      email: 'test1@gmail.com',
      nickname: 'maverick',
      password: '1234qwer',
      createdAt: new Date(),
      updatedAt: new Date(),
      hashedRefreshToken: 'string',
      article: [],
      like: [],
      comment: [],
    };
    user2 = {
      id: 2,
      email: 'test2@gmail.com',
      nickname: 'iceman',
      password: '1234qwer',
      createdAt: new Date(),
      updatedAt: new Date(),
      hashedRefreshToken: 'string',
      article: [],
      like: [],
      comment: [],
    };

    article = {
      id: 1,
      title: 'NestJS로 게시판 만들기!',
      content: '오늘은 NestJS로 게시판을 만들어보겠습니다!',
      hashtag: '#개발자,#게시판,#Nest JS,#백엔드',
      totalLike: 0,
      totalView: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: user1,
      deletedAt: null,
      like: [],
      comment: [],
      articleHashtag: [],
    };
  });

  describe('게시글 상세 요청', () => {
    it('기본 테스트', () => {
      expect(articleService.getArticle).toBeDefined();
    });

    it('쿼리빌더 호출 카운팅', async () => {
      await articleService.getArticle(1);
      expect(articleRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(
        articleRepository.createQueryBuilder().select,
      ).toHaveBeenCalledTimes(1);
      expect(
        articleRepository.createQueryBuilder().addSelect,
      ).toHaveBeenCalledTimes(3);
      expect(
        articleRepository.createQueryBuilder().leftJoin,
      ).toHaveBeenCalledTimes(3);
      expect(
        articleRepository.createQueryBuilder().where,
      ).toHaveBeenCalledTimes(1);
      expect(
        articleRepository.createQueryBuilder().getOne,
      ).toHaveBeenCalledTimes(1);
    });

    it('게시글 상세 요청 성공', async () => {
      jest
        .spyOn(articleRepository.createQueryBuilder(), 'getOne')
        .mockResolvedValue(article);

      const result = await articleService.getArticle(1);

      expect(articleRepository.createQueryBuilder().getOne).toHaveBeenCalled();
      expect(result['title']).toStrictEqual(article.title);
      expect(result['content']).toStrictEqual(article.content);
      expect(result['totalView']).toStrictEqual(1);
      expect(result['totalLike']).toStrictEqual(0);
      expect(result['hashtag']).toHaveLength(4);
    });

    it('존재하지 않는 게시글 상세요청 시', async () => {
      jest
        .spyOn(articleRepository.createQueryBuilder(), 'getOne')
        .mockResolvedValue(article);

      try {
        await articleService.getArticle(100);
        expect(
          articleRepository.createQueryBuilder().getOne,
        ).toHaveBeenCalled();
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });
});
