import React from "react";
import { Carousel } from "react-responsive-carousel";

export default function ImageCarousel({ images = [] }) {
  if (!images.length) return null;

  return (
    <Carousel
      showThumbs={false}
      showStatus={false}
      infiniteLoop
      autoPlay
      interval={3000}
      swipeable
      emulateTouch
      className="rounded-xl overflow-hidden"
    >
      {images.map((img, idx) => (
        <div key={idx}>
          <img src={img} alt={`slide-${idx}`} className="object-cover h-64 w-full" />
        </div>
      ))}
    </Carousel>
  );
}
