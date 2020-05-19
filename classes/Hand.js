class Hand {

    constructor(suits) {
        this.determined = new Map();
        this.undetermined = { numCards: 4, possibleSuits: suits }
    }

    /**
     * Determines the identity of one card to be suit
     * @param {String} suit     The suit that the card is determined to be
     */
    determine(suit) {
        this.undetermined.numCards -= 1;
        this.addCard(suit);
    }

    /**
     * Narrows the possible suits of undetermined cards to be not suit
     * @param {String} suit     The suit that the cards are determined not to be
     */
    narrow(suit) {
        const index = this.undetermined.possibleSuits.indexOf(suit);
        if (index > -1) {
            this.undetermined.possibleSuits.splice(index, 1);
        }
    }

    /**
     * Adds a card of the given suit to the hand
     * @param {String} suit     The suit of the added card
     */
    addCard(suit) {
        if (this.determined.get(suit)) {
            this.determined.get(suit) += 1;
        } else {
            this.determined.set(suit, 1);
        }
    }

    /**
     * Removes a card of the given suit from the hand
     * @param {String} suit     The suit of the lost card
     */
    loseCard(suit) {
        if (this.determined.get(suit) == 1) {
            this.determined.delete(suit);
        } else {
            this.determined.set(suit, this.determined.get(suit) - 1);
        }
    }
}

module.exports = Hand;