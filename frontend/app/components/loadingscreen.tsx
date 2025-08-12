"use client";

import Image from "next/image";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#fec401] z-50">
      <div className="text-center">
        <Image
          src="/images/logo.png"
          alt="Cardiac Delights Logo"
          width={120}
          height={120}
          className="mx-auto animate-pulse"
        />
        <h2 className="mt-4 text-2xl font-bold text-black">Loading...</h2>
      </div>
    </div>
  );
}
