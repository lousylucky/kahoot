import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, writeBatch } from 'firebase/firestore';

const ADMIN_UID = 'G0sm3SoeKxYthuc87AQO7qwfWa52';

const app = initializeApp({
  apiKey: 'AIzaSyB9-Ek0AXBPf0Z4N0vHat29CrCW0gRVJTo',
  authDomain: 'cahot-85255.firebaseapp.com',
  projectId: 'cahot-85255',
});

const db = getFirestore(app);

const quizzes = [
  {
    title: 'Capitals of Europe',
    description: 'Test your knowledge of European capital cities!',
    questions: [
      { text: 'What is the capital of Germany?', choices: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt'], correct: 0 },
      { text: 'What is the capital of Spain?', choices: ['Barcelona', 'Madrid', 'Seville', 'Valencia'], correct: 1 },
      { text: 'What is the capital of Poland?', choices: ['Krakow', 'Gdansk', 'Warsaw', 'Wroclaw'], correct: 2 },
      { text: 'What is the capital of Italy?', choices: ['Milan', 'Rome', 'Naples', 'Florence'], correct: 1 },
      { text: 'What is the capital of Sweden?', choices: ['Gothenburg', 'Malmo', 'Uppsala', 'Stockholm'], correct: 3 },
    ],
  },
  {
    title: 'Capitals of the World',
    description: 'How well do you know world capitals? Find out!',
    questions: [
      { text: 'What is the capital of Japan?', choices: ['Osaka', 'Tokyo', 'Kyoto', 'Nagoya'], correct: 1 },
      { text: 'What is the capital of Australia?', choices: ['Sydney', 'Melbourne', 'Canberra', 'Brisbane'], correct: 2 },
      { text: 'What is the capital of Brazil?', choices: ['Rio de Janeiro', 'Sao Paulo', 'Salvador', 'Brasilia'], correct: 3 },
      { text: 'What is the capital of Canada?', choices: ['Toronto', 'Vancouver', 'Ottawa', 'Montreal'], correct: 2 },
      { text: 'What is the capital of Egypt?', choices: ['Alexandria', 'Cairo', 'Luxor', 'Giza'], correct: 1 },
    ],
  },
  {
    title: 'General Knowledge',
    description: 'A mix of fun trivia questions for everyone!',
    questions: [
      { text: 'Which planet is known as the Red Planet?', choices: ['Venus', 'Jupiter', 'Mars', 'Saturn'], correct: 2 },
      { text: 'How many continents are there?', choices: ['5', '6', '7', '8'], correct: 2 },
      { text: 'What is the largest ocean on Earth?', choices: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correct: 3 },
      { text: 'Who painted the Mona Lisa?', choices: ['Michelangelo', 'Leonardo da Vinci', 'Raphael', 'Donatello'], correct: 1 },
      { text: 'What is the chemical symbol for water?', choices: ['O2', 'CO2', 'H2O', 'NaCl'], correct: 2 },
    ],
  },
];

async function seed() {
  for (const quiz of quizzes) {
    const quizRef = doc(collection(db, 'quizzes'));
    const batch = writeBatch(db);

    batch.set(quizRef, {
      title: quiz.title,
      description: quiz.description,
      admin: ADMIN_UID,
      createdAt: Date.now(),
    });

    for (const q of quiz.questions) {
      const qRef = doc(collection(quizRef, 'questions'));
      batch.set(qRef, {
        text: q.text,
        choices: q.choices.map((text) => ({ text })),
        correctChoiceIndex: q.correct,
      });
    }

    await batch.commit();
    console.log(`Created: ${quiz.title} (${quiz.questions.length} questions)`);
  }

  console.log('Done! 3 quizzes with 15 questions total.');
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
