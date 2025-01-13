//All strings used
const rbaTemplate = "rgb(%1, %2, %3)";
const btnElement = "button";
const textElement = "p";
const btnClass = "gameBtn";
const blockDisplay = "block";
const noneDisplay = "none";
const gameFieldId = "gameField";
const menuMsgId = "menuMsg";
const menuBtnId = "menuBtn";
const inputId = "buttonCount";
const posUnits = "px";
const movablePosType = "absolute";
const clickEvent = "click";
const clickAttribute = "onclick";

//Represents a button shuffled in the game
class Button {
    //Builds the Button element
    //num is the button's order in the memory
    //colour is the colour of the button
    constructor(num, colour) {
        this.num = document.createElement(textElement);
        this.num.innerHTML = num;

        this.btn = document.createElement(btnElement);
        this.btn.style.backgroundColor = colour;
        this.btn.style.left = 0;
        this.btn.style.top = 0;
        this.btn.classList.add(btnClass)
        this.btn.appendChild(this.num);
    }

    //Shows the Button's order number
    show() {
        this.num.style.display = blockDisplay;
    }

    //Hides the Button's order and prepares it for shuffling
    hide() {
        this.num.style.display = noneDisplay;
        this.btn.style.position = movablePosType;
    }

    //Returns the button element
    getBtnElement() {
        return this.btn;
    }

    //Returns the paragraph element showing the Button's order
    getNumber() {
        return this.num;
    }
}

//Represents the GameField containing the buttons
class GameField {
    //Establishes the buttons list and finds the field div
    constructor(){
        this.buttons = [];
        this.field = document.getElementById(gameFieldId);
    }

    //Generates a number of random colours
    #generateRandomColours(numOfButtons){
        let colours = [];
        for(let i = 0; i < numOfButtons; i++){
            let colour = rbaTemplate;
            for(let j = 1; j <= 3; j++){
                //Ensures the colours are different enough to be distinguishable
                const randVal = (Math.floor(Math.random() * 185) + 20) + (i * 10);
                colour = colour.replace(`%${j}`, randVal.toString());
            }
            colours[i] = colour;       
        }
        
        return colours;
    }

    //Generates the buttons in the field with random numbers
    #generateButtons(numOfButtons){
        //Makes colours even more random
        const colours = this.#generateRandomColours(numOfButtons).sort(() => {
            Math.random() - 0.5;
        });

        this.buttons = [];
        for(let i = 1; i <= numOfButtons; i++){
            this.buttons[i] = new Button(i, colours[i-1]);
        }
    }

    //Creates and displays buttons 
    displayButtons(numOfButtons){
        this.#generateButtons(numOfButtons);
        this.buttons.forEach((button)=>{
            this.field.appendChild(button.getBtnElement());
        });      
    }

    //Adds click listener to buttons
    //Game with functions used for the click event
    makeButtonsClickable(game){
        this.buttons.forEach((button)=>{
            const btnElement = button.getBtnElement();
            btnElement.addEventListener(clickEvent, () => {
                button.show();
                const num = parseInt(btnElement.firstChild.innerHTML);
                game.checkOrder(num);
            });
        });
    }

    //Shuffles buttons to new locations
    shuffleButtons(){
        this.buttons.forEach((button)=>{
            const btnElement = button.getBtnElement()
            const btnWidth = btnElement.offsetWidth;
            const btnHeight = btnElement.offsetHeight;
            const posx = Math.floor(Math.random() * this.field.offsetWidth) - btnWidth;
            const posy = Math.floor(Math.random() * this.field.offsetHeight) - btnHeight;

            btnElement.style.left = posx + posUnits;
            btnElement.style.top = posy + posUnits;
        });
    }

    //Hides the button numbers
    hideButtonNumbers(){
        this.buttons.forEach((button)=>{
            button.hide();
        });
    }

    //Clears field div
    clearBoard() {
        this.field.innerHTML = "";
        this.buttons = [];
    }
}

//Menu starting and restarting the game
class Menu {
    //Gathers elements used in the menu
    constructor(){
        this.menuMsg = document.getElementById(menuMsgId);
        this.menuBtn = document.getElementById(menuBtnId);
        this.inputField = document.getElementById(inputId);
    }

    //Checks if the user input is between 3 and 7
    #validateInput(){
        const userInput = this.inputField.value;
        return /^([3-7]{1})$/.test(userInput);
    }

    //Sets up the Menu's elements
    #setUpMenu(menuMsg, btnMsg, btnFunc){
        this.menuBtn.innerHTML = btnMsg;
        this.menuMsg.innerHTML = menuMsg;
        this.menuBtn.onclick = btnFunc;
    }

    //Shows the start menu
    //game represents the Game to be started
    showStartMenu(game){
        const btnFunc = () => {
            const input = this.#getUserInput();
            if(input > 0){
                game.startGame(input);
                this.menuBtn.removeAttribute(clickAttribute);
            }
        }

        this.#setUpMenu(startMsg, startBtnMsg, btnFunc);
        this.inputField.value = '';
        this.inputField.style.display = blockDisplay;
    }

    //Shows the end screen
    //menuMsg represents the message on the end screen
    //game represents the Game to be restarted
    showGameEndMenu(menuMsg, game){
        const restartFunc = () => {game.play();};
        this.#setUpMenu(menuMsg, restartBtnMsg, restartFunc);
        this.inputField.style.display = noneDisplay;
    }

    //Checks and returns the user input
    #getUserInput(){
        if(this.#validateInput()){
           const buttons =  parseInt(this.inputField.value);
           return buttons;
        }

        alert(badUserInputAlert);
        return -1;
    }
}

//The memory game
class Game {
    //Creates the field and menu for the game
    constructor(){
        this.gamefield = new GameField();
        this.menu = new Menu();
        this.numOfButtons = 0;
        this.order = 0;
    }

    //Initializes the game
    play(){
        this.order = 0;
        this.gamefield.clearBoard();
        this.menu.showStartMenu(this); 
    }

    //Starts the game
    //numOfButtons represents how many buttons the game is played with
    startGame(numOfButtons){
        this.numOfButtons = numOfButtons;
        this.gamefield.displayButtons(this.numOfButtons, this);
        const timeoutFunc = ()=>{
            this.gamefield.hideButtonNumbers();
            this.shuffleButtons();
        };
        setTimeout(timeoutFunc, this.numOfButtons * 1000);
    }

    //Shuffles the buttons
    shuffleButtons(){
        this.gamefield.shuffleButtons();
        let shuffleCount = 1;
        const self = this;
        const intervalId = setInterval(function(){shuffle(self)}, 2000);
        function shuffle(self) {
            if(shuffleCount >= self.numOfButtons){
                clearInterval(intervalId);
                self.gamefield.makeButtonsClickable(self);
            } else {
                self.gamefield.shuffleButtons();
                shuffleCount++;
            }
        }

    }

    //Checks if the user clicks the buttons according to the order
    //Checks if the game has been won
    checkOrder(num){
        if((++this.order) != num){
            this.menu.showGameEndMenu(loseMsg, this);
            this.gamefield.clearBoard();
        } 
        if(this.order == this.numOfButtons) {
            this.menu.showGameEndMenu(winMsg, this);
            this.gamefield.clearBoard();
        }
    }    
}

//Create and play game
const game = new Game();
game.play();