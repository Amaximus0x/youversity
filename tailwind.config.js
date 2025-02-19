/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  darkMode: 'class',
  theme: {
    container: {
			center: true,
			padding: "0rem",
			screens: {
				// "2xl": "1400px"
			}
		},

    extend: {
      screens: {
        'sm': '430px',
        // '2xl': '1440px',
      },

      margin: {
				"safe-top": "24px",
				"safe-left": "20px",
			},
			padding: {
				"safe-top": "24px",
			},

      colors: {
        // Brand colors
        'brand': {
          'red': '#EE434A',
          'turquoise': '#42C1C8',
          'navy': '#2A4D61',
          'darkBlue': '#1E3443'
        },
        // Light theme colors
        'light': {
          'bg': {
            'primary': '#FFFFFF',
            'secondary': '#FFF2F3',
            'tertiary': '#EDFEFF'
          },
          'text': {
            'primary': '#000000',
            'secondary': '#494848',
            'tertiary': '#A3A3A3',
          },
          'border': 'rgba(0, 0, 0, 0.05)'
        },
        // Dark theme colors
        'dark': {
          'bg': {
            'primary': '#000000',
            'secondary': '#241015',
            'tertiary': '#000000'
          },
          'text': {
            'primary': '#FFFFFF',
            'secondary': '#DDDADA',
            'tertiary': '#A3A3A3'
          },
          'border': 'rgba(255, 255, 255, 0.05)'
        },
        // Your new color palette
        "BackgroundRed": "#FFF2F3",
        "BackgoundBlue": "#EDFEFF",
        "Black": "#000000",
        "Black2": "#494848",
        "Green": "#2A4D61",
        "TransparentBlack": "#000000 0.05",
        "White": "#FFFFFF",
        "TransparentGreen": "rgba(65,193,203,0.1)",
        "Grey": "#A3A3A3",
        "TransparentWhite 1": "#FFFFFF",
        "Grey2": "#EBEBEB",
        "Black2dark":"#DDDADA",
        "TransparentGreen2": "#41C1CB",
        "blackTransparent": "#000000",
        "GreenHover": "#1E3443",
        "ButtonHover": "#C3373C",

      },
      fontSize: {
        'h1': [
          '48px', // Font size
          {
            lineHeight: '53px', // Line height
            fontWeight: '400', // Font weight
            fontFamily: 'Poppins', // Font family
            textAlign: 'left', // Text alignment
          },
        ],

        'h2': [
          '36px', // Font size
          {
            lineHeight: '44px', // Line height
            fontWeight: '500', // Font weight
            fontFamily: 'Poppins', // Font family
            textAlign: 'left', // Text alignment
          },
        ],
        'h2-bold': [
          '36px', // Font size
          {
            lineHeight: '44px', // Line height
            fontWeight: '700', // Font weight
            fontFamily: 'Poppins', // Font family
            textAlign: 'left', // Text alignment
          },
        ],
        'h2-mobile': [
          '26px', // Font size
          {
            lineHeight: '36px', // Line height
            fontWeight: '500', // Font weight
            fontFamily: 'Poppins', // Font family
            textAlign: 'left', // Text alignment
          },
        ],
        'h2-mobile-bold': [
          '26px', // Font size
          {
            lineHeight: '34px', // Line height
            fontWeight: '700', // Font weight
            fontFamily: 'Poppins', // Font family
            textAlign: 'left', // Text alignment
          },
        ],
        'h3-mobile': [
          '24px', // Font size
          {
            lineHeight: '28px', // Line height
            fontWeight: '500', // Font weight
            fontFamily: 'Poppins', // Font family
            textAlign: 'left', // Text alignment
          },
        ],
        
        '36-53': [
          '36px', // Font size
          {
            lineHeight: '53px', // Line height
            fontWeight: '400', // Font weight
            fontFamily: 'Poppins', // Font family
            textAlign: 'left', // Text alignment
          },
        ],

        'h4': [
          '20px', // Font size
          {
            lineHeight: '28px', // Line height
            fontWeight: '400', // Font weight
            letterSpacing: '-0.01em', // Letter spacing
            fontFamily: 'Poppins', // Font family
            textAlign: 'left', // Text alignment
            textUnderlinePosition: 'from-font', // Underline position
            textDecorationSkipInk: 'none', // Decoration skip ink
          },
        ],

        'h4-medium': [
          '20px', // Font size
          {
            lineHeight: '28px', // Line height
            fontWeight: '500', // Font weight
            fontFamily: 'Poppins', // Font family
            textAlign: 'left', // Text alignment
            textUnderlinePosition: 'from-font', // Underline position
            textDecorationSkipInk: 'none', // Decoration skip-ink
          },
        ],
        '18-28': [
          '18px', // Font size
          {
            lineHeight: '28px', // Line height
            fontWeight: '400', // Font weight
            letterSpacing: '-0.01em',
            fontFamily: 'Poppins', // Font family
            textAlign: 'left', // Text alignment
            textUnderlinePosition: 'from-font', // Underline position
            textDecorationSkipInk: 'none', // Decoration skip-ink
          },
        ],
        
        'body-semibold': [
          '16px', // Font size
          {
            lineHeight: '24px', // Line height
            fontWeight: '600', // Font weight
            fontFamily: 'Poppins', // Font family
            textAlign: 'left', // Text alignment
          },
        ],

        'body': [
          '16px', // Font size
          {
            lineHeight: '24px', // Line height
            fontWeight: '400', // Font weight
            fontFamily: 'Poppins', // Font family
            letterSpacing: '-0.01em', // Letter spacing
            textAlign: 'left', // Text alignment
          },
        ],

        'semibody-medium': [
          '14px', // Font size
          {
            lineHeight: '21px', // Line height
            fontWeight: '500', // Font weight
            fontFamily: 'Poppins', // Font family
            letterSpacing: '-0.01em', // Letter spacing
            textAlign: 'left', // Text alignment
          },
        ],
        
        'semi-body': [
          '14px', // Font size
          {
            lineHeight: '22px', // Line height
            fontWeight: '400', // Font weight
            fontFamily: 'Poppins', // Font family
            textAlign: 'left', // Text alignment
          },
        ],

        'mini-body': [
          '12px', // Font size
          {
            lineHeight: '20px', // Line height
            fontWeight: '400', // Font weight
            fontFamily: 'Poppins', // Font family
            textAlign: 'left', // Text alignment
          },
        ],
        'sm-button': [
          '12px', // Font size
          {
            lineHeight: '18px', // Line height
            fontWeight: '500', // Font weight
            fontFamily: 'Poppins', // Font family
            textAlign: 'left', // Text alignment
          },
        ],


      },
      
      fontFamily: {
        'poppins': 'Poppins',
      },
      letterSpacing: {
        'normal': '0em',
        'narrow': '-0.01em',
      },
      backgroundImage: {
        'gradient-light': 'linear-gradient(to bottom, #FFF2F3, #EDFEFF)',
        'gradient-dark': 'linear-gradient(180deg, #241015 0%, #0E1313 100%)',
      }
    }
  },
  
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.underline-from-font': {
          textUnderlinePosition: 'from-font',
        },
        '.skip-ink-none': {
          textDecorationSkipInk: 'none',
        },
        '.letter-spacing-tight': {
          letterSpacing: '-0.01em',
        },
      });
    },

    function ({ addComponents }) {
      addComponents({
        '.form-input': {
          height: '3rem', // 12 (h-12)
          paddingLeft: '1rem', // 4 (pl-4)
          paddingRight: '0.5rem', // 2 (pr-2)
          paddingTop: '0.5rem', // 2 (py-2)
          paddingBottom: '0.5rem', // 2 (py-2)
          backgroundColor: 'white', // bg-white
          borderRadius: '1rem', // rounded-2xl
          border: '1.5px solid rgba(0, 0, 0, 0.05)', // border border-black/5
          display: 'inline-flex', // inline-flex
          justifyContent: 'flex-start', // justify-start
          alignItems: 'center', // items-center
          gap: '0.5rem', // gap-2
          fontFamily: "'Poppins'", // font-['Poppins']
          fontSize: '0.75rem', // text-xs
          fontWeight: '400', // font-normal
          lineHeight: '1.25rem', // leading-tight
          color: '#a2a2a2', // text-[#a2a2a2]
        },
      });
    },
  ],
}