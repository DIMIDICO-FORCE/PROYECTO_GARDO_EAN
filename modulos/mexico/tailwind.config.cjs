module.exports={
  content:['./index.html','./src/**/*.{js,jsx,ts,tsx}'],
  theme:{extend:{colors:{
    gray:{950:'rgb(var(--c-gray-950) / <alpha-value>)',900:'rgb(var(--c-gray-900) / <alpha-value>)',800:'rgb(var(--c-gray-800) / <alpha-value>)',700:'rgb(var(--c-gray-700) / <alpha-value>)',500:'rgb(var(--c-gray-500) / <alpha-value>)',300:'rgb(var(--c-gray-300) / <alpha-value>)',200:'rgb(var(--c-gray-200) / <alpha-value>)'},
    cyan:{950:'rgb(var(--c-cyan-950) / <alpha-value>)',700:'rgb(var(--c-cyan-700) / <alpha-value>)',600:'rgb(var(--c-cyan-600) / <alpha-value>)',500:'rgb(var(--c-cyan-500) / <alpha-value>)',300:'rgb(var(--c-cyan-300) / <alpha-value>)'},
    onaccent:'rgb(255 255 255 / <alpha-value>)'
  },borderColor:({theme})=>({...theme('colors'),gray:{700:'rgb(var(--c-borde-gray-700) / <alpha-value>)'}}),divideColor:({theme})=>theme('borderColor')}}
};
