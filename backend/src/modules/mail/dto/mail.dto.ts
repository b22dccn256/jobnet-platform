import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendMailDto {
  @ApiProperty({ example: 'candidate@example.com', description: 'Địa chỉ email người nhận' })
  @IsEmail()
  to: string;

  @ApiProperty({ example: 'Thông báo từ JobNet', description: 'Tiêu đề email' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: '<p>Nội dung thông báo</p>', description: 'Nội dung định dạng HTML' })
  @IsString()
  @IsNotEmpty()
  html: string;
}

export class TestMailDto {
  @ApiProperty({ example: 'tuan@example.com', description: 'Địa chỉ email nhận thư thử nghiệm' })
  @IsEmail()
  to: string;
}
