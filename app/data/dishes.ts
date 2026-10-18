/**
 * Dish library for the menu generator. Every component references a food of the built-in table
 * (app/data/foods.ts); amounts are a reference portion, the generator resizes them to the targets.
 *
 * Roles:
 * - carb: resized to hit the meal's CHO target
 * - protein / fat / dairy: resized to fill the remaining calories
 * - veg / fruit / sauce / fixed: never resized (fixed = whole items like a croissant or a bar)
 */

export type DishCourse = 'breakfast' | 'snack' | 'main'
export type ComponentRole = 'carb' | 'protein' | 'fat' | 'dairy' | 'veg' | 'fruit' | 'sauce' | 'fixed'
export type DishTag = 'fish' | 'legumes' | 'white-meat' | 'red-meat' | 'eggs' | 'cheese' | 'veggie' | 'treat'

export interface DishComponent {
  foodId: string
  amount: number // g / ml, or pieces when the food is counted in pieces
  role: ComponentRole
}

export interface Dish {
  id: string
  name: string
  course: DishCourse
  /** Mains only: slight preference for lunch or dinner */
  prefer?: 'lunch' | 'dinner'
  tags: DishTag[]
  components: DishComponent[]
}

const c = (foodId: string, amount: number, role: ComponentRole): DishComponent => ({ foodId, amount, role })

