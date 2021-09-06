import View from './View.js';
import icons from 'url:../../img/icons.svg';
import previewView from './previewView.js';

class BookmarksView extends previewView {
  _parentEl = document.querySelector('.bookmarks__list');
  _errorMessage = 'No recipes yet, find a nice one and bookmart it';

  addHandlerRender(handler) {
    ['hashchange', 'load'].forEach(ev => window.addEventListener(ev, handler));
  }
}

export default new BookmarksView();
