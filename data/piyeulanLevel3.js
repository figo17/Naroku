// Daftar 10 pernyataan Piyeulan (Piwulang Luhur) Level 3 beserta kunci jawaban
// Koordinat centerY diukur presisi dari gambar public/assets/level3/screen_piyeulan.jpg (766 x 576)

export const PIYEULAN_BOX_X = {
  benerCenterPct: 65.34,
  salahCenterPct: 72.98,
};

export const PIYEULAN_ITEMS = [
  {
    id: '1',
    no: 1,
    statement: 'Nglalekake pitutur saka wong tuwa.',
    correct: 'salah',
    centerY: 31.60,
  },
  {
    id: '2',
    no: 2,
    statement: 'Tekad sing kuwat.',
    correct: 'bener',
    centerY: 36.11,
  },
  {
    id: '3',
    no: 3,
    statement: 'Mung mikirake awake dhewe.',
    correct: 'salah',
    centerY: 40.80,
  },
  {
    id: '4',
    no: 4,
    statement: 'Ngurmati alam.',
    correct: 'bener',
    centerY: 45.66,
  },
  {
    id: '5',
    no: 5,
    statement: 'Kula gelem ngrusak alas kanggo kepentingan dhewe.',
    correct: 'salah',
    centerY: 51.04,
  },
  {
    id: '6',
    no: 6,
    statement: 'Ngurmati tradhisi leluhur.',
    correct: 'bener',
    centerY: 56.16,
  },
  {
    id: '7',
    no: 7,
    statement: 'Sabar lan ikhlas nampa pacoban.',
    correct: 'bener',
    centerY: 60.76,
  },
  {
    id: '8',
    no: 8,
    statement: 'Ngadhepi pasulayan kanthi nesu lan duka.',
    correct: 'salah',
    centerY: 65.45,
  },
  {
    id: '9',
    no: 9,
    statement: 'Ora gampang nglokro.',
    correct: 'bener',
    centerY: 70.14,
  },
  {
    id: '10',
    no: 10,
    statement: 'Ora perlu njaga sesambungan karo sesami.',
    correct: 'salah',
    centerY: 75.00,
  },
];

export function scorePiyeulanAnswers(answersMap = {}) {
  let score = 0;
  PIYEULAN_ITEMS.forEach((item) => {
    if (answersMap[item.id] === item.correct) {
      score += 1;
    }
  });
  return score;
}
