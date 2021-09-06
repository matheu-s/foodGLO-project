import previewView from './previewView.js';

class ResultView extends previewView {
  _parentEl = document.querySelector('.results');
  _errorMessage = 'No results, try again :(';
}

export default new ResultView();
