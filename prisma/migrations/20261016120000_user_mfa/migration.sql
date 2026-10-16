-- Optional two-factor settings per user. Existing accounts stay off.
CREATE TABLE "UserMfa" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "phone" TEXT,
    "phoneEnabled" BOOLEAN NOT NULL DEFAULT false,
    "phonePending" TEXT,
    "totpPending" TEXT,
    "totpSecret" TEXT,
    "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
    "emailCodeHash" TEXT,
    "emailCodeExpiresAt" TIMESTAMP(3),
    "emailCodeAttempts" INTEGER NOT NULL DEFAULT 0,
    "phoneCodeHash" TEXT,
    "phoneCodeExpiresAt" TIMESTAMP(3),
    "phoneCodeAttempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMfa_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserMfa_userId_key" ON "UserMfa"("userId");

ALTER TABLE "UserMfa" ADD CONSTRAINT "UserMfa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
