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

interface IJwt {
  id: number;
  email: string;
}

@Injectable()
export class AuthService {
  @InjectRepository(User) 
  private readonly userRepository: Repository<User>;

  constructor(private readonly configService: ConfigService, private readonly jwtService: JwtService) {}

  async register(body: RegisterDto): Promise<string> { 
    const user = await this.userRepository.findOneBy({ email: body.email });

    if (user) throw new BadRequestException(messageAccountAlreadyExists);

    const passwordHash = await bcrypt.hash(body.password, Number(this.configService.get<string>('SALT')));

    const newUser = this.userRepository.create({
      ...body,
      password: passwordHash
    });

    await this.userRepository.save(newUser);

    return this._generateToken({ 
      id: newUser.id,
      email: newUser.email 
    });
  }

  async login(body: LoginDto): Promise<string> {
    const user = await this.userRepository.findOneBy({ email: body.email });

    if (!user) throw new BadRequestException("Incorrent email or password");

    const doesPasswordMatch = await bcrypt.compare(body.password, user.password);

    if (!doesPasswordMatch) throw new BadRequestException("Incorrent email or password");

    return this._generateToken({ 
      id: user.id,
      email: user.email 
    });
  }

  async googleOAuthAuthorization(body: RegisterDto) {
    let user = await this.userRepository.findOneBy({ email: body.email });

    if (user) return user;

    const generatedPassword = Math.random().toString(36).slice(-8);
    const passwordHash = await bcrypt.hash(generatedPassword, Number(this.configService.get<string>('SALT')));
    
    user = this.userRepository.create({
      ...body,
      password: passwordHash
    });

    await this.userRepository.save(user);
  }

  async validateUser(id: number): Promise<boolean> {
    return await this.userRepository.findOneBy({ id }) ? true : false;
  }

  _generateToken(payload: IJwt): string {
    return this.jwtService.sign(payload);
  }
}