export const DISHES: Dish[] = [
  // ─── Colazioni ──────────────────────────────────────────────────────────
  { id: 'col-latte-fette', name: 'Latte, fette biscottate e marmellata', course: 'breakfast', tags: [], components: [c('latte-vaccino', 200, 'dairy'), c('fette-biscottate', 30, 'carb'), c('marmellata', 20, 'carb')] },
  { id: 'col-greco-avena', name: 'Yogurt greco, avena e frutti di bosco', course: 'breakfast', tags: [], components: [c('yogurt-greco-magro', 170, 'protein'), c('avena-secca', 40, 'carb'), c('frutti-di-bosco', 100, 'fruit')] },
  { id: 'col-pane-ricotta', name: 'Pane integrale, ricotta e miele', course: 'breakfast', tags: ['cheese'], components: [c('pane-integrale', 60, 'carb'), c('ricotta', 80, 'protein'), c('miele', 10, 'carb')] },
  { id: 'col-porridge', name: 'Porridge di avena con banana', course: 'breakfast', tags: [], components: [c('latte-vaccino', 200, 'dairy'), c('avena-secca', 40, 'carb'), c('banana', 1, 'fruit')] },
  { id: 'col-pane-uova', name: 'Pane integrale e uova', course: 'breakfast', tags: ['eggs'], components: [c('pane-integrale', 50, 'carb'), c('uova', 2, 'protein')] },
  { id: 'col-yogurt-muesli', name: 'Yogurt bianco con muesli e mela', course: 'breakfast', tags: [], components: [c('yogurt-bianco', 125, 'dairy'), c('muesli', 40, 'carb'), c('mela', 1, 'fruit')] },
  { id: 'col-latte-cereali', name: 'Latte e corn flakes', course: 'breakfast', tags: [], components: [c('latte-vaccino', 250, 'dairy'), c('corn-flakes', 40, 'carb')] },
  { id: 'col-toast', name: 'Toast integrale con prosciutto cotto', course: 'breakfast', tags: [], components: [c('pane-integrale', 60, 'carb'), c('prosciutto-cotto', 40, 'protein')] },
  { id: 'col-cornetto', name: 'Cappuccino e cornetto', course: 'breakfast', tags: ['treat'], components: [c('latte-vaccino', 150, 'dairy'), c('cornetto', 1, 'fixed')] },
  { id: 'col-fiocchi-gallette', name: 'Fiocchi di latte, gallette e pera', course: 'breakfast', tags: ['cheese'], components: [c('fiocchi-di-latte', 150, 'protein'), c('gallette-riso', 3, 'carb'), c('pera', 1, 'fruit')] },

  // ─── Spuntini e merende ─────────────────────────────────────────────────
  { id: 'sp-mela-mandorle', name: 'Mela e mandorle', course: 'snack', tags: [], components: [c('mela', 1, 'fruit'), c('mandorle', 15, 'fat')] },
  { id: 'sp-greco-miele', name: 'Yogurt greco e miele', course: 'snack', tags: [], components: [c('yogurt-greco-magro', 170, 'protein'), c('miele', 10, 'carb')] },
  { id: 'sp-banana', name: 'Banana e noci', course: 'snack', tags: [], components: [c('banana', 1, 'fruit'), c('noci', 10, 'fat')] },
  { id: 'sp-pane-bresaola', name: 'Pane integrale e bresaola', course: 'snack', tags: [], components: [c('pane-integrale', 30, 'carb'), c('bresaola', 30, 'protein')] },
  { id: 'sp-shake', name: 'Shake proteico e frutto', course: 'snack', tags: [], components: [c('proteine-whey', 25, 'protein'), c('frutto-misto', 1, 'fruit')] },
  { id: 'sp-barretta', name: 'Barretta proteica', course: 'snack', tags: [], components: [c('barretta-proteica', 1, 'fixed')] },
  { id: 'sp-gallette-arachidi', name: 'Gallette e burro di arachidi', course: 'snack', tags: [], components: [c('gallette-riso', 3, 'carb'), c('burro-arachidi', 15, 'fat')] },
  { id: 'sp-yogurt-bosco', name: 'Yogurt e frutti di bosco', course: 'snack', tags: [], components: [c('yogurt-bianco', 125, 'dairy'), c('frutti-di-bosco', 100, 'fruit')] },
  { id: 'sp-kiwi-noci', name: 'Kiwi e noci', course: 'snack', tags: [], components: [c('kiwi', 2, 'fruit'), c('noci', 15, 'fat')] },
  { id: 'sp-crackers-grana', name: 'Crackers e grana', course: 'snack', tags: ['cheese'], components: [c('crackers', 25, 'carb'), c('parmigiano', 15, 'protein')] },
  { id: 'sp-fiocchi-pomodorini', name: 'Fiocchi di latte e pomodorini', course: 'snack', tags: ['cheese'], components: [c('fiocchi-di-latte', 100, 'protein'), c('pomodorini', 100, 'veg'), c('crackers', 15, 'carb')] },

  // ─── Primi e piatti unici ───────────────────────────────────────────────
  { id: 'pr-pasta-tonno', name: 'Pasta al pomodoro e tonno', course: 'main', prefer: 'lunch', tags: ['fish'], components: [c('pasta-secca', 80, 'carb'), c('tonno-naturale', 80, 'protein'), c('passata-pomodoro', 100, 'sauce'), c('olio-oliva', 10, 'fat')] },
  { id: 'pr-pasta-ceci', name: 'Pasta e ceci', course: 'main', prefer: 'lunch', tags: ['legumes'], components: [c('pasta-secca', 60, 'carb'), c('ceci-cotti', 150, 'protein'), c('olio-oliva', 10, 'fat')] },
  { id: 'pr-pasta-gamberi', name: 'Pasta integrale con zucchine e gamberi', course: 'main', prefer: 'lunch', tags: ['fish'], components: [c('pasta-integrale-secca', 80, 'carb'), c('gamberi', 150, 'protein'), c('zucchine', 200, 'veg'), c('olio-oliva', 10, 'fat')] },
  { id: 'pr-pasta-pesto', name: 'Pasta al pesto con pomodorini e grana', course: 'main', prefer: 'lunch', tags: ['veggie', 'cheese'], components: [c('pasta-secca', 80, 'carb'), c('pesto', 20, 'fat'), c('parmigiano', 15, 'protein'), c('pomodorini', 100, 'veg')] },
  { id: 'pr-pasta-lenticchie', name: 'Pasta e lenticchie', course: 'main', prefer: 'lunch', tags: ['legumes'], components: [c('pasta-secca', 60, 'carb'), c('lenticchie-cotte', 150, 'protein'), c('olio-oliva', 10, 'fat')] },
  { id: 'pr-riso-pollo', name: 'Riso basmati con pollo e verdure', course: 'main', tags: ['white-meat'], components: [c('riso-basmati-secco', 80, 'carb'), c('petto-di-pollo', 150, 'protein'), c('verdure-miste', 200, 'veg'), c('olio-oliva', 10, 'fat')] },
  { id: 'pr-risotto-zucchine', name: 'Risotto alle zucchine e grana', course: 'main', prefer: 'lunch', tags: ['veggie', 'cheese'], components: [c('riso-secco', 80, 'carb'), c('zucchine', 200, 'veg'), c('parmigiano', 20, 'protein'), c('olio-oliva', 10, 'fat')] },
  { id: 'pr-riso-salmone', name: 'Riso con salmone e broccoli', course: 'main', tags: ['fish'], components: [c('riso-basmati-secco', 70, 'carb'), c('filetto-di-salmone', 150, 'protein'), c('broccoli', 200, 'veg'), c('olio-oliva', 5, 'fat')] },
  { id: 'pr-farro-ceci', name: 'Farro con ceci e verdure', course: 'main', prefer: 'lunch', tags: ['legumes'], components: [c('farro-secco', 70, 'carb'), c('ceci-cotti', 150, 'protein'), c('verdure-miste', 200, 'veg'), c('olio-oliva', 10, 'fat')] },
  { id: 'pr-couscous-pollo', name: 'Cous cous con pollo e peperoni', course: 'main', prefer: 'lunch', tags: ['white-meat'], components: [c('cous-cous-secco', 70, 'carb'), c('petto-di-pollo', 130, 'protein'), c('peperoni', 150, 'veg'), c('olio-oliva', 10, 'fat')] },
  { id: 'pr-orzo-tonno', name: 'Insalata di orzo con tonno e pomodorini', course: 'main', prefer: 'lunch', tags: ['fish'], components: [c('orzo-secco', 70, 'carb'), c('tonno-naturale', 80, 'protein'), c('pomodorini', 150, 'veg'), c('olio-oliva', 10, 'fat')] },
  { id: 'pr-quinoa-salmone', name: 'Quinoa con salmone affumicato e insalata', course: 'main', prefer: 'lunch', tags: ['fish'], components: [c('quinoa-secca', 70, 'carb'), c('salmone-affumicato', 80, 'protein'), c('insalata', 80, 'veg'), c('olio-oliva', 10, 'fat')] },
  { id: 'pr-gnocchi', name: 'Gnocchi al pomodoro e mozzarella', course: 'main', prefer: 'lunch', tags: ['cheese', 'veggie'], components: [c('gnocchi-patate', 200, 'carb'), c('passata-pomodoro', 100, 'sauce'), c('mozzarella', 80, 'protein')] },
  { id: 'pr-polenta-fagioli', name: 'Polenta e fagioli', course: 'main', tags: ['legumes'], components: [c('polenta-cotta', 250, 'carb'), c('fagioli-cannellini-cotti', 150, 'protein'), c('olio-oliva', 10, 'fat')] },
  { id: 'pr-lasagne', name: 'Lasagne alla bolognese', course: 'main', prefer: 'lunch', tags: ['treat', 'red-meat'], components: [c('lasagne', 300, 'carb'), c('insalata', 80, 'veg')] },

  // ─── Secondi con contorno ───────────────────────────────────────────────
  { id: 'se-merluzzo-patate', name: 'Merluzzo con patate e zucchine', course: 'main', prefer: 'dinner', tags: ['fish'], components: [c('filetto-di-merluzzo', 200, 'protein'), c('patate', 200, 'carb'), c('zucchine', 200, 'veg'), c('olio-oliva', 10, 'fat')] },
  { id: 'se-orata-pane', name: 'Orata al forno, pane e insalata', course: 'main', prefer: 'dinner', tags: ['fish'], components: [c('filetto-di-orata', 200, 'protein'), c('pane-integrale', 60, 'carb'), c('insalata', 80, 'veg'), c('olio-oliva', 10, 'fat')] },
  { id: 'se-branzino-patate', name: 'Branzino con patate e finocchi', course: 'main', prefer: 'dinner', tags: ['fish'], components: [c('branzino', 200, 'protein'), c('patate', 200, 'carb'), c('finocchi', 200, 'veg'), c('olio-oliva', 10, 'fat')] },
  { id: 'se-salmone-patate', name: 'Salmone con patate e spinaci', course: 'main', prefer: 'dinner', tags: ['fish'], components: [c('filetto-di-salmone', 150, 'protein'), c('patate', 200, 'carb'), c('spinaci', 150, 'veg'), c('olio-oliva', 5, 'fat')] },
  { id: 'se-pollo-patate', name: 'Pollo con patate e insalata', course: 'main', prefer: 'dinner', tags: ['white-meat'], components: [c('petto-di-pollo', 150, 'protein'), c('patate', 250, 'carb'), c('insalata', 80, 'veg'), c('olio-oliva', 10, 'fat')] },
  { id: 'se-tacchino-pane', name: 'Tacchino, pane e verdure', course: 'main', prefer: 'dinner', tags: ['white-meat'], components: [c('fesa-di-tacchino', 150, 'protein'), c('pane-integrale', 60, 'carb'), c('verdure-miste', 200, 'veg'), c('olio-oliva', 10, 'fat')] },
  { id: 'se-manzo-patate', name: 'Manzo con patate e broccoli', course: 'main', prefer: 'dinner', tags: ['red-meat'], components: [c('manzo-magro', 150, 'protein'), c('patate', 200, 'carb'), c('broccoli', 200, 'veg'), c('olio-oliva', 10, 'fat')] },
  { id: 'se-frittata', name: 'Frittata di zucchine con pane', course: 'main', prefer: 'dinner', tags: ['eggs', 'veggie'], components: [c('uova', 2, 'protein'), c('zucchine', 200, 'veg'), c('pane-integrale', 60, 'carb'), c('olio-oliva', 5, 'fat')] },
  { id: 'se-uova-spinaci', name: 'Uova, spinaci e pane', course: 'main', prefer: 'dinner', tags: ['eggs', 'veggie'], components: [c('uova', 2, 'protein'), c('spinaci', 200, 'veg'), c('pane-integrale', 60, 'carb'), c('olio-oliva', 5, 'fat')] },
  { id: 'se-lenticchie-pane', name: 'Zuppa di lenticchie con pane', course: 'main', prefer: 'dinner', tags: ['legumes'], components: [c('lenticchie-cotte', 200, 'protein'), c('pane-integrale', 60, 'carb'), c('carote', 100, 'veg'), c('olio-oliva', 10, 'fat')] },
  { id: 'se-caprese', name: 'Caprese con pane', course: 'main', prefer: 'dinner', tags: ['cheese', 'veggie'], components: [c('mozzarella', 125, 'protein'), c('pomodoro', 200, 'veg'), c('pane-integrale', 70, 'carb'), c('olio-oliva', 10, 'fat')] },
  { id: 'se-bresaola', name: 'Bresaola, rucola e grana con pane', course: 'main', prefer: 'dinner', tags: ['red-meat'], components: [c('bresaola', 80, 'protein'), c('insalata', 80, 'veg'), c('parmigiano', 15, 'dairy'), c('pane-integrale', 70, 'carb')] },
  { id: 'se-fagioli-tonno', name: 'Insalata di fagioli e tonno con pane', course: 'main', tags: ['legumes', 'fish'], components: [c('fagioli-cannellini-cotti', 150, 'protein'), c('tonno-naturale', 80, 'protein'), c('pane-integrale', 50, 'carb'), c('insalata', 80, 'veg'), c('olio-oliva', 10, 'fat')] },
  { id: 'se-piadina', name: 'Piadina con crudo e mozzarella', course: 'main', prefer: 'dinner', tags: ['treat'], components: [c('piadina', 1, 'fixed'), c('prosciutto-crudo', 40, 'protein'), c('mozzarella', 60, 'dairy'), c('insalata', 60, 'veg')] },
  { id: 'se-pizza', name: 'Pizza margherita', course: 'main', prefer: 'dinner', tags: ['treat', 'cheese'], components: [c('pizza-margherita', 300, 'carb'), c('insalata', 80, 'veg')] },
]

export const DISHES_BY_ID = new Map(DISHES.map((d) => [d.id, d]))
