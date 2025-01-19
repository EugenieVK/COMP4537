//HTML elements
const btnElement = "button";
const textElement = "textarea";
const divElement = "div";

//Element ids
const notesContainerId = "notes";
const buttonsContainerId = "buttonsDiv";
const addBtnId = "addBtn";
const updateMsgId = "updateTime";
const writerBtnId = "writerBtn";
const readerBtnId = "readerBtn";

//Element classes
const removeBtnClass = "removeBtn";
const backBtnClass = "backBtn";
const noteDivClass = "noteContainer";

//JSON localstorage keys
const keyString = "notes";

//Page links
const indexPageLink = "index.html";
const writerPageLink = "writer.html";
const readerPageLink = "reader.html";

//Represents a button
class Button {
    constructor(msg){
        this.btn = document.createElement(btnElement);
        this.btn.innerHTML = msg;
    }

    //Add on click function
    //func is the funciton to be added
    addOnClickEvent(func){
        this.btn.onclick = func;
    }

    //Returns the button element of the Button
    getBtn(){
        return this.btn;
    }
}

//Represents a back button returning to the index page
class BackButton extends Button {
    constructor(msg){
        super(msg);
        this.btn.classList.add(backBtnClass);
        this.addOnClickEvent(()=>{
            window.location.href = indexPageLink;
        });
    }
}

//Represents a remove button that removes notes
class RemoveButton extends Button {
    constructor(msg){
        super(msg);
        this.btn.classList.add(removeBtnClass);
    }
}

//Represents a note
class Note {
    constructor(text){
        this.text = text;
        this.noteContainer = document.createElement(divElement);
        this.noteContainer.classList.add(noteDivClass);

        this.textField = document.createElement(textElement);
        this.textField.innerHTML = this.text;
        this.noteContainer.appendChild(this.textField);
    }

    //Returns the container with all note elements
    getNoteElement(){
        return this.noteContainer;
    }
}

//Represents a note used by the writer
class WriterNote extends Note{
    constructor(text = ""){
        super(text);
        this.removeBtn = new RemoveButton(messages.removeBtnMsg);
        this.noteContainer.appendChild(this.removeBtn.getBtn());
    }
   
    //Adds event when note is edited
    //Func is the function called in the event
    addChangeEvent(func){
        this.textField.addEventListener("change", ()=>{
            this.text = this.textField.value;
            func();
        });
    }

    //Adds an event to the notes remove button
    addRemoveButtonEvent(writer){
        this.removeBtn.addOnClickEvent(()=>{
            writer.removeNote(this);
        });
    }

}

class ReaderNote extends Note {
    constructor(text = ""){
        super(text);
        this.textField.disabled = true;
    }
}

//Represents the page where notes are written
class Writer {
    constructor(){
        this.notes = [];
        this.getNotes();
        this.notesContainer = document.getElementById(notesContainerId);
        
        this.updateMsg = document.getElementById(updateMsgId);
        this.updateMessage();

        this.createAddButton();
        this.createBackButton();
    }

    //Creates a back button on the page
    createBackButton(){
        const backButton = new BackButton(messages.backBtnMsg);
        document.getElementById(buttonsContainerId).appendChild(backButton.getBtn());
    }

    //Creates an add button on the page for adding notes
    createAddButton(){
        const addButton = document.getElementById(addBtnId);
        addButton.innerHTML = messages.addBtnMsg;
        addButton.onclick = () => {this.addNote()};
    }

    //Gets notes from the localstorage
    getNotes(){
        const jsonNotes = JSON.parse(window.localStorage.getItem(keyString));
        if(jsonNotes != null){
            jsonNotes.forEach((note)=>{
                const newNote = this.createNote(note.text);
                this.notes.push(newNote);
            });
        }
        
    }

    //Creates Notes to display
    createNote(text = ""){
        const newNote = new WriterNote(text);
        newNote.addRemoveButtonEvent(this);
        newNote.addChangeEvent(()=>{
            this.storeNotes();
        });

        return newNote;
    }

    //Adds a note
    addNote(){
        const newNote = this.createNote();
        this.notes.push(newNote);
        this.notesContainer.appendChild(newNote.getNoteElement());
        this.updateMessage();
        this.storeNotes();
       
    }

    //Removes a note
    removeNote(delNote){
        this.notes.forEach((note, i) =>{
            if(note === delNote){
                this.notes.splice(i, 1);
            }
        });
        this.storeNotes();
        this.displayNotes();
    }

    //Updates the update time message
    updateMessage(){
        const time = new Date().toLocaleTimeString();
        this.updateMsg.innerHTML = messages.storedMsg + time;
    }

    //Displays all notes
    displayNotes(){
        this.notesContainer.innerHTML = "";
        this.notes.forEach((note)=>{
            this.notesContainer.appendChild(note.getNoteElement());
        });
    }

    //Stores all notes
    storeNotes() {
        window.localStorage.setItem(keyString, JSON.stringify(this.notes));
        this.updateMessage();
    }
}

//
class Reader {
    constructor(){
        this.notes = [];
        this.getNotes();
        this.notesContainer = document.getElementById(notesContainerId);
        this.displayNotes();

        this.updateMsg = document.getElementById(updateMsgId);
        this.updateMessage();

        this.createBackButton();
    }

    createBackButton(){
        const backButton = new BackButton(messages.backBtnMsg);
        document.getElementById(buttonsContainerId).appendChild(backButton.getBtn());
    }

    setLocalStorageListener(){
        window.addEventListener("storage", ()=>{
            this.updateNotes();
        });
    }

    getNotes(){
        this.notes = [];
        const jsonNotes = JSON.parse(window.localStorage.getItem(keyString));
        if(jsonNotes != null){
            jsonNotes.forEach((note)=>{
                this.notes.push(new ReaderNote(note.text));
            });
        }
    }

    updateMessage(){
        const time = new Date().toLocaleTimeString();
        this.updateMsg.innerHTML = messages.updatedMsg + time;
    }

    displayNotes(){
        this.notesContainer.innerHTML = "";
        this.notes.forEach((note)=>{
            this.notesContainer.appendChild(note.getNoteElement());
        });
    }

    updateNotes(){
        this.getNotes();
        this.displayNotes();
        this.updateMessage();
    }

    startAutoUpdate(){
        setInterval(()=>{this.updateNotes()}, 2000);
    }

}

class Home {
    constructor(){
        this.writerLink = document.getElementById(writerBtnId);
        this.readerLink = document.getElementById(readerBtnId);
    }

    setUpNotepadLinks(){
        this.writerLink.innerHTML = messages.writerBtnMsg;
        this.writerLink.onclick = this.openWriterPage;
        
        this.readerLink.innerHTML = messages.readerBtnMsg;
        this.readerLink.onclick = this.openReaderPage;
    }

    openWriterPage(){
        window.location.href = writerPageLink;
    }

    openReaderPage(){
        window.location.href = readerPageLink;
    }
}

if(window.location.href.includes(indexPageLink)){
    const homePage = new Home();
    homePage.setUpNotepadLinks();
} else if(window.location.href.includes(writerPageLink)){
    const writerPage = new Writer();
    writerPage.displayNotes();
} else if(window.location.href.includes(readerPageLink)){
    const readerPage = new Reader();
    readerPage.setLocalStorageListener();
    readerPage.startAutoUpdate();
}
