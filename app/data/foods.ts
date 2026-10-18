import type { FoodUnit, IngredientCategory } from '~/types/meal'

/**
 * Built-in food table. Values are INDICATIVE, per 100 g (or 100 ml) of edible portion,
 * rounded from Italian food composition tables (CREA) and USDA data.
 * `choPer100g` = available carbohydrates. Everything stays editable in the app.
 *
 * - unit 'pz': counted in pieces; `gramsPerPiece` converts to grams.
 * - `portionGrams`: typical portion, used as default quantity and for "q.b." ingredients.
 */
export interface FoodItem {
  id: string
  name: string
  aliases?: string[]
  category: IngredientCategory
  choPer100g: number
  kcalPer100g: number
  unit: Exclude<FoodUnit, 'qb'>
  gramsPerPiece?: number
  portionGrams?: number
}

export const FOODS: FoodItem[] = [
  // Cereali, pane, pasta
  { id: 'pasta-secca', name: 'Pasta (a secco)', aliases: ['pasta', 'spaghetti', 'penne', 'fusilli'], category: 'carb', choPer100g: 73, kcalPer100g: 353, unit: 'g', portionGrams: 80 },
  { id: 'pasta-integrale-secca', name: 'Pasta integrale (a secco)', aliases: ['pasta integrale'], category: 'carb', choPer100g: 66, kcalPer100g: 337, unit: 'g', portionGrams: 80 },
  { id: 'pasta-cotta', name: 'Pasta cotta', category: 'carb', choPer100g: 30, kcalPer100g: 150, unit: 'g', portionGrams: 200 },
  { id: 'riso-secco', name: 'Riso (a secco)', aliases: ['riso'], category: 'carb', choPer100g: 78, kcalPer100g: 350, unit: 'g', portionGrams: 80 },
  { id: 'riso-basmati-secco', name: 'Riso basmati (a secco)', aliases: ['basmati'], category: 'carb', choPer100g: 77, kcalPer100g: 350, unit: 'g', portionGrams: 80 },
  { id: 'riso-cotto', name: 'Riso cotto', category: 'carb', choPer100g: 28, kcalPer100g: 130, unit: 'g', portionGrams: 200 },
  { id: 'risotto', name: 'Risotto', category: 'carb', choPer100g: 22, kcalPer100g: 140, unit: 'g', portionGrams: 300 },
  { id: 'gnocchi-patate', name: 'Gnocchi di patate', aliases: ['gnocchi'], category: 'carb', choPer100g: 32, kcalPer100g: 150, unit: 'g', portionGrams: 200 },
  { id: 'lasagne', name: 'Lasagne alla bolognese', aliases: ['lasagna'], category: 'carb', choPer100g: 15, kcalPer100g: 155, unit: 'g', portionGrams: 300 },
  { id: 'canederlo', name: 'Canederlo', aliases: ['canederli', 'knodel', 'knödel'], category: 'carb', choPer100g: 30, kcalPer100g: 210, unit: 'pz', gramsPerPiece: 80 },
  { id: 'cous-cous-secco', name: 'Cous cous (a secco)', aliases: ['couscous', 'cous cous'], category: 'carb', choPer100g: 72, kcalPer100g: 360, unit: 'g', portionGrams: 80 },
  { id: 'farro-secco', name: 'Farro (a secco)', aliases: ['farro'], category: 'carb', choPer100g: 67, kcalPer100g: 335, unit: 'g', portionGrams: 80 },
  { id: 'orzo-secco', name: 'Orzo perlato (a secco)', aliases: ['orzo'], category: 'carb', choPer100g: 70, kcalPer100g: 320, unit: 'g', portionGrams: 80 },
  { id: 'quinoa-secca', name: 'Quinoa (a secco)', aliases: ['quinoa'], category: 'carb', choPer100g: 64, kcalPer100g: 368, unit: 'g', portionGrams: 80 },
  { id: 'polenta-cotta', name: 'Polenta cotta', aliases: ['polenta'], category: 'carb', choPer100g: 16, kcalPer100g: 75, unit: 'g', portionGrams: 250 },
  { id: 'avena-secca', name: 'Fiocchi di avena', aliases: ['avena', 'porridge'], category: 'carb', choPer100g: 60, kcalPer100g: 370, unit: 'g', portionGrams: 40 },
  { id: 'corn-flakes', name: 'Corn flakes', aliases: ['cereali'], category: 'carb', choPer100g: 84, kcalPer100g: 380, unit: 'g', portionGrams: 30 },
  { id: 'muesli', name: 'Muesli', aliases: ['granola'], category: 'carb', choPer100g: 65, kcalPer100g: 370, unit: 'g', portionGrams: 40 },
  { id: 'pane-integrale', name: 'Pane integrale', category: 'carb', choPer100g: 48, kcalPer100g: 230, unit: 'g', portionGrams: 50 },
  { id: 'pane-bianco', name: 'Pane bianco', aliases: ['pane', 'pane comune', 'rosetta', 'baguette', 'michetta'], category: 'carb', choPer100g: 55, kcalPer100g: 270, unit: 'g', portionGrams: 50 },
  { id: 'fette-biscottate', name: 'Fette biscottate', category: 'carb', choPer100g: 72, kcalPer100g: 410, unit: 'g', portionGrams: 20 },
  { id: 'crackers', name: 'Crackers', aliases: ['cracker'], category: 'carb', choPer100g: 70, kcalPer100g: 430, unit: 'g', portionGrams: 25 },
  { id: 'grissini', name: 'Grissini', category: 'carb', choPer100g: 68, kcalPer100g: 410, unit: 'g', portionGrams: 20 },
  { id: 'gallette-riso', name: 'Gallette di riso', aliases: ['gallette'], category: 'carb', choPer100g: 80, kcalPer100g: 385, unit: 'pz', gramsPerPiece: 8 },
  { id: 'piadina', name: 'Piadina', category: 'carb', choPer100g: 50, kcalPer100g: 320, unit: 'pz', gramsPerPiece: 110 },
  { id: 'focaccia', name: 'Focaccia', category: 'carb', choPer100g: 45, kcalPer100g: 300, unit: 'g', portionGrams: 100 },
  { id: 'pizza-margherita', name: 'Pizza margherita', aliases: ['pizza'], category: 'carb', choPer100g: 33, kcalPer100g: 250, unit: 'g', portionGrams: 300 },
  { id: 'tramezzino', name: 'Tramezzino', category: 'carb', choPer100g: 25, kcalPer100g: 260, unit: 'pz', gramsPerPiece: 90 },

  // Patate e legumi
  { id: 'patate', name: 'Patate', aliases: ['patata'], category: 'carb', choPer100g: 17, kcalPer100g: 77, unit: 'g', portionGrams: 200 },
  { id: 'patate-forno', name: 'Patate al forno', category: 'carb', choPer100g: 23, kcalPer100g: 140, unit: 'g', portionGrams: 200 },
  { id: 'patatine-fritte', name: 'Patatine fritte', aliases: ['patate fritte'], category: 'carb', choPer100g: 32, kcalPer100g: 290, unit: 'g', portionGrams: 150 },
  { id: 'ceci-cotti', name: 'Ceci (cotti)', aliases: ['ceci'], category: 'legume', choPer100g: 18, kcalPer100g: 120, unit: 'g', portionGrams: 150 },
  { id: 'fagioli-cannellini-cotti', name: 'Fagioli cannellini (cotti)', aliases: ['fagioli', 'cannellini'], category: 'legume', choPer100g: 16, kcalPer100g: 95, unit: 'g', portionGrams: 150 },
  { id: 'lenticchie-cotte', name: 'Lenticchie (cotte)', aliases: ['lenticchie'], category: 'legume', choPer100g: 17, kcalPer100g: 115, unit: 'g', portionGrams: 150 },
  { id: 'piselli', name: 'Piselli', category: 'legume', choPer100g: 9, kcalPer100g: 70, unit: 'g', portionGrams: 150 },

  // Frutta
  { id: 'mela', name: 'Mela', category: 'fruit', choPer100g: 10, kcalPer100g: 50, unit: 'pz', gramsPerPiece: 180 },
  { id: 'pera', name: 'Pera', category: 'fruit', choPer100g: 10, kcalPer100g: 45, unit: 'pz', gramsPerPiece: 180 },
  { id: 'banana', name: 'Banana', category: 'fruit', choPer100g: 20, kcalPer100g: 89, unit: 'pz', gramsPerPiece: 115 },
  { id: 'arancia', name: 'Arancia', category: 'fruit', choPer100g: 8, kcalPer100g: 37, unit: 'pz', gramsPerPiece: 200 },
  { id: 'mandarino', name: 'Mandarino', aliases: ['clementina'], category: 'fruit', choPer100g: 10, kcalPer100g: 45, unit: 'pz', gramsPerPiece: 80 },
  { id: 'kiwi', name: 'Kiwi', category: 'fruit', choPer100g: 9, kcalPer100g: 44, unit: 'pz', gramsPerPiece: 80 },
  { id: 'pesca', name: 'Pesca', category: 'fruit', choPer100g: 6, kcalPer100g: 27, unit: 'pz', gramsPerPiece: 150 },
  { id: 'albicocca', name: 'Albicocca', category: 'fruit', choPer100g: 7, kcalPer100g: 28, unit: 'pz', gramsPerPiece: 40 },
  { id: 'fragole', name: 'Fragole', category: 'fruit', choPer100g: 5.5, kcalPer100g: 27, unit: 'g', portionGrams: 150 },
  { id: 'uva', name: 'Uva', category: 'fruit', choPer100g: 15.5, kcalPer100g: 61, unit: 'g', portionGrams: 150 },
  { id: 'anguria', name: 'Anguria', aliases: ['cocomero'], category: 'fruit', choPer100g: 3.7, kcalPer100g: 16, unit: 'g', portionGrams: 300 },
  { id: 'melone', name: 'Melone', category: 'fruit', choPer100g: 7, kcalPer100g: 33, unit: 'g', portionGrams: 200 },
  { id: 'ananas', name: 'Ananas', category: 'fruit', choPer100g: 10, kcalPer100g: 40, unit: 'g', portionGrams: 150 },
  { id: 'frutti-di-bosco', name: 'Frutti di bosco', aliases: ['mirtilli', 'lamponi'], category: 'fruit', choPer100g: 6, kcalPer100g: 35, unit: 'g', portionGrams: 125 },
  { id: 'frutto-misto', name: 'Frutto a scelta', aliases: ['frutta', 'frutto'], category: 'fruit', choPer100g: 10, kcalPer100g: 45, unit: 'pz', gramsPerPiece: 180 },

  // Frutta secca e semi
  { id: 'mandorle', name: 'Mandorle', category: 'nuts', choPer100g: 4.5, kcalPer100g: 600, unit: 'g', portionGrams: 15 },
  { id: 'noci', name: 'Noci', category: 'nuts', choPer100g: 5, kcalPer100g: 689, unit: 'g', portionGrams: 15 },
  { id: 'nocciole', name: 'Nocciole', category: 'nuts', choPer100g: 6, kcalPer100g: 650, unit: 'g', portionGrams: 15 },
  { id: 'anacardi', name: 'Anacardi', category: 'nuts', choPer100g: 27, kcalPer100g: 570, unit: 'g', portionGrams: 15 },
  { id: 'arachidi', name: 'Arachidi', aliases: ['noccioline'], category: 'nuts', choPer100g: 8.5, kcalPer100g: 600, unit: 'g', portionGrams: 20 },
  { id: 'burro-arachidi', name: 'Burro di arachidi', category: 'nuts', choPer100g: 13, kcalPer100g: 590, unit: 'g', portionGrams: 15 },

  // Latte, latticini, uova
  { id: 'latte-vaccino', name: 'Latte parzialmente scremato', aliases: ['latte'], category: 'dairy', choPer100g: 5, kcalPer100g: 46, unit: 'ml', portionGrams: 200 },
  { id: 'latte-intero', name: 'Latte intero', category: 'dairy', choPer100g: 4.9, kcalPer100g: 64, unit: 'ml', portionGrams: 200 },
  { id: 'latte-scremato', name: 'Latte scremato', category: 'dairy', choPer100g: 5, kcalPer100g: 35, unit: 'ml', portionGrams: 200 },
  { id: 'bevanda-avena', name: 'Bevanda di avena', aliases: ['latte di avena'], category: 'dairy', choPer100g: 6.5, kcalPer100g: 45, unit: 'ml', portionGrams: 200 },
  { id: 'bevanda-soia', name: 'Bevanda di soia', aliases: ['latte di soia'], category: 'dairy', choPer100g: 2.5, kcalPer100g: 40, unit: 'ml', portionGrams: 200 },
  { id: 'yogurt-bianco', name: 'Yogurt bianco', aliases: ['yogurt'], category: 'dairy', choPer100g: 4.5, kcalPer100g: 66, unit: 'g', portionGrams: 125 },
  { id: 'yogurt-naturale', name: 'Yogurt naturale', category: 'dairy', choPer100g: 4.5, kcalPer100g: 66, unit: 'g', portionGrams: 125 },
  { id: 'yogurt-greco-magro', name: 'Yogurt greco 0%', aliases: ['yogurt greco'], category: 'dairy', choPer100g: 3.5, kcalPer100g: 57, unit: 'g', portionGrams: 170 },
  { id: 'yogurt-frutta', name: 'Yogurt alla frutta', category: 'dairy', choPer100g: 13, kcalPer100g: 95, unit: 'g', portionGrams: 125 },
  { id: 'fiocchi-di-latte', name: 'Fiocchi di latte', category: 'dairy', choPer100g: 3, kcalPer100g: 100, unit: 'g', portionGrams: 150 },
  { id: 'mozzarella', name: 'Mozzarella', category: 'dairy', choPer100g: 0.7, kcalPer100g: 253, unit: 'g', portionGrams: 125 },
  { id: 'parmigiano', name: 'Parmigiano', aliases: ['grana', 'parmigiano reggiano'], category: 'dairy', choPer100g: 0, kcalPer100g: 390, unit: 'g', portionGrams: 10 },
  { id: 'ricotta', name: 'Ricotta', category: 'dairy', choPer100g: 3.5, kcalPer100g: 146, unit: 'g', portionGrams: 100 },
  { id: 'uova', name: 'Uovo', aliases: ['uova'], category: 'protein', choPer100g: 0.6, kcalPer100g: 128, unit: 'pz', gramsPerPiece: 55 },
  { id: 'albume', name: 'Albume', aliases: ['albumi'], category: 'protein', choPer100g: 0.7, kcalPer100g: 43, unit: 'g', portionGrams: 100 },

  // Carne, pesce, affettati
  { id: 'petto-di-pollo', name: 'Petto di pollo', aliases: ['pollo'], category: 'protein', choPer100g: 0, kcalPer100g: 100, unit: 'g', portionGrams: 150 },
  { id: 'fesa-di-tacchino', name: 'Fesa di tacchino', aliases: ['tacchino'], category: 'protein', choPer100g: 0, kcalPer100g: 107, unit: 'g', portionGrams: 150 },
  { id: 'manzo-magro', name: 'Manzo magro', aliases: ['manzo', 'carne rossa', 'bistecca'], category: 'protein', choPer100g: 0, kcalPer100g: 130, unit: 'g', portionGrams: 150 },
  { id: 'bresaola', name: 'Bresaola', category: 'protein', choPer100g: 0, kcalPer100g: 151, unit: 'g', portionGrams: 50 },
  { id: 'prosciutto-cotto', name: 'Prosciutto cotto', category: 'protein', choPer100g: 1, kcalPer100g: 215, unit: 'g', portionGrams: 50 },
  { id: 'prosciutto-crudo', name: 'Prosciutto crudo', category: 'protein', choPer100g: 0, kcalPer100g: 268, unit: 'g', portionGrams: 50 },
  { id: 'speck', name: 'Speck', category: 'protein', choPer100g: 0.5, kcalPer100g: 300, unit: 'g', portionGrams: 50 },
  { id: 'filetto-di-salmone', name: 'Salmone', aliases: ['filetto di salmone'], category: 'protein', choPer100g: 0, kcalPer100g: 185, unit: 'g', portionGrams: 150 },
  { id: 'salmone-affumicato', name: 'Salmone affumicato', category: 'protein', choPer100g: 0, kcalPer100g: 147, unit: 'g', portionGrams: 80 },
  { id: 'tonno-naturale', name: 'Tonno al naturale', aliases: ['tonno'], category: 'protein', choPer100g: 0, kcalPer100g: 103, unit: 'g', portionGrams: 80 },
  { id: 'tonno-olio', name: "Tonno sott'olio (sgocciolato)", category: 'protein', choPer100g: 0, kcalPer100g: 192, unit: 'g', portionGrams: 80 },
  { id: 'filetto-di-merluzzo', name: 'Merluzzo', aliases: ['filetto di merluzzo', 'nasello'], category: 'protein', choPer100g: 0, kcalPer100g: 71, unit: 'g', portionGrams: 200 },
  { id: 'filetto-di-orata', name: 'Orata', aliases: ['filetto di orata'], category: 'protein', choPer100g: 0, kcalPer100g: 121, unit: 'g', portionGrams: 200 },
  { id: 'branzino', name: 'Branzino', aliases: ['spigola'], category: 'protein', choPer100g: 0, kcalPer100g: 90, unit: 'g', portionGrams: 200 },
  { id: 'gamberi', name: 'Gamberi', category: 'protein', choPer100g: 0, kcalPer100g: 71, unit: 'g', portionGrams: 150 },

  // Verdure
  { id: 'verdure-miste', name: 'Verdure miste', aliases: ['verdure', 'contorno'], category: 'veg', choPer100g: 4, kcalPer100g: 25, unit: 'g', portionGrams: 200 },
  { id: 'insalata', name: 'Insalata', aliases: ['lattuga', 'rucola'], category: 'veg', choPer100g: 2, kcalPer100g: 15, unit: 'g', portionGrams: 80 },
  { id: 'zucchine', name: 'Zucchine', aliases: ['zucchina'], category: 'veg', choPer100g: 1.4, kcalPer100g: 11, unit: 'g', portionGrams: 200 },
  { id: 'pomodoro', name: 'Pomodoro', aliases: ['pomodori'], category: 'veg', choPer100g: 3, kcalPer100g: 19, unit: 'g', portionGrams: 150 },
  { id: 'pomodorini', name: 'Pomodorini', category: 'veg', choPer100g: 3, kcalPer100g: 20, unit: 'g', portionGrams: 100 },
  { id: 'spinaci', name: 'Spinaci', category: 'veg', choPer100g: 2.9, kcalPer100g: 35, unit: 'g', portionGrams: 150 },
  { id: 'carote', name: 'Carote', aliases: ['carota'], category: 'veg', choPer100g: 7.6, kcalPer100g: 39, unit: 'g', portionGrams: 100 },
  { id: 'broccoli', name: 'Broccoli', category: 'veg', choPer100g: 3, kcalPer100g: 27, unit: 'g', portionGrams: 200 },
  { id: 'peperoni', name: 'Peperoni', aliases: ['peperone'], category: 'veg', choPer100g: 4.2, kcalPer100g: 22, unit: 'g', portionGrams: 150 },
  { id: 'melanzane', name: 'Melanzane', aliases: ['melanzana'], category: 'veg', choPer100g: 2.6, kcalPer100g: 18, unit: 'g', portionGrams: 200 },
  { id: 'finocchi', name: 'Finocchi', aliases: ['finocchio'], category: 'veg', choPer100g: 1, kcalPer100g: 9, unit: 'g', portionGrams: 200 },
  { id: 'funghi', name: 'Funghi champignon', aliases: ['funghi'], category: 'veg', choPer100g: 0.8, kcalPer100g: 20, unit: 'g', portionGrams: 150 },

  // Condimenti e dispensa
  { id: 'olio-oliva', name: 'Olio extravergine di oliva', aliases: ['olio', 'olio evo'], category: 'pantry', choPer100g: 0, kcalPer100g: 899, unit: 'g', portionGrams: 10 },
  { id: 'burro', name: 'Burro', category: 'pantry', choPer100g: 1, kcalPer100g: 758, unit: 'g', portionGrams: 10 },
  { id: 'zucchero', name: 'Zucchero', category: 'pantry', choPer100g: 100, kcalPer100g: 392, unit: 'g', portionGrams: 5 },
  { id: 'miele', name: 'Miele', category: 'pantry', choPer100g: 80, kcalPer100g: 304, unit: 'g', portionGrams: 10 },
  { id: 'marmellata', name: 'Marmellata', aliases: ['confettura'], category: 'pantry', choPer100g: 58, kcalPer100g: 222, unit: 'g', portionGrams: 20 },
  { id: 'crema-spalmabile', name: 'Crema spalmabile alla nocciola', aliases: ['nutella'], category: 'pantry', choPer100g: 57, kcalPer100g: 540, unit: 'g', portionGrams: 15 },
  { id: 'passata-pomodoro', name: 'Passata di pomodoro', aliases: ['sugo', 'salsa di pomodoro'], category: 'pantry', choPer100g: 4, kcalPer100g: 25, unit: 'g', portionGrams: 100 },
  { id: 'pesto', name: 'Pesto alla genovese', aliases: ['pesto'], category: 'pantry', choPer100g: 5, kcalPer100g: 480, unit: 'g', portionGrams: 20 },

  // Dolci, snack, integratori, bevande
  { id: 'biscotti-frollini', name: 'Biscotti frollini', aliases: ['biscotti'], category: 'carb', choPer100g: 68, kcalPer100g: 460, unit: 'g', portionGrams: 30 },
  { id: 'cornetto', name: 'Cornetto', aliases: ['brioche', 'croissant'], category: 'carb', choPer100g: 45, kcalPer100g: 410, unit: 'pz', gramsPerPiece: 60 },
  { id: 'cioccolato-fondente', name: 'Cioccolato fondente', aliases: ['cioccolato'], category: 'pantry', choPer100g: 46, kcalPer100g: 550, unit: 'g', portionGrams: 15 },
  { id: 'gelato', name: 'Gelato', category: 'dairy', choPer100g: 24, kcalPer100g: 210, unit: 'g', portionGrams: 100 },
  { id: 'patatine-chips', name: 'Patatine in busta', aliases: ['chips'], category: 'carb', choPer100g: 50, kcalPer100g: 540, unit: 'g', portionGrams: 25 },
  { id: 'barretta-proteica', name: 'Barretta proteica', category: 'supplement', choPer100g: 30, kcalPer100g: 350, unit: 'pz', gramsPerPiece: 50 },
  { id: 'proteine-whey', name: 'Proteine whey', aliases: ['whey', 'shake proteico'], category: 'supplement', choPer100g: 6, kcalPer100g: 380, unit: 'g', portionGrams: 30 },
  { id: 'succo-frutta', name: 'Succo di frutta', aliases: ['succo'], category: 'other', choPer100g: 12, kcalPer100g: 50, unit: 'ml', portionGrams: 200 },
  { id: 'cola', name: 'Cola', aliases: ['coca cola', 'bibita'], category: 'other', choPer100g: 10.6, kcalPer100g: 42, unit: 'ml', portionGrams: 330 },
  { id: 'birra', name: 'Birra', category: 'other', choPer100g: 3.5, kcalPer100g: 43, unit: 'ml', portionGrams: 330 },
  { id: 'vino', name: 'Vino', aliases: ['vino rosso', 'vino bianco'], category: 'other', choPer100g: 0.3, kcalPer100g: 80, unit: 'ml', portionGrams: 125 },
]

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const FOODS_BY_ID = new Map(FOODS.map((food) => [food.id, food]))

