import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

/* Crea una base temporal exclusiva de esta corrida, aplica las migraciones con «migrate deploy» (no destructivo)
   y al terminar elimina únicamente esa base. */
export default async function setup() {
  const servidor = process.env.TEST_PG_SERVER!;
  const nombre = process.env.TEST_DB_NAME!;
  if (!/^posmedica_test_\d+$/.test(nombre)) throw new Error("Nombre de base de pruebas inesperado.");

  const admin = new PrismaClient({ datasourceUrl: `${servidor}/postgres` });
  await admin.$executeRawUnsafe(`CREATE DATABASE "${nombre}"`);
  const url = `${servidor}/${nombre}?schema=public`;
  execSync("npx prisma migrate deploy", { stdio: "ignore", env: { ...process.env, DATABASE_URL: url } });

  return async () => {
    await admin.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${nombre}" WITH (FORCE)`);
    await admin.$disconnect();
  };
}
