-- CreateTable
CREATE TABLE "public"."PresupuestoTermotanques" (
    "id" SERIAL NOT NULL,
    "personas" INTEGER NOT NULL,
    "agua" TEXT NOT NULL,
    "altura" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modeloElegido" TEXT NOT NULL,
    "precioBase" DOUBLE PRECISION NOT NULL,
    "precioAccesorios" DOUBLE PRECISION NOT NULL,
    "precioFinal" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "PresupuestoTermotanques_pkey" PRIMARY KEY ("id")
);
