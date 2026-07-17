-- CreateTable
CREATE TABLE "CloseoutItem" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "assigneeId" TEXT,
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloseoutItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CloseoutItem_projectId_idx" ON "CloseoutItem"("projectId");

-- CreateIndex
CREATE INDEX "CloseoutItem_assigneeId_idx" ON "CloseoutItem"("assigneeId");

-- AddForeignKey
ALTER TABLE "CloseoutItem" ADD CONSTRAINT "CloseoutItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CloseoutItem" ADD CONSTRAINT "CloseoutItem_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
