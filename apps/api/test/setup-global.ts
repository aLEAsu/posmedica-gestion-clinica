/* Las bases de prueba las crea cada archivo (test/setup-archivo.ts). Aquí solo se verifica que el servidor responda. */
import { PrismaClient } from "@prisma/client";

export default async function setup() {
  const admin = new PrismaClient({ datasourceUrl: `${process.env.TEST_PG_SERVER}/postgres` });
  await admin.$queryRaw`SELECT 1`;
  await admin.$disconnect();
}
