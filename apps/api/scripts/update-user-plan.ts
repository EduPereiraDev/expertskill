import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { email: 'free@teste.com' },
    data: { plan: 'EXPERT' }
  });
  console.log('Usuário atualizado:', user.email, '-> Plano:', user.plan);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
