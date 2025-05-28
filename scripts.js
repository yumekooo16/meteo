// JS : effet de sortie avant changement de page
document.querySelectorAll('.transition-link').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    document.body.classList.add('fade-out');
    setTimeout(() => {
      window.location = this.href;
    }, 500); // doit correspondre à la durée CSS
  });
});
