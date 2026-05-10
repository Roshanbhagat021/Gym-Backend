import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('gym_content')
export class GymContent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  gymName: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ type: 'text', nullable: true })
  aboutSection: string;

  @Column({ type: 'jsonb', nullable: true })
  heroBanners: string[];

  @Column({ type: 'jsonb', nullable: true })
  contactInformation: any;

  @Column({ type: 'jsonb', nullable: true })
  socialLinks: any;

  @Column({ type: 'jsonb', nullable: true })
  galleryImages: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
