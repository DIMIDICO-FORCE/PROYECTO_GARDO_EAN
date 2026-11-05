try{document.documentElement.dataset.theme=(localStorage.getItem('ean-tema')||localStorage.getItem('mx2027-tema'))==='light'?'light':'dark'}catch{document.documentElement.dataset.theme='dark'}
