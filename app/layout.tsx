import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '876 Card Game Scorer',
  description: 'Track scores for the 876 card game',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>{children}</body>
    </html>
  )
}
