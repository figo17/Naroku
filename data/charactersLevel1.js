/**
 * Data Karakter Level 1: Orientasi Tokoh (Paraga Legenda Rara Kuning)
 * Berisi informasi tokoh, ciri-ciri busana, opsi jawaban, dan kunci jawaban.
 */
export const charactersLevel1 = [
  {
    id: 'rara_kuning',
    name: 'Rara Kuning',
    subtitle: 'Dewi Sekartaji',
    image: '/assets/level1/screen_rara_kuning.jpg',
    description:
      'Rara Kuning yaiku putri saka Patih Lembu Amiseno kang nandhang lara gondhok lan penyakit kulit. Dheweke berani ngulandara kanggo golek tamba ing Gunung Wilis.',
    attire: [
      { label: 'Nganggo kebaya warna kuning emas.' },
      { label: 'Nganggo kain jarik bermotif khas Jawa.' },
      { label: 'Nggelung gelung sandhungan kembang melati.' },
      { label: 'Nganggo selendhang abang minangka panganggo.' },
    ],
    options: [
      'Nganggo kebaya kuning.',
      'Nganggo kebaya ijo.',
      'Nandhang lara gondhok.',
      'Nandhang lara kuning.',
      'Putri Patih Lembu Amiseno.',
    ],
    // Indeks jawaban benar (0-based): 0, 2, 4
    correctIndices: [0, 2, 4],
    correctAnswers: [
      'Nganggo kebaya kuning.',
      'Nandhang lara gondhok.',
      'Putri Patih Lembu Amiseno.',
    ],
    boxCenterX: 72.31,
    boxCentersY: [41.41, 46.96, 52.60, 58.25, 63.98],
  },
  {
    id: 'rara_runting',
    name: 'Rara Runting',
    subtitle: 'Dewi Kilisuci',
    image: '/assets/level1/screen_rara_runting.jpg',
    description:
      'Rara Runting yaiku adhine Rara Kuning. Dheweke ngadhepi lara kuning lan tansah setya nindakake lelampahan bareng adhine nggolek pambulihan.',
    attire: [
      { label: 'Nganggo kebaya warna ijo.' },
      { label: 'Nganggo kain jarik bermotif khas Jawa.' },
      { label: 'Nggelung sanggul kembang melati.' },
      { label: 'Nganggo selendhang ijo minangka panganggo.' },
    ],
    options: [
      'Nganggo kebaya ijo.',
      'Adhite Rara Kuning.',
      'Nandhang lara kuning.',
      'Nggelung gelung kembang melati.',
      'Putri Patih Lembu Amiseno.',
    ],
    // Indeks jawaban benar (0-based): 0, 1, 2 (serta 4 juga valid sebagai putri Patih Lembu Amiseno)
    correctIndices: [0, 1, 2, 4],
    correctAnswers: [
      'Nganggo kebaya ijo.',
      'Adhite Rara Kuning.',
      'Nandhang lara kuning.',
    ],
    boxCenterX: 72.36,
    boxCentersY: [41.32, 46.88, 52.52, 58.25, 63.98],
  },
  {
    id: 'resi_darmo',
    name: 'Resi Darmo',
    subtitle: 'Pertapa Gunung Wilis',
    image: '/assets/level1/screen_resi_darmo.jpg',
    description:
      'Resi Darmo yaiku pertapa suci ing lereng Gunung Wilis sing weni ilmu obat-obatan tradhisional. Dheweke nulung Rara Kuning lan Rara Runting marasake lara.',
    attire: [
      { label: 'Nganggo jubah warna coklat lan krem.' },
      { label: 'Nganggo kain jarik bermotif Jawa.' },
      { label: 'Rambut gondhel putih lan jenggot dawa.' },
      { label: 'Nggawa tongkat kayu.' },
    ],
    options: [
      'Nganggo jubah coklat lan krem.',
      'Rambut gondhel lan jenggot putih.',
      'Duwe ilmu obat-obatan.',
      'Raja ing Karajan Daha.',
      'Nggawa tongkat kayu.',
    ],
    // Indeks jawaban benar (0-based): 0, 1, 2, 4 (opsi 3 adalah SALAH karena Raja Daha adalah Patih Lembu Amiseno)
    correctIndices: [0, 1, 2, 4],
    correctAnswers: [
      'Nganggo jubah coklat lan krem.',
      'Rambut gondhel lan jenggot putih.',
      'Duwe ilmu obat-obatan.',
    ],
    boxCenterX: 72.27,
    boxCentersY: [41.32, 46.88, 52.52, 58.25, 63.98],
  },
  {
    id: 'lembu_amiseno',
    name: 'Patih Lembu Amiseno',
    subtitle: 'Raja Daha/Kadiri',
    image: '/assets/level1/screen_lembu_amiseno.jpg',
    description:
      'Patih Lembu Amiseno yaiku bapake Rara Kuning lan Rara Runting sing kuwasa ing Karajaan Daha. Dheweke tegas, wicaksana, lan tresna marang kulawargane.',
    attire: [
      { label: 'Nganggo mahkota raja kang ana jamrut abang.' },
      { label: 'Nganggo jubah kerajaan warna abang marun.' },
      { label: 'Nganggo kain jarik bermotif khas kerajaan.' },
      { label: 'Nduweni kumis lan jenggot yamg rapi.' },
    ],
    options: [
      'Bapake Rara Kuning lan Rara Runting.',
      'Nganggo jubah warna cokelat lan putih',
      'Nggawa tongkat kayu.',
      'Raja utawa patih ing Karajaan Daha.',
      'Rambut gondhel lan jenggot putih.',
    ],
    // Opsi 0 dan 3 benar. Jika murid memilih opsi 0 & 3, atau ciri yang sesuai, diberikan skor
    correctIndices: [0, 3],
    correctAnswers: [
      'Bapake Rara Kuning lan Rara Runting.',
      'Raja utawa patih ing Karajaan Daha.',
    ],
    boxCenterX: 72.31,
    boxCentersY: [41.15, 46.61, 52.08, 57.64, 63.11],
  },
];
