import {
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { classToPlain } from 'class-transformer';
import { User } from 'src/user/entities/user.entity';
import { DataSource, QueryBuilder, Repository } from 'typeorm';
import { CreateArticleDTO } from '../dto/createArticle.dto';
import { UpdateArticleDTO } from '../dto/updateArticle.dto';
import { Article } from '../entities/article.entity';
import { ArticleHashtag } from '../entities/article_hashtag.entity';
import { Hashtag } from '../entities/hashtag.entity';
import { ArticleService } from '../service/article.service';
import { ArticleList } from './articleList.mockdata';

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
  let updateArticleDto: UpdateArticleDTO;

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

    updateArticleDto = {
      title: 'NEST JS 사용',
      content: 'Nest JS를 사용해보겠습니다',
      hashtag: '#성장,#공부,#스터디',
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

  describe('게시글 생성 요청', () => {
    it('호출 카운팅', async () => {
      await articleService.createArticle(article, user1);
      const hashtags = await articleService.getHashtag(article.hashtag);
      const totalHashtag = hashtags.length;
      expect(articleRepository.create).toHaveBeenCalledTimes(1);
      expect(articleRepository.save).toHaveBeenCalledTimes(1);
      expect(articleHashtagRepository.insert).toHaveBeenCalledTimes(
        totalHashtag,
      );
      expect(hashtagRepository.findOne).toHaveBeenCalledTimes(totalHashtag);
    });

    it('게시글 생성 요청 성공', async () => {
      jest.spyOn(articleRepository, 'save').mockResolvedValue(article);
      const result = await articleService.createArticle(article, user1);
      const hashtags = await articleService.getHashtag(article.hashtag);
      const totalHashtag = hashtags.length;
      expect(result['title']).toStrictEqual(article.title);
      expect(result['content']).toStrictEqual(article.content);
      expect(result['totalView']).toStrictEqual(0);
      expect(result['totalLike']).toStrictEqual(0);
      expect(result['hashtag']).toHaveLength(totalHashtag);
    });

    it('게시글 생성 요청 시 필수 인자가 없을 경우', async () => {
      jest.spyOn(articleRepository, 'save').mockResolvedValue(article);
      delete article.title;
      try {
        await articleService.createArticle(article, user1);
      } catch (error) {
        expect(error).toBeInstanceOf(InternalServerErrorException);
      }
    });
  });

  describe('게시글 삭제 요청', () => {
    it('호출 카운팅', async () => {
      try {
        await articleService.deleteArticle(article.id, user1);
        expect(articleRepository.softDelete).toHaveBeenCalledTimes(1);
      } catch (e) {}
    });

    it('게시글 삭제 요청 성공', async () => {
      jest
        .spyOn(articleRepository, 'softDelete')
        .mockResolvedValue({ affected: 1 });
      const result = await articleService.deleteArticle(article.id, user1);
      expect(result['id']).toStrictEqual(article.id);
    });

    it('게시글 삭제 요청 실패', async () => {
      jest
        .spyOn(articleRepository, 'softDelete')
        .mockResolvedValue({ affected: 0 });
      try {
        await articleService.deleteArticle(article.id, user2);
      } catch (e) {
        expect(e).toBeInstanceOf(UnauthorizedException);
      }
    });
  });

  describe('게시글 수정 요청', () => {
    it('호출 카운팅', async () => {
      await articleService.updateArticle(1, updateArticleDto, user1);

      expect(articleRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
      expect(
        articleRepository.createQueryBuilder().update,
      ).toHaveBeenCalledTimes(1);
      expect(articleRepository.createQueryBuilder().set).toHaveBeenCalledTimes(
        1,
      );
      expect(
        articleRepository.createQueryBuilder().where,
      ).toHaveBeenCalledTimes(1);
      expect(
        articleRepository.createQueryBuilder().andWhere,
      ).toHaveBeenCalledTimes(1);
      expect(
        articleRepository.createQueryBuilder().execute,
      ).toHaveBeenCalledTimes(1);
    });

    it('게시글 수정 요청 성공', async () => {
      jest
        .spyOn(articleRepository.createQueryBuilder(), 'execute')
        .mockResolvedValue(article);

      const result = await articleService.updateArticle(
        1,
        updateArticleDto,
        user1,
      );
      expect(result['title']).toStrictEqual(article.title);
      expect(result['content']).toStrictEqual(article.content);
      expect(result['hashtag']).toStrictEqual(article.hashtag);
    });

    it('게시글 수정 요청 실패', async () => {
      jest
        .spyOn(articleRepository.createQueryBuilder(), 'execute')
        .mockResolvedValue(article);

      try {
        await articleService.updateArticle(1, updateArticleDto, user2);
      } catch (e) {
        expect(e).toBeInstanceOf(UnauthorizedException);
      }
    });
  });
});
