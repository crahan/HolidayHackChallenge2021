// Modified chomp function that checks the cell at position (x,y)
function chomp(x, y) {
    if (challenges[x][y][0] != "") {
        // Clear the cell
        document.getElementById(x + ',' + y).innerHTML = "";
        if (challenges[x][y][1]) {
            // Update the score
            score += 100;
            document.getElementById("score").innerHTML = "<h2>" + score + "</h2>";
        } else {
            // Leave this in as a sanity check
            wigwags("Oh no! Ate a wrong answer!")
        }
    }
    challenges[x][y] = [[],[]]; 
    checkWin();
}             

// Play the level by chomping each cell containing a true statement
function playLevel() {
    for (var col = 0; col < challenges.length; col++) {
        for (var cell = 0; cell < challenges[col].length; cell++) {
            if (challenges[col][cell][1] == true) {chomp(col,cell);}
        }
    }
}

// Call playLevel() every 2 seconds
setInterval(playLevel, 2000); 
