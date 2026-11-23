import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class CreateVnpayUrlDto {
  @ApiProperty({ description: 'ID gói dịch vụ cần thanh toán' })
  @IsMongoId()
  packageId: string;
}
