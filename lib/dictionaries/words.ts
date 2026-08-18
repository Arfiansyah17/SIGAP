/**
 * Common Indonesian words that show up inside passwords.
 *
 * Weighted toward affection, family, religion, and motivation, because those
 * are the categories people actually reach for when inventing a password.
 */
export const COMMON_WORDS = [
  // affection and relationships
  "cinta", "sayang", "sayangku", "cintaku", "kasih", "rindu", "kangen",
  "pacar", "istri", "suami", "teman", "sahabat", "keluarga", "jomblo",
  // family
  "ibu", "bapak", "ayah", "bunda", "mama", "papa", "anak", "kakak", "adik",
  "nenek", "kakek", "om", "tante",
  // faith
  "allah", "islam", "iman", "doa", "sholat", "quran", "masjid", "surga",
  "berkah", "amin", "insyaallah", "bismillah", "alhamdulillah", "tuhan",
  "yesus", "gereja",
  // motivation
  "semangat", "sukses", "juara", "hebat", "kuat", "sabar", "syukur",
  "bahagia", "senang", "ikhlas", "jaya", "maju", "berani", "mimpi", "harapan",
  // nature
  "bulan", "bintang", "matahari", "langit", "awan", "hujan", "angin", "laut",
  "gunung", "pantai", "sungai", "bunga", "melati", "mawar", "pohon", "api",
  "air", "tanah", "salju", "pelangi",
  // everyday
  "rumah", "makan", "nasi", "ayam", "kopi", "teh", "susu", "gula", "bakso",
  "sekolah", "kampus", "kuliah", "kerja", "kantor", "uang", "duit", "motor",
  "mobil", "sepeda", "jalan", "pulang", "tidur", "bangun", "mandi", "libur",
  "kucing", "anjing", "burung", "ikan",
  // identity and country
  "indonesia", "merdeka", "pancasila", "garuda", "nusantara", "bhinneka",
  "negara", "bangsa", "rakyat",
  // security words people ironically use
  "rahasia", "sandi", "katasandi", "kunci", "aman", "admin", "pengguna",
  "coba", "tebak", "lupa",
];

/** Bare strings that are themselves complete, very common passwords locally. */
export const COMMON_PASSWORDS = [
  "qwerty", "qwerty123", "asdasd", "asdfghjkl", "zxcvbnm", "123456",
  "12345678", "123456789", "1234567890", "111111", "000000", "password",
  "password123", "admin", "admin123", "administrator", "sayangku", "cintaku",
  "indonesia", "indonesia123", "jakarta", "bismillah", "alhamdulillah",
  "akuganteng", "akucantik", "anakbaik", "rahasia", "iloveyou", "monkey",
  "sandiku", "passwordku", "qazwsx", "1q2w3e4r", "aku cinta kamu",
];
