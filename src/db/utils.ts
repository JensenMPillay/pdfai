import { db } from "@/db";
import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

export const getDbUser = async (condition: Prisma.UserWhereUniqueInput) => {
  const dbUser = await db.user.findFirst({
    where: condition,
  });

  return dbUser;
};

export const getDbFile = async (condition: Prisma.FileWhereInput) => {
  const dbFile = await db.file.findFirst({
    where: condition,
  });

  // Error
  if (!dbFile) throw new TRPCError({ code: "NOT_FOUND" });

  return dbFile;
};
