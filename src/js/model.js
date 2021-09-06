import * as config from './config.js';
import * as helper from './helper.js';

export const state = {
  recipe: {},
  search: {
    query: '',
    results: [],
    resultsPerPage: config.RESULTS_PER_PAGE,
    currentPage: 1,
  },
  bookmarks: [],
};

const createRecipeObject = function (data) {
  let { recipe } = data.data;

  return {
    title: recipe.title,
    id: recipe.id,
    sourceUrl: recipe.source_url,
    image: recipe.image_url,
    ingredients: recipe.ingredients,
    cookingTime: recipe.cooking_time,
    servings: recipe.servings,
    publisher: recipe.publisher,
    ...(recipe.key && { key: recipe.key }), // if recipe.key exists, then return {key: recipe.key}
  };
};

/**
 * Sends the ID to the api and wait for the answer, when received, transforms to
 * the application format and bookmark if necessary
 * @param {string} id the id of the recipe
 * @returns {undefined} it does not return, just change the State
 * @author Matheus-13
 */
export const loadRecipe = async function (id) {
  try {
    const data = await helper.getJSON(
      `${config.API_URL_FORKIFY}${id}?key=${config.API_KEY_FORKIFY}`
    );

    state.recipe = createRecipeObject(data);

    if (state.bookmarks.some(rec => rec.id === id)) {
      state.recipe.bookmarked = true;
    } else {
      state.recipe.bookmarked = false;
    }
  } catch (err) {
    console.error(`${err} :bomb:`);
    throw err;
  }
};

export const loadSearchResults = async function (query) {
  try {
    const data = await helper.getJSON(
      `${config.API_URL_FORKIFY}?search=${query}&key=${config.API_KEY_FORKIFY}`
    );
    if (data.data.recipes.length === 0) throw new Error('No results :(');
    state.search.query = query;
    state.search.results = data.data.recipes.map(rec => {
      return {
        id: rec.id,
        title: rec.title,
        publisher: rec.publisher,
        image: rec.image_url,
        ...(rec.key && { key: rec.key }),
      };
    });
  } catch (err) {
    throw err;
  }
};

export const loadSearchResultsPage = function (
  page = state.search.currentPage
) {
  state.search.currentPage = page;

  const start = (page - 1) * state.search.resultsPerPage; // 0
  const end = page * state.search.resultsPerPage; // 9, slice() does not include last one

  return state.search.results.slice(start, end);
};

export const updateServings = function (newServings) {
  if (state.recipe.servings === 1 && newServings === 0) return; //minimum servings
  state.recipe.ingredients.forEach(ing => {
    return (ing.quantity =
      (ing.quantity * newServings) / state.recipe.servings);
  });

  state.recipe.servings = newServings;
};

const storeBookmarks = function () {
  localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
};

export const addBookmark = function (recipe) {
  //Add on Bookmarks
  state.bookmarks.push(recipe);

  //Check property
  if (recipe.id === state.recipe.id) recipe.bookmarked = true;
  storeBookmarks();
};

export const removeBookmark = function (id) {
  const index = state.bookmarks.findIndex(el => el.id === id);
  state.bookmarks.slice(index, 1);
  if (state.recipe.id === id) state.recipe.bookmarked = false;
  storeBookmarks();
};

export const uploadRecipe = async function (newRecipe) {
  try {
    const ingredients = Object.entries(newRecipe)
      .filter(entry => entry[0].startsWith('ingredient') && entry[1] !== '')
      .map(ing => {
        const ingArr = ing[1].replaceAll(' ', '').split(',');
        if (ingArr.length !== 3)
          throw new Error('Wrong format, please updload with the right one ;)');

        const [quantity, unit, description] = ingArr;

        return {
          quantity: quantity ? Number(quantity) : null,
          unit,
          description,
        };
      });

    const recipe = {
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      image_url: newRecipe.image,
      publisher: newRecipe.publisher,
      cooking_time: +newRecipe.cookingTime,
      servings: +newRecipe.servings,
      ingredients,
    };

    const data = await helper.sendJSON(
      `${config.API_URL_FORKIFY}?key=${config.API_KEY_FORKIFY}`,
      recipe
    );

    state.recipe = createRecipeObject(data);
    addBookmark(state.recipe);
  } catch (err) {
    throw err;
  }
};

const getIngredientsID = async function (ingsArr) {
  try {
    const objectsWithId = [];
    let test;

    await Promise.all(
      ingsArr.map(async ing => {
        const data = await helper.getJSON(
          `https://api.spoonacular.com/food/ingredients/search?query=${ing.description}&apiKey=${config.API_KEY_SPOONACULAR}`
        );
        const queryData = data.results[0];
        if (!queryData) return;
        const queryID = queryData.id;
        ing.id = queryID; // attaching the ID to the ing object
        objectsWithId.push(ing);
        // after finding the 1st ID, just to save requests
        test = 'achieved now';
      })
    );

    state.recipe.foundIngredients = objectsWithId;
    return state.recipe.ingredients;
  } catch (err) {
    console.error(err);
  }
};
// getIngredientsID(['banana', 'pineapple', 'rice']);

const getIngredientsInfo = async function (ingObject) {
  //Get infos
  try {
    let data;
    if (ingObject.id && ingObject.quantity && ingObject.unit) {
      data = await helper.getJSON(
        `https://api.spoonacular.com/food/ingredients/${ingObject.id}/information?amount=${ingObject.quantity}&unit=${ingObject.unit}&apiKey=${config.API_KEY_SPOONACULAR}`
      );
    } else if (ingObject.id && ingObject.quantity && !ingObject.unit) {
      data = await helper.getJSON(
        `https://api.spoonacular.com/food/ingredients/${ingObject.id}/information?amount=${ingObject.quantity}&apiKey=${config.API_KEY_SPOONACULAR}`
      );
    } else if (ingObject.id) {
      data = await helper.getJSON(
        `https://api.spoonacular.com/food/ingredients/${ingObject.id}/information?apiKey=${config.API_KEY_SPOONACULAR}`
      );
    }
    if (!data) return;

    //Filter calories
    const calories = data.nutrition?.nutrients?.filter(
      nut => nut.title === 'Calories'
    );

    if (!calories) return; // sometimes it has no info about calories
    const { amount: caloriesAmount } = calories[0];

    //Filter cost
    const { value: ingredientCost } = data.estimatedCost;

    //create array with results and return
    const caloriesAndPrice = [caloriesAmount, ingredientCost / 100];

    return caloriesAndPrice;
  } catch (err) {
    console.error(err);
  }
};

// getIngredientsInfo(9266, 1);

export const calculateInfo = async function (ingredientsArr) {
  try {
    const ingsObjectArr = await getIngredientsID(ingredientsArr);

    for (ing of ingsObjectArr) {
      if (!ing.id) continue;

      const data = await getIngredientsInfo(ing);
      if (!data) continue;

      ing.calories = data[0];
      ing.cost = data[1];
    }
  } catch (err) {
    console.error(error);
  }
};

const init = function () {
  const storage = localStorage.getItem('bookmarks');
  if (!storage) return;
  state.bookmarks = JSON.parse(storage);
};
init();
