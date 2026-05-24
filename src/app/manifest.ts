import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SourceAsia — Flight Booking',
    short_name: 'SourceAsia',
    description:
      'Search, compare, and book domestic flights across India with SourceAsia. Best fares guaranteed.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1a1a14',
    theme_color: '#e8522a',
    orientation: 'portrait-primary',
    categories: ['travel', 'booking'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
