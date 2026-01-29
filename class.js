import words from './wordList.json' with {type: 'json'}

const shufButton = document.getElementById('shuffle')
const start = document.getElementById('start')
const input = document.getElementById('input')
const form = document.getElementById('guess')
const display = document.getElementById('countdown')
const levelBtn = document.getElementById('level-up')
const debugContainer = document.querySelector('.debug')
const debugBtn = document.getElementById("debugBtn")
const stopBtn = document.getElementById('stopBtn')
const threshold = document.getElementById('threshold')
const remaining = document.getElementById('remaining')
const scoreInfo = document.getElementById('level-score')
const wordsThreshold = document.getElementById('wordsThreshold')
const scorebar = document.querySelector(".scorebar")
const debugToggle = document.getElementById("debug-toggle")
const fakeToggle = document.getElementById("fake-toggle")
const unknownToggle = document.getElementById("unknown-toggle")
const infiniteToggle = document.getElementById("infinite-toggle")
const diffStep = document.getElementById('levelDiff')
const minLetters = document.getElementById('wordLength')
const warning = document.getElementById('warning')
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('')
const NO_Q = 'abcdefghijklmnoprstuvwxyz'.split('')
let count = 0

let intervalId

class InputHandler {
    constructor(game) {
        this.game = game
        shufButton.addEventListener('click', () => this.game.shuffleTiles())
        form.addEventListener('submit', (e) => {
            e.preventDefault()
            if (!input.disabled){
            this.game.check()
            input.value = ""
        }
        })
        debugToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.game.debugOn = true
                this.game.debugInit()
            } else {
                this.game.debugOn = false;
            }
        })
        fakeToggle.addEventListener('change', (e) => {
            this.game.decoy = !this.game.decoy
            // console.log(this.game.decoy)
        })
        unknownToggle.addEventListener('change', (e) => {
            this.game.unknown = !this.game.unknown
            // console.log(this.game.unknown)
        })
        diffStep.addEventListener('change', (e) => {
            this.game.diffStep = e.target.value
            // console.log(this.game.diffStep)
        })
        minLetters.addEventListener('change', (e) => {
            this.game.minLength = e.target.value
            // console.log(this.game.minLength)
        })
        infiniteToggle.addEventListener('change', (e) => {
            this.game.noLose = !this.game.noLose
        })
        levelBtn.addEventListener('click', () => this.game.levelUp())
        debugBtn.addEventListener("click", () => this.game.debug())
        stopBtn.addEventListener("click", () => this.game.stopTimer())
    }
}

class WordSet {
    constructor(game, words) {
        this.game = game
        this.words = words
        this.wordsByLevel = {}
        this.word = ""
        this.wordInfo = {}
        this.wordSet = {}
        this.sorted = {}
        this.weights = []
        this.wordLengths = []
        this.maxWeight = 10
        this.letters = []
        this.numTiles = 0
    }
    getWordsByLevel() {
        const first = this.words.filter(word => word.key.length <= 10)
        const second = this.words.filter(word => word.difficulty == 1)
        const third = this.words.filter(word => word.difficulty == 2)
        if (this.game.minLength !=4 ) {
            this.wordsByLevel[1] = first
            this.wordsByLevel[2] = [...first, second]
            this.wordsByLevel[3] = third
        }
        else {
            this.wordsByLevel[1] = first
            this.wordsByLevel[2] = this.words
        }
    }

