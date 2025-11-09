import React from "react";
import useCart from "../hooks/UseCart";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";

export default function ProductCard({ product }) {
  const { addItem } = useCart();

  // ✅ Support comma-separated URLs OR array OR single string
  let images = [];

  if (Array.isArray(product.image)) {
    images = product.image;
  } else if (typeof product.image === "string" && product.image.includes(",")) {
    images = product.image.split(",").map((s) => s.trim());
  } else {
    images = [product.image]; // fallback
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

      {/* ✅ CAROUSEL if multiple images */}
      {images.length > 1 ? (
        <Carousel
          showThumbs={false}
          showStatus={false}
          infiniteLoop
          autoPlay
          interval={3000}
          swipeable
          emulateTouch
          className="rounded-t-xl overflow-hidden"
        >
          {images.map((img, idx) => (
            <div key={idx}>
              <img
                src={img}
                alt={`${product.name}-${idx}`}
                className="h-40 w-full object-cover"
              />
            </div>
          ))}
        </Carousel>
      ) : (
        <img
          src={images[0]}
          alt={product.name}
          className="h-40 w-full object-cover"
        />
      )}

      {/* CONTENT */}
      <div className="space-y-2 p-4">
        <h3 className="text-base font-semibold">{product.name}</h3>
        <p className="text-sm text-gray-600">${product.price.toFixed(2)}</p>

        <button
          className="mt-1 inline-flex w-full items-center justify-center rounded-lg border border-gray-900 bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 active:scale-[.99]"
          onClick={() => addItem(product)}
        >
          Add to cart
        </button>
      </div>
    </div>
  );
}
