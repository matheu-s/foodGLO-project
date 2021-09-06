import icons from 'url:../../img/icons.svg';
import View from './View';

class PaginationView extends View {
  _parentEl = document.querySelector('.pagination');

  addHandlerPage(handler) {
    this._parentEl.addEventListener('click', function (e) {
      const btn = e.target.closest('.btn--inline'); // select the closes element to the click
      if (!btn) return;
      const btnPage = Number(btn.dataset.goto);
      handler(btnPage);
    });
  }

  _generateMarkup() {
    const currPage = this._data.search.currentPage;
    const numOfPages = Math.ceil(
      this._data.search.results.length / this._data.search.resultsPerPage
    );

    //Page 1 && there are NO other pages
    if (currPage === 1 && numOfPages === 1) {
      return '';
    }

    //Page 1 && there are other pages
    if (currPage === 1 && numOfPages > 1) {
      return `
      <button data-goto="${
        currPage + 1
      }" class="btn--inline pagination__btn--next">
            <span>${currPage + 1}</span>
            <svg class="search__icon">
              <use href="${icons}#icon-arrow-right"></use>
            </svg>
          </button>`;
    }
    //Last page
    if (currPage === numOfPages) {
      return `
        <button data-goto="${
          currPage - 1
        }" class="btn--inline pagination__btn--prev">
            <svg class="search__icon">
              <use href="${icons}#icon-arrow-left"></use>
            </svg>
            <span>Page ${currPage - 1}</span>
          </button>`;
    }

    //Other page
    if (currPage > 1 && currPage < numOfPages) {
      return `
      <button data-goto="${
        currPage - 1
      }" class="btn--inline pagination__btn--prev">
            <svg class="search__icon">
              <use href="${icons}#icon-arrow-left"></use>
            </svg>
            <span>Page ${currPage - 1}</span>
          </button>
          <button data-goto="${
            currPage + 1
          }" class="btn--inline pagination__btn--next">
            <span>Page ${currPage + 1}</span>
            <svg class="search__icon">
              <use href="${icons}#icon-arrow-right"></use>
            </svg>
          </button>`;
    }
  }
}

export default new PaginationView();
