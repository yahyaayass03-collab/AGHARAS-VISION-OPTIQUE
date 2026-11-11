-- Archive d'un produit : non destructif, n'efface ni les commandes ni les visuels.
ALTER TABLE "Product" ADD COLUMN "archivedAt" TIMESTAMP(3);
