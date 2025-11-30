/*
  Warnings:

  - Added the required column `automatizado` to the `PresupuestoTermotanques` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."PresupuestoTermotanques" ADD COLUMN     "automatizado" BOOLEAN NOT NULL;
