import React from 'react'

export default function Card({ children, className = '', ...props }) {
  return (
    <div 
      className={`rounded-lg shadow-card ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}