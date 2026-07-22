"use client";

import { use } from "react";
import { useVendor } from "@/context/VendorContext";
import { ProductForm } from "@/components/vendor/ProductForm";
import { EmptyState } from "@/components/vendor/shared";
import Link from "next/link";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { products } = useVendor();
  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="p-5">
        <EmptyState
          title="Product not found"
          hint="It may have been deleted."
          action={
            <Link href="/vendor/products" className="text-teal dark:text-off-white">
              Back to Products
            </Link>
          }
        />
      </div>
    );
  }

  return <ProductForm product={product} />;
}
