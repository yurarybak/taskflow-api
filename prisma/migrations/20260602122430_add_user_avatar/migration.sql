/*
  Warnings:

  - A unique constraint covering the columns `[avatarStorageName]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatarStorageName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_avatarStorageName_key" ON "users"("avatarStorageName");
