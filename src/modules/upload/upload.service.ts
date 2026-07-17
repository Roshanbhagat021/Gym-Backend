import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);

  constructor(private configService: ConfigService) {
    const cloudinaryUrl = this.configService.get<string>('CLOUDINARY_URL');

    if (cloudinaryUrl) {
      cloudinary.config({ cloudinary_url: cloudinaryUrl, secure: true });
      return;
    }

    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (
      !cloudName ||
      !apiKey ||
      !apiSecret ||
      cloudName === 'your_cloud_name' ||
      apiKey === 'your_api_key' ||
      apiSecret === 'your_api_secret'
    ) {
      this.logger.warn(
        'Cloudinary credentials are missing or still using placeholder values.',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
  }

  async uploadImage(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'gym_platform',
          },
          (error, result) => {
            if (error) {
              this.logger.error(`Cloudinary upload failed: ${error.message}`);
              reject(
                new BadRequestException(
                  `Image upload failed: ${error.message}`,
                ),
              );
            } else if (!result?.secure_url) {
              reject(
                new InternalServerErrorException(
                  'Image upload failed: Cloudinary did not return a URL',
                ),
              );
            } else {
              resolve(result);
            }
          },
        )
        .end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(new InternalServerErrorException('Image deletion failed'));
        } else {
          resolve(result);
        }
      });
    });
  }
}
