// learn.js – Lernfakten und Info-Karten-System

const FACTS = {
  gravity: {
    icon: '🌍',
    title: 'Schwerkraft',
    text: 'Die Erde zieht alles nach unten – das nennt man Schwerkraft! Je höher du springst, desto länger fällst du.',
  },
  friction: {
    icon: '🧊',
    title: 'Reibung',
    text: 'Auf Eis gibt es fast keine Reibung – deshalb rutschst du weiter! Reibung bremst uns normalerweise ab.',
  },
  potential_energy: {
    icon: '⬆️',
    title: 'Potenzielle Energie',
    text: 'Je höher du bist, desto mehr Energie steckt in dir! Wenn du fällst, wird daraus Bewegungsenergie.',
  },
  kinetic_energy: {
    icon: '💨',
    title: 'Kinetische Energie',
    text: 'Bewegung = Energie! Je schneller du bist, desto mehr kinetische Energie hast du.',
  },
  damping: {
    icon: '🏖️',
    title: 'Dämpfung',
    text: 'Sand bremst dich stark ab – das ist Dämpfung! Das Gegenteil von Eis.',
  },
  elasticity: {
    icon: '🤸',
    title: 'Elastizität',
    text: 'Ein Trampolin ist elastisch – es gibt dir die Energie zurück und schleudert dich nach oben!',
  },
  newton3: {
    icon: '🚀',
    title: 'Newtons 3. Gesetz',
    text: 'Wenn du springst, drückst du den Boden nach unten – und der Boden drückt dich nach oben! Actio = Reactio.',
  },
  impulse: {
    icon: '💥',
    title: 'Impuls & Kollision',
    text: 'Wenn du gegen eine Wand läufst, überträgst du deinen Impuls. Je schneller, desto stärker der Aufprall!',
  },
};

export class LearnSystem {
  constructor() {
    this.shownFacts = new Set();
    this.cardElement = document.getElementById('learn-card');
    this.cardIcon = this.cardElement.querySelector('.card-icon');
    this.cardTitle = this.cardElement.querySelector('.card-title');
    this.cardText = this.cardElement.querySelector('.card-text');
    this.cardBtn = this.cardElement.querySelector('.card-btn');
    this.cardPlay = this.cardElement.querySelector('.card-play');
    this.isShowing = false;
    this.onDismiss = null;
    this.currentUtterance = null;

    this.cardBtn.addEventListener('click', () => this.hideCard());
    this.cardPlay.addEventListener('click', () => this.toggleSpeech());
  }

  triggerFact(factId, callback) {
    if (this.shownFacts.has(factId) || this.isShowing) return false;

    const fact = FACTS[factId];
    if (!fact) return false;

    this.shownFacts.add(factId);
    this.showCard(fact, callback);
    return true;
  }

  showCard(fact, callback) {
    this.isShowing = true;
    this.onDismiss = callback || null;
    this.cardIcon.textContent = fact.icon;
    this.cardTitle.textContent = fact.title;
    this.cardText.textContent = fact.text;
    this.cardPlay.textContent = '\u25B6 Vorlesen';
    this.cardPlay.classList.remove('speaking');
    this.cardElement.classList.remove('hidden');
  }

  hideCard() {
    this.stopSpeech();
    this.cardElement.classList.add('hidden');
    this.isShowing = false;
    if (this.onDismiss) {
      this.onDismiss();
      this.onDismiss = null;
    }
  }

  toggleSpeech() {
    if (window.speechSynthesis.speaking) {
      this.stopSpeech();
      return;
    }
    const title = this.cardTitle.textContent;
    const text = this.cardText.textContent;
    const utterance = new SpeechSynthesisUtterance(`${title}. ${text}`);
    utterance.lang = 'de-DE';
    utterance.rate = 0.9;
    utterance.onend = () => {
      this.cardPlay.textContent = '\u25B6 Vorlesen';
      this.cardPlay.classList.remove('speaking');
    };
    this.currentUtterance = utterance;
    this.cardPlay.textContent = '\u25A0 Stopp';
    this.cardPlay.classList.add('speaking');
    window.speechSynthesis.speak(utterance);
  }

  stopSpeech() {
    window.speechSynthesis.cancel();
    this.cardPlay.textContent = '\u25B6 Vorlesen';
    this.cardPlay.classList.remove('speaking');
    this.currentUtterance = null;
  }

  // Automatische Trigger durch Spielevents
  checkEventTriggers(eventType) {
    switch (eventType) {
      case 'wall_hit':
        return this.triggerFact('impulse');
      case 'bounce':
        return this.triggerFact('elasticity');
      default:
        return false;
    }
  }

  getLearnedCount() {
    return this.shownFacts.size;
  }

  reset() {
    this.shownFacts.clear();
    this.hideCard();
  }
}
