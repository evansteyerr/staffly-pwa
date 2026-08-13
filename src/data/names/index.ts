/**
 * Pools de noms par nationalité, pour générer des combattants fictifs
 * culturellement cohérents (section 9/93). Volontairement compacts pour
 * le MVP — extensible sans toucher au moteur.
 */
export interface NationalityNamePool {
  code: string;
  label: string;
  flag: string;
  male: string[];
  female: string[];
  surnames: string[];
}

export const NATIONALITIES: NationalityNamePool[] = [
  {
    code: "FR",
    label: "France",
    flag: "🇫🇷",
    male: ["Lucas", "Nathan", "Enzo", "Karim", "Yanis", "Mathis", "Theo", "Amir", "Bilal", "Kevin"],
    female: ["Lea", "Manon", "Chloe", "Sarah", "Ines", "Camille", "Sofia", "Emma", "Lina", "Jade"],
    surnames: ["Martin", "Bernard", "Dubois", "Traore", "Diallo", "Perrin", "Moreau", "Benali", "Girard", "Fontaine"],
  },
  {
    code: "US",
    label: "USA",
    flag: "🇺🇸",
    male: ["Jake", "Tyler", "Marcus", "Brandon", "Cody", "Derek", "Isaiah", "Colton", "Trevor", "Malik"],
    female: ["Ashley", "Megan", "Brianna", "Taylor", "Jasmine", "Kayla", "Alyssa", "Destiny", "Sierra", "Rachel"],
    surnames: ["Johnson", "Smith", "Williams", "Reyes", "Carter", "Coleman", "Hayes", "Foster", "Bishop", "Sawyer"],
  },
  {
    code: "BR",
    label: "Bresil",
    flag: "🇧🇷",
    male: ["Joao", "Pedro", "Rafael", "Gabriel", "Thiago", "Bruno", "Diego", "Lucas", "Matheus", "Anderson"],
    female: ["Camila", "Larissa", "Beatriz", "Juliana", "Fernanda", "Amanda", "Gabriela", "Isabela", "Vitoria", "Mariana"],
    surnames: ["Silva", "Santos", "Oliveira", "Souza", "Pereira", "Costa", "Almeida", "Ferreira", "Rocha", "Barbosa"],
  },
  {
    code: "RU",
    label: "Russie",
    flag: "🇷🇺",
    male: ["Ivan", "Dmitri", "Sergei", "Alexei", "Nikolai", "Roman", "Artem", "Maxim", "Viktor", "Oleg"],
    female: ["Anastasia", "Ekaterina", "Olga", "Natalia", "Irina", "Svetlana", "Yulia", "Marina", "Polina", "Daria"],
    surnames: ["Volkov", "Petrov", "Sokolov", "Ivanov", "Smirnov", "Popov", "Kuznetsov", "Fedorov", "Novikov", "Orlov"],
  },
  {
    code: "DAG",
    label: "Daghestan",
    flag: "🏔️",
    male: ["Islam", "Khabib", "Zubair", "Rustam", "Magomed", "Abubakar", "Shamil", "Yusup", "Ramazan", "Ali"],
    female: ["Zarema", "Aminat", "Khadija", "Patimat", "Madina", "Zaira", "Marjan", "Sabina", "Karina", "Elmira"],
    surnames: ["Nurmagomedov", "Abdulaev", "Gadzhiev", "Omarov", "Rasulov", "Aliyev", "Magomedov", "Kurbanov", "Idrisov", "Musaev"],
  },
  {
    code: "GE",
    label: "Georgie",
    flag: "🇬🇪",
    male: ["Giorgi", "Levan", "Nika", "Saba", "Luka", "Beka", "Davit", "Zaza", "Irakli", "Vato"],
    female: ["Nino", "Mariam", "Ana", "Tamar", "Salome", "Elene", "Keti", "Natia", "Sopho", "Lika"],
    surnames: ["Beridze", "Kapanadze", "Tsereteli", "Mamulashvili", "Gelashvili", "Khizanishvili", "Lomidze", "Iashvili", "Chikovani", "Dzidzava"],
  },
  {
    code: "GB",
    label: "Angleterre",
    flag: "🏴",
    male: ["Jack", "Harry", "Oliver", "Callum", "George", "Liam", "Ryan", "Connor", "Aaron", "Josh"],
    female: ["Molly", "Chloe", "Ella", "Grace", "Poppy", "Freya", "Amelia", "Lucy", "Millie", "Georgia"],
    surnames: ["Smith", "Taylor", "Wilson", "Evans", "Thomas", "Roberts", "Walker", "Wright", "Hughes", "Edwards"],
  },
  {
    code: "IE",
    label: "Irlande",
    flag: "🇮🇪",
    male: ["Conor", "Sean", "Cian", "Darragh", "Eoin", "Fionn", "Rory", "Cathal", "Declan", "Niall"],
    female: ["Aoife", "Saoirse", "Niamh", "Ciara", "Roisin", "Orla", "Grainne", "Aisling", "Emer", "Sinead"],
    surnames: ["Byrne", "Murphy", "Kelly", "Walsh", "O'Brien", "Ryan", "Doyle", "McCarthy", "Gallagher", "Kennedy"],
  },
  {
    code: "PL",
    label: "Pologne",
    flag: "🇵🇱",
    male: ["Kamil", "Pawel", "Marcin", "Tomasz", "Jakub", "Piotr", "Wojciech", "Bartosz", "Michal", "Adrian"],
    female: ["Kasia", "Ola", "Zuzanna", "Julia", "Natalia", "Wiktoria", "Marta", "Agnieszka", "Ewa", "Karolina"],
    surnames: ["Kowalski", "Nowak", "Wojcik", "Kaminski", "Lewandowski", "Zielinski", "Szymanski", "Wozniak", "Dabrowski", "Kozlowski"],
  },
  {
    code: "KZ",
    label: "Kazakhstan",
    flag: "🇰🇿",
    male: ["Nursultan", "Yerlan", "Dias", "Alibek", "Timur", "Serik", "Bekzat", "Daulet", "Arman", "Sanzhar"],
    female: ["Aigerim", "Dana", "Zhanel", "Saltanat", "Aizhan", "Gulnaz", "Madina", "Alua", "Zarina", "Aliya"],
    surnames: ["Amanov", "Bekov", "Nurlanov", "Sagynov", "Tolegenov", "Kaliev", "Zhaksybekov", "Omarov", "Seitkali", "Dzhaksybekov"],
  },
  {
    code: "MX",
    label: "Mexique",
    flag: "🇲🇽",
    male: ["Diego", "Alejandro", "Miguel", "Jose", "Carlos", "Emiliano", "Santiago", "Ricardo", "Fernando", "Luis"],
    female: ["Maria", "Guadalupe", "Ximena", "Valentina", "Renata", "Fernanda", "Daniela", "Paola", "Andrea", "Camila"],
    surnames: ["Hernandez", "Garcia", "Martinez", "Lopez", "Gonzalez", "Ramirez", "Torres", "Flores", "Rivera", "Gomez"],
  },
  {
    code: "AU",
    label: "Australie",
    flag: "🇦🇺",
    male: ["Jack", "Cooper", "Lachlan", "Ethan", "Riley", "Mitchell", "Hunter", "Blake", "Tyson", "Jarrah"],
    female: ["Chloe", "Charlotte", "Matilda", "Ruby", "Isla", "Sienna", "Mia", "Ivy", "Willow", "Zoe"],
    surnames: ["Smith", "Taylor", "Anderson", "Nguyen", "Robinson", "Mitchell", "Clarke", "White", "Kelly", "Ross"],
  },
  {
    code: "JP",
    label: "Japon",
    flag: "🇯🇵",
    male: ["Ren", "Sota", "Haruto", "Yuto", "Riku", "Kaito", "Sho", "Daiki", "Takumi", "Kenta"],
    female: ["Yui", "Aoi", "Sakura", "Rin", "Hina", "Mio", "Yuna", "Koharu", "Akari", "Nanami"],
    surnames: ["Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe", "Ito", "Yamamoto", "Nakamura", "Kobayashi", "Saito"],
  },
];

export function getNationality(code: string): NationalityNamePool {
  return NATIONALITIES.find((n) => n.code === code) ?? NATIONALITIES[0];
}
