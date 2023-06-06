import { BadRequestException, Injectable } from "@nestjs/common";
import { RegisterDto } from "./dto/register.dto";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from 'bcrypt';
import { messageAccountAlreadyExists } from "./constants";
import { User } from "../users/entities/user.entity";
import { JwtService } from "@nestjs/jwt";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  @InjectRepository(User) 
  private readonly userRepository: Repository<User>;

  constructor(private readonly configService: ConfigService, private readonly jwtService: JwtService) {}

  async register(body: RegisterDto): Promise<void> { 
    const user = await this.userRepository.findOneBy({ email: body.email });

    if (user) throw new BadRequestException(messageAccountAlreadyExists);

    const passwordHash = await bcrypt.hash(body.password, Number(this.configService.getOrThrow<string>('SALT')));

    const newUser = this.userRepository.create({
      ...body,
      password: passwordHash
    });

    await this.userRepository.save(newUser);
  }

  async login(body: LoginDto): Promise<string> {
    const user = await this.userRepository.findOneBy({ email: body.email });

    if (!user) throw new BadRequestException("Incorrent email or password");

    const doesPasswordMatch = await bcrypt.compare(body.password, user.password);

    if (!doesPasswordMatch) throw new BadRequestException("Incorrent email or password");

    const generatedToken = this.jwtService.sign({
      id: user.id,
      email: body.email
    });

    return generatedToken;
  }

  async validateUser(id: number): Promise<boolean> {
    const user = await this.userRepository.findOneBy({ id });

    return user ? true : false;
  }
}