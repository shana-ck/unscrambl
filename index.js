import { Game, start } from './class.js'
import words from './wordList.json' with {type: 'json'}

const modal = document.querySelector('.modal')
const openModal = document.getElementById('openModal')
const close = document.querySelector('.close')

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


