import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { QueryRunner, Repository } from "typeorm";
import * as sharp from 'sharp';
import * as ffmpeg from 'fluent-ffmpeg';

import { Media } from "@/modules/media/entities/media.entity";
import { User } from "@/modules/users/entities/user.entity";
import { Tweet } from "@/modules/tweets/entities/tweet.entity";
import { MEDIA_TYPES_SIZES, MEDIA_TYPES } from "../constants";
import { messageTweetNotFound } from "@/utils/global.constants";
import { Readable, Writable } from "stream";

@Injectable()
export class MediaService {
  @InjectRepository(Media)
  private readonly mediaRepository: Repository<Media>;

  async createTweetMedia(
    filePath: string, 
    authUser: User, 
    tweetId: number, 
    mediaType: MEDIA_TYPES, 
    queryRunner: QueryRunner
  ): Promise<Media> {
    const tweet = await queryRunner.manager.findOneBy(Tweet, { id: tweetId }); 
    if (!tweet) throw new BadRequestException(messageTweetNotFound);
    
    const mediaInstance = this.mediaRepository.create({
      path: filePath,
      user: authUser,
      media_type: mediaType,
      tweet
    });

    await queryRunner.manager.save(mediaInstance);

    return mediaInstance;
  }

  async compressImage(
    buffer: Buffer, 
    fileExtension: string, 
    fileType: MEDIA_TYPES_SIZES, 
    jpegQuality = 77, 
    pngCompressionLevel = 7
  ): Promise<Buffer> {
    try { 
      let sharpInstance = sharp(buffer).resize({
        width: fileType
      });

      if (fileExtension === 'jpeg' || fileExtension === 'jpg') {
        sharpInstance = sharpInstance
          .jpeg({ 
            quality: jpegQuality, 
            chromaSubsampling: '4:4:4', 
            progressive: true, 
            mozjpeg: true 
          });
      } else if (fileExtension === 'png') {
        sharpInstance = sharpInstance
          .png({ 
            compressionLevel: pngCompressionLevel 
          }); 
      }

      return await sharpInstance.toBuffer();
    } catch(err) {
      throw new InternalServerErrorException("Unable to compress the image");
    }
  }

  async compressVideo(payload: { buffer: Buffer }): Promise<Buffer> {
    // process.on("message", async () => {  
      let compressedBuffer: Buffer = Buffer.alloc(0);
      
      const { buffer } = payload;
      const timestamp = Date.now();
      
      console.log("initial buffer", buffer)
      const readable = new Readable();
      readable._read = () => {}; 
    
      readable.push(buffer);
      readable.push(null);

      const ws = new Writable();
      ws._write = ws.write;

      const k = await new Promise<Buffer>((resolve, reject) => {
        const ffmpegCommand = ffmpeg()
          .input(readable)
          .inputFormat('mp4') 
          .videoCodec('libx264') 
          .audioCodec('aac') 
          .outputOptions(['-crf 28'])
          .fps(30)  

      ffmpegCommand
        .on('data', (chunk) => {
          console.log("chunk", chunk)
          compressedBuffer = Buffer.concat([compressedBuffer, chunk]);
        })
        .on('end', () => {
          resolve(compressedBuffer);
        })
        .on('error', (err) => {
          reject(err);
        });
  
      console.log("DONE ???? STREAM:", compressedBuffer)

      ffmpegCommand.pipe(ws);
    })
    console.log(k);
    return compressedBuffer;
  }
}
