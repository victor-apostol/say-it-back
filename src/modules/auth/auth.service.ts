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
import { IJwtPayload } from "./interfaces/jwt.interface";
import { oAuthDto } from "./dto/oauth.dto";

@Injectable()
export class AuthService {
  @InjectRepository(User) 
  private readonly userRepository: Repository<User>;

  constructor(private readonly configService: ConfigService, private readonly jwtService: JwtService) {}

  async register(body: RegisterDto): Promise<string> { 
    const user = await this.userRepository.findOne({
      where: [{ email: body.email }, { username: body.username }]
    });

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
    const user = await this.userRepository.findOne({ 
      where: { 
        email: body.email,
        is_oauth: false 
      },
      select: {
        password: true,
        id: true,
        email: true
      }
    });

    if (!user) throw new BadRequestException("Incorrent email or password");

    const doesPasswordMatch = await bcrypt.compare(body.password, user.password);
    if (!doesPasswordMatch) throw new BadRequestException("Incorrent email or password");

    return this._generateToken({ 
      id: user.id,
      email: user.email 
    });
  }

  async oauth(body: oAuthDto): Promise<string> {
    let user = await this.userRepository.findOneBy({ email: body.email, is_oauth: true });

    const name = `${body.first_name} ${body.last_name}`;
    const username = 'oauthHardcodede';

    if (!user) {
      user = this.userRepository.create({
        name,
        username,
        email: body.email,
        avatar: body.avatar,
        is_oauth: true,
        password: 'oauth'
      });

      await this.userRepository.save(user);
    }
 
    return this._generateToken({
      id: user.id,
      email: user.email
    });
  }

  async validateUser(id: number): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findOne({ 
      where: { id }
    }); 

    return user;
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    if (username.length > 16) throw new BadRequestException("Username length must be lower than 17 characters");

    const user = await this.userRepository.findOne({
      where: {
        username
      },
      select: ['id']
    });

    return user 
      ? false 
      : true
  }

  _generateToken(payload: IJwtPayload): string {
    return this.jwtService.sign(payload);
  }
}
