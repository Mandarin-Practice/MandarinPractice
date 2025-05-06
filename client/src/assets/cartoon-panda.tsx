import React from "react";

export default function CartoonPanda() {
  return (
    <svg
      viewBox="0 0 500 500"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%" }}
    >
      {/* Black ears */}
      <circle cx="120" cy="150" r="60" fill="#282828" />
      <circle cx="380" cy="150" r="60" fill="#282828" />

      {/* White head/body */}
      <ellipse cx="250" cy="250" rx="170" ry="180" fill="#FFFBEB" stroke="#282828" strokeWidth="10" />

      {/* Black eyes */}
      <ellipse cx="180" cy="230" rx="45" ry="60" fill="#282828" />
      <ellipse cx="320" cy="230" rx="45" ry="60" fill="#282828" />

      {/* White eye highlights */}
      <circle cx="190" cy="210" r="15" fill="#FFFFFF" />
      <circle cx="330" cy="210" r="15" fill="#FFFFFF" />

      {/* Black nose */}
      <ellipse cx="250" cy="290" rx="20" ry="15" fill="#282828" />

      {/* Mouth with red tongue */}
      <path d="M 230 320 Q 250 340 270 320" stroke="#282828" strokeWidth="5" fill="none" />
      <path d="M 250 320 L 250 330 Q 250 340 240 340 L 260 340 Q 250 340 250 330 Z" fill="#FF6B6B" />

      {/* White belly patch */}
      <path d="M 200 330 Q 250 360 300 330 Q 300 400 250 420 Q 200 400 200 330 Z" fill="#FFFBEB" stroke="#282828" strokeWidth="5" />
    </svg>
  );
}