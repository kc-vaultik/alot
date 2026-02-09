import { motion } from 'framer-motion';

const brands = [
  'Jordan',
  'KAWS',
  'Pop Mart',
  'Pokémon',
  'Vera Wang',
  'Hermès',
  'Rolex',
  'Dior',
  'Cartier',
  'YSL',
  'Louis Vuitton',
  'Chanel',
];

export function BrandCarousel() {
  // Duplicate brands for seamless infinite scroll
  const duplicatedBrands = [...brands, ...brands];

  return (
    <div className="w-full py-6">
      {/* Title */}
      <p className="text-center text-white/40 text-xs tracking-[0.3em] uppercase mb-6">
        Trusted by collectors of
      </p>
      
      {/* Carousel container */}
      <div className="relative overflow-hidden">
        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-black/85 to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-black/85 to-transparent z-10 pointer-events-none" />
        
        {/* Scrolling brands */}
        <motion.div
          className="flex items-center gap-12 whitespace-nowrap"
          animate={{
            x: ['0%', '-50%'],
          }}
          transition={{
            x: {
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            },
          }}
        >
          {duplicatedBrands.map((brand, index) => (
            <span
              key={`${brand}-${index}`}
              className="text-white/50 text-sm font-light tracking-wider hover:text-white/80 transition-colors duration-300"
            >
              {brand}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
