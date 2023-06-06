import { MigrationInterface, QueryRunner } from "typeorm";

export class Second1685791768139 implements MigrationInterface {
    name = 'Second1685791768139'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "test"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "test" character varying(128) NOT NULL`);
    }

}
