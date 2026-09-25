// Фільтр каталогу брифів за роком і темою. Без JS каталог просто показує всі брифи.
(function () {
  var form = document.querySelector("[data-briefs-filter]");
  if (!form) return;
  var items = Array.prototype.slice.call(document.querySelectorAll(".brief"));
  var count = form.querySelector(".filter-count");
  form.hidden = false;
  function apply() {
    var y = form.year.value, t = form.topic.value, shown = 0;
    items.forEach(function (li) {
      var ok = (!y || li.dataset.year === y) && (!t || (" " + li.dataset.topics + " ").indexOf(" " + t + " ") > -1);
      li.hidden = !ok;
      if (ok) shown++;
    });
    count.textContent = count.dataset.label + ": " + shown + " / " + items.length;
  }
  form.addEventListener("change", apply);
  form.addEventListener("submit", function (e) { e.preventDefault(); });
  apply();
})();
