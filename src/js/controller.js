import * as model from './model.js';
import * as config from './config.js';
import recipeView from './views/recipeView.js';
import searchView from './views/searchView.js';
import resultView from './views/resultView.js';
import paginationView from './views/paginationView.js';
import bookmarkView from './views/bookmarkView.js';
import addRecipeView from './views/addRecipeView.js';

// https://forkify-api.herokuapp.com/v2

///////////////////////////////////////

const getRecipe = async function () {
  try {
    //1. Getting the id, if any
    const id = window.location.hash.slice(1);

    if (!id) return;
    recipeView.renderSpinner(); // render spinner while waiting for answer

    resultView.update(model.loadSearchResultsPage());

    //2. Searching recipe
    await model.loadRecipe(id); // it does not return a value, simply changes the value of state.recipe

    //Get more infos from Spoonacular API
    await model.calculateInfo(model.state.recipe.ingredients);

    //3. Render recipe
    recipeView.render(model.state.recipe); // passing the value to the view

    //4. Update bookmarks
    bookmarkView.update(model.state.bookmarks);

    //maybe render/update?
  } catch (err) {
    console.error(err);
    recipeView.renderError();
  }
};

const getSearchResults = async function () {
  try {
    resultView.renderSpinner();

    //1. Getting query
    const query = searchView.getQuery();
    if (!query) return;

    //2. Searching results through API
    await model.loadSearchResults(query);

    //3. Displaying results
    await resultView.render(model.loadSearchResultsPage());

    //4. Render pagination buttons
    await paginationView.render(model.state);
  } catch (err) {
    resultView.renderError();
    console.error(err);
  }
};
const pagControl = async function (goTo) {
  //1. Render NEW results
  await resultView.render(model.loadSearchResultsPage(goTo));

  //2. Render NEW buttons
  await paginationView.render(model.state);
};

const resetPaginationCounting = function () {
  model.state.search.currentPage = 1;

  return console.log('Page number reseted');
};

const controlServings = function (newNumberServings) {
  //update servings on State\

  model.updateServings(newNumberServings);

  //render the new recipe
  recipeView.update(model.state.recipe);
};

const controlBookmarks = function () {
  //Add or Delete bookmark on the shown recipe, if button is clicked
  if (!model.state.recipe.bookmarked) {
    model.addBookmark(model.state.recipe);
  } else {
    model.removeBookmark(model.state.recipe.id);
  }

  //Update recipeView
  recipeView.update(model.state.recipe);

  //Render bookmarks
  bookmarkView.render(model.state.bookmarks);
};

const initWithBookmarks = function () {
  bookmarkView.render(model.state.bookmarks);
};

const controlAddRecipe = async function (newRecipe) {
  try {
    //render spinner
    addRecipeView.renderSpinner();

    //1. Upload the new recipe
    await model.uploadRecipe(newRecipe);

    //2. Render
    recipeView.render(model.state.recipe);

    //3. Success message
    addRecipeView.renderMessage();

    //4. Change ID in URL
    window.history.pushState(null, '', `${model.state.recipe.id}`);

    //5. Close upload form
    setTimeout(function () {
      addRecipeView.toggleWindow();
    }, config.CLOSE_MODAL_TIME);
  } catch (err) {
    console.error(err);
    recipeView.renderError(err.message);
  }
};

//listening to events
const init = function () {
  bookmarkView.addHandlerRender(initWithBookmarks);
  recipeView.addHandlerRender(getRecipe); //linking both functions
  recipeView.addHandlerUpdateServings(controlServings);
  recipeView.addHandlerAddBookmark(controlBookmarks);
  searchView.addHandlerSearch(getSearchResults, resetPaginationCounting);
  paginationView.addHandlerPage(pagControl);
  addRecipeView.addHanlderUpload(controlAddRecipe);
  console.log('Welcome!');
};
init();
