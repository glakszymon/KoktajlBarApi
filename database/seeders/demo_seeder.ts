import Cocktail from '#models/cocktail'
import Comment from '#models/comment'
import Ingredient from '#models/ingredient'
import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

const ingredients = [
  { name: 'Wódka', alcohol: true, description: 'Neutralny alkohol zbożowy.' },
  { name: 'Biały rum', alcohol: true, description: 'Lekki rum do koktajli cytrusowych.' },
  { name: 'Ciemny rum', alcohol: true, description: 'Dojrzewający rum o karmelowym aromacie.' },
  { name: 'Gin', alcohol: true, description: 'Alkohol z aromatem jałowca.' },
  { name: 'Tequila', alcohol: true, description: 'Tequila blanco z agawy.' },
  { name: 'Triple sec', alcohol: true, description: 'Likier pomarańczowy.' },
  { name: 'Bourbon', alcohol: true, description: 'Amerykańska whiskey kukurydziana.' },
  { name: 'Sok z limonki', alcohol: false, description: 'Świeżo wyciśnięty sok z limonki.' },
  { name: 'Sok z cytryny', alcohol: false, description: 'Świeżo wyciśnięty sok z cytryny.' },
  { name: 'Mięta', alcohol: false, description: 'Świeże liście mięty.' },
  { name: 'Syrop cukrowy', alcohol: false, description: 'Syrop z równych części cukru i wody.' },
  { name: 'Woda gazowana', alcohol: false, description: 'Schłodzona woda gazowana.' },
  { name: 'Tonic', alcohol: false, description: 'Gazowany napój z chininą.' },
  { name: 'Cola', alcohol: false, description: 'Gazowany napój o smaku coli.' },
  { name: 'Sok pomarańczowy', alcohol: false, description: 'Sok pomarańczowy bez dodatku cukru.' },
  { name: 'Sok ananasowy', alcohol: false, description: 'Sok ananasowy do tropikalnych koktajli.' },
  { name: 'Mleczko kokosowe', alcohol: false, description: 'Kremowe mleczko kokosowe.' },
  { name: 'Grenadyna', alcohol: false, description: 'Bezalkoholowy syrop z granatu.' },
  { name: 'Lód', alcohol: false, description: 'Kostki lodu.' },
  { name: 'Ogórek', alcohol: false, description: 'Świeże plastry ogórka.' },
] as const

type IngredientName = (typeof ingredients)[number]['name']
type Account = 'admin' | 'user'