    getRandomWord(difficulty) {
        let keys
        if (difficulty < 2 || this.game.minLength == 4) {
            keys = this.wordsByLevel[1].map(word => word.key)
        } else if (difficulty <=4 && this.game.minLength == 4){
            keys = this.wordsByLevel[2].map(word => word.key)
        } else {
            keys = this.wordsByLevel[3].map(word => word.key)
        }
    // let keys = this.words.map(word => word.key)
    const randIndex = Math.floor(Math.random() * keys.length)
    this.word = keys[randIndex]
    this.letters = Array.from(this.word)
    this.wordInfo = this.words.find(word => word.key === this.word)

    if (difficulty > 2) {
    this.wordSet = this.wordInfo["words"].filter(word => word.length >= this.game.minLength)
    } else {
        this.wordSet = this.wordInfo["words"]
    }
    if (this.game.debugOn) {
            console.log(this.wordSet)
        }
    this.words = this.words.filter(word => word.key != this.word)
    this.wordsByLevel[1] = this.wordsByLevel[1].filter(word => word.key !=this.word)
    this.wordsByLevel[2] = this.wordsByLevel[2].filter(word => word.key != this.word)
    if (this.wordsByLevel[3]) {
        this.wordsByLevel[3] = this.wordsByLevel[3].filter(word => word.key !=this.word)
    }
    this.sortByLength()
    this.scoreWeights()
    this.shuffle(this.letters)
    }
    getWord(word) {
        this.word = word
        this.letters = Array.from(this.word)
        this.wordInfo = this.words.find(word => word.key === this.word)
        this.wordSet = this.wordInfo.words
        console.log(this.wordSet)
        this.sortByLength()
        this.scoreWeights()
        this.shuffle(this.letters)
    }
    sortByLength() {
        this.wordSet.forEach(word => {
            const len = word.length
            if (!this.sorted[len]) {
                this.sorted[len] = []
            }
            this.sorted[len].push(word)
        })
        this.wordLengths = Object.keys(this.sorted)
    }
    scoreWeights() {
        let count = this.wordLengths.length
        this.weights = this.wordLengths.map((index) => {
            let weight = Math.abs(Math.floor(this.maxWeight*(1-index/count)))
            if (weight < 1) {
                weight = 1
            }
            return weight
        })
    }
    shuffle(letters) {
        this.letters = letters
        this.numTiles = this.letters.length
        let curIdx = this.letters.length, randomIndex
        while (curIdx !== 0) {
        // pick an element
        randomIndex = Math.floor(Math.random() * curIdx);
        curIdx--;
        // swap it with the current element
        [this.letters[curIdx], this.letters[randomIndex]] = [
            this.letters[randomIndex], this.letters[curIdx]];
    }
}
}