export function findFoodById(id: string | undefined): FoodItem | undefined {
  return id ? FOODS_BY_ID.get(id) : undefined
}

/** Exact match on name or alias (accents, case and parentheses ignored) */
export function findFoodByName(name: string | undefined): FoodItem | undefined {
  if (!name) return undefined
  const key = normalize(name)
  if (!key) return undefined
  return FOODS.find((food) => normalize(food.name) === key || food.aliases?.some((a) => normalize(a) === key))
}

/** Suggestions for an autocomplete: names/aliases starting with the query first, then containing it */
export function searchFoods(query: string, limit = 6): FoodItem[] {
  const q = normalize(query)
  if (q.length < 2) return []
  const scored: { food: FoodItem; score: number }[] = []
  for (const food of FOODS) {
    const terms = [food.name, ...(food.aliases || [])].map(normalize)
    let score = 0
    if (terms.some((t) => t === q)) score = 3
    else if (terms.some((t) => t.startsWith(q))) score = 2
    else if (terms.some((t) => t.split(' ').some((w) => w.startsWith(q)))) score = 1.5
    else if (terms.some((t) => t.includes(q))) score = 1
    if (score > 0) scored.push({ food, score })
  }
  return scored
    .sort((a, b) => b.score - a.score || a.food.name.localeCompare(b.food.name))
    .slice(0, limit)
    .map((s) => s.food)
}

/** Default quantity when picking a food: 1 piece, or a typical portion in g/ml */
export function defaultFoodQuantity(food: FoodItem): number {
  return food.unit === 'pz' ? 1 : (food.portionGrams ?? 100)
}

/** CHO and kcal for a quantity of food. For 'pz' the quantity is a number of pieces. */
export function foodNutrition(food: FoodItem, quantity: number, unit: FoodUnit = food.unit): { cho: number; kcal: number } {
  let grams: number
  if (unit === 'pz') grams = quantity * (food.gramsPerPiece ?? 100)
  else if (unit === 'qb') grams = food.portionGrams ?? 0
  else grams = quantity
  return {
    cho: Math.round(((grams * food.choPer100g) / 100) * 10) / 10,
    kcal: Math.round((grams * food.kcalPer100g) / 100),
  }
}
