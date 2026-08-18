/**
 * Common Indonesian password phrases, and the short function words needed to
 * recognise them.
 *
 * People rarely pick one word. They pick a sentence with the spaces removed
 * ("akucintakamu"), which every length-based strength meter rewards and every
 * real wordlist already contains. zxcvbn only splits English phrases, so these
 * look like long random strings to it.
 */

/** Whole phrases that appear verbatim in leaked Indonesian password dumps. */
export const COMMON_PHRASES = [
  "akucintakamu",
  "akusayangkamu",
  "cintakamu",
  "sayangkamu",
  "cintaselamanya",
  "sayangselalu",
  "kamucantik",
  "kamuganteng",
  "akuganteng",
  "akucantik",
  "akubisa",
  "akukuat",
  "akuhebat",
  "semangatterus",
  "tetapsemangat",
  "pantangmenyerah",
  "jangandilupakan",
  "tuhanbaik",
  "tuhanmahabaik",
  "bismillahirrahmanirrahim",
  "alhamdulillahirabbilalamin",
  "lailahailallah",
  "allahuakbar",
  "ingatmati",
  "sabaritukunci",
  "hidupitupilihan",
  "rahasiabanget",
  "jangandibuka",
  "punyakusendiri",
  "anakmama",
  "anakpapa",
  "anakbaik",
  "cintapertama",
  "mantanku",
  "pacarku",
  "istriku",
  "suamiku",
  "keluargaku",
  "rumahku",
  "kampungku",
];

/**
 * Short words that only matter as phrase glue. They are too short to be a
 * dictionary hit on their own (a 3-letter match would fire on almost anything),
 * so they are kept apart from the main wordlist and used only by the phrase
 * detector.
 */
export const GLUE_WORDS = [
  "aku", "kamu", "kau", "dia", "kita", "kami", "saya", "anda", "mu", "ku",
  "ini", "itu", "dan", "atau", "yang", "sang", "para", "buat", "untuk", "dari",
  "ada", "aja", "deh", "dong", "sih", "nya", "ter", "ber", "pun", "lah",
  "mas", "mbak", "bang", "kak", "dek", "pak", "bu", "om", "tante",
  "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "lapan", "sembilan",
  "cinta", "sayang", "suka", "rindu", "hati", "jiwa", "diri", "hidup", "mati",
  "baik", "kuat", "hebat", "bisa", "mau", "jangan", "selalu", "selamanya",
];