const cocktails: {
  name: string
  owner: Account
  category: string
  recipe: string
  ingredients: { name: IngredientName; amount: number; unit: string }[]
  comments: { author: Account; rating: number; content: string | null }[]
}[] = [
  {
    name: 'Mojito',
    owner: 'admin',
    category: 'Long Drink',
    recipe:
      'Delikatnie ugnieć miętę z sokiem i syropem. Dodaj rum i lód, dopełnij wodą i wymieszaj.',
    ingredients: [
      { name: 'Biały rum', amount: 50, unit: 'ml' },
      { name: 'Sok z limonki', amount: 25, unit: 'ml' },
      { name: 'Mięta', amount: 8, unit: 'liści' },
      { name: 'Syrop cukrowy', amount: 20, unit: 'ml' },
      { name: 'Woda gazowana', amount: 100, unit: 'ml' },
      { name: 'Lód', amount: 6, unit: 'kostek' },
    ],
    comments: [
      { author: 'admin', rating: 5, content: 'Orzeźwiający klasyk z wyraźnym aromatem mięty.' },
      { author: 'user', rating: 4, content: 'Dobry balans, następnym razem dodam mniej syropu.' },
    ],
  },
  {
    name: 'Margarita',
    owner: 'user',
    category: 'Sour',
    recipe: 'Wstrząśnij tequilę, triple sec i sok z lodem. Przecedź do schłodzonego kieliszka.',
    ingredients: [
      { name: 'Tequila', amount: 50, unit: 'ml' },
      { name: 'Triple sec', amount: 25, unit: 'ml' },
      { name: 'Sok z limonki', amount: 25, unit: 'ml' },
      { name: 'Lód', amount: 6, unit: 'kostek' },
    ],
    comments: [
      { author: 'admin', rating: 4, content: 'Przyjemnie kwaśna i prosta w przygotowaniu.' },
      { author: 'user', rating: 5, content: 'Mój ulubiony przepis na Margaritę.' },
    ],
  },
  {
    name: 'Gin Tonic',
    owner: 'admin',
    category: 'Long Drink',
    recipe: 'Wlej gin na lód, dopełnij tonikiem i delikatnie wymieszaj. Dodaj ogórek.',
    ingredients: [
      { name: 'Gin', amount: 50, unit: 'ml' },
      { name: 'Tonic', amount: 150, unit: 'ml' },
      { name: 'Ogórek', amount: 3, unit: 'plastry' },
      { name: 'Lód', amount: 6, unit: 'kostek' },
    ],
    comments: [{ author: 'user', rating: 4, content: 'Ogórek świetnie pasuje do ginu.' }],
  },
  {
    name: 'Cuba Libre',
    owner: 'user',
    category: 'Long Drink',
    recipe: 'Wlej rum i sok na lód. Dopełnij colą i delikatnie wymieszaj.',
    ingredients: [
      { name: 'Ciemny rum', amount: 50, unit: 'ml' },
      { name: 'Sok z limonki', amount: 15, unit: 'ml' },
      { name: 'Cola', amount: 150, unit: 'ml' },
      { name: 'Lód', amount: 6, unit: 'kostek' },
    ],
    comments: [
      { author: 'admin', rating: 3, content: 'Prosty koktajl, dla mnie trochę za słodki.' },
    ],
  },
  {
    name: 'Screwdriver',
    owner: 'admin',
    category: 'Long Drink',
    recipe: 'Wlej wódkę i sok pomarańczowy do szklanki z lodem. Wymieszaj.',
    ingredients: [
      { name: 'Wódka', amount: 50, unit: 'ml' },
      { name: 'Sok pomarańczowy', amount: 150, unit: 'ml' },
      { name: 'Lód', amount: 5, unit: 'kostek' },
    ],
    comments: [{ author: 'user', rating: 3, content: null }],
  },
  {
    name: 'Whiskey Sour',
    owner: 'user',
    category: 'Sour',
    recipe: 'Wstrząśnij bourbon, sok i syrop z lodem. Przecedź do szklanki ze świeżym lodem.',
    ingredients: [
      { name: 'Bourbon', amount: 50, unit: 'ml' },
      { name: 'Sok z cytryny', amount: 25, unit: 'ml' },
      { name: 'Syrop cukrowy', amount: 20, unit: 'ml' },
      { name: 'Lód', amount: 6, unit: 'kostek' },
    ],
    comments: [{ author: 'admin', rating: 5, content: 'Świetna równowaga słodyczy i kwasowości.' }],
  },
  {
    name: 'Virgin Mojito',
    owner: 'user',
    category: 'Mocktail',
    recipe: 'Ugnieć delikatnie miętę z sokiem i syropem. Dodaj lód, dopełnij wodą i wymieszaj.',
    ingredients: [
      { name: 'Sok z limonki', amount: 30, unit: 'ml' },
      { name: 'Mięta', amount: 10, unit: 'liści' },
      { name: 'Syrop cukrowy', amount: 20, unit: 'ml' },
      { name: 'Woda gazowana', amount: 150, unit: 'ml' },
      { name: 'Lód', amount: 6, unit: 'kostek' },
    ],
    comments: [
      { author: 'admin', rating: 5, content: 'Bardzo dobry również bez rumu.' },
      { author: 'user', rating: 4, content: 'Lekki i orzeźwiający.' },
    ],
  },
  {
    name: 'Virgin Piña Colada',
    owner: 'admin',
    category: 'Mocktail',
    recipe: 'Zblenduj sok ananasowy, mleczko kokosowe i lód. Podaj w wysokiej szklance.',
    ingredients: [
      { name: 'Sok ananasowy', amount: 150, unit: 'ml' },
      { name: 'Mleczko kokosowe', amount: 50, unit: 'ml' },
      { name: 'Lód', amount: 6, unit: 'kostek' },
    ],
    comments: [],
  },
  {
    name: 'Daiquiri',
    owner: 'user',
    category: 'Sour',
    recipe: 'Wstrząśnij rum, sok z limonki i syrop z lodem. Przecedź do schłodzonego kieliszka.',
    ingredients: [
      { name: 'Biały rum', amount: 60, unit: 'ml' },
      { name: 'Sok z limonki', amount: 30, unit: 'ml' },
      { name: 'Syrop cukrowy', amount: 20, unit: 'ml' },
      { name: 'Lód', amount: 6, unit: 'kostek' },
    ],
    comments: [],
  },
  {
    name: 'Tom Collins',
    owner: 'admin',
    category: 'Long Drink',
    recipe: 'Wstrząśnij gin, sok i syrop z lodem. Przelej do szklanki i dopełnij wodą gazowaną.',
    ingredients: [
      { name: 'Gin', amount: 50, unit: 'ml' },
      { name: 'Sok z cytryny', amount: 25, unit: 'ml' },
      { name: 'Syrop cukrowy', amount: 20, unit: 'ml' },
      { name: 'Woda gazowana', amount: 100, unit: 'ml' },
      { name: 'Lód', amount: 6, unit: 'kostek' },
    ],
    comments: [],
  },
  {
    name: 'Tequila Sunrise',
    owner: 'user',
    category: 'Long Drink',
    recipe: 'Wlej tequilę i sok pomarańczowy na lód. Powoli dodaj grenadynę, nie mieszając warstw.',
    ingredients: [
      { name: 'Tequila', amount: 50, unit: 'ml' },
      { name: 'Sok pomarańczowy', amount: 150, unit: 'ml' },
      { name: 'Grenadyna', amount: 15, unit: 'ml' },
      { name: 'Lód', amount: 6, unit: 'kostek' },
    ],
    comments: [],
  },
  {
    name: 'Piña Colada',
    owner: 'admin',
    category: 'Tropical',
    recipe: 'Zblenduj rum, sok ananasowy, mleczko kokosowe i lód. Podaj w wysokiej szklance.',
    ingredients: [
      { name: 'Biały rum', amount: 50, unit: 'ml' },
      { name: 'Sok ananasowy', amount: 100, unit: 'ml' },
      { name: 'Mleczko kokosowe', amount: 50, unit: 'ml' },
      { name: 'Lód', amount: 6, unit: 'kostek' },
    ],
    comments: [],
  },
  {
    name: 'Vodka Tonic',
    owner: 'user',
    category: 'Long Drink',
    recipe: 'Wlej wódkę i sok z limonki na lód. Dopełnij tonikiem i delikatnie wymieszaj.',
    ingredients: [
      { name: 'Wódka', amount: 50, unit: 'ml' },
      { name: 'Sok z limonki', amount: 10, unit: 'ml' },
      { name: 'Tonic', amount: 150, unit: 'ml' },
      { name: 'Lód', amount: 6, unit: 'kostek' },
    ],
    comments: [],
  },
  {
    name: 'Gin Fizz',
    owner: 'admin',
    category: 'Fizz',
    recipe: 'Mocno wstrząśnij gin, sok i syrop z lodem. Przecedź i dopełnij wodą gazowaną.',
    ingredients: [
      { name: 'Gin', amount: 45, unit: 'ml' },
      { name: 'Sok z cytryny', amount: 30, unit: 'ml' },
      { name: 'Syrop cukrowy', amount: 15, unit: 'ml' },
      { name: 'Woda gazowana', amount: 80, unit: 'ml' },
      { name: 'Lód', amount: 6, unit: 'kostek' },
    ],
    comments: [],
  },
  {
    name: 'Rum Sour',
    owner: 'user',
    category: 'Sour',
    recipe: 'Wstrząśnij ciemny rum, sok z cytryny i syrop z lodem. Przecedź do szklanki.',
    ingredients: [
      { name: 'Ciemny rum', amount: 50, unit: 'ml' },
      { name: 'Sok z cytryny', amount: 25, unit: 'ml' },
      { name: 'Syrop cukrowy', amount: 20, unit: 'ml' },
      { name: 'Lód', amount: 6, unit: 'kostek' },
    ],
    comments: [],
  },
  {
    name: 'Bourbon Cola',
    owner: 'admin',
    category: 'Long Drink',
    recipe: 'Wlej bourbon na lód, dopełnij colą i delikatnie wymieszaj.',
    ingredients: [
      { name: 'Bourbon', amount: 50, unit: 'ml' },
      { name: 'Cola', amount: 150, unit: 'ml' },
      { name: 'Lód', amount: 6, unit: 'kostek' },
    ],
    comments: [],
  },
  {
    name: 'Tropical Rum Punch',
    owner: 'user',
    category: 'Tropical',
    recipe:
      'Wstrząśnij rum, triple sec, sok ananasowy i sok z limonki z lodem. Przelej do szklanki.',
    ingredients: [
      { name: 'Biały rum', amount: 40, unit: 'ml' },
      { name: 'Triple sec', amount: 20, unit: 'ml' },
      { name: 'Sok ananasowy', amount: 100, unit: 'ml' },
      { name: 'Sok z limonki', amount: 15, unit: 'ml' },
      { name: 'Lód', amount: 6, unit: 'kostek' },
    ],
    comments: [],
  },
  {
    name: 'Tequila Soda',
    owner: 'admin',
    category: 'Long Drink',
    recipe: 'Wlej tequilę i sok z limonki na lód. Dodaj wodę gazowaną i delikatnie wymieszaj.',
    ingredients: [
      { name: 'Tequila', amount: 50, unit: 'ml' },
      { name: 'Sok z limonki', amount: 20, unit: 'ml' },
      { name: 'Woda gazowana', amount: 150, unit: 'ml' },
      { name: 'Lód', amount: 6, unit: 'kostek' },
    ],
    comments: [],
  },
]

