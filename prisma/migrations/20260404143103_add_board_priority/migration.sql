-- CreateEnum
CREATE TYPE "BoardPriority" AS ENUM ('high', 'medium', 'low');

-- AlterTable
ALTER TABLE "Board" ADD COLUMN     "priority" "BoardPriority" NOT NULL DEFAULT 'medium';