class Game {
    constructor(words) {
        this.words = words
        this.inputHandler = new InputHandler(this)
        this.wordData = null
        this.running = false
        this.curWord = ""
        this.letters = null
        this.found = null
        this.scoreVal = 0
        this.maxScore = 0
        this.level = 1
        this.timeLimit = 10
        this.time = 
        this.lastTime = 0
        this.isGameOver = false;
        this.wordsFound = []
        this.container = document.querySelector('.tile-container')
        this.blanks = document.querySelector('.blanks')
        this.levelDisplay = document.getElementById('level')
        this.score = document.getElementById('score')
        this.input = document.getElementById('input')
        this.start = document.getElementById('start')
        this.wordsScore = document.getElementById('wordsFound')
        this.input.disabled = true
        this.blanksArray = []
        this.tiles = []
        this.debugOn = false
        this.difficulty = 1
        this.decoy = true
        this.unknown = true
        this.diffStep = 5
        this.minLength = 5
        this.randIndex = -1
        this.randLetter = ''
        this.noLose = false
    }
    init() {
        this.wordData = new WordSet(this, this.words)
        this.wordData.getWordsByLevel()
        if (this.diffStep == 0) {
            this.difficulty = 4
            console.log(this.difficulty)
        }
            this.wordData.getRandomWord(this.difficulty)
            this.curWord = this.wordData.word
            if (this.debugOn) {
            console.log(this.curWord)
            }
            delete this.words[this.curWord]
            this.found = Object.fromEntries(this.wordData.wordLengths.map(word => [word, []]))
            this.input.disabled = false
            this.getMaxScore()
            this.createTiles()
            this.createBlanks()
            this.startTimer()
    }
    getMaxScore() {
        let scoreArray = this.wordData.weights
        let wordLen = this.wordData.wordLengths
        wordLen.forEach(key => {
            let numWords = this.wordData.sorted[key].length
            let weightIdx = wordLen.indexOf(key.toString())
            this.maxScore += scoreArray[weightIdx] * numWords
        })
        threshold.textContent = '/' + Math.floor(0.6*this.maxScore)
        wordsThreshold.textContent = '/' + Math.floor(0.75*this.wordData.wordSet.length)
        
    }
    createTiles() {
        let letters = this.wordData.letters
        this.letters = letters
        let numTiles = letters.length
        let confuse = ['decoy', 'unknown']
        let chosen
        let randIndex
        let randLetter
        if ((!this.decoy && !this.unknown) || this.difficulty == 1) {
            chosen = ''
        }
        if (this.difficulty > 1 && this.difficulty < 4) {
            if (this.decoy && this.unknown) {
                chosen = confuse[Math.round(Math.random())]
            } else if (this.decoy && !this.unknown) {
                chosen = confuse[0]
            } else if (this.unknown && !this.decoy) {
                chosen = confuse[1]
            }
        }
        if (this.difficulty == 4 && this.decoy && this.unknown) {
            chosen = 'both'
        } else if (this.difficulty == 4 && this.decoy) {
            chosen = confuse[0]
        } else if (this.difficulty == 4 && this.unknown) {
            chosen = confuse[1]
        }
        this.container.style.width = 80*numTiles + 'px'
        if (chosen == 'both') {
            randIndex = Math.floor(Math.random()*letters.length)
            this.randIndex = randIndex
            const letter = letters[randIndex]
            if (letters.includes('u')) {
                let clean = LETTERS.filter(char => char != letter)
                randLetter = clean[Math.floor(Math.random()*clean.length)]
                this.randLetter = randLetter
            } else {
                let clean = NO_Q.filter(char => char != letter)
                randLetter = clean[Math.floor(Math.random()*clean.length)]
                this.randLetter = randLetter
            }
            letters.push(randLetter)
            numTiles +=1
            warning.textContent = "Guess the mystery letter and one of the letters is a decoy!"
        } else if (chosen == 'unknown') {
            randIndex = Math.floor(Math.random()*letters.length)
            this.randIndex = randIndex
            warning.textContent = "Guess the mystery letter!"
        } else if (chosen == 'decoy') {
             if (letters.includes('u')) {
                randLetter = LETTERS[Math.floor(Math.random()*LETTERS.length)]
                this.randLetter = randLetter
            } else {
                randLetter = NO_Q[Math.floor(Math.random()*NO_Q.length)]
                this.randLetter = randLetter
            }
            letters.push(randLetter)
            numTiles +=1
            warning.textContent = "One of the letters is a decoy!"
        }
        for (let i=0; i < numTiles; i++) {
            const newTile = document.createElement('div')
            newTile.className = 'tile'
            newTile.id = i
            newTile.textContent = letters[i]
            if (chosen==='unknown' || chosen ==='both') {
                if (i === randIndex) {
                    newTile.textContent = '?'
                }
            }
            const xPos = i * 80
            newTile.style.transform = `translate(${xPos}px)`
            newTile.dataset.xPos = xPos
            this.tiles.push(newTile)
        }
        this.tiles.forEach(tile => {
            this.container.appendChild(tile)
        })
    }
    createBlanks() {
        let solver = this.wordData.sorted
        let wordLen = this.wordData.wordLengths
        wordLen.forEach(key => {
            let numWords = solver[key].length
        for (let i = 0; i< numWords; i++) {
        const blankTile = document.createElement('div')
        blankTile.className= 'blank-tile'
        const letterTiles = document.createElement('div')
        letterTiles.id = `${key}-${i}`
        letterTiles.className = "letters"
        blankTile.appendChild(letterTiles)
        letterTiles.textContent = '□'.repeat(key)
        this.blanksArray.push(blankTile)
        this.blanks.appendChild(blankTile)
        }
        })
    }
    shuffleTiles() {
        const currentPos = this.tiles.map(tile => tile.dataset.xPos)
        this.wordData.shuffle(currentPos)
        const shuffled = this.wordData.letters
        this.tiles.forEach((tile, index) => {
            const newPos = shuffled[index]
            tile.style.transform = `translate(${newPos}px)`
            tile.dataset.xPos = newPos
        })
    }
    reset() {
        let blankTiles = document.querySelectorAll('.blank-tile')
        blankTiles.forEach(blankTile => {
            blankTile.remove()
        })
        let tiles = document.querySelectorAll('.tile')
        tiles.forEach(tile => {
            tile.remove()
        })
        input.value = ""
        this.blanksArray = []
        this.tiles = []
        this.wordsFound = []
        this.scoreVal = 0
        this.maxScore = 0
        this.score.textContent = 0
        this.wordsScore.textContent = 0
        this.time = 0
        this.randIndex = -1
        this.randLetter = ''
        warning.textContent = ""
    }
    levelUp() {
        this.level += 1
        if (!this.diffStep == 0 && this.difficulty !=4){ 
            if (this.level % this.diffStep == 0) {
            this.difficulty +=1
            }
        }
        this.levelDisplay.textContent = this.level
        display.textContent = "02:00"
        levelBtn.style.display = 'none';
        scorebar.classList.remove('shimmer')
        this.score.classList.remove('up')
        this.reset()
        this.init()
    }
    check() {
        let input = document.getElementById('input').value.trim()
        input = input.toLowerCase()
        if (this.wordData.wordSet.includes(input) && !this.wordsFound.includes(input)) {
            let key = input.length
            this.wordsFound.push(input)
            this.found[key].push(input)
            let scoreIdx = this.wordData.wordLengths.indexOf(key.toString())
            this.scoreVal += this.wordData.weights[scoreIdx]
            this.wordsScore.textContent = this.wordsFound.length
            this.showToast(input)
            // if (this.debugOn) {
            //     console.log(this.wordData.weights[scoreIdx])
            // }
            if (this.scoreVal >= Math.floor(0.6*this.maxScore) || this.wordsFound.length >= Math.floor(0.75*this.wordData.wordSet.length)) {
                scorebar.classList.add('shimmer')
                scoreInfo.classList.add('up')
            }
            let wordIdx = this.wordData.sorted[key].indexOf(input)
            let lettersId = `${key}-${wordIdx}`
            let lettersFound = document.getElementById(lettersId)
            lettersFound.textContent = input
            if (key === this.curWord.length) {
                this.scoreVal += 10
                lettersFound.classList.add('pulse-text')
            }
            this.score.textContent = this.scoreVal
            if (this.wordsFound.length === this.wordData.wordSet.length) {
                this.stopTimer()
                levelBtn.style.display = 'inline-block'
            }
        }
    }
    scoreLevel() {
        if (this.scoreVal >= Math.floor(0.6*this.maxScore)) {
            display.textContent = "02:00"
            levelBtn.style.display = 'inline-block'
            // start.disabled = false
            // this.levelUp()
        } else if (this.wordsFound.length >= Math.floor(0.75*this.wordData.wordSet.length)) {
            display.textContent = "02:00"
            levelBtn.style.display = 'inline-block'
        } else if (this.noLose) {
            display.textContent = "02:00"
            levelBtn.style.display = 'inline-block'
        } else {
            this.isGameOver = true
            this.gameOver()
        }
    }
    startTimer() {
        let timer = 120, min, sec;
        if (!intervalId) {
        start.style.display = 'none'
        this.running = true;

        intervalId = setInterval(() => {
            min = parseInt(timer/60, 10)
            sec = parseInt(timer % 60, 10)
            min = min < 10 ? "0" + min : min;
            sec = sec < 10 ? "0" + sec : sec;
            display.textContent = min + ":" + sec;
            const percentage = (timer/120) * 100;
            remaining.style.width = percentage + '%'
            if (timer % 15 == 0 && timer!= 120) {
                this.shuffleTiles()
            }
            if (timer == 50 && (this.decoy || this.unknown)) {
                if (!this.randLetter == '') {
                    this.tiles.at(-1).classList.add("decoy")
                }
                if (this.randIndex !=-1) {
                    this.tiles[this.randIndex].textContent = this.letters[this.randIndex]
                    this.tiles[this.randIndex].classList.add('reveal')
                }
            }
            if (timer <= 0) {
                if (this.debugOn) {
                    console.log("time's up")
                }
                this.stopTimer()
                this.scoreLevel()
            }
            timer--;
        }, 1000)
    }
    }
    stopTimer() {
        clearInterval(intervalId)
        this.running = false
        input.disabled = true
        if (!this.debugOn) {
             this.scoreLevel()
            }
        intervalId = null
    }
    showToast(foundWord) {
        let toast = document.createElement("div")
        toast.classList.add("toast")
        toast.innerHTML = `<div class="toast-content-wrapper">
        <div class="toast-message">FOUND ${foundWord.toUpperCase()}</div>
        <div class="toast-progress"></div></div>`
        let duration = 5000
        toast.querySelector(".toast-progress").style.animationDuration = `${duration/1000}s`
        let toasted = document.body.querySelector(".toast")
        if (toasted) {
            toasted.remove()
        }
        document.body.appendChild(toast)
    }
    gameOver() {
        const main = document.querySelector('.main')
        main.textContent = ''
        const restart = document.createElement('button')
        restart.className = 'btn'
        restart.textContent = 'Game Over! Try Again?'
        main.appendChild(restart)
        restart.addEventListener('click', () => {window.location.reload()})

    }
    debugInit() {
        if (this.debugOn) {
            debugContainer.style.display = 'inline-block'
        stopBtn.style.display = 'inline-block'
                if (this.diffStep == 0) {
            this.difficulty = 4
            console.log(this.difficulty)
        }
    }
        if (!this.debugOn) {
            debugContainer.style.display = 'none'
            stopBtn.style.display = 'none'
        }
    }
    debug() {
            const debugVal = document.getElementById("debug")
            const debugInput = debugVal.value.trim().toLowerCase()
            this.wordData = new WordSet(this, this.words)
            this.wordData.getWord(debugInput)
            this.curWord = this.wordData.word
            console.log(this.curWord)
            this.found = Object.fromEntries(this.wordData.wordLengths.map(word => [word, []]))
            this.input.disabled = false
            this.getMaxScore()
            this.createTiles()
            this.createBlanks()
            this.startTimer()
    }
    }


export { Game, InputHandler, WordSet, shufButton, start, input, form, display, levelBtn, debugContainer, debugBtn, stopBtn, count, intervalId}


