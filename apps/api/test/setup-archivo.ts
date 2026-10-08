/* Cada archivo de pruebas trabaja en su PROPIA base temporal (posmedica_test_<marca>), con las migraciones aplicadas
   con «migrate deploy» (no destructivo). Al terminar el archivo se elimina solo esa base. Así las pruebas no dependen
   del orden ni se afectan entre sí, y nunca tocan la base de desarrollo. */
import { execSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { afterAll } from "vitest";

const servidor = process.env.TEST_PG_SERVER!;
const nombre = `posmedica_test_${Date.now()}_${randomBytes(3).toString("hex")}`;
const url = `${servidor}/${nombre}?schema=public`;

const admin = new PrismaClient({ datasourceUrl: `${servidor}/postgres` });
await admin.$executeRawUnsafe(`CREATE DATABASE "${nombre}"`);
execSync("npx prisma migrate deploy", { stdio: "ignore", env: { ...process.env, DATABASE_URL: url } });
process.env.DATABASE_URL = url;

afterAll(async () => {
  const { prisma } = await import("../src/db.js");
  await prisma.$disconnect();
  await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${nombre}" WITH (FORCE)`);
  await admin.$disconnect();
});
