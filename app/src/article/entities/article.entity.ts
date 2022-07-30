import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/user/entities/user.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
  DeleteDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Like } from './like.entity';
import { Comment } from './comment.entity';
import { ArticleHashtag } from './article_hashtag.entity';
import { ArticleView } from './view.entity';
@Entity()
export class Article {
  @ApiProperty()
  @PrimaryGeneratedColumn('increment')
  public id: number;

  @ApiProperty({
    description: '게시글 제목',
    example: 'Nestjs로 게시판 만들기!',
  })
  @Column({
    nullable: false,
    length: 80,
  })
  public title: string;

  @ApiProperty({
    description: '게시글 내용',
    example: '오늘은 Nest js로 게시판을 만들어보겠습니다! blah blah',
  })
  @Column({
    nullable: false,
  })
  public content: string;

  @ApiProperty({ description: '해시태그' })
  @Column({
    nullable: true,
  })
  public hashtag: string;

  @ApiProperty({ description: '좋아요 수' })
  @Column({
    default: 0,
  })
  public totalLike: number;

  @ApiProperty({ description: '조회수' })
  @Column({
    default: 0,
  })
  public totalView: number;

  @ApiProperty({ description: '생성일' })
  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
  })
  public createdAt: Date;

  @ApiProperty({ description: '수정일' })
  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
  })
  public updatedAt: Date;

  @ApiProperty({ description: '삭제일' })
  @DeleteDateColumn({
    type: 'timestamp',
    nullable: true,
  })
  public deletedAt: Date;

  /**
   * @description
   * - user : article = 1:N
   * - article : like = 1:N
   * - article : hashtag = N:M
   * - article : comment = N:M
   * */

  @ManyToOne(() => User, (user) => user.article, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  @OneToMany(() => Like, (like) => like.article, {
    nullable: true,
    cascade: true,
  })
  @JoinColumn()
  like: Like[];

  // @OneToMany(() => ArticleView, (articleView) => articleView.article, {
  //   cascade: true,
  // })
  // @JoinColumn()
  // articleView: ArticleView[];

  @OneToMany(() => Comment, (comment) => comment.article, {
    nullable: true,
    cascade: true,
  })
  @JoinColumn()
  comment: Comment[];

  @OneToMany(() => ArticleHashtag, (articleHashtag) => articleHashtag.article, {
    nullable: true,
    cascade: true,
  })
  @JoinColumn()
  articleHashtag: ArticleHashtag[];
}
