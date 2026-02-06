import { Game, start } from './class.js'
import words from './wordList.json' with {type: 'json'}

const modal = document.querySelector('.modal')
const openModal = document.getElementById('openModal')
const close = document.querySelector('.close')
const theme = document.getElementById('theme')
const useDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

const switchTheme = (e) => {
    if (e.target.checked) {
        document.documentElement.setAttribute('data-theme', 'dark')
        localStorage.setItem('theme', 'dark')
    } else {
        document.documentElement.setAttribute('data-theme', 'light')
        localStorage.setItem('theme', 'light')
    }
}

if (localStorage.getItem('theme') === 'dark' || (useDark && !localStorage.getItem('theme'))) {
    theme.checked = true
    document.documentElement.setAttribute('data-theme', 'dark')
}

theme.addEventListener('change', switchTheme)

openModal.addEventListener('click', () => modal.style.display = "block")
close.addEventListener('click', () => modal.style.display = "none")
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = "none"
    }
})


window.addEventListener('load', () => {
    const game = new Game(words)

    start.addEventListener('click', () => {
        game.init()
        })
})


