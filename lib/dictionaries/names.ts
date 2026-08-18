/**
 * Indonesian given names and surnames.
 *
 * zxcvbn ships English/US name frequency lists, so these are invisible to it.
 * For a local attacker they are the opposite of obscure: they are the first
 * guesses. Entries are lowercase; matching is case-insensitive.
 */

export const GIVEN_NAMES = [
  "adi", "aditya", "agung", "agus", "ahmad", "aisyah", "aji", "aldi", "alif",
  "amir", "anang", "anda", "andi", "andika", "anggi", "anisa", "anton", "ari",
  "arief", "arif", "arifin", "arya", "asep", "aulia", "ayu", "bagas", "bagus",
  "bambang", "bayu", "beni", "bima", "budi", "cahya", "candra", "chandra",
  "citra", "dadang", "dani", "danu", "darma", "dedi", "deni", "desi", "dewa",
  "dewi", "dian", "didi", "dimas", "dina", "dodi", "doni", "dwi", "eka", "edi",
  "eko", "endang", "erik", "erna", "fahri", "faisal", "fajar", "farhan",
  "fathur", "fauzan", "febri", "ferdi", "fikri", "fitri", "gading", "galih",
  "gilang", "guntur", "hadi", "hafiz", "hana", "hendra", "hendri", "heri",
  "hidayat", "ical", "idris", "ikhsan", "ilham", "imam", "indah", "indra",
  "intan", "irfan", "iqbal", "iwan", "joko", "jono", "kartika", "kiki",
  "krisna", "lala", "laras", "lestari", "lina", "lukman", "maya", "maulana",
  "mega", "melati", "mira", "muhammad", "mulyono", "nanda", "nia", "novi",
  "nugroho", "nur", "nurul", "oki", "prasetyo", "pratama", "purnomo", "putra",
  "putri", "rachmat", "rahma", "rahman", "rahmat", "raka", "ramadhan", "rangga",
  "ratna", "reza", "rian", "ridho", "rina", "rio", "risa", "rizal", "rizki",
  "rizky", "roni", "sabrina", "salsa", "sandi", "sari", "satria", "sela",
  "septi", "sigit", "siska", "siti", "slamet", "sri", "sugeng", "suhardi",
  "sukma", "sulaiman", "sunarto", "supri", "supriyadi", "surya", "susanti",
  "susanto", "sutrisno", "syahrul", "taufik", "tegar", "tiara", "tono", "tri",
  "umar", "vina", "wahyu", "wati", "wawan", "widya", "wulan", "wulandari",
  "yanti", "yanto", "yoga", "yudi", "yuni", "yusuf", "zahra", "zaki", "zainal",
  // Full-name forms common enough to be single dictionary entries
  "nurhaliza", "nurhayati", "rahayu", "handayani", "kartini", "sulistyo",
  "wahyuni", "puspita", "anggraini", "safitri", "novita", "yuliana",
];

export const SURNAMES = [
  "arfiansyah", "firmansyah", "gunawan", "halim", "harahap", "hartono",
  "hidayat", "hutapea", "irawan", "kusuma", "kurniawan", "lubis", "mahendra",
  "manullang", "marpaung", "nasution", "nugraha", "nurdin", "panjaitan",
  "pardede", "permana", "prabowo", "pranata", "purba", "ramadhan", "rahardjo",
  "saputra", "saputro", "sasmita", "setiawan", "simanjuntak", "simbolon",
  "sinaga", "siregar", "sitompul", "situmorang", "suryana", "susanto",
  "syahputra", "tanjung", "utomo", "wibowo", "wijaya", "wibisono", "yulianto",
  "ginting", "sembiring", "tarigan", "manurung", "hasibuan", "pohan",
];

/** Suffixes that turn a given name into a common Indonesian full-name form. */
export const NAME_SUFFIXES = ["syah", "putra", "putri", "wan", "man", "udin"];
