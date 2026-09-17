-- Redeemed magic-link nonces, making the stateless HMAC gate tokens single-use.
CREATE TABLE "GateTokenUse" (
    "nonce" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GateTokenUse_pkey" PRIMARY KEY ("nonce")
);

CREATE INDEX "GateTokenUse_expiresAt_idx" ON "GateTokenUse"("expiresAt");