export default class extends BaseSeeder {
  static environment = ['development', 'test']

  async run() {
    await this.client.transaction(async (trx) => {
      const options = { client: trx }
      const accounts = {
        admin: await User.firstOrCreate(
          { email: 'admin@example.com' },
          { name: 'Demo Admin', passwordHash: 'Demo-password-12345!', role: 'admin' },
          options
        ),
        user: await User.firstOrCreate(
          { email: 'user@example.com' },
          { name: 'Demo User', passwordHash: 'Demo-password-12345!', role: 'user' },
          options
        ),
      }

      const ingredientIds = new Map<IngredientName, number>()
      for (const { name, ...data } of ingredients) {
        const ingredient = await Ingredient.firstOrCreate({ name }, data, options)
        ingredientIds.set(name, ingredient.id)
      }

      for (const { owner, ingredients: recipeIngredients, comments, ...data } of cocktails) {
        const cocktail = await Cocktail.firstOrCreate(
          { name: data.name, userId: accounts[owner].id },
          { category: data.category, recipe: data.recipe },
          options
        )

        const pivot: Record<number, { amount: number; unit: string }> = {}
        for (const { name, amount, unit } of recipeIngredients) {
          pivot[ingredientIds.get(name)!] = { amount, unit }
        }
        await cocktail.related('ingredients').sync(pivot, false)

        for (const { author, rating, content } of comments) {
          await Comment.firstOrCreate(
            { cocktailId: cocktail.id, userId: accounts[author].id, content },
            { rating },
            options
          )
        }

        // Uwzględnij także oceny dodane ręcznie pomiędzy uruchomieniami seedera.
        const result = await trx
          .from('comments')
          .where('cocktail_id', cocktail.id)
          .avg('rating as average')
          .first()

        cocktail.rating = result.average === null ? null : Number(result.average)
        await cocktail.save()
      }
    })
  }
}
