!function(t,e){var n=720;function i(){var i=e.clientWidth/n*100;o(i);var a=parseFloat(t.getComputedStyle(e)["font-size"]);Math.abs(a-i)>.1&&o(i*i/a)}function o(t){e.style.fontSize=t+"px"}t.calcRem=function(e){n=e,i(),t.addEventListener("resize",i)}}(window,document.documentElement);