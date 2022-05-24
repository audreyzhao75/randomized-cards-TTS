window.addEventListener('DOMContentLoaded', init);

function init() {
    // TODO
    let synth = window.speechSynthesis;
    let voicesList;
    // Set voice select
    function get_voices() {
        return new Promise(
            function (resolve, reject) {
                // let synth = window.speechSynthesis;
                let id;
    
                id = setInterval(() => {
                    if (synth.getVoices().length !== 0) {
                        resolve(synth.getVoices());
                        clearInterval(id);
                    }
                }, 10);
            }
        )
    }
    
    let s = get_voices();
    s.then(function(voices) {
        voicesList = voices;
        for(var i = 0; i < voices.length; i++) {
            var option = document.createElement('option');
            option.textContent = voices[i].name + ' (' + voices[i].lang + ')';
    
            if(voices[i].default) {
                option.textContent += ' -- DEFAULT';
            }
    
            option.setAttribute('data-lang', voices[i].lang);
            option.setAttribute('data-name', voices[i].name);
            document.getElementById("voice-select").appendChild(option);
        }
    });

    // MAIN
    // For cards
    const suit = ["Spades", "Hearts", "Diamonds", "Clubs"];
    const num = ["Ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King"];

    let jokerVal = 1; // 1-on, 0-off
    let delay = 5000; // in ms
    let voice;

    let paused = false;
    var timeouts = [];
    var list = [];

    let currRound = -1; // delay mult
    let currListInd = 0;

    const settingsBlock = document.getElementById("settings");
    const gameBlock = document.getElementById("game-screen");
    const cardDisplay = document.getElementById("card-display");
    const pauseBtn = document.getElementById("pause-resume-button");
    const imgEle = document.getElementById("img-placeholder");
    const textEle = document.getElementById("text-placeholder");
    const backBtn = document.getElementById("back-button");
    const forwardBtn = document.getElementById("forward-button");
    const startBtn = document.querySelector("#start-game-button");
    const resetBtn = document.querySelector("#reset-game-button");


    // ===================== BUTTON CONROLS =====================

    // ===== Start the Game =====
    startBtn.addEventListener( "click", (e) => {
        e.preventDefault();

        // getting inputs
        
        // .val(); input:checkbox:checked

        // Joker
        const jokerCheck = $('#joker-switch input:checked').val(); //either on or undefined
        if(jokerCheck == "on") {
            jokerVal = 1;
        }
        else {
            jokerVal = 0;
        }

        // Delay
        delay = document.querySelector("#delayTime").value;

        // Voice
        // var toSpeak = new SpeechSynthesisUtterance(tts.value);
        const changeVoice = document.getElementById("voice-select");
        var selectedOption = changeVoice.selectedOptions[0].getAttribute('data-name');

        // if there was no choice
        if(selectedOption == null) {
            // return;
            selectedOption = "Alex (en-US) -- DEFAULT";
        }
        voice = selectedOption;

        // main setting disappear
        settingsBlock.style.display = "none";

        game_start();
    });
    
    // ===== Reset the Game =====
    resetBtn.addEventListener( "click", () => {
        window.location.reload();
        // e.preventDefault();
        // gameBlock.style.display = "none";
        // settingsBlock.style.display = "block";
        // cardDisplay.style.display = "none";
        // clearTimeout(rounds);
    });

    // ===== Pause and Resume Play =====
    pauseBtn.addEventListener("click", (e)=>{
        e.preventDefault();
        // when paused, resume
        if(paused == true){
            console.log("unpaused");
            paused = false;
            pauseBtn.textContent = "Pause";
            pauseBtn.className = "btn btn-secondary";
            game_play();
        }
        // when playing, pause
        else if(paused == false){
            console.log("paused");
            paused = true;
            pauseBtn.textContent = "Resume";
            pauseBtn.className = "btn btn-success";

            clearQueue();
            // for(let a = currListInd-1; a < timeouts.length; a++) {
            //     clearTimeout(timeouts[a]);
            // }
        }
    });

    function clearQueue() {
        currRound = -1; // reset timer delay mulitplier
        for(let a = currListInd-1; a < timeouts.length; a++) {
            clearTimeout(timeouts[a]);
        }
    }

    // ===== Back One Card =====
    backBtn.addEventListener("click", (e)=>{
        e.preventDefault();

        // then go back a list ind
        // only when there is cards before
        if(currListInd >= 1) {
            clearQueue();
            currListInd--;
            game_play();
        }
    });

    // ===== Forward One Card=====
    forwardBtn.addEventListener("click", (e)=>{
        e.preventDefault();

        if(currListInd < list.length - 1) {
            clearQueue();
            currListInd++;
            game_play();
        }
    });


    // ================== Main Game Mechanics ==================

    function game_start() {
        // new game screen appears
        gameBlock.style.display = "block";

        // randomize the cards for later
        const list = randomize_cards();

        // Countdown
        var timeleft = 3;
        const countdown = document.getElementById("countdown");

        countdown.style.display = "block";
        var downloadTimer = setInterval(function(){
            timeleft--;
            countdown.textContent = timeleft;
            if(timeleft <= 0){
                clearInterval(downloadTimer);
                countdown.style.display = "none";
                countdown.textContent = 5;

                // start playing
                game_play();
            }
        },1000);
    }

    // ===== Randomize the deck =====

    function randomize_cards() {
        list = [];

        // suit, num
        
        // if there is a joker, add it to the deck
        if(jokerVal == 1) {
            list.push("Red Joker");
        }
        // adding cards to the deck
        for(let i = 0; i < suit.length; i++) {
            for(let j = 0; j < num.length; j++) {
                list.push(num[j].concat(" of ", suit[i]));
            }
        }

        // time to randomize the array
        // Shuffle from https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
        let currentIndex = list.length,  randomIndex;

        // While there remain elements to shuffle.
        while (currentIndex != 0) {

            // Pick a remaining element.
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [list[currentIndex], list[randomIndex]] = [
                list[randomIndex], list[currentIndex]];
        }
        console.log(list);

        return list;
    }

    // ===== Main Game Play =====

    function game_play() {
        // Go through the list
        cardDisplay.style.display = "block";
        const startPath = "/assets/card-pngs/";

        // 
        for(let i = currListInd; i < list.length; i++) {
            currRound++;
            round(list, i, startPath);
        }
    }

    // ===== One Round =====

    function round(list, i, startPath) {
        timeouts.push(setTimeout(() => {
            // pauses
            // pauseBtn.addEventListener("click", ()=>{
            //     if(paused == false){
            //         paused = true;
            //         for(let a = i-1; a < timeouts.length; a++) {
            //             pauseBtn.textContent = "Resume";
            //             pauseBtn.className = "btn btn-success";
            //             clearTimeout(timeouts[a]);
            //         }
            //     }
            // });
            currListInd = i;
            // set text
            textEle.textContent = list[i];
            // set the img
            let cardDesc = list[i].toLowerCase().replaceAll(" ", "_") + ".png";
            imgEle.src = startPath + cardDesc;

            read_card(list[i]);

        }, delay * currRound));
    }

    // ===== TTS Function ===== 
    // voice was set before

    function read_card(text) {
        var toSpeak = new SpeechSynthesisUtterance(text);
        // 
        for(var i = 0; i < voicesList.length ; i++) {
            if(voicesList[i].name === voice) {
                toSpeak.voice = voicesList[i];
            }
        }
        synth.cancel();
        synth.speak(toSpeak);
    }

    //     const changeVoice = document.getElementById("voice-select");
    //     const pressTalk = document.querySelector("#tts-button");
    //     const tts = document.getElementById("text-to-speak");
    //     // const smile = document.querySelector("img");

    //     // when press to talk button is pushed
    //     pressTalk.addEventListener("click", (e) => {
    //         e.preventDefault();

    //         var toSpeak = new SpeechSynthesisUtterance(tts.value);
    //         var selectedOption = changeVoice.selectedOptions[0].getAttribute('data-name');

    //         // when there's no voice selected yet
    //         if(selectedOption == null) {
    //             // return;
    //             selectedOption = "Alex (en-US) -- DEFAULT";
    //         }
    //         // console.log(selectedOption);
    //         for(var i = 0; i < voices.length ; i++) {
    //             if(voices[i].name === selectedOption) {
    //                 toSpeak.voice = voices[i];
    //             }
    //         }
    //         // toSpeak.pitch = pitch.value;
    //         // toSpeak.rate = rate.value;

    //         // open mouth
    //         // smile.src = "assets/images/smiling-open.png";

    //         synth.cancel();
    //         synth.speak(toSpeak);

    //         toSpeak.onend = function(event) {
    //             console.log('Utterance has finished being spoken after ' + event.elapsedTime + ' seconds.');
    //             // smile.src = "assets/images/smiling.png";
    //         };

    //         tts.blur();
    //     });
        
    
    
    
    // });   
}