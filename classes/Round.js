class Round {

    constructor(players, settings) {
        this.players = players;
        this.determined = {};
        this.turn = Math.floor(Math.random() * players.length);
        this.history = [];
        this.settings = settings;
        this.startRound();
    }

    /**
     * Retrieves list of current players
     */
    getPlayers() {
        return this.players;
    }

    /**
     * Gets player with the given nickname
     */
    getPlayer(name) {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].nickname === name) {
                return this.players[i];
            }
        }
    }

    /**
     * Retrieves the last action performed from history
     */
    getLastAction() {
        return this.history[this.history.length-1];
    }

    /**
     * Retrieves the player who's turn it is
     */
    getTurnPlayer() {
        return this.players[this.turn];
    }

    /**
     * Retrieves the hands of the current players
     */
    getHands() {
        const hands = {};
        this.getPlayers().forEach(player => hands[player.sid] = { nickname: player.nickname, hand: player.getHand() });
        return hands;
    }

    /**
     * Initialize starting settings and hands for the round
     */
    startRound() {
        let suits = Array(this.players.length);
        for (let i = 0; i < suits.length; i++) {
            const iStr = (i+1).toString();
            suits[i] = iStr;
            this.determined[iStr] = 0;
        }
        this.players.forEach(player => player.initHand(suits));
    }

    /**
     * Advances the round turn to the next player
     */
    advanceTurn() {
        this.turn += 1;
        this.turn %= this.players.length;
        return this.turn;
    }

    /**
     * Simplifies a player's hand based on the logic elaborated in makeDeductions()
     * @param {Hand} hand               The hand of the player that can be simplified
     * @param {String[]} possibleSuits  The original list of possible suits
     * @param {String} suit             The suit to be simplified
     * @param {Number} numberOther      The number of other possible suits there are
     */
    simplify(hand, possibleSuits, suit, numberOther) {
        let otherPossibleSuits = possibleSuits.slice();
        otherPossibleSuits.splice(otherPossibleSuits.indexOf(suit), 1);
        if (otherPossibleSuits.length == 1) {
            for (let i = 0; i < numberOther; i++) {
                hand.addCard(otherPossibleSuits[0]);
                this.determined[otherPossibleSuits[0]] += 1;
            }
        } else {
            let newPossibility = Array(2);
            newPossibility[0] = otherPossibleSuits;
            newPossibility[1] = numberOther;
            hand.undetermined.push(newPossibility);
        }
    }

    /**
     * Simplifies the hands' uncertain cards on the logic that, if the number of cards that could possibly be of a certain suit 
     * in someone's hand exceeds the number of remaining undetermined cards of that suit, then we can take out that suit from
     * the list of possible suits for some of those cards. The number of those cards is the difference between the number of 
     * listed undetermined cards and the number of remaining undetermined cards of a certain suit.
     */
    makeDeductions() {
        Object.keys(this.determined).forEach(suit => {
            const numberRemaining = 4 - this.determined[suit];
            if (numberRemaining > 0) {
                this.players.forEach(player => {
                    const hand = player.getHand();
                    hand.undetermined.forEach(posSuits => {
                        if (posSuits[0].indexOf(suit) > -1 && posSuits[1] > numberRemaining) {
                            const numberOther = posSuits[1] - numberRemaining;
                            posSuits[1] -= numberOther;
                            this.simplify(hand, posSuits[0], suit, numberOther);
                        }
                    });
                });
            }
        });
    }

    /**
     * Checks if a user has won the game
     */
    checkWinConditions() {
        let noUndetermined = true;
        for (let i = 0; i < this.players.length; i++) {
            let hand = this.players[i].getHand();
            const fourKind = Object.keys(hand.determined).filter(key => hand.determined[key] === 4);
            if (fourKind.length > 0) {
                return true;
            }
            if (hand.undetermined.length !== 0) {
                noUndetermined = false;
            }
        }
        return noUndetermined;
    }

    /**
     * Determines values of playerFrom's hand based on the question
     * @param {String} playerFromString     The name of the player that asked the question
     * @param {String} suit                 The suit that is being asked
     */
    ask(playerFromString, playerToString, suit) {
        const playerFrom = this.getPlayer(playerFromString);
        const playerFromHand = playerFrom.getHand();
        if (playerFromHand.determined[suit] === 0) {
            playerFrom.determine(suit);
            this.determined[suit] += 1;
            this.makeDeductions();
            if (this.checkWinConditions()) {
                return playerFromString;
            }
        }
        this.history.push({ type: "Question", from: playerFromString, to: playerToString, suit: suit });
        return "";
    }

    /**
     * Updates the round-scoped determined variable based on a player's hand before and after narrow()
     * @param {Hand} beforeHand     The hand of the player before narrowing
     * @param {Hand} afterHand      The hand of the player after narrowing
     */
    updateDetermined(beforeHand, afterHand) {
        console.log(beforeHand);
        console.log(afterHand);
        Object.keys(beforeHand.determined).forEach(key => {
            console.log("hello outside if")
            if (beforeHand[key] !== afterHand[key]) {
                this.determined[key] += afterHand[key] - beforeHand[key];
                console.log("hello inside if")
            }
        });
    }

    /**
     * Determines or narrows values of playerTo's hand based on playerTo's response
     * to playerFrom's question. Processes transferring of cards between players.
     * @param {String} playerFromString     The name of the player that asked the question
     * @param {String} playerToString       The name of the player that was asked the question
     * @param {String} res                  Whether the player has the card or not
     * @param {String} suit                 The suit that is being asked
     */
    respond(playerFrom, playerToString, res, suit) {
        const playerTo = this.getPlayer(playerToString);
        if (res === "Yes") {
            const playerToHand = playerTo.getHand();
            if (playerToHand.determined[suit] === 0) {
                playerTo.determine(suit);
                this.determined[suit] += 1;
            }
            playerTo.transferCard(playerFrom, suit);
        } else {
            const beforeHand = playerTo.getHand();
            playerTo.narrow(suit);
            const afterHand = playerTo.getHand();
            console.log("narrow", playerTo.nickname);
            this.updateDetermined(beforeHand, afterHand);
        }
        this.makeDeductions();
        if (this.checkWinConditions()) {
            return playerFrom.nickname;
        }
        this.history.push({ type: "Response", from: playerToString, to: playerFrom.nickname, suit: suit });
        return "";
    }
}

module.exports = Round;