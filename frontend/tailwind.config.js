/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        // Ultra small screens (Galaxy Fold, very small phones)
        '2xs': '280px',
        // Extra small screens (iPhone SE, small phones)
        'xs': '320px',
        // Portrait tablets and large phones
        'sm': '640px',
        // Landscape tablets
        'md': '768px',
        // Laptops
        'lg': '1024px',
        // Desktop
        'xl': '1280px',
        // Large desktop
        '2xl': '1536px',
        // Ultra-wide screens
        '3xl': '1920px',
        // Custom breakpoints for specific device orientations
        'portrait': { 'raw': '(orientation: portrait)' },
        'landscape': { 'raw': '(orientation: landscape)' },
        // Specific device breakpoints
        'fold': '280px', // Galaxy Fold inner screen
        'mini': '375px', // iPhone Mini
        'mobile-lg': '414px', // iPhone Plus/Max
        'tablet-sm': '600px', // Small tablets
        'tablet-lg': '900px', // Large tablets
        // Height-based breakpoints for very short screens
        'h-xs': { 'raw': '(max-height: 500px)' },
        'h-sm': { 'raw': '(max-height: 600px)' },
        'h-md': { 'raw': '(max-height: 700px)' },
        // Combined breakpoints for flippable screens
        'flip-sm': { 'raw': '(max-width: 480px) and (orientation: landscape)' },
        'flip-md': { 'raw': '(max-width: 768px) and (orientation: landscape)' },
      },
      spacing: {
        // Extra fine-grained spacing for small screens
        '0.25': '0.0625rem', // 1px
        '0.75': '0.1875rem', // 3px
        '1.25': '0.3125rem', // 5px
        '1.75': '0.4375rem', // 7px
        '2.25': '0.5625rem', // 9px
        '3.25': '0.8125rem', // 13px
        '4.5': '1.125rem',   // 18px
        '5.5': '1.375rem',   // 22px
        '6.5': '1.625rem',   // 26px
        '7.5': '1.875rem',   // 30px
        '8.5': '2.125rem',   // 34px
        '9.5': '2.375rem',   // 38px
        '11': '2.75rem',     // 44px
        '13': '3.25rem',     // 52px
        '15': '3.75rem',     // 60px
        '17': '4.25rem',     // 68px
        '18': '4.5rem',      // 72px
        '19': '4.75rem',     // 76px
        '21': '5.25rem',     // 84px
        '22': '5.5rem',      // 88px
        '23': '5.75rem',     // 92px
        '25': '6.25rem',     // 100px
        '26': '6.5rem',      // 104px
        '27': '6.75rem',     // 108px
        '28': '7rem',        // 112px
        '29': '7.25rem',     // 116px
        '30': '7.5rem',      // 120px
        '31': '7.75rem',     // 124px
        '33': '8.25rem',     // 132px
        '34': '8.5rem',      // 136px
        '35': '8.75rem',     // 140px
        '37': '9.25rem',     // 148px
        '38': '9.5rem',      // 152px
        '39': '9.75rem',     // 156px
        '41': '10.25rem',    // 164px
        '42': '10.5rem',     // 168px
        '43': '10.75rem',    // 172px
        '45': '11.25rem',    // 180px
        '46': '11.5rem',     // 184px
        '47': '11.75rem',    // 188px
        '49': '12.25rem',    // 196px
        '50': '12.5rem',     // 200px
      },
      fontSize: {
        // Extra small font sizes for tiny screens
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }], // 10px
        '3xs': ['0.5rem', { lineHeight: '0.625rem' }],  // 8px
      },
      minWidth: {
        '0': '0px',
        '4': '1rem',
        '8': '2rem',
        '12': '3rem',
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
        '28': '7rem',
        '32': '8rem',
        '36': '9rem',
        '40': '10rem',
        '44': '11rem',
        '48': '12rem',
        '52': '13rem',
        '56': '14rem',
        '60': '15rem',
        '64': '16rem',
        '72': '18rem',
        '80': '20rem',
        '96': '24rem',
      },
      maxWidth: {
        '2xs': '16rem',
        '3xs': '12rem',
        '4xs': '10rem',
        '5xs': '8rem',
        '6xs': '6rem',
        '7xs': '4rem',
        '8xs': '3rem',
        '9xs': '2rem',
      },
      borderWidth: {
        '3': '3px',
        '5': '5px',
        '6': '6px',
        '7': '7px',
        '10': '10px',
      }
    },
  },
  plugins: [],
}
