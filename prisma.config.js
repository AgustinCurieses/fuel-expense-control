/** @type {import('prisma-client-js').PrismaClientOptions} */
const config = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
}

export default config
