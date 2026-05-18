-- CreateEnum
CREATE TYPE "LessonType" AS ENUM ('VIDEO', 'IMAGE', 'TEXT');

-- AlterTable
ALTER TABLE "videos" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "textContent" TEXT,
ADD COLUMN     "type" "LessonType" NOT NULL DEFAULT 'VIDEO',
ALTER COLUMN "videoUrl" DROP NOT NULL;